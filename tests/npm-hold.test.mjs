/**
 * Guards the npm version hold in renovate.json.
 *
 * renovate.json pins the npm that Renovate runs (`constraints.npm`) because
 * npm 12 fails lockfile updates with EALLOWREMOTE
 * (https://github.com/npm/cli/issues/9800). Two things can quietly undo that:
 *
 * - The hold disappears, and Renovate goes back to npm 12.
 * - package.json declares an npm version that some version inside the hold
 *   does not satisfy. Renovate runs the newest npm the hold allows, and with
 *   `engine-strict=true` in `.npmrc` (or a `devEngines` entry) that npm refuses
 *   to install, so every Renovate PR fails its artifact update.
 *
 * Neither shows up anywhere else in CI, so this test checks both. When a fixed
 * npm 12 can update this lockfile, remove the hold and the "keeps Renovate off
 * npm 12" test in the same change.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import semver from 'semver'

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

/**
 * Lists every npm version declared in package.json that would reject an npm
 * Renovate may run under the hold. An empty list means any npm inside the hold
 * can work on this repository.
 */
export function npmHoldProblems(renovate, pkg) {
  const hold = renovate.constraints?.npm
  if (hold === undefined) {
    return []
  }
  if (!semver.validRange(hold)) {
    return [`renovate.json constraints.npm "${hold}" is not a valid semver range`]
  }

  const problems = []
  // Renovate picks the newest npm inside the hold, which moves over time, so
  // every version the hold allows has to satisfy the declared range.
  const checkRange = (where, range) => {
    if (!semver.validRange(range)) {
      problems.push(`${where} "${range}" is not a valid semver range`)
    } else if (!semver.subset(hold, range)) {
      problems.push(
        `${where} "${range}" rejects some of the npm versions Renovate may run under its hold ` +
          `("${hold}" in renovate.json constraints.npm), so npm would refuse to update the lockfile. ` +
          'Widen the range or narrow the hold to match.',
      )
    }
  }

  if (pkg.engines?.npm !== undefined) {
    checkRange('package.json engines.npm', pkg.engines.npm)
  }

  const packageManager = pkg.packageManager
  if (typeof packageManager === 'string' && packageManager.startsWith('npm@')) {
    const version = packageManager.slice('npm@'.length).split('+')[0]
    if (!semver.valid(version)) {
      problems.push(
        `package.json packageManager "${packageManager}" does not name a valid npm version`,
      )
    } else if (!semver.satisfies(version, hold)) {
      problems.push(
        `package.json packageManager "${packageManager}" is outside the npm Renovate is held to ` +
          `("${hold}" in renovate.json constraints.npm). Use a version inside the hold or move the hold.`,
      )
    }
  }

  // npm only refuses to run for a devEngines entry whose onFail is "error"
  // (the default); "warn" and "ignore" entries cannot break Renovate.
  const devEngineManagers = [pkg.devEngines?.packageManager ?? []].flat()
  for (const entry of devEngineManagers) {
    const blocking = entry?.onFail === undefined || entry.onFail === 'error'
    if (entry?.name === 'npm' && entry.version !== undefined && blocking) {
      checkRange('package.json devEngines.packageManager (npm) version', entry.version)
    }
  }

  return problems
}

describe('Renovate npm hold', () => {
  it('keeps Renovate off npm 12 while npm/cli#9800 is open', () => {
    const hold = readJson('renovate.json').constraints?.npm
    assert.ok(
      hold,
      'renovate.json must set constraints.npm (see the comment at the top of this file)',
    )
    assert.ok(
      semver.validRange(hold) && !semver.intersects(hold, '>=12'),
      `renovate.json constraints.npm "${hold}" allows npm 12`,
    )
  })

  it('is compatible with every npm version this repository declares', () => {
    assert.deepEqual(npmHoldProblems(readJson('renovate.json'), readJson('package.json')), [])
  })

  describe('npmHoldProblems', () => {
    const held = { constraints: { npm: '^11' } }

    it('passes when package.json declares no npm version', () => {
      assert.deepEqual(npmHoldProblems(held, { engines: { node: '^26.13.0' } }), [])
    })

    it('passes when there is no hold', () => {
      assert.deepEqual(npmHoldProblems({}, { engines: { npm: '>=12' } }), [])
    })

    it('reports a hold that is not a semver range', () => {
      assert.equal(npmHoldProblems({ constraints: { npm: 'eleven' } }, {}).length, 1)
    })

    it('accepts engines.npm ranges that cover the whole hold', () => {
      assert.deepEqual(npmHoldProblems(held, { engines: { npm: '>=10' } }), [])
      assert.deepEqual(npmHoldProblems(held, { engines: { npm: '>=11 <13' } }), [])
      assert.deepEqual(
        npmHoldProblems({ constraints: { npm: '^11.5.1' } }, { engines: { npm: '^11.5.1' } }),
        [],
      )
    })

    it('reports engines.npm ranges that exclude the hold', () => {
      const [problem, ...rest] = npmHoldProblems(held, { engines: { npm: '>=12' } })
      assert.match(problem, /engines\.npm ">=12" rejects/)
      assert.deepEqual(rest, [])
    })

    it('reports engines.npm ranges that only overlap part of the hold', () => {
      // Renovate runs the newest ^11 npm, so these would break it even though
      // some ^11 versions satisfy them.
      for (const range of ['~11.6.0', '11.6.0', '<11.10.0', '^11.5.1']) {
        assert.equal(npmHoldProblems(held, { engines: { npm: range } }).length, 1, range)
      }
    })

    it('checks an npm packageManager version, ignoring its hash suffix', () => {
      assert.deepEqual(npmHoldProblems(held, { packageManager: 'npm@11.6.0+sha512.abc' }), [])
      assert.equal(npmHoldProblems(held, { packageManager: 'npm@12.2.3' }).length, 1)
      assert.equal(npmHoldProblems(held, { packageManager: 'npm@latest' }).length, 1)
    })

    it('ignores a packageManager that is not npm', () => {
      assert.deepEqual(npmHoldProblems(held, { packageManager: 'pnpm@10.0.0' }), [])
    })

    it('checks npm entries in devEngines.packageManager, as an object or an array', () => {
      assert.equal(
        npmHoldProblems(held, { devEngines: { packageManager: { name: 'npm', version: '^12' } } })
          .length,
        1,
      )
      assert.equal(
        npmHoldProblems(held, {
          devEngines: {
            packageManager: [
              { name: 'pnpm', version: '^10' },
              { name: 'npm', version: '>=12' },
            ],
          },
        }).length,
        1,
      )
      assert.equal(
        npmHoldProblems(held, {
          devEngines: { packageManager: { name: 'npm', version: '~11.6.0' } },
        }).length,
        1,
      )
      assert.deepEqual(
        npmHoldProblems(held, { devEngines: { packageManager: { name: 'npm', version: '>=11' } } }),
        [],
      )
    })

    it('only checks devEngines entries that make npm refuse to run', () => {
      for (const onFail of ['warn', 'ignore']) {
        assert.deepEqual(
          npmHoldProblems(held, {
            devEngines: { packageManager: { name: 'npm', version: '^12', onFail } },
          }),
          [],
          onFail,
        )
      }
      assert.equal(
        npmHoldProblems(held, {
          devEngines: { packageManager: { name: 'npm', version: '^12', onFail: 'error' } },
        }).length,
        1,
      )
    })
  })
})
