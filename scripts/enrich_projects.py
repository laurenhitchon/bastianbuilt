#!/usr/bin/env python3
"""Fill in the blank Project fields from each post's caption and photos.

Usage:
    python3 ./scripts/enrich_projects.py             # enrich anything not cached
    python3 ./scripts/enrich_projects.py --dry-run   # list what would be sent
    python3 ./scripts/enrich_projects.py --force     # redo posts already cached
    python3 ./scripts/enrich_projects.py --only DZbb6b-k6F2

Reads bastian.built.posts.json (written by export_instagram_posts.py), sends
each post's caption plus its photos to Claude, and writes the returned tags,
features, process, and specs to scripts/enrichment.json keyed by shortcode.

That cache is the reason to keep this separate from the export: re-running the
export never re-bills the API, and this script skips any post it has already
enriched. export_instagram_posts.py reads the cache when it builds its output,
so both bastian.built.posts.json and the paste-ready snippet come out filled in.

Posts marked `locked` in post-map.json are skipped — they already have
hand-written entries in src/lib/projects.ts.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import ai_config
import ai_request

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = REPO_ROOT / 'public'
POSTS_JSON = REPO_ROOT / 'bastian.built.posts.json'
CACHE_PATH = SCRIPT_DIR / 'enrichment.json'

# Preferred labels where they genuinely apply — they keep printed projects
# consistent with the 13 hand-written entries. Anything else is chosen to suit
# the work; see the prompt for the candidate list.
SPEC_LABELS = ('Material', 'Print Method', 'Weight', 'Dimensions', 'Post-Processing')
MIN_SPECS = 3
MAX_SPECS = 6

# Curated overviews run 55-97 words, median 74.
MIN_OVERVIEW_WORDS = 60
MAX_OVERVIEW_WORDS = 95
MAX_OVERVIEW_CHARS = 900

FEATURE_COUNT = 5
PROCESS_COUNT = 6
MAX_TAGS = 4
MAX_IMAGES = 6

# The 13 hand-written entries in projects.ts run 22-39 words, median 29. The card
# and the page hero both render this, so it has to stay in that band.
MIN_DESCRIPTION_WORDS = 20
MAX_DESCRIPTION_WORDS = 35
MAX_DESCRIPTION_CHARS = 320

# Curated titles run 3-8 words: "CBR600RR Engine Case Cover", "Subwoofer Box — FG
# Falcon Ute". Captions are not titles, so this is always rewritten.
MIN_TITLE_WORDS = 3
MAX_TITLE_WORDS = 8
MAX_TITLE_CHARS = 80


# --------------------------------------------------------------------------
# what we ask for
# --------------------------------------------------------------------------

SCHEMA = {
    'type': 'object',
    'additionalProperties': False,
    'required': ['title', 'description', 'overview', 'tags', 'features', 'process', 'specs'],
    'properties': {
        'title': {'type': 'string'},
        'description': {'type': 'string'},
        'overview': {'type': 'string'},
        'tags': {'type': 'array', 'items': {'type': 'string'}},
        'features': {'type': 'array', 'items': {'type': 'string'}},
        'process': {'type': 'array', 'items': {'type': 'string'}},
        # Labels are chosen per project rather than fixed. The five printing
        # labels are meaningless on a CAD-only concept, and the page renders
        # whatever label/value pairs it is given — a blank value is an empty
        # row on screen, so only populated pairs are emitted.
        'specs': {
            'type': 'array',
            'items': {
                'type': 'object',
                'additionalProperties': False,
                'required': ['label', 'value'],
                'properties': {
                    'label': {'type': 'string'},
                    'value': {'type': 'string'},
                },
            },
        },
    },
}

# Two published entries, chosen for contrast: one where the caption supported a
# full set of specs, one where it didn't. The second is doing real work — it
# shows that empty spec values are a correct answer, not a failure.
EXAMPLES = [
    {
        'title': 'YZF-R7 Pod Filter Airbox',
        'description': (
            'Custom 3D printed pod filter airbox for the Yamaha YZF-R7, designed from full '
            '3D scan data for precise fitment and clean integration.'
        ),
        'overview': (
            'This custom YZF-R7 pod filter airbox began with a full 3D scan of the intake area '
            'to capture every mounting point, contour, and clearance. A replica model of the DNA '
            'pod filter was created to ensure perfect alignment from the outset. Designed '
            'entirely in Fusion 360 around real-world scan data, the airbox delivers precise '
            'fitment, structural integrity, and a clean OEM-plus look once installed. Printed in '
            'multiple materials to balance strength, heat resistance, and flexibility, it '
            'features brass inserts, a serviceable lid, and a hex rear vent for controlled '
            'airflow.'
        ),
        'tags': ['Yamaha', 'YZF-R7', 'Airbox'],
        'features': [
            'Full 3D scan-based design for exact fitment and clearance control',
            'Replica-modeled DNA pod filter for precision integration',
            'Multi-material construction for strength and flexibility',
            'Serviceable lid with brass threaded inserts',
            'Hex-pattern rear vent for controlled airflow and visual detail',
        ],
        'process': [
            'Full 3D scan of the YZF-R7 intake and surrounding frame area',
            'Digital cleanup and preparation of scan data',
            'Creation of a replica DNA pod filter model for accurate fit',
            'Airbox design in Fusion 360 around real-world geometry',
            'Multi-material print preparation and prototyping',
            'Final printing, hardware installation, and on-bike fitment validation',
        ],
        'specs': [
            {'label': 'Material', 'value': 'ASA-CF (shell), TPU (flexible joiners), Brass inserts'},
            {'label': 'Print Method', 'value': 'FDM 3D Printing (Multi-material)'},
            {'label': 'Dimensions', 'value': 'Designed specifically for Yamaha YZF-R7 intake area'},
            {
                'label': 'Post-Processing',
                'value': 'Heat-set brass inserts, hardware installation, final fitment testing',
            },
        ],
    },
    {
        'title': 'Wheelchair Footrest Replacement',
        'description': (
            '1:1 replacement footrest modelled from the intact opposite-side part using precise '
            'hand measurements. Reinforced redesign printed in ASA-CF for strength and UV '
            'durability in a load-bearing application.'
        ),
        'overview': (
            'A broken wheelchair footrest was recreated as a true 1:1 replacement by using the '
            'intact opposite-side footrest as the reference. Critical dimensions were captured '
            'with rulers and vernier calipers, then the part was remodelled and strengthened '
            'beyond the original design. The final part was printed in ASA-CF, a carbon '
            'fibre-infused, UV-resistant engineering plastic chosen for toughness and durability '
            'in a load-bearing, real-world use case.'
        ),
        'tags': ['Reverse Engineering', 'ASA-CF', 'Functional Print'],
        'features': [
            'Reverse-engineered from the intact opposite-side footrest',
            'Measured with calipers for accurate replication',
            'Redesigned with added strength over OEM geometry',
            'ASA-CF selected for durability and UV resistance',
            'Optimised for load-bearing functional use',
        ],
        'process': [
            'Use intact footrest as dimensional reference',
            'Measure critical features with calipers and rulers',
            'Model replacement geometry and mounting interfaces',
            'Add reinforcement/strength features in weak areas',
            'Print in ASA-CF with functional orientation',
            'Test fit and validate under load',
        ],
        # Fewer pairs than the example above, and one label that is not in the
        # standard set — this project has no weight or post-processing to state,
        # so those are simply absent rather than blank.
        'specs': [
            {'label': 'Material', 'value': 'ASA-CF (carbon fibre-infused ASA)'},
            {'label': 'Print Method', 'value': 'FDM'},
            {'label': 'Reference Method', 'value': 'Opposite-side part, vernier calipers'},
        ],
    },
]

standard = ', '.join(SPEC_LABELS)

SYSTEM_PROMPT = f"""\
You write project entries for Bastian Built, a portfolio site for CAD design, 3D
printing, and fabrication work. Typical projects: parts modelled in Fusion 360
from 3D scan data, FDM prints in PA-CF / ASA-CF / PLA, ute trays and accessories,
motorcycle components, and sheet-metal design for laser cutting.

