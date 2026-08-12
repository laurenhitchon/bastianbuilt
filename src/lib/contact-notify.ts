import { renderContactEmail, type ContactSubmission } from '@/lib/contact-email'
import { Resend } from 'resend'

/**
 * Outcome of one notification attempt. `sent: false` covers both a missing API
 * key and a rejection from Resend, because the caller treats them the same way:
 * the row stays unnotified and the sweep will try it again.
 */
export type NotifyResult = { sent: true } | { sent: false; reason: string; error?: unknown }

/**
 * Mails the owner about one submission.
 *
 * Shared by the contact endpoint and the retry sweep so a retried enquiry
 * arrives in exactly the same shape as a first-attempt one — including
 * `replyTo`, which is what makes the owner able to answer the sender directly.
 * Resend reports API failures in the resolved value rather than throwing, so
 * the result is inspected rather than assumed.
 */
export async function sendContactNotification(
  submission: ContactSubmission,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { sent: false, reason: 'missing RESEND_API_KEY' }
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@bastianbuilt.com'
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>'
  const { subject, text, html } = renderContactEmail(submission)

  const { error } = await new Resend(apiKey).emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: submission.email,
    subject,
    text,
    html,
  })

  if (error) {
    return { sent: false, reason: 'resend rejected the message', error }
  }

  return { sent: true }
}
