import * as Sentry from '@sentry/nextjs'

// No-ops cleanly when SENTRY_DSN is unset — see sentry.server.config.js.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: !!process.env.SENTRY_DSN,
})
