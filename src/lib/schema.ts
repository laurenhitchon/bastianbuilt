import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  /**
   * When the owner was successfully notified by email. Null means the send
   * failed, or has not been attempted — the endpoint commits the row before it
   * mails anyone, so an enquiry can outlive its notification. The scheduled
   * sweep in /api/contact/retry-unsent retries these; without the column there
   * was no way to tell a delivered enquiry from a lost one.
   *
   * Rows that predate this column are backfilled to created_at by the
   * migration, so the first sweep does not re-mail the entire history.
   */
  notifiedAt: timestamp('notified_at', { withTimezone: false }),
})
