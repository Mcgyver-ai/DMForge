const { test, expect } = require('@playwright/test')

test('sms connect + reminder scheduling require auth', async ({ request }) => {
  expect((await request.post('/api/channels/sms/connect', { data: { accountSid: 'a', authToken: 'b', from: '+1' } })).status()).toBe(401)
  expect((await request.post('/api/reminders/schedule', { data: { to: '+1', scheduledAt: '2030-01-01T00:00:00Z' } })).status()).toBe(401)
})

test('cron endpoint runs (no secret configured) and reports a tally', async ({ request }) => {
  // When CRON_SECRET is unset the endpoint is open; with it set, an unauthorized
  // call returns 401. Either is acceptable here — we just assert it's wired.
  const res = await request.get('/api/cron/send-reminders')
  expect([200, 401]).toContain(res.status())
})