You are given one project's Instagram caption and its photos. Return four fields,
written as copy for the website — not as a caption, and not as a restatement of
the caption in different words.

# Fields

title — the project name, used as the card heading and the page H1. Title Case,
a noun phrase of {MIN_TITLE_WORDS} to {MAX_TITLE_WORDS} words, no trailing full
stop. Name the thing, not what happened: "Tray Design — NP300", not "Tray design
I did for a client".

Never carry the caption's own casing across. Captions are often typed in capitals
or as a sentence; restate them as Title Case regardless. The one exception is
genuine acronyms, model codes, and brand names, which keep their real casing:
NP300, CBR600RR, YZF-R7, DXF, APB, KT Kustoms, EinStar 2. Published titles look
like "Engine Covers — CBR600 F2/F3" and "Subwoofer Box — FG Falcon Ute".

description — the project card blurb, and the lead line on the project page. One
or two sentences, {MIN_DESCRIPTION_WORDS} to {MAX_DESCRIPTION_WORDS} words, and
closer to {MIN_DESCRIPTION_WORDS} than to {MAX_DESCRIPTION_WORDS}. Say what the
thing is, then the single most distinctive fact about it. It is read on its own,
next to a photo, by someone who has not opened the project yet — so no "this
project", no "in this build", and no trailing hook. The full caption is kept
verbatim elsewhere on the page; this is not a summary of it, it is a label for
the work.

