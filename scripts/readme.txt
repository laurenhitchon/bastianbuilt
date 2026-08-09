Pull Instagram posts into the site, then draft the project fields with Claude.

  # 1. pull new posts into public/<slug>/ (incremental, skips what's on disk)
  python3 ./scripts/export_instagram_posts.py

  # 2. draft tags/features/process/specs from each caption + its photos
  python3 ./scripts/enrich_projects.py

  # 3. re-run the export to fold the drafts into the outputs
  python3 ./scripts/export_instagram_posts.py

  # or do 1-3 in one go
  python3 ./scripts/export_instagram_posts.py --enrich

Then paste scripts/new-projects.snippet.ts into src/lib/projects.ts, review the
copy, and set "locked": true for those shortcodes in scripts/post-map.json.

Requires: pip3 install instaloader python-slugify anthropic
          AI_GATEWAY_API_KEY in the environment (step 2 only) — the same Vercel
          AI Gateway key the nswds-devops scripts use. Falls back to
          ANTHROPIC_API_KEY for a direct Anthropic call if the gateway key is
          absent. Model defaults to anthropic/claude-opus-5; override with
          AI_MODEL, AI_EFFORT, AI_MAX_TOKENS.

One-off backfill (already run once, kept for future hand-written entries):

  python3 ./scripts/backfill_specs.py --dry-run
  python3 ./scripts/backfill_specs.py
  npx prettier --write src/lib/projects.ts

Reads each entry in src/lib/projects.ts that has blank spec rows, plus its
photos, and appends project-appropriate pairs. Existing values are re-injected
verbatim — the model can only add, never alter or reorder what is already there.

Useful flags:
  export_instagram_posts.py  --dry-run --force --limit N --enrich
  enrich_projects.py         --dry-run --force --limit N --only <shortcode>

Costs are cached per shortcode in scripts/enrichment.json — re-running the
export never re-bills, and --force is the only way to redo a post.
