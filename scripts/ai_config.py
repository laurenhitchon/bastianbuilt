"""Shared AI model configuration.

Import this to get one consistent model and credential across every script here
— the same role scripts/openai-config.sh plays in nswds-devops.

Requests are routed through the Vercel AI Gateway, so model identifiers use the
gateway's provider/model form (e.g. anthropic/claude-opus-5). The gateway serves
Anthropic's *native* Messages API at https://ai-gateway.vercel.sh/v1/messages,
so the official anthropic SDK works against it unchanged — structured outputs,
vision, and prompt caching all behave the same as they do first-party.

Providers are tried in order, same convention as jira-tickets/create-jira-from-acme.js:
    1. Vercel AI Gateway   AI_GATEWAY_API_KEY   (primary)
    2. Anthropic direct    ANTHROPIC_API_KEY    (fallback)
Each is skipped unless its credentials are present.

Environment overrides:
    AI_GATEWAY_API_KEY    gateway key — the primary provider
    AI_GATEWAY_BASE_URL   default: https://ai-gateway.vercel.sh
    AI_MODEL              default: anthropic/claude-opus-5
    ANTHROPIC_API_KEY     used only when the gateway key is absent
    AI_EFFORT             low | medium | high | xhigh | max (default: high)
    AI_MAX_TOKENS         output ceiling per request (default: 16000)

    AI_MODEL=anthropic/claude-sonnet-5 python3 ./scripts/enrich_projects.py
"""

from __future__ import annotations

import os
from dataclasses import dataclass

GATEWAY_BASE_URL = os.environ.get('AI_GATEWAY_BASE_URL') or 'https://ai-gateway.vercel.sh'

# Single source of truth for the default model. Change it here once and every
# script that imports this picks it up.
MODEL = os.environ.get('AI_MODEL') or os.environ.get('ANTHROPIC_MODEL') or 'anthropic/claude-opus-5'

# Effort controls how much the model thinks and spends per request. `high` is
# the API default; `medium` is a cheaper step down that suits short structured
# extraction, `xhigh`/`max` are for genuinely hard reasoning.
VALID_EFFORTS = ('low', 'medium', 'high', 'xhigh', 'max')
EFFORT = os.environ.get('AI_EFFORT') or os.environ.get('ANTHROPIC_EFFORT') or 'high'

if EFFORT not in VALID_EFFORTS:
    raise SystemExit(f'AI_EFFORT must be one of {", ".join(VALID_EFFORTS)} (got {EFFORT!r})')

# Thinking is on by default on claude-opus-5, and max_tokens caps thinking plus
# response text together — so this needs headroom above the size of the answer.
try:
    MAX_TOKENS = int(os.environ.get('AI_MAX_TOKENS') or os.environ.get('ANTHROPIC_MAX_TOKENS') or '16000')
except ValueError:
    raise SystemExit('AI_MAX_TOKENS must be an integer')


@dataclass(frozen=True)
class Target:
    """Where a request goes, and under what model name."""

    label: str
    api_key: str
    base_url: str | None
    model: str


def resolve_target() -> Target:
    """Pick the first configured provider, adjusting the model name to suit it.

    The gateway wants a provider/model slug; Anthropic direct wants the bare
    model ID. A bare name in AI_MODEL is assumed to be Anthropic's, so overrides
    work either way round.
    """
    gateway_key = os.environ.get('AI_GATEWAY_API_KEY')
    if gateway_key:
        model = MODEL if '/' in MODEL else f'anthropic/{MODEL}'
        return Target(
            label=f'Vercel AI Gateway ({model})',
            api_key=gateway_key,
            base_url=GATEWAY_BASE_URL,
            model=model,
        )

    direct_key = os.environ.get('ANTHROPIC_API_KEY')
    if direct_key:
        model = MODEL.split('/', 1)[1] if MODEL.startswith('anthropic/') else MODEL
        if '/' in model:
            raise SystemExit(
                f'AI_MODEL is {MODEL!r}, which names a non-Anthropic provider, but only\n'
                'ANTHROPIC_API_KEY is set. Set AI_GATEWAY_API_KEY to reach that model.'
            )
        return Target(
            label=f'Anthropic direct ({model})',
            api_key=direct_key,
            base_url=None,
            model=model,
        )

    raise SystemExit(
        'No AI provider configured. Export AI_GATEWAY_API_KEY (preferred — the same\n'
        'key the nswds-devops scripts use), or ANTHROPIC_API_KEY to call Anthropic\n'
        'directly:\n\n'
        '    export AI_GATEWAY_API_KEY=...\n'
    )
