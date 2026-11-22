import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// CI's install / test job runs `npm run test`, which runs these vitest suites
// (src/**/*.test.ts) and then the node:test suites in tests/. Keep both halves
// of that script: dropping either one turns its tests into a silent no-op.
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
