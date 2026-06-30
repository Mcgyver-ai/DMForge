const { test, expect } = require('@playwright/test')

test('linkedin connect + send require auth', async ({ request }) => {
  const start = await request.get('/api/auth/linkedin')
  expect(start.status()).toBe(401)

  const send = await request.post('/api/outreach/linkedin/send', { data: { recipientUrn: 'urn:li:person:x', message: 'hi' } })
  expect(send.status()).toBe(401)
})

test('linkedin callback redirects to channels settings on bad state', async ({ request }) => {
  const res = await request.get('/api/auth/linkedin/callback?code=abc&state=garbage', { maxRedirects: 0 })
  expect([302, 303, 307, 308]).toContain(res.status())
  expect(res.headers()['location']).toContain('/settings/channels')
})
