import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'

/**
 * Submissions allowed per IP per window. A genuine enquiry is sent once, maybe
 * twice after a correction, so five leaves headroom while capping how much of
 * the Resend quota — and of the owner's inbox — a single sender can consume.
 */
export const CONTACT_RATE_LIMIT = {
  requests: 5,
  window: '1 h',
} as const

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  /** Seconds until the window frees up. Zero when the request was allowed. */
  retryAfter: number
}

/**
 * `undefined` means "not resolved yet", `null` means "resolved to disabled".
 * Resolving lazily rather than at module load keeps the env lookup testable.
 */
let limiter: Ratelimit | null | undefined

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) {
    return limiter
  }

  // Set by the Upstash integration from the Vercel Marketplace. Missing means
  // local development, or a deploy made before the integration was added.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[rate-limit] Upstash env vars missing - contact rate limiting is disabled')
    limiter = null
    return limiter
  }

  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(CONTACT_RATE_LIMIT.requests, CONTACT_RATE_LIMIT.window),
    prefix: 'ratelimit:contact',
    analytics: false,
  })
  return limiter
}

/**
 * Vercel sets both of these headers at its proxy, so neither survives from the
 * client and neither can be forged to dodge the limit. `x-real-ip` is a single
 * value, so prefer it over picking an entry out of the `x-forwarded-for` chain.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwardedFor) {
    return forwardedFor
  }

  // Unreachable behind Vercel. Sharing one bucket is the safe way to fail: the
  // alternative hands an unlimited quota to anyone who can strip both headers.
  return 'unknown'
}

/**
 * Hashed so raw IP addresses are never written to third-party storage. The
 * limiter only needs an identifier that is stable per sender, not the address.
 */
function bucketKey(ip: string): string {
  return createHash('sha256').update(ip).digest('base64url').slice(0, 22)
}

export async function checkContactRateLimit(request: Request): Promise<RateLimitResult> {
  const allowed: RateLimitResult = {
    allowed: true,
    limit: CONTACT_RATE_LIMIT.requests,
    remaining: CONTACT_RATE_LIMIT.requests,
    retryAfter: 0,
  }

  const activeLimiter = getLimiter()
  if (!activeLimiter) {
    return allowed
  }

  try {
    const result = await activeLimiter.limit(bucketKey(getClientIp(request.headers)))
    // Upstash settles its own background work through `pending`. Nothing here
    // depends on it, but an unhandled rejection would take the instance down.
    void result.pending.catch(() => {})

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      // `reset` is a unix timestamp in ms. Never advertise 0 seconds: a client
      // that honours Retry-After would retry straight into another rejection.
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    }
  } catch (error) {
    // A Redis outage must not take the contact form down with it.
    console.error('[rate-limit] check failed, allowing request:', error)
    return allowed
  }
}
