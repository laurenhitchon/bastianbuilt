import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// CI keys off the presence of this file: the shared reusable-ci workflow runs
// `npx --no-install vitest run` only when a vitest.config.* exists, and
// otherwise reports "nothing to run". Renaming or deleting this file silently
// turns the test job back into a no-op that still reports green.
export default defineConfig({
  test: {
    // These suites cover pure logic only, so the lighter node environment is
    // enough. Switch to jsdom (and add the matching devDependency) if tests
    // that render components are added later.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    // Mirrors the `@/*` -> `./src/*` path alias in tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
