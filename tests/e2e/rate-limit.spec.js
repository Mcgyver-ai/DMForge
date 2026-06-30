const { test, expect } = require('@playwright/test')

// ponytail: no login flow wired into this suite, so this exercises the IP-based
// limit (20/min) rather than the uid limit (60/min) — same code path in lib/rateLimit.js.
test('rate limit returns 429 after a burst of unauthenticated requests', async ({ request }) => {
  const statuses = []
  for (let i = 0; i < 25; i++) {
    const res = await request.get('/api/plans')
    statuses.push(res.status())
  }
  expect(statuses).toContain(429)
})
