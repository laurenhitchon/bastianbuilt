import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const { limit, updateSet, updateWhere, send } = vi.hoisted(() => ({
  limit: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  send: vi.fn(),
}))

// The select chain is fluent up to `.limit()`, which is where the rows arrive.
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({ where: () => ({ orderBy: () => ({ limit }) }) }),
    }),
    update: () => ({ set: (...args: unknown[]) => updateSet(...args) }),
  }),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

const row = (id: number) => ({
  id,
  name: `Sender ${id}`,
  email: `sender${id}@example.com`,
  message: `Message ${id}`,
})

const sweep = (authorization?: string) =>
  GET(
    new Request('http://localhost/api/contact/retry-unsent', {
      headers: authorization ? { authorization } : {},
    }),
  )

beforeEach(() => {
  limit.mockResolvedValue([])
  updateSet.mockReturnValue({ where: updateWhere })
  updateWhere.mockResolvedValue(undefined)
  send.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
  vi.stubEnv('CRON_SECRET', 'test-cron-secret')
  vi.stubEnv('RESEND_API_KEY', 'test-key')
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('GET /api/contact/retry-unsent', () => {
  it('rejects a request with no bearer token', async () => {
    const response = await sweep()

    expect(response.status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects a request with the wrong bearer token', async () => {
    const response = await sweep('Bearer not-the-secret')

    expect(response.status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('refuses to run at all when CRON_SECRET is unset', async () => {
    // Failing closed matters more than usual here: the route sends mail, so an
    // unset secret would otherwise leave a public trigger for it.
    vi.stubEnv('CRON_SECRET', '')

    const response = await sweep('Bearer anything')

    expect(response.status).toBe(503)
    expect(send).not.toHaveBeenCalled()
  })

  it('mails each pending enquiry and stamps it', async () => {
    limit.mockResolvedValue([row(1), row(2)])

    const response = await sweep('Bearer test-cron-secret')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ scanned: 2, sent: 2, failed: 0 })
    expect(send).toHaveBeenCalledTimes(2)
    expect(updateSet).toHaveBeenCalledTimes(2)
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ notifiedAt: expect.any(Date) }),
    )
  })

  it('replies to the original sender, not the owner', async () => {
    limit.mockResolvedValue([row(1)])

    await sweep('Bearer test-cron-secret')

    // A retried enquiry has to be answerable the same way a first-attempt one
    // is, otherwise the owner gets mail they cannot reply to.
    expect(send.mock.calls[0][0].replyTo).toBe('sender1@example.com')
  })

  it('leaves a row unstamped when the retry also fails', async () => {
    limit.mockResolvedValue([row(1)])
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    send.mockResolvedValue({ data: null, error: { name: 'daily_quota_exceeded', message: 'x' } })

    const response = await sweep('Bearer test-cron-secret')

    await expect(response.json()).resolves.toEqual({ scanned: 1, sent: 0, failed: 1 })
    // Unstamped means the next run tries again rather than losing the enquiry.
    expect(updateSet).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('stops the batch at the first failure instead of burning the quota', async () => {
    limit.mockResolvedValue([row(1), row(2), row(3)])
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    // The causes that reach here — exhausted quota, unverified sender — apply to
    // every remaining row too, so continuing would fail twice more for nothing.
    send.mockResolvedValueOnce({ data: { id: 'ok' }, error: null })
    send.mockResolvedValue({ data: null, error: { name: 'daily_quota_exceeded', message: 'x' } })

    const response = await sweep('Bearer test-cron-secret')

    await expect(response.json()).resolves.toEqual({ scanned: 3, sent: 1, failed: 1 })
    expect(send).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })

  it('reports an empty sweep without sending anything', async () => {
    const response = await sweep('Bearer test-cron-secret')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ scanned: 0, sent: 0, failed: 0 })
    expect(send).not.toHaveBeenCalled()
  })
})
