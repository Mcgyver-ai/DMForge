import * as Sentry from '@sentry/nextjs'

// Client-side DSN must be public (embedded in the bundle); reuse the same
// SENTRY_DSN var via next.config.js env passthrough. No-ops cleanly when
// unset — Sentry.init() without a dsn never activates a client.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
