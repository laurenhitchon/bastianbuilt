import { CONTACT_FIELD_LIMITS } from '@/lib/contact-email'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const { insertValues, send, checkContactRateLimit } = vi.hoisted(() => ({
  insertValues: vi.fn(),
  send: vi.fn(),
  checkContactRateLimit: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ insert: () => ({ values: insertValues }) }),
}))

vi.mock('@/lib/rate-limit', () => ({ checkContactRateLimit }))

vi.mock('resend', () => ({
  // The handler calls `new Resend(...)`, so the double has to be constructable.
  Resend: class {
    emails = { send }
  },
}))

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

const sentEmail = () => {
  expect(send).toHaveBeenCalledTimes(1)
  return send.mock.calls[0][0] as { subject: string; text: string; html: string }
}

beforeEach(() => {
  insertValues.mockResolvedValue(undefined)
  send.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
  checkContactRateLimit.mockResolvedValue({
    allowed: true,
    limit: 5,
    remaining: 4,
    retryAfter: 0,
  })
  vi.stubEnv('RESEND_API_KEY', 'test-key')
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('POST /api/contact', () => {
  it('escapes user-controlled markup in the email it sends', async () => {
    const response = await post({
      name: '<img src=x onerror=alert(1)>',
      email: 'attacker@example.com',
      message: 'Please <a href="https://evil.example">reset your password</a>\nThanks',
    })

    expect(response.status).toBe(200)

    const { html } = sentEmail()
    // The only tags in the body are the ones the template writes itself.
    expect(html).not.toMatch(/<(?!\/?(?:h2|p|strong|br)\b)/)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;')
    expect(html).toContain('reset your password&lt;/a&gt;<br>Thanks')
  })

  it('sends a plain text alternative alongside the html', async () => {
    await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello' })

    const { text, html } = sentEmail()
    expect(text).toContain('Name: Ada')
    expect(text).toContain('Hello')
    expect(html).toContain('Hello')
  })

  it('accepts the enquiry and logs the failure when Resend rejects the send', async () => {
    // Resend resolves with an error rather than throwing, so an unchecked send
    // told the sender their message arrived when it never left the building.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    send.mockResolvedValue({
      data: null,
      error: { name: 'daily_quota_exceeded', message: 'Daily quota exceeded' },
    })

    const response = await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello' })

    // 202, not 200: the row is banked but nobody has been notified, so the two
    // outcomes stay distinguishable to anyone reading the logs.
    expect(response.status).toBe(202)
    expect(response.ok).toBe(true)
    expect(insertValues).toHaveBeenCalledOnce()

    // The log is the owner's only signal that an enquiry went unnotified.
    expect(consoleError).toHaveBeenCalledWith(
      '[contact] Resend rejected the message:',
      expect.objectContaining({ name: 'daily_quota_exceeded' }),
    )
    consoleError.mockRestore()
  })

  it('never tells the sender to resend after a failed send', async () => {
    // A retry cannot clear an exhausted quota or an unverified From address, and
    // the client keeps the form populated on error — so an error response made
    // "try again" a one-click way to bank a duplicate row per attempt.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    send.mockResolvedValue({
      data: null,
      error: { name: 'daily_quota_exceeded', message: 'Daily quota exceeded' },
    })

    const response = await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello' })
    const body = (await response.json()) as { message?: string; error?: string }

    expect(body.error).toBeUndefined()
    expect(body.message).not.toMatch(/try again|resend|send it again/i)
    // Points at a route that does not depend on Resend having worked.
    expect(body.message).toContain('bastian@hitchon.me')
    consoleError.mockRestore()
  })

  it('refuses before touching the database when the API key is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const response = await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello' })

    expect(response.status).toBe(500)
    expect(insertValues).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('trims surrounding whitespace from every field', async () => {
    await post({
      name: '  Ada Lovelace  ',
      email: '  ada@example.com  ',
      message: '  Hello there  ',
    })

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'Hello there',
      }),
    )
    expect(sentEmail().text).toContain('Name: Ada Lovelace')
  })

  it('accepts an address pasted with a trailing space', async () => {
    // The email regex excludes whitespace, so without trimming this is the
    // commonest way for a perfectly valid address to be rejected.
    const response = await post({
      name: 'Ada',
      email: 'ada@example.com ',
      message: 'Hello',
    })

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0][0].replyTo).toBe('ada@example.com')
  })

  it('rejects a message of nothing but whitespace', async () => {
    const response = await post({ name: 'Ada', email: 'ada@example.com', message: '   \n  ' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'All fields are required' })
    expect(insertValues).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('measures the length caps against the trimmed value', async () => {
    const response = await post({
      name: `  ${'a'.repeat(CONTACT_FIELD_LIMITS.name)}  `,
      email: 'ada@example.com',
      message: 'Hello',
    })

    expect(response.status).toBe(200)
  })

  it('stores the submission verbatim', async () => {
    // Escaping belongs to the email body only: the database keeps what was typed.
    await post({ name: 'Ada & Co', email: 'ada@example.com', message: '<b>Hi</b>' })

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada & Co', message: '<b>Hi</b>' }),
    )
  })

  it('rejects a missing field', async () => {
    const response = await post({ name: 'Ada', email: 'ada@example.com' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'All fields are required' })
    expect(insertValues).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects an invalid email address', async () => {
    const response = await post({ name: 'Ada', email: 'not-an-email', message: 'Hello' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid email address' })
    expect(insertValues).not.toHaveBeenCalled()
  })

  it('rejects a non-string field instead of failing later', async () => {
    const response = await post({
      name: { toString: 'nope' },
      email: 'ada@example.com',
      message: 1,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'All fields must be text' })
    expect(insertValues).not.toHaveBeenCalled()
  })

  it.each([
    ['name', CONTACT_FIELD_LIMITS.name],
    ['email', CONTACT_FIELD_LIMITS.email],
    ['message', CONTACT_FIELD_LIMITS.message],
  ] as const)('rejects an oversized %s before storing or mailing it', async (field, limit) => {
    const body = { name: 'Ada', email: 'ada@example.com', message: 'Hello' }
    const overflow = field === 'email' ? `${'a'.repeat(limit)}@example.com` : 'a'.repeat(limit + 1)

    const response = await post({ ...body, [field]: overflow })

    expect(response.status).toBe(400)
    expect(insertValues).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects a rate limited sender before reading the body', async () => {
    checkContactRateLimit.mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      retryAfter: 90,
    })

    const response = await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello' })

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      error: 'Too many messages sent. Please try again later.',
    })
    expect(response.headers.get('Retry-After')).toBe('90')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    // The whole point is that a blocked request costs neither a row nor an email.
    expect(insertValues).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('accepts a field that is exactly at the limit', async () => {
    const response = await post({
      name: 'a'.repeat(CONTACT_FIELD_LIMITS.name),
      email: 'ada@example.com',
      message: 'a'.repeat(CONTACT_FIELD_LIMITS.message),
    })

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledTimes(1)
  })
})
