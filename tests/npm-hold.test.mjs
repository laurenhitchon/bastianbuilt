/**
 * Guards the npm version hold in renovate.json.
 *
 * renovate.json pins the npm that Renovate runs (`constraints.npm`) because
 * npm 12 fails lockfile updates with EALLOWREMOTE. `.npmrc` sets
 * `engine-strict=true`, so if package.json ever declares an npm version that
 * the hold excludes, Renovate's npm refuses to install and every Renovate PR
 * fails its artifact update. Nothing else in CI points at that cause, so this
 * test does.
 *
 * When the hold is removed from renovate.json there is nothing to guard and
 * the repository check passes.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import semver from 'semver'

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

/**
 * Lists every npm version declared in package.json that the Renovate npm hold
 * cannot satisfy. An empty list means Renovate's npm can work on this repository.
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
  const checkRange = (where, range) => {
    if (!semver.validRange(range)) {
      problems.push(`${where} "${range}" is not a valid semver range`)
    } else if (!semver.intersects(range, hold)) {
      problems.push(
        `${where} "${range}" excludes the npm Renovate is held to ("${hold}" in renovate.json constraints.npm); ` +
          'with engine-strict=true every Renovate lockfile update would fail. Widen the range or move the hold.',
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

  const devEngineManagers = [pkg.devEngines?.packageManager ?? []].flat()
  for (const entry of devEngineManagers) {
    if (entry?.name === 'npm' && entry.version !== undefined) {
      checkRange('package.json devEngines.packageManager (npm) version', entry.version)
    }
  }

  return problems
}

describe('Renovate npm hold', () => {
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

    it('accepts engines.npm ranges that overlap the hold', () => {
      assert.deepEqual(npmHoldProblems(held, { engines: { npm: '>=10' } }), [])
      assert.deepEqual(npmHoldProblems(held, { engines: { npm: '^11.5.1' } }), [])
    })

    it('reports engines.npm ranges that exclude the hold', () => {
      const [problem, ...rest] = npmHoldProblems(held, { engines: { npm: '>=12' } })
      assert.match(problem, /engines\.npm ">=12" excludes/)
      assert.deepEqual(rest, [])
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
      assert.deepEqual(
        npmHoldProblems(held, { devEngines: { packageManager: { name: 'npm', version: '>=11' } } }),
        [],
      )
    })
  })
})
