export type ContactSubmission = {
  name: string
  email: string
  message: string
}

/**
 * Upper bound on each field, in characters. The contact endpoint is public and
 * unauthenticated, so without these an arbitrarily large body is written to the
 * database and handed to the mailer.
 */
export const CONTACT_FIELD_LIMITS = {
  name: 100,
  // RFC 5321 caps a forward path at 254 characters.
  email: 254,
  message: 5000,
} as const

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escapes the five characters that can break out of HTML text or an attribute
 * value. Every field on a submission is attacker-controlled markup until it has
 * been through here.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/**
 * Builds the notification email sent to the site owner.
 *
 * Escaping runs before the newline-to-`<br>` substitution, so the `<br>` tags we
 * insert survive while any markup the sender typed does not. Mail clients block
 * `<script>`, so the risk here is phishing links, tracking pixels and content
 * spoofed to look like it came from the site rather than classic XSS.
 */
export function renderContactEmail({ name, email, message }: ContactSubmission) {
  return {
    // CR/LF in a subject is the classic header-injection vector, so collapse it.
    subject: `New Contact Form Submission from ${name.replace(/[\r\n]+/g, ' ')}`,
    text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>
    `,
  }
}
