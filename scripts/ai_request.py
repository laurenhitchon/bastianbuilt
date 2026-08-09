"""Shared AI request helper.

Import this instead of ai_config directly — you get the model defaults and one
`structured_json()` function that every script here uses to talk to the API.
Same role scripts/openai-request.sh plays in nswds-devops.

Requests go to the Vercel AI Gateway, which serves Anthropic's native Messages
API shape — so this uses the official anthropic SDK with `base_url` pointed at
the gateway rather than an OpenAI-compatible shim. `structured_json()` uses
structured outputs (`output_config.format`), so the model's reply is constrained
to the JSON Schema you pass and comes back as a validated dict — no prose to
strip, no parse-and-retry loop like the Responses-API helper needs.

Requires: pip3 install anthropic
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

import ai_config

try:
    import anthropic
except ImportError:
    raise SystemExit('Missing dependency. Install it with:\n\n    pip3 install anthropic\n')

IMAGE_MEDIA_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
}

_client: anthropic.Anthropic | None = None
_target: ai_config.Target | None = None


def target() -> ai_config.Target:
    """The resolved provider — gateway if its key is set, else Anthropic direct."""
    global _target
    if _target is None:
        _target = ai_config.resolve_target()
    return _target


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        resolved = target()
        _client = anthropic.Anthropic(
            api_key=resolved.api_key,
            base_url=resolved.base_url,  # None keeps the SDK's own default
        )
    return _client


def image_block(path: Path) -> dict | None:
    """A base64 image content block, or None if the file isn't a usable image."""
    media_type = IMAGE_MEDIA_TYPES.get(path.suffix.lower())
    if not media_type or not path.is_file():
        return None

    return {
        'type': 'image',
        'source': {
            'type': 'base64',
            'media_type': media_type,
            'data': base64.standard_b64encode(path.read_bytes()).decode('ascii'),
        },
    }


def structured_json(system: str, content: list[dict], schema: dict, label: str = 'request') -> dict | None:
    """Send one request and return the model's reply parsed against `schema`.

    Returns None on any failure — refusal, API error, or transport — after
    printing a diagnostic to stderr. Callers decide whether to skip or stop.

    `system` is sent as a cached block: across a run of several posts the
    instructions are identical, so every call after the first reads that prefix
    at ~10% of input cost instead of reprocessing it.
    """
    try:
        response = client().messages.create(
            model=target().model,
            max_tokens=ai_config.MAX_TOKENS,
            output_config={
                'effort': ai_config.EFFORT,
                'format': {'type': 'json_schema', 'schema': schema},
            },
            system=[{'type': 'text', 'text': system, 'cache_control': {'type': 'ephemeral'}}],
            messages=[{'role': 'user', 'content': content}],
        )
    except anthropic.RateLimitError:
        print(f'  rate limited on {label} — wait and re-run; finished posts are cached', file=sys.stderr)
        return None
    except anthropic.APIStatusError as exc:
        print(f'  API error on {label} ({exc.status_code}): {exc.message}', file=sys.stderr)
        return None
    except anthropic.APIConnectionError as exc:
        print(f'  could not reach the API for {label}: {exc}', file=sys.stderr)
        return None

    # Check why generation stopped before reading content — a refusal returns
    # HTTP 200 with empty or partial content, not an exception.
    if response.stop_reason == 'refusal':
        category = getattr(response.stop_details, 'category', None)
        print(f'  {label} was declined by the safety classifiers ({category}) — skipping', file=sys.stderr)
        return None

    if response.stop_reason == 'max_tokens':
        print(f'  {label} hit the output ceiling — raise ANTHROPIC_MAX_TOKENS', file=sys.stderr)
        return None

    text = ''.join(block.text for block in response.content if block.type == 'text')
    if not text.strip():
        print(f'  {label} returned no content', file=sys.stderr)
        return None

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        print(f'  {label} returned unparseable JSON: {exc}', file=sys.stderr)
        return None
