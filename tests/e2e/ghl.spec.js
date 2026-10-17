const { test, expect } = require('@playwright/test')

test('GHL connect + sync require auth', async ({ request }) => {
  expect((await request.post('/api/integrations/ghl/connect', { data: { apiKey: 'k', locationId: 'l' } })).status()).toBe(401)
  expect((await request.post('/api/integrations/ghl/sync', { data: { email: 'a@b.com' } })).status()).toBe(401)
  expect((await request.get('/api/integrations')).status()).toBe(401)
})

test('GHL inbound webhook is public but signature-gated', async ({ request }) => {
  // No auth header needed (GHL posts server-to-server), but an absent
  // X-GHL-Signature (Ed25519, GHL's published key) is always rejected.
  const res = await request.post('/api/integrations/ghl/webhook', { data: { type: 'AppointmentCreate', locationId: 'loc' } })
  expect(res.status()).toBe(401)
})
