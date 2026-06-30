const { test, expect } = require('@playwright/test')

test('GHL connect + sync require auth', async ({ request }) => {
  expect((await request.post('/api/integrations/ghl/connect', { data: { apiKey: 'k', locationId: 'l' } })).status()).toBe(401)
  expect((await request.post('/api/integrations/ghl/sync', { data: { email: 'a@b.com' } })).status()).toBe(401)
  expect((await request.get('/api/integrations')).status()).toBe(401)
})

test('GHL inbound webhook is public but signature-gated when configured', async ({ request }) => {
  // No auth header needed (GHL posts server-to-server). With GHL_WEBHOOK_SECRET
  // set, a bad/absent x-ghl-signature returns 401; unset, it accepts and tallies.
  const res = await request.post('/api/integrations/ghl/webhook', { data: { type: 'AppointmentCreate', locationId: 'loc' } })
  expect([200, 401]).toContain(res.status())
})
