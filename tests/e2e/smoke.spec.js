const { test, expect } = require('@playwright/test')

test('homepage loads with hero text', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/stop losing leads/i)).toBeVisible()
})

test('full wizard build produces a chat simulator', async ({ page }) => {
  await page.goto('/')

  // Step 0: niche + agent name
  await expect(page.getByText(/what's your niche/i)).toBeVisible()
  await page.getByRole('button', { name: /fitness/i }).first().click()
  const nameInput = page.getByPlaceholder(/your name/i)
  await nameInput.clear()
  await nameInput.fill('TestBot')
  await page.getByRole('button', { name: 'Next' }).click()

  // Step 1: offer + audience (defaults are fine)
  await expect(page.getByPlaceholder(/ideal client/i)).toBeVisible()
  // scope Next to the one beside Back (step 1 and 2 both have Back + Next)
  await page.getByRole('button', { name: 'Next' }).click()

  // Step 2: qualification (default is fine)
  await page.getByRole('button', { name: 'Next' }).click()

  // Step 3: tone + build — two "Build my AI setter" buttons exist (wizard + marketing).
  // Scope to the one paired with "Back" (the wizard's Back button is its sibling).
  await page.getByRole('button', { name: 'Back' }).locator('..')
    .getByRole('button', { name: /build my ai setter/i }).click()
  await expect(page.getByText(/ai active/i)).toBeVisible({ timeout: 45_000 })
})

test('/r/:id share page loads', async ({ page }) => {
  // Use the share id from our earlier result/save call during phase 3
  await page.goto('/r/3eb4a25b-4f8b-4a73-911f-37465fd2417e')
  await expect(page.locator('body')).not.toContainText('404')
  await expect(page.locator('body')).not.toContainText('Internal Server Error')
})

test('blog index page loads', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.locator('h1, h2').first()).toBeVisible()
})
