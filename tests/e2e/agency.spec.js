const { test, expect } = require('@playwright/test')

test('agency endpoints require auth', async ({ request }) => {
  expect((await request.post('/api/agency/invite', { data: { email: 'a@b.com' } })).status()).toBe(401)
  expect((await request.post('/api/agency/remove', { data: { memberUid: 'x' } })).status()).toBe(401)
  expect((await request.get('/api/agency')).status()).toBe(401)
})

test('agency accept requires sign-in even with a token', async ({ request }) => {
  const res = await request.get('/api/agency/accept?token=abc')
  expect(res.status()).toBe(401)
})
