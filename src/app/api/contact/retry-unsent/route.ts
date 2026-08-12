import { sendContactNotification } from '@/lib/contact-notify'
import { getDb } from '@/lib/db'
import { contacts } from '@/lib/schema'
import { and, asc, eq, gte, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * Most a single run will attempt. Each retry spends a message from the Resend
 * quota, and the commonest reason a sweep finds work is that the quota was
 * exhausted in the first place — so a run is capped rather than draining what
 * little allowance has recovered.
 */
const MAX_PER_RUN = 25

/**
 * How far back the sweep looks. An enquiry nobody was notified about a fortnight
 * ago is not worth mailing as if it were new, and the bound stops a
 * misconfiguration from turning the whole table into a mailing list.
 */
const LOOKBACK_DAYS = 14

export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the environment
  // variable is set. Without the variable the route would be a public trigger
  // for sending mail, so a missing secret fails closed rather than open.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[contact-retry] CRON_SECRET is not set; refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  try {
    const db = getDb()
    const pending = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        message: contacts.message,
      })
      .from(contacts)
      .where(and(isNull(contacts.notifiedAt), gte(contacts.createdAt, since)))
      // Oldest first: the enquiry that has been waiting longest is the one most
      // worth getting out while the quota lasts.
      .orderBy(asc(contacts.createdAt))
      .limit(MAX_PER_RUN)

    let sent = 0
    let failed = 0

    for (const row of pending) {
      const result = await sendContactNotification({
        name: row.name,
        email: row.email,
        message: row.message,
      })

      if (!result.sent) {
        failed++
        console.error(`[contact-retry] enquiry ${row.id} still undeliverable:`, result.reason)
        // Left unstamped on purpose so the next run picks it up again. A run
        // stops early once sending starts failing, because the causes that
        // reach here — exhausted quota, an unverified From address — apply to
        // every remaining row too, and burning the rest of the batch against
        // them achieves nothing.
        break
      }

      await db.update(contacts).set({ notifiedAt: new Date() }).where(eq(contacts.id, row.id))
      sent++
    }

    const summary = { scanned: pending.length, sent, failed }
    if (sent > 0 || failed > 0) {
      console.warn('[contact-retry] sweep finished', summary)
    }

    return NextResponse.json(summary, { status: 200 })
  } catch (error) {
    console.error('[contact-retry] sweep failed:', error)
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 })
  }
}
