import { CONTACT_FIELD_LIMITS } from '@/lib/contact-email'
import { sendContactNotification } from '@/lib/contact-notify'
import { getDb } from '@/lib/db'
import { checkContactRateLimit } from '@/lib/rate-limit'
import { contacts } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Before anything else: the endpoint is public and every request past this
    // point costs a database write and a message from the Resend quota.
    const rateLimit = await checkContactRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      )
    }

    const { name, email, message } = await request.json()

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // A non-string field would otherwise reach `db.insert` and the email
    // renderer and fail there as an opaque 500.
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'All fields must be text' }, { status: 400 })
    }

    // Trim before every check below. A pasted address routinely carries a
    // trailing space, and the email regex excludes whitespace outright, so
    // without this a valid address is rejected as invalid. Trimming also stops
    // a message of nothing but spaces from reaching the inbox.
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Bound the payload before it is stored or mailed.
    if (trimmedName.length > CONTACT_FIELD_LIMITS.name) {
      return NextResponse.json(
        { error: `Name must be ${CONTACT_FIELD_LIMITS.name} characters or fewer` },
        { status: 400 },
      )
    }
    if (trimmedEmail.length > CONTACT_FIELD_LIMITS.email) {
      return NextResponse.json(
        { error: `Email must be ${CONTACT_FIELD_LIMITS.email} characters or fewer` },
        { status: 400 },
      )
    }
    if (trimmedMessage.length > CONTACT_FIELD_LIMITS.message) {
      return NextResponse.json(
        { error: `Message must be ${CONTACT_FIELD_LIMITS.message} characters or fewer` },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Checked before the insert: a deployment that cannot mail anyone should
    // say so rather than bank a row nobody will ever be notified about.
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Server email configuration missing' }, { status: 500 })
    }

    const db = getDb()
    // The id comes back so the row can be stamped once the owner has actually
    // been notified. Without it the sweep cannot tell a delivered enquiry from
    // an undelivered one and would re-mail everything.
    const [inserted] = await db
      .insert(contacts)
      .values({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        createdAt: new Date(),
      })
      .returning({ id: contacts.id })

    // Resend reports API failures in the resolved value instead of throwing, so
    // an unchecked send reports success for a message that was never delivered.
    // Quota exhaustion and a rejected From address both land here. The row is
    // already stored, so the submission survives even when the email does not.
    const result = await sendContactNotification({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    })

    if (!result.sent) {
      // The row stays unstamped, which is what puts it in front of the
      // scheduled sweep in /api/contact/retry-unsent. The log remains useful
      // for diagnosing why, but it is no longer the only thing standing between
      // a failed send and a lost enquiry.
      console.error('[contact] notification failed:', result.reason, result.error ?? '')

      // 202 rather than 5xx: the row is committed above, so the submission was
      // genuinely accepted and the sender has nothing to retry. Returning an
      // error status told them to resubmit, which cannot fix a quota or
      // From-address rejection and banked a duplicate row on every attempt.
      // 2xx also lets the client clear the form, which is what actually
      // prevents the duplicate rather than merely discouraging it. The status
      // still differs from the 200 success path, so a delivered enquiry and an
      // undelivered one remain distinguishable in logs.
      return NextResponse.json(
        {
          success: true,
          message:
            "Thanks — your message has been received. If you don't hear back soon, please email bastian@hitchon.me directly.",
        },
        { status: 202 },
      )
    }

    // Stamped only after the send succeeded, so the column means "the owner has
    // seen this" rather than "we tried". If this update fails the row stays
    // unstamped and the sweep mails it a second time — a duplicate notification
    // is a far cheaper failure than an enquiry nobody ever reads.
    await db.update(contacts).set({ notifiedAt: new Date() }).where(eq(contacts.id, inserted.id))

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[v0] Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 },
    )
  }
}
