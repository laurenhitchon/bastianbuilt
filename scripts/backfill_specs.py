#!/usr/bin/env python3
"""Fill the blank spec rows in the hand-written entries in src/lib/projects.ts.

Usage:
    python3 ./scripts/backfill_specs.py --dry-run   # show what would be sent
    python3 ./scripts/backfill_specs.py             # generate and patch
    python3 ./scripts/backfill_specs.py --only axle-sliders

A spec pair with an empty value renders as an empty row on the project page.
The curated entries carry 39 of them, mostly because the five standard labels
are printing-centric and several projects are CAD or fabrication work.

This reads each entry's own copy plus its photos from public/, asks for extra
pairs that suit the project, and rewrites only the `specs` block.

Existing values are never sent back through the model: the pairs that already
have values are re-injected verbatim, in their original order, and the generated
pairs are appended after them. The model can only add.

This is a one-off backfill, not part of the Instagram pipeline — new posts get
their specs from enrich_projects.py.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import ai_request
from enrich_projects import MAX_SPECS, SPEC_LABELS, clean_specs

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = REPO_ROOT / 'public'
PROJECTS_TS = REPO_ROOT / 'src' / 'lib' / 'projects.ts'
MAP_PATH = SCRIPT_DIR / 'post-map.json'
CACHE_PATH = SCRIPT_DIR / 'backfilled-specs.json'

TARGET_SPECS = 5
MAX_IMAGES = 5

SCHEMA = {
    'type': 'object',
    'additionalProperties': False,
    'required': ['specs'],
    'properties': {
        'specs': {
            'type': 'array',
            'items': {
                'type': 'object',
                'additionalProperties': False,
                'required': ['label', 'value'],
                'properties': {'label': {'type': 'string'}, 'value': {'type': 'string'}},
            },
        },
    },
}

SYSTEM_PROMPT = f"""\
You are completing the specification table on a project page for Bastian Built, a
portfolio site for CAD design, 3D printing, and fabrication work.

You are given one project's finished write-up — title, summary, overview, key
features, and design process — plus its photos, and the spec pairs the table
already has. Return additional label/value pairs to complete it.

# Rules

Do not repeat or restate a label that is already present. Those are written and
final; your pairs are appended after them.

Choose labels that suit this project. Prefer these where they genuinely apply:
{', '.join(SPEC_LABELS)}. Where they do not, pick your own — a CAD or fabrication
job has no print method, but it does have things worth tabulating: Software,
Scan Method, Scanner, Sheet Thickness, Fastening, Compatible Hardware, Lighting,
Output Files, Finish, Fabrication, Scale, Assembly, Components Modelled,
Reference Method.

Write only what the write-up or the photos support. Return fewer pairs, or none
at all, rather than inventing a figure — a weight nobody measured is worse than a
short table. Do not guess a dimension from a photo unless it is dimensioned or
stated. Never return an empty value: the page renders exactly what it is given,
and a blank value is a visibly empty row.

