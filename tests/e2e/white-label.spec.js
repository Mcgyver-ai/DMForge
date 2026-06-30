const { test, expect } = require('@playwright/test')

test('white-label update requires auth', async ({ request }) => {
  const res = await request.put('/api/agency/white-label', { data: { brandName: 'Acme', primaryColor: '#123456' } })
  expect(res.status()).toBe(401)
})

test('white-label settings page gates non-agency users', async ({ page }) => {
  await page.goto('/settings/white-label')
  // Logged out → sign-in prompt; logged-in non-agency → upgrade gate. Either way,
  // the editable brand form must not be present.
  await expect(page.getByPlaceholder('Acme Outreach')).toHaveCount(0)
})
