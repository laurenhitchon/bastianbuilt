# Repository tooling

CI, releases and dependency updates are defined entirely in this repository.
Nothing here reads workflows or configuration from another account at run
time.

## GitHub Actions workflows

| Workflow                    | Runs on                                       | What it does                                                                                                                                        |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                    | Pull requests                                 | Five jobs: install and build, lint, typecheck, format check and tests. Each job runs the matching `package.json` script.                            |
| `commitlint.yml`            | Pull requests                                 | Lints every commit in the PR against `commitlint.config.mjs`.                                                                                       |
| `validate-branch-name.yml`  | Pull requests                                 | Checks the branch name against `scripts/branch-name-config.sh`, read from the base commit.                                                          |
| `commit-types-sync.yml`     | PRs and pushes touching the commit-type files | Runs `scripts/check-commit-types-sync.sh`.                                                                                                          |
| `ai-pr-title.yml`           | PR opened, reopened or edited                 | Rewrites a title that is not a Conventional Commit header, using the AI Gateway. A valid title is never changed.                                    |
| `openai-pr-description.yml` | PR opened                                     | Writes a description when the PR has none. The diff is redacted with `scripts/secret-redaction.sh` first.                                           |
| `release.yml`               | Push to `main`                                | Runs semantic-release with `release.config.mjs`. Opens a "Release failed on main" issue on failure and closes it after the next successful release. |

- **Required checks.** The "Protect main" ruleset requires `commitlint / commitlint`
  and `install / install`, `install / lint`, `install / typecheck`,
  `install / format` and `install / test`. Those strings are the job `name`
  values in `commitlint.yml` and `ci.yml`. Renaming a job without updating the
  ruleset leaves a required check that never reports.
- **Release pushes.** `release.yml` checks out with the `RELEASE_DEPLOY_KEY`
  secret. That deploy key is the ruleset's only bypass actor, which is what lets
  the `chore(release)` commit reach `main`. The release job installs with
  `--ignore-scripts`, so no dependency install script runs while that key is on
  disk.
- **Skipping the CI build.** Setting the repository Actions variable
  `CI_SKIP_BUILD=true` skips `npm run build` in `install / install`. Use it only
  if the build starts needing deploy-time environment variables. Install and
  signature verification still run.
- **AI workflows.** These need the `AI_GATEWAY_API_KEY` secret. They skip
  pull requests opened by bots or from forks. They load their scripts from the
  base commit, because the job holds that secret.
- **Untested by PRs.** `release.yml` runs only on pushes to `main`. A change to
  it is first exercised by the next merge.
- **Action pins.** Actions are pinned to commit SHAs. Renovate keeps the pins
  current.

## Renovate

`renovate.json` extends only Renovate's built-in presets. Updates run before
7am on Mondays, Sydney time, and every npm update waits until its release is 3
days old. Vulnerability alerts are enabled.

Renovate also keeps `.nvmrc` current. Node.js minor and patch releases join the
non-major group PR. A new Node.js major arrives in its own PR on the same
branch as the matching `@types/node` major. That PR needs `engines.node` in
`package.json` changed to the new major before it can install.

Renovate rebases a PR only when it conflicts with `main`. A reviewed PR that has
fallen behind needs its rebase checkbox ticked before it can merge. The two
automerge groups below rebase whenever they fall behind, so they never stall.

Renovate merges two kinds of update by itself once the required checks pass:

| Group                            | Branch                           |
| -------------------------------- | -------------------------------- |
| Monthly lockfile maintenance     | `renovate/lock-file-maintenance` |
| Patch updates to devDependencies | `renovate/dev-patch`             |

Next.js packages always arrive together in one PR for review.
`conventional-changelog-conventionalcommits` majors are disabled, because v10
produces empty release notes with the current release-notes generator.

## Local development

`.nvmrc` sets the Node.js version for local development, CI and releases.
`engines.node` in `package.json` allows only that major, and `.npmrc` sets
`engine-strict=true`, so npm refuses to install on any other version with
`EBADENGINE`. Run `nvm use` in the repository before any npm command.

## Scripts

Shell scripts and hook templates under `scripts/` handle commit messages,
branch names, AI requests and secret redaction. Both developers and the
workflows above use them. `scripts/branch-name-config.sh` accepts `feature/` and
`bugfix/` as aliases for `feat/` and `fix/`.

ESLint and Prettier policy comes from the published `@nswds/eslint-config` and
`@nswds/prettier-config` packages.

## Checks before pushing workflow changes

```sh
nvm use
npm run format:check
npm run lint
npm run type-check
actionlint .github/workflows/*.yml
shellcheck -x -e SC1091 scripts/*.sh
```