overview — the body paragraph on the project page, {MIN_OVERVIEW_WORDS} to
{MAX_OVERVIEW_WORDS} words. Rewrite the caption as site copy in the voice below;
do not reproduce it. Captions are written for Instagram — first person, chatty,
uneven, sometimes with a typo or a repeated sentence — and this is the version a
client reads. Keep every fact, part name and number, drop the asides, and fix
what is plainly a slip.

Structure it the way the published entries do: open by saying what the project is
and the constraint or problem behind it, move through how it was approached and
what drove the key decisions, and close on the material or the outcome. One
paragraph, no headings, no bullet points.

tags — 2 to {MAX_TAGS} short labels for the project card. Name the tool, material,
vehicle, or domain, not a sentence fragment.

features — exactly {FEATURE_COUNT}. What makes the finished part what it is:
design decisions, material choices, integration details. One line each, roughly
8 to 14 words, no trailing full stop.

process — exactly {PROCESS_COUNT}, in the order the work actually happened, from
gathering reference through to final fitment or validation. One line each, no
numbering.

specs — {MIN_SPECS} to {MAX_SPECS} label/value pairs for the spec table. Short
phrases, not sentences.

Choose labels that suit this project. Prefer these where they genuinely apply, so
printed parts stay consistent with the published entries: {standard}. Where they
do not, pick your own — a CAD or fabrication job has no print method, but it does
have things worth tabulating: Software, Scan Method, Scanner, Sheet Thickness,
Fastening, Compatible Hardware, Lighting, Output Files, Finish, Fabrication,
Tray Size, Components Modelled.

Emit a pair only when you have a real value for it. Never emit an empty value and
never pad to reach {MIN_SPECS} — the table renders exactly what you return, and a
blank value is a visibly empty row on the page. If the caption and photos only
support two pairs, return two.

# The evidence rule

Write only what the caption or the photos support. Where a spec is not evidenced,
return an empty string for it. An empty value is the correct answer and is
expected — several published entries have empty specs, and the second example
below is one of them. Do not infer a material, machine, weight, or dimension from
what similar projects usually use. This applies to features and process steps
too: describe the work actually shown, not a plausible generic version of it. If
the caption is thin, a shorter, blanker answer is the right one.

# Voice

Third person, plain and technical. No marketing language, no emoji, no hashtags,
no @handles, and none of "showcasing", "leveraging", "seamless", "elevate". Keep
each line to a single clause where you can — these render as list items, not
paragraphs.