Values are short phrases, not sentences. No trailing full stop.
"""


def load_entries() -> list[dict]:
    """Parse the entries out of projects.ts, in file order."""
    src = PROJECTS_TS.read_text(encoding='utf-8')
    starts = [(m.start(), m.group(1)) for m in re.finditer(r"slug: '([^']*)',", src)]

    def field(block: str, key: str) -> str:
        m = re.search(
            rf"\b{key}:\s*\n?\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")", block
        )
        return (m.group(1) or m.group(2)) if m else ''

    def string_list(block: str, key: str) -> list[str]:
        m = re.search(rf'\b{key}: \[(.*?)\n    \],', block, re.S)
        if not m:
            return []
        return [
            (a or b) for a, b in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", m.group(1))
        ]

    entries = []
    for i, (pos, slug) in enumerate(starts):
        if not slug:
            continue
        end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
        block = src[pos:end]

        specs_body = re.search(r'specs: \[(.*?)\n    \],', block, re.S)
        pairs = []
        if specs_body:
            for m in re.finditer(
                r"label: (?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"),\s*"
                r"value: (?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")",
                specs_body.group(1),
                re.S,
            ):
                pairs.append({'label': m.group(1) or m.group(2) or '', 'value': m.group(3) or m.group(4) or ''})

        entries.append({
            'slug': slug,
            'title': field(block, 'title'),
            'description': field(block, 'description'),
            'overview': field(block, 'overview'),
            'features': string_list(block, 'features'),
            'process': string_list(block, 'process'),
            'specs': pairs,
        })
    return entries


def media_dir(slug: str) -> Path | None:
    post_map = json.loads(MAP_PATH.read_text(encoding='utf-8'))
    for key, value in post_map.items():
        if not key.startswith('_') and value['slug'] == slug:
            return PUBLIC_DIR / value['dir']
    return None


def images_for(slug: str) -> list[Path]:
    directory = media_dir(slug)
    if not directory or not directory.is_dir():
        return []
    found = sorted(
        p for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() in ai_request.IMAGE_MEDIA_TYPES
    )
    return found[:MAX_IMAGES]


def build_content(entry: dict, filled: list[dict], images: list[Path]) -> list[dict]:
    content = [block for path in images if (block := ai_request.image_block(path))]
    already = (
        '\n'.join(f'- {p["label"]}: {p["value"]}' for p in filled) if filled else '(none yet)'
    )
    wanted = max(1, TARGET_SPECS - len(filled))
    content.append({
        'type': 'text',
        'text': (
            f'Title: {entry["title"]}\n\n'
            f'Summary: {entry["description"]}\n\n'
            f'Overview: {entry["overview"]}\n\n'
            'Key features:\n' + '\n'.join(f'- {f}' for f in entry['features'] if f) + '\n\n'
            'Design process:\n' + '\n'.join(f'- {p}' for p in entry['process'] if p) + '\n\n'
            f'Spec pairs already in the table:\n{already}\n\n'
            f'{len(images)} photo(s) of this project are attached above.\n\n'
            f'Return about {wanted} further pair(s), or fewer if the material does not support it.'
        ),
    })
    return content


def merged_specs(filled: list[dict], generated: list[dict]) -> list[dict]:
    """Existing pairs first, unchanged, then generated pairs with new labels."""
    seen = {p['label'].casefold() for p in filled}
    out = list(filled)
    for pair in generated:
        if pair['label'].casefold() in seen:
            continue
        seen.add(pair['label'].casefold())
        out.append(pair)
    return out[:MAX_SPECS]


def write_specs(slug_to_specs: dict[str, list[dict]]) -> int:
    """Rewrite just the `specs` block of each named entry."""
    src = PROJECTS_TS.read_text(encoding='utf-8')
    starts = [(m.start(), m.group(1)) for m in re.finditer(r"slug: '([^']*)',", src)]
    bounds = [
        (pos, slug, starts[i + 1][0] if i + 1 < len(starts) else len(src))
        for i, (pos, slug) in enumerate(starts)
    ]

    patched = 0
    for start, slug, end in reversed(bounds):
        specs = slug_to_specs.get(slug)
        if not specs:
            continue

        block = src[start:end]
        pattern = re.compile(r'(\bspecs: )\[.*?\n(\s*)\],', re.S)
        match = pattern.search(block)
        if not match:
            raise SystemExit(f'could not locate specs block for {slug}')

        indent = match.group(2)
        rows = ''.join(
            f'\n{indent}  {{ label: {json.dumps(s["label"], ensure_ascii=False)}, '
            f'value: {json.dumps(s["value"], ensure_ascii=False)} }},'
            for s in specs
        )
        block = pattern.sub(lambda m: f'{m.group(1)}[{rows}\n{indent}],', block, count=1)
        src = src[:start] + block + src[end:]
        patched += 1

    PROJECTS_TS.write_text(src, encoding='utf-8')
    return patched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--only', help='Only process this slug')
    parser.add_argument('--dry-run', action='store_true', help='Report what would be sent, write nothing')
    args = parser.parse_args()

    entries = load_entries()
    todo = [
        e for e in entries
        if any(not p['value'] for p in e['specs']) and (not args.only or e['slug'] == args.only)
    ]

    if not todo:
        print('No blank spec rows found.')
        return 0

    if args.dry_run:
        for entry in todo:
            filled = [p for p in entry['specs'] if p['value']]
            blank = len(entry['specs']) - len(filled)
            print(f'  {entry["slug"]:<48} {blank} blank, {len(filled)} kept, {len(images_for(entry["slug"]))} image(s)')
        print(f'\nDry run: {len(todo)} entr(ies). Nothing written.')
        return 0

    target = ai_request.target()
    print(f'Backfilling {len(todo)} entr(ies) via {target.label}\n')

    cache = json.loads(CACHE_PATH.read_text(encoding='utf-8')) if CACHE_PATH.exists() else {}
    results: dict[str, list[dict]] = {}

    for entry in todo:
        slug = entry['slug']
        filled = [p for p in entry['specs'] if p['value']]
        images = images_for(slug)
        print(f'  {slug:<48} ', end='', flush=True)

        result = ai_request.structured_json(
            system=SYSTEM_PROMPT,
            content=build_content(entry, filled, images),
            schema=SCHEMA,
            label=slug,
        )
        if result is None:
            print('failed')
            continue

        rejected: list[str] = []
        generated = clean_specs(result.get('specs'), rejected)
        merged = merged_specs(filled, generated)
        if rejected:
            print(f'\n    dropped: {", ".join(rejected)}\n    ', end='')

        results[slug] = merged
        cache[slug] = {'kept': filled, 'added': generated, 'model': target.model}
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'kept {len(filled)}, added {len(merged) - len(filled)} -> {len(merged)} rows')

    if not results:
        print('\nNothing generated.')
        return 1

    patched = write_specs(results)
    print(f'\nPatched {patched} entr(ies) in {PROJECTS_TS.relative_to(REPO_ROOT)}')
    print('Run: npx prettier --write src/lib/projects.ts')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
