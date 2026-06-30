const { test, expect } = require('@playwright/test')

test('channel and outreach endpoints require auth', async ({ request }) => {
  const connect = await request.post('/api/channels/email/connect', { data: { provider: 'smtp', host: 'x', port: 587, user: 'a', pass: 'b' } })
  expect(connect.status()).toBe(401)

  const list = await request.get('/api/channels')
  expect(list.status()).toBe(401)

  const send = await request.post('/api/outreach/send', { data: { to: 'a@b.com', subject: 'hi', body: 'hi' } })
  expect(send.status()).toBe(401)
})

test('/settings/channels prompts sign-in when logged out', async ({ page }) => {
  await page.goto('/settings/channels')
  await expect(page.getByText(/sign in to manage channels/i)).toBeVisible()
})
