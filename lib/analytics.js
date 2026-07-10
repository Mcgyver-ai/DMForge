'use client'
import posthog from 'posthog-js'

// TODO(consent): this project has no cookie/consent gate yet. When one is
// added, guard init() and track() behind the user's analytics consent choice
// (PostHog defaults to persistence via localStorage, which is a cookie-law
// "non-essential" storage use in most jurisdictions).

let initialized = false

function isEnabled() {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY
}

export function initAnalytics() {
  if (!isEnabled() || initialized) return
  initialized = true
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,
    person_profiles: 'identified_only',
  })
}

export function track(event, properties) {
  if (!isEnabled() || !initialized) return
  posthog.capture(event, properties)
}

export function identify(userId, properties) {
  if (!isEnabled() || !initialized) return
  posthog.identify(userId, properties)
}
