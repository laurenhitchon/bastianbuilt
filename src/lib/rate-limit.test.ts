import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { limit, slidingWindow, ratelimitConstructor } = vi.hoisted(() => ({
  limit: vi.fn(),
  slidingWindow: vi.fn(() => 'sliding-window'),
  ratelimitConstructor: vi.fn(),
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = slidingWindow
    limit = limit
    constructor(config: unknown) {
      ratelimitConstructor(config)
    }
  },
}))

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: () => ({ __redis: true }) },
}))

/**
 * The limiter is memoised per module instance, so each test imports a fresh
 * copy after stubbing the environment it should resolve against.
 */
const loadModule = async (env: { url?: string; token?: string } = {}) => {
  vi.resetModules()
  if (env.url) vi.stubEnv('UPSTASH_REDIS_REST_URL', env.url)
  if (env.token) vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', env.token)
  return import('@/lib/rate-limit')
}

const configured = () => loadModule({ url: 'https://redis.test', token: 'test-token' })

const request = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/contact', { method: 'POST', headers })

beforeEach(() => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('getClientIp', () => {
  it('prefers x-real-ip', async () => {
    const { getClientIp } = await loadModule()

    expect(getClientIp(new Headers({ 'x-real-ip': '203.0.113.4' }))).toBe('203.0.113.4')
  })

  it('falls back to the first x-forwarded-for entry', async () => {
    const { getClientIp } = await loadModule()

    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.4, 70.41.3.18' }))).toBe(
      '203.0.113.4',
    )
  })

  it('trims surrounding whitespace', async () => {
    const { getClientIp } = await loadModule()

    expect(getClientIp(new Headers({ 'x-forwarded-for': '  203.0.113.4 , 70.41.3.18' }))).toBe(
      '203.0.113.4',
    )
  })

  it('buckets requests with no usable header together rather than exempting them', async () => {
    const { getClientIp } = await loadModule()

    expect(getClientIp(new Headers())).toBe('unknown')
    expect(getClientIp(new Headers({ 'x-forwarded-for': '   ' }))).toBe('unknown')
  })
})

describe('checkContactRateLimit', () => {
  it('allows everything when Upstash is not configured', async () => {
    const { checkContactRateLimit } = await loadModule()

    await expect(checkContactRateLimit(request())).resolves.toMatchObject({ allowed: true })
    expect(limit).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('resolves the limiter once and reuses it', async () => {
    const { checkContactRateLimit } = await configured()
    limit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    })

    await checkContactRateLimit(request({ 'x-real-ip': '203.0.113.4' }))
    await checkContactRateLimit(request({ 'x-real-ip': '203.0.113.4' }))

    expect(ratelimitConstructor).toHaveBeenCalledOnce()
    expect(limit).toHaveBeenCalledTimes(2)
  })

  it('keys the bucket on a hash rather than the raw address', async () => {
    const { checkContactRateLimit } = await configured()
    limit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    })

    await checkContactRateLimit(request({ 'x-real-ip': '203.0.113.4' }))

    const [key] = limit.mock.calls[0]
    expect(key).not.toContain('203.0.113.4')
    expect(key).toMatch(/^[\w-]{22}$/)
  })

  it('gives the same sender the same bucket and different senders different ones', async () => {
    const { checkContactRateLimit } = await configured()
    limit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    })

    await checkContactRateLimit(request({ 'x-real-ip': '203.0.113.4' }))
    await checkContactRateLimit(request({ 'x-real-ip': '203.0.113.4' }))
    await checkContactRateLimit(request({ 'x-real-ip': '198.51.100.7' }))

    const [first, second, third] = limit.mock.calls.map(([key]) => key)
    expect(first).toBe(second)
    expect(third).not.toBe(first)
  })

  it('reports a rejection with the seconds left in the window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00Z'))
    const { checkContactRateLimit } = await configured()
    limit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 90_000,
      pending: Promise.resolve(),
    })

    await expect(checkContactRateLimit(request())).resolves.toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      retryAfter: 90,
    })
  })

  it('never advertises a zero second retry', async () => {
    // A client honouring Retry-After: 0 would retry straight into another 429.
    const { checkContactRateLimit } = await configured()
    limit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() - 5_000,
      pending: Promise.resolve(),
    })

    await expect(checkContactRateLimit(request())).resolves.toMatchObject({ retryAfter: 1 })
  })

  it('allows the request when Redis is unreachable', async () => {
    // Losing the contact form entirely is worse than losing the limit.
    const { checkContactRateLimit } = await configured()
    limit.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(checkContactRateLimit(request())).resolves.toMatchObject({ allowed: true })
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('swallows a rejected pending promise instead of crashing the instance', async () => {
    const { checkContactRateLimit } = await configured()
    const pending = Promise.reject(new Error('analytics write failed'))
    limit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60_000,
      pending,
    })

    await expect(checkContactRateLimit(request())).resolves.toMatchObject({ allowed: true })
    await expect(pending.catch(() => 'handled')).resolves.toBe('handled')
  })
})
