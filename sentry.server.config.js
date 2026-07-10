import * as Sentry from '@sentry/nextjs'

// No-ops cleanly when SENTRY_DSN is unset (local/dev) — Sentry.init() without
// a dsn never activates a client, so all capture calls become silent no-ops.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: !!process.env.SENTRY_DSN,
})