# Two published entries, for shape and register

{json.dumps(EXAMPLES, indent=2, ensure_ascii=False)}
"""


# --------------------------------------------------------------------------
# cache
# --------------------------------------------------------------------------


def load_cache() -> dict:
    if not CACHE_PATH.exists():
        return {}
    with CACHE_PATH.open(encoding='utf-8') as f:
        return json.load(f)


def save_cache(cache: dict) -> None:
    with CACHE_PATH.open('w', encoding='utf-8') as f:
        json.dump(dict(sorted(cache.items())), f, ensure_ascii=False, indent=2)
        f.write('\n')


# --------------------------------------------------------------------------
# request + normalisation
# --------------------------------------------------------------------------


def gather_images(record: dict) -> list[Path]:
    paths = []
    for item in record.get('gallery', []):
        path = PUBLIC_DIR / item.lstrip('/')
        if path.suffix.lower() in ai_request.IMAGE_MEDIA_TYPES and path.is_file():
            paths.append(path)
        if len(paths) >= MAX_IMAGES:
            break
    return paths


def build_content(record: dict, images: list[Path]) -> list[dict]:
    # Images first, then the text that refers to them — the API handles this
    # ordering better than text-then-images.
    content = [block for path in images if (block := ai_request.image_block(path))]
    content.append({
        'type': 'text',
        'text': (
            f'Project title: {record["title"]}\n\n'
            f'Instagram caption:\n{record["description"]}\n\n'
            f'{len(images)} photo(s) from this post are attached above.'
        ),
    })
    return content


# Every value here ends up pasted into src/lib/projects.ts and rendered on the
# site, so nothing reaches that file unchecked. These fields are short one-line
# phrases by construction; anything markdown-shaped, JSON-shaped, multi-line, or
# far too long is a malformed generation rather than copy, and is dropped.
MAX_LINE_CHARS = 220
# Structural characters that never appear in a spec value or a one-line feature,
# but do appear in leaked schema fragments, markdown, and JSON.
FORBIDDEN_CHARS = '{}[]<>`\n'
SUSPECT_PHRASES = ('system prompt', 'ignore the', 'json object', 'schema')


def suspect(value: str, max_chars: int = MAX_LINE_CHARS) -> str | None:
    """Why this value should be rejected, or None if it looks like real copy."""
    if len(value) > max_chars:
        return f'{len(value)} chars (limit {max_chars})'
    for char in FORBIDDEN_CHARS:
        if char in value:
            return f'contains {char!r}' if char != '\n' else 'multi-line'
    lowered = value.lower()
    for phrase in SUSPECT_PHRASES:
        if phrase in lowered:
            return f'contains {phrase!r}'
    return None


def clean(value, field: str, rejected: list[str], max_chars: int = MAX_LINE_CHARS) -> str:
    text = ' '.join(str(value or '').split())
    if not text:
        return ''
    reason = suspect(text, max_chars)
    if reason:
        rejected.append(f'{field} ({reason})')
        return ''
    return text


def fit(items, count: int, field: str, rejected: list[str]) -> list[str]:
    """Exactly `count` entries — trimmed if over, padded with blanks if under."""
    cleaned = [c for item in (items or []) if (c := clean(item, field, rejected))]
    return (cleaned + [''] * count)[:count]


def clean_specs(specs, rejected: list[str]) -> list[dict]:
    """Label/value pairs, keeping only those with both halves present.

    A pair with a blank value renders as an empty row on the project page, so
    it is dropped rather than passed through.
    """
    out = []
    for pair in specs or []:
        if not isinstance(pair, dict):
            continue
        label = clean(pair.get('label'), 'spec label', rejected, 60)
        value = clean(pair.get('value'), f'spec:{pair.get("label")}', rejected)
        if label and value:
            out.append({'label': label, 'value': value})
    return out[:MAX_SPECS]


def normalise(result: dict) -> tuple[dict, list[str]]:
    """Returns the normalised entry plus a list of anything dropped."""
    specs = result.get('specs') or []
    rejected: list[str] = []
    entry = {
        'title': clean(result.get('title'), 'title', rejected, MAX_TITLE_CHARS).rstrip('.'),
        'description': clean(result.get('description'), 'description', rejected, MAX_DESCRIPTION_CHARS),
        'overview': clean(result.get('overview'), 'overview', rejected, MAX_OVERVIEW_CHARS),
        'tags': [c for t in (result.get('tags') or []) if (c := clean(t, 'tag', rejected))][:MAX_TAGS],
        'features': fit(result.get('features'), FEATURE_COUNT, 'feature', rejected),
        'process': fit(result.get('process'), PROCESS_COUNT, 'process', rejected),
        'specs': clean_specs(specs, rejected),
    }
    return entry, rejected


def enrich(record: dict) -> dict | None:
    images = gather_images(record)
    shortcode = record['shortcode']

    result = ai_request.structured_json(
        system=SYSTEM_PROMPT,
        content=build_content(record, images),
        schema=SCHEMA,
        label=f'{shortcode} ({record["slug"]})',
    )
    if result is None:
        return None

    entry, rejected = normalise(result)
    if rejected:
        print(f'\n    dropped malformed: {", ".join(rejected)}', file=sys.stderr)
        entry['rejected'] = rejected
    entry['model'] = ai_request.target().model
    entry['generated_at'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    entry['image_count'] = len(images)
    return entry


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------


def pending(records: list[dict], cache: dict, force: bool, only: str | None) -> list[dict]:
    out = []
    for record in records:
        if record.get('status') == 'locked':
            continue
        if only and record.get('shortcode') != only:
            continue
        if record.get('shortcode') in cache and not force:
            continue
        out.append(record)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--force', action='store_true', help='Re-enrich posts that are already cached')
    parser.add_argument('--limit', type=int, help='Only process the first N pending posts')
    parser.add_argument('--only', help='Only process this shortcode')
    parser.add_argument('--dry-run', action='store_true', help='List what would be sent, without calling the API')
    args = parser.parse_args()

    if not POSTS_JSON.exists():
        return print(f'{POSTS_JSON.name} not found — run ./scripts/export_instagram_posts.py first') or 1

    with POSTS_JSON.open(encoding='utf-8') as f:
        records = json.load(f)

    cache = load_cache()
    todo = pending(records, cache, args.force, args.only)
    if args.limit is not None:
        todo = todo[: args.limit]

    if not todo:
        print(f'Nothing to enrich — {len(cache)} post(s) already cached. Use --force to redo them.')
        return 0

    if args.dry_run:
        for record in todo:
            images = gather_images(record)
            print(f'  would enrich  {record["shortcode"]}  {record["slug"]}  ({len(images)} image(s))')
        print(f'\nDry run: {len(todo)} post(s) would be sent to {ai_config.MODEL}. Nothing written.')
        return 0

    target = ai_request.target()
    print(f'Enriching {len(todo)} post(s) via {target.label}, effort {ai_config.EFFORT}\n')

    succeeded = 0
    for record in todo:
        shortcode = record['shortcode']
        images = gather_images(record)
        print(f'  {shortcode}  {record["slug"]}  ({len(images)} image(s)) ... ', end='', flush=True)

        entry = enrich(record)
        if entry is None:
            print('failed')
            continue

        cache[shortcode] = entry
        # Written per post, so an interrupted or rate-limited run keeps
        # everything already paid for.
        save_cache(cache)
        succeeded += 1
        print(
            f'done ({len(entry["overview"].split())}w overview, '
            f'{len(entry["tags"])} tags, {len(entry["specs"])} specs)'
        )

    print(f'\n{succeeded}/{len(todo)} enriched. Cache: {CACHE_PATH.relative_to(REPO_ROOT)}')
    if succeeded:
        print('\nNext: re-run ./scripts/export_instagram_posts.py to fold these into')
        print('      bastian.built.posts.json and scripts/new-projects.snippet.ts')
    return 0 if succeeded == len(todo) else 1


if __name__ == '__main__':
    raise SystemExit(main())
