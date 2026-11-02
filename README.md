# Bastian Built

Industrial design portfolio site built with Next.js and deployed on Vercel.
Contact enquiries are stored in a Neon Postgres database, sent by email through
Resend and rate limited per sender through Upstash Redis.

## Local development

Switch to the Node.js version in `.nvmrc`, install dependencies and start the
development server:

```bash
nvm use
npm install
npm run dev
```

npm refuses to install on any other Node.js major (`engine-strict=true`). See
[TOOLING.md](TOOLING.md#local-development).

| Command              | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Development server on http://localhost:3000             |
| `npm run build`      | Production build                                        |
| `npm test`           | Unit tests (Vitest)                                     |
| `npm run lint`       | ESLint                                                  |
| `npm run type-check` | TypeScript                                              |
| `npm run db:push`    | Push `src/lib/schema.ts` to the `DATABASE_URL` database |

## Environment variables

| Variable                                              | Purpose                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | Neon Postgres connection string. Required by the contact API and `drizzle-kit`.                            |
| `RESEND_API_KEY`                                      | Resend API key. Without it the contact API rejects every enquiry with a 500 before storing it.             |
| `CONTACT_TO_EMAIL`                                    | Recipient of enquiry notifications. Defaults to `contact@bastianbuilt.com`.                                |
| `CONTACT_FROM_EMAIL`                                  | Sender address for notifications. Defaults to Resend's onboarding sender.                                  |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis for contact rate limiting. `KV_REST_API_URL` / `KV_REST_API_TOKEN` are accepted instead.     |
| `CRON_SECRET`                                         | Authorises the daily Vercel Cron call to `/api/contact/retry-unsent`. Without it the route refuses to run. |
| `NEXT_PUBLIC_SITE_URL`                                | Base URL for the sitemap. `NEXT_PUBLIC_APP_URL` is used if it is unset.                                    |

Without the Upstash variables, contact rate limiting is disabled and a warning
is logged.

## Tooling

CI, releases and Renovate are described in [TOOLING.md](TOOLING.md).
