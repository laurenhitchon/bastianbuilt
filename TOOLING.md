# Shared repository tooling

This repository uses the portable parts of
[`digitalnsw/nswds-devops`](https://github.com/digitalnsw/nswds-devops) without
granting DigitalNSW automation access to a personal repository.

## Distribution model

- Reusable GitHub Actions workflows are called directly from the public
  `nswds-devops` repository. Each caller is pinned to the commit currently
  promoted as `v1`; Renovate manages later digest updates as pull requests once
  the Mend Renovate App is enabled for this repository.
- Shell scripts and hook templates under `scripts/` are vendored from
  `digitalnsw/nswds-devops` at the promoted `v1` commit `cef727d`. They are refreshed manually
  because the DigitalNSW file-sync GitHub App is not installed on this account.
- `scripts/branch-name-config.sh` has a small personal override: `feature/` and
  `bugfix/` remain accepted aliases alongside the shared `feat/` and `fix/`
  prefixes.
- AI scripts default to `AI_MODEL=openai/gpt-5.6-sol` and
  `AI_PROVIDER=azure`; repo-local overrides can live in the gitignored `.env`.
- ESLint and Prettier policy comes from the published
  `@nswds/eslint-config` and `@nswds/prettier-config` packages.
- `renovate.json` extends the public NSWDS preset but re-enables vulnerability
  alerts because this repository does not inherit DigitalNSW's Snyk coverage.

## Updating the vendored layer

Review changes in `digitalnsw/nswds-devops`, replace the corresponding files
under `scripts/`, preserve the personal branch aliases, then run:

```sh
npm run format:check
npm run lint
npm run type-check
npm run build
actionlint .github/workflows/*.yml
shellcheck -x -e SC1091 scripts/*.sh
```

Do not switch workflow references back to the floating `v1` tag. The SHA pin
keeps changes in another organisation reviewable in this repository.
