#!/usr/bin/env python3
"""Pull posts from Instagram into the site's public/ media folders.

Usage:
    python3 ./scripts/export_instagram_posts.py            # incremental pull
    python3 ./scripts/export_instagram_posts.py --dry-run  # show what would happen
    python3 ./scripts/export_instagram_posts.py --force    # re-download unlocked posts
    python3 ./scripts/export_instagram_posts.py --limit 5  # only the 5 newest posts

Media lands in public/<dir>/ so Next.js can serve it at /<dir>/<file>.

Which project a post belongs to is recorded in scripts/post-map.json. Posts
marked `locked` there already have a hand-written entry in src/lib/projects.ts
with curated media; this script never downloads over them or touches their
files. Everything else is downloaded once and skipped on later runs.

Outputs:
    bastian.built.posts.json        every post, with a status per post
    scripts/new-projects.snippet.ts paste-ready Project entries for new posts

Set IG_USER (and IG_PASS on first run) to log in, which avoids most rate
limiting. The session is cached, so IG_PASS is only needed once.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    import instaloader
    from slugify import slugify
except ImportError:
    sys.exit('Missing dependencies. Install them with:\n\n    pip3 install instaloader python-slugify\n')

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = REPO_ROOT / 'public'
PROJECTS_TS = REPO_ROOT / 'src' / 'lib' / 'projects.ts'
MAP_PATH = SCRIPT_DIR / 'post-map.json'
SNIPPET_PATH = SCRIPT_DIR / 'new-projects.snippet.ts'
OUT_JSON = REPO_ROOT / 'bastian.built.posts.json'
ENRICHMENT_PATH = SCRIPT_DIR / 'enrichment.json'

PROFILE = 'bastian.built'

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.webp')
VIDEO_EXTS = ('.mp4', '.webm', '.mov')
MEDIA_EXTS = IMAGE_EXTS + VIDEO_EXTS

HASHTAG_RE = re.compile(r'#(\w+)')
TITLE_FALLBACK = 'Instagram Post'

# The spec labels every hand-written entry in projects.ts uses, so generated
# entries can be pasted in and filled out rather than reshaped first.
CURATED_SPEC_LABELS = ('Material', 'Print Method', 'Weight', 'Dimensions', 'Post-Processing')


# --------------------------------------------------------------------------
# caption parsing
# --------------------------------------------------------------------------


def title_case(text: str) -> str:
    """Tame a SHOUTED caption line without mangling model codes.

    Any token containing a digit is left alone — NP300 and CBR600RR must not
    become Np300 and Cbr600rr — as is any token that is already mixed case.
    This is only a fallback; enrich_projects.py writes the real title.
    """
    letters = [c for c in text if c.isalpha()]
    if not letters or sum(c.isupper() for c in letters) / len(letters) < 0.7:
        return text

    words = []
    for word in text.split(' '):
        if any(c.isdigit() for c in word) or not word.isupper():
            words.append(word)
        else:
            words.append(word.capitalize())
    return ' '.join(words)


def extract_title(caption: str) -> str:
    """First non-empty caption line, cleaned up enough to use as a heading."""
    for line in caption.splitlines():
        line = line.strip()
        if not line:
            continue
        # Captions often open with a full sentence; a heading wants the first
        # clause, not 80 characters cut mid-word.
        first = re.split(r'(?<=[.!?])\s+', line)[0]
        if len(first) > 80:
            first = first[:80].rsplit(' ', 1)[0]
        return title_case(first.rstrip(' .'))
    return TITLE_FALLBACK


def extract_tags(caption: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for tag in HASHTAG_RE.findall(caption):
        tag = tag.strip()
        if tag and tag.lower() not in seen:
            seen.add(tag.lower())
            out.append(tag)
    return out


# --------------------------------------------------------------------------
# slug + map handling
# --------------------------------------------------------------------------


def load_map() -> dict:
    if not MAP_PATH.exists():
        return {}
    with MAP_PATH.open(encoding='utf-8') as f:
        return json.load(f)


def save_map(post_map: dict) -> None:
    comment = post_map.get('_comment')
    entries = {k: v for k, v in post_map.items() if not k.startswith('_')}
    ordered = {}
    if comment is not None:
        ordered['_comment'] = comment
    ordered.update(entries)
    with MAP_PATH.open('w', encoding='utf-8') as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)
        f.write('\n')


def curated_slugs() -> set[str]:
    """Slugs already used in projects.ts, so a generated slug never collides."""
    if not PROJECTS_TS.exists():
        return set()
    source = PROJECTS_TS.read_text(encoding='utf-8')
    return {s for s in re.findall(r"slug:\s*'([^']*)'", source) if s}


def unique_slug(base: str, taken: set[str], shortcode: str) -> str:
    slug = base or shortcode.lower()
    if slug not in taken:
        return slug
    # A caption-derived slug that collides is more likely a duplicate title than
    # the same post, so disambiguate with the shortcode rather than a counter.
    return f'{slug}-{shortcode.lower()}'


# --------------------------------------------------------------------------
# media discovery
# --------------------------------------------------------------------------


def discover_media(directory: Path, shortcode: str) -> list[Path]:
    """Files instaloader wrote for this post, in carousel order.

    Sidecars are saved as <shortcode>_1.jpg, <shortcode>_2.mp4, ...; single
    posts as <shortcode>.jpg. Matched with a regex because shortcodes can
    themselves contain an underscore (e.g. DQdbu_lEo3v).
    """
    if not directory.is_dir():
        return []

    pattern = re.compile(rf'^{re.escape(shortcode)}(?:_(\d+))?$')
    matches: list[tuple[int, Path]] = []
    for path in directory.iterdir():
        if not path.is_file() or path.suffix.lower() not in MEDIA_EXTS:
            continue
        found = pattern.match(path.stem)
        if found:
            matches.append((int(found.group(1) or 0), path))

    return [path for _, path in sorted(matches, key=lambda pair: (pair[0], pair[1].name))]


def is_video(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTS


def describe_media(post, files: list[Path]) -> str:
    """Human-readable media type.

    post.is_video is False for a carousel even when it contains video, so the
    breakdown comes from the downloaded files rather than that flag.
    """
    videos = sum(1 for path in files if is_video(path))
    images = len(files) - videos

    if post.typename != 'GraphSidecar':
        return 'Video' if (videos or post.is_video) else 'Image'

    parts = []
    if images:
        parts.append(f'{images} image' + ('s' if images != 1 else ''))
    if videos:
        parts.append(f'{videos} video' + ('s' if videos != 1 else ''))
    return 'Carousel — ' + ', '.join(parts) if parts else 'Carousel'


def web_path(directory_name: str, path: Path) -> str:
    return f'/{directory_name}/{path.name}'


# --------------------------------------------------------------------------
# output
# --------------------------------------------------------------------------


def short_description(caption: str, title: str, limit: int = 200) -> str:
    """Fallback card blurb, used until enrich_projects.py writes a real one.

    `description` renders on the card and as the project page's lead line, so it
    has to be short — the full caption lives in `overview`. This takes the first
    sentence after the repeated title line, or trims on a word boundary.
    """
    text = ' '.join(caption.split())
    if text.startswith(title):
        text = text[len(title) :].lstrip(' .-—')
    if not text:
        return ''
    if len(text) <= limit:
        return text

    first_sentence = re.split(r'(?<=[.!?])\s+', text)[0]
    if len(first_sentence) <= limit:
        return first_sentence
    return text[:limit].rsplit(' ', 1)[0].rstrip(' ,;:-') + '…'


def build_record(post, caption: str, slug: str, dir_name: str, files: list[Path], status: str) -> dict:
    gallery = [web_path(dir_name, path) for path in files]
    images = [web_path(dir_name, path) for path in files if not is_video(path)]

    # Cover the card with a still where the post has one — every curated entry
    # in projects.ts uses an image, and a video cover can't be a poster frame.
    cover = images[0] if images else (gallery[0] if gallery else '')

    title = extract_title(caption)

    return {
        'slug': slug,
        'title': title,
        # Short blurb for the card and the page lead; the caption is kept whole
        # in `overview`. enrich_projects.py replaces this with a written one.
        'description': short_description(caption, title),
        'image': cover,
        'tags': extract_tags(caption),
        'overview': caption.strip(),
        'features': [],
        'specs': [{'label': label, 'value': ''} for label in CURATED_SPEC_LABELS],
        'process': [],
        'gallery': gallery,
        # Metadata about the pull itself, not part of the Project shape.
        'shortcode': post.shortcode,
        'date': post.date_utc.strftime('%Y-%m-%d'),
        'mediaType': describe_media(post, files),
        'status': status,
    }


def load_enrichment() -> dict:
    """AI-generated fields from scripts/enrich_projects.py, keyed by shortcode."""
    if not ENRICHMENT_PATH.exists():
        return {}
    with ENRICHMENT_PATH.open(encoding='utf-8') as f:
        return json.load(f)


def apply_enrichment(records: list[dict], enrichment: dict) -> int:
    """Fold cached AI fields into the records. Returns how many were filled."""
    filled = 0
    for record in records:
        entry = enrichment.get(record.get('shortcode'))
        if not entry or record.get('status') == 'locked':
            continue

        # Caption hashtags win if there are any — they're the author's own
        # labels. In practice these captions carry none, so the AI tags apply.
        record['tags'] = record['tags'] or entry.get('tags', [])
        # A written title/blurb beats the caption-derived fallback; keep the
        # fallback if the guard rejected the generated one.
        record['title'] = entry.get('title') or record['title']
        record['description'] = entry.get('description') or record['description']
        # The rewritten overview replaces the raw caption on the page. The
        # caption itself stays in this file under `caption`, so nothing is lost.
        record['caption'] = record['overview']
        record['overview'] = entry.get('overview') or record['overview']
        record['features'] = entry.get('features', [])
        record['process'] = entry.get('process', [])
        # Labels are chosen per project now, and only populated pairs arrive.
        record['specs'] = entry.get('specs') or record['specs']
        record['enrichedBy'] = entry.get('model')
        filled += 1
    return filled


def ts_literal(value) -> str:
    """JSON is valid TypeScript for these shapes, and escapes correctly."""
    return json.dumps(value, ensure_ascii=False)


def render_snippet(records: list[dict]) -> str:
    lines = [
        '// Generated by scripts/export_instagram_posts.py — paste into the',
        '// `projects` array in src/lib/projects.ts.',
        '//',
        '// description/overview are the Instagram caption verbatim; rewrite them',
        '// as site copy. tags/features/process/specs are AI-drafted from the',
        '// caption and photos (scripts/enrich_projects.py) — read them before',
        '// shipping. Empty spec values mean the caption did not evidence one.',
        '',
    ]
    for record in records:
        specs = record.get('specs') or [{'label': label, 'value': ''} for label in CURATED_SPEC_LABELS]
        features = record.get('features') or [''] * 5
        process = record.get('process') or [''] * 6

        lines.append('{')
        lines.append(f'  slug: {ts_literal(record["slug"])},')
        lines.append(f'  title: {ts_literal(record["title"])},')
        lines.append(f'  description: {ts_literal(record["description"])},')
        lines.append(f'  image: {ts_literal(record["image"])},')
        lines.append(f'  tags: {ts_literal(record["tags"])},')
        lines.append(f'  overview: {ts_literal(record["overview"])},')
        lines.append('  features: [')
        for item in features:
            lines.append(f'    {ts_literal(item)},')
        lines.append('  ],')
        lines.append('  specs: [')
        for spec in specs:
            lines.append(
                f'    {{ label: {ts_literal(spec["label"])}, value: {ts_literal(spec["value"])} }},'
            )
        lines.append('  ],')
        lines.append('  process: [')
        for item in process:
            lines.append(f'    {ts_literal(item)},')
        lines.append('  ],')
        lines.append('  gallery: [')
        for item in record['gallery']:
            lines.append(f'    {ts_literal(item)},')
        lines.append('  ],')
        lines.append(f'}}, // {record["shortcode"]} · {record["date"]} · {record["mediaType"]}')
        lines.append('')
    return '\n'.join(lines)


# --------------------------------------------------------------------------
# instaloader setup
# --------------------------------------------------------------------------


def build_loader() -> instaloader.Instaloader:
    return instaloader.Instaloader(
        # {target} is the per-post folder name passed to download_post().
        dirname_pattern=str(PUBLIC_DIR / '{target}'),
        filename_pattern='{shortcode}',
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        # Metadata would be written into public/ and served publicly.
        save_metadata=False,
        post_metadata_txt_pattern='',
        quiet=False,
    )


def maybe_login(loader: instaloader.Instaloader) -> None:
    user = os.environ.get('IG_USER')
    if not user:
        return

    try:
        loader.load_session_from_file(user)
        print(f'Using cached Instagram session for {user}.')
        return
    except FileNotFoundError:
        pass

    password = os.environ.get('IG_PASS')
    if not password:
        print(f'No cached session for {user} and IG_PASS is not set — continuing anonymously.')
        return

    loader.login(user, password)
    loader.save_session_to_file()
    print(f'Logged in as {user}; session cached for future runs.')


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--profile', default=PROFILE, help=f'Instagram profile to pull (default: {PROFILE})')
    parser.add_argument('--force', action='store_true', help='Re-download posts that are already on disk (locked posts are still skipped)')
    parser.add_argument('--limit', type=int, help='Only process the N most recent posts')
    parser.add_argument('--dry-run', action='store_true', help='Report what would be downloaded without writing anything')
    parser.add_argument('--enrich', action='store_true', help='Also draft tags/features/process/specs via the Anthropic API (see enrich_projects.py)')
    args = parser.parse_args()

    # Fail before the download loop rather than after it, so a missing key never
    # costs a full re-pull and never aborts between downloading and writing.
    if args.enrich and not args.dry_run:
        import enrich_projects

        enrich_projects.ai_request.target()

    post_map = load_map()
    taken = curated_slugs() | {v['slug'] for k, v in post_map.items() if not k.startswith('_')}

    loader = build_loader()
    if not args.dry_run:
        maybe_login(loader)

    profile = instaloader.Profile.from_username(loader.context, args.profile)

    records: list[dict] = []
    counts = {'downloaded': 0, 'existing': 0, 'locked': 0}

    for index, post in enumerate(profile.get_posts()):
        if args.limit is not None and index >= args.limit:
            break

        caption = post.caption or ''
        entry = post_map.get(post.shortcode)

        if entry and entry.get('locked'):
            counts['locked'] += 1
            print(f'  locked      {post.shortcode}  {entry["slug"]}')
            records.append({
                'slug': entry['slug'],
                'title': extract_title(caption),
                'description': caption.strip(),
                'shortcode': post.shortcode,
                'date': post.date_utc.strftime('%Y-%m-%d'),
                'status': 'locked',
                'note': 'Curated in src/lib/projects.ts; media in public/ left untouched.',
            })
            continue

        if entry:
            slug, dir_name = entry['slug'], entry['dir']
        else:
            slug = unique_slug(slugify(extract_title(caption)), taken, post.shortcode)
            dir_name = slug
            taken.add(slug)

        target = PUBLIC_DIR / dir_name
        files = discover_media(target, post.shortcode)

        if files and not args.force:
            status = 'existing'
            counts['existing'] += 1
            print(f'  skip        {post.shortcode}  {slug}  ({len(files)} files already in public/{dir_name}/)')
        elif args.dry_run:
            status = 'would-download'
            counts['downloaded'] += 1
            print(f'  would pull  {post.shortcode}  {slug}  -> public/{dir_name}/')
        else:
            loader.download_post(post, target=dir_name)
            files = discover_media(target, post.shortcode)
            status = 'downloaded'
            counts['downloaded'] += 1
            print(f'  downloaded  {post.shortcode}  {slug}  -> public/{dir_name}/ ({len(files)} files)')

        if not args.dry_run and post.shortcode not in post_map:
            post_map[post.shortcode] = {'slug': slug, 'dir': dir_name, 'locked': False}

        records.append(build_record(post, caption, slug, dir_name, files, status))

    if args.dry_run:
        print(f'\nDry run: {counts["downloaded"]} to download, {counts["existing"]} already present, {counts["locked"]} locked. Nothing written.')
        return 0

    save_map(post_map)

    if args.enrich:
        # Imported lazily so a plain export never needs the anthropic SDK.
        import enrich_projects

        cache = enrich_projects.load_cache()
        todo = enrich_projects.pending(records, cache, force=False, only=None)
        if todo:
            print(f'\nEnriching {len(todo)} post(s) via {enrich_projects.ai_request.target().label}')
            for record in todo:
                print(f'  {record["shortcode"]}  {record["slug"]} ... ', end='', flush=True)
                entry = enrich_projects.enrich(record)
                if entry is None:
                    print('failed')
                    continue
                cache[record['shortcode']] = entry
                enrich_projects.save_cache(cache)
                print('done')

    enrichment = load_enrichment()
    enriched = apply_enrichment(records, enrichment)

    with OUT_JSON.open('w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
        f.write('\n')

    # Anything not locked has no entry in projects.ts yet, whether it came down
    # on this run or an earlier one, so it all belongs in the snippet.
    pending = [r for r in records if r.get('status') != 'locked']
    if pending:
        SNIPPET_PATH.write_text(render_snippet(pending), encoding='utf-8')

    print(f'\n{counts["downloaded"]} downloaded, {counts["existing"]} already present, {counts["locked"]} locked.')
    print(f'Wrote {len(records)} posts to {OUT_JSON.relative_to(REPO_ROOT)}')
    if pending:
        print(f'Wrote {len(pending)} entries awaiting copy to {SNIPPET_PATH.relative_to(REPO_ROOT)}')
        unenriched = len(pending) - enriched
        if unenriched:
            print(f'{unenriched} of them still have blank fields — run ./scripts/enrich_projects.py to draft them')
        print('\nNext: paste them into src/lib/projects.ts, review the copy, then set')
        print(f'      "locked": true for those shortcodes in {MAP_PATH.relative_to(REPO_ROOT)}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
