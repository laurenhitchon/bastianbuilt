import nswds from '@nswds/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

// `.claude/**` holds agent worktrees — full checkouts, each with its own
// node_modules and .next build output. ESLint's flat config does not read
// .gitignore, so being ignored by git is not enough: without this, a single
// background-task worktree turns `npm run lint` into thousands of errors from
// generated bundles. CI checks out a clean tree and never sees them, so the
// failure only ever hits locally, which is what makes it confusing.
export default defineConfig([...nswds, globalIgnores(['scripts/**', '.claude/**'])])
