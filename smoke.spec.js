const { test, expect } = require('@playwright/test')

// Real-browser click tests for the critical DMForge paths.
// Selectors use visible text/placeholders (from app/page.js + auth-modal.jsx)
// so they survive styling changes.

test.describe('DMForge smoke', () => {
  test('homepage loads with hero + sign in', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Build, test & ship/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('auth modal opens from Sign in', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByPlaceholder('you@coach.com')).toBeVisible()
    await expect(page.getByPlaceholder('Password (min 6 chars)')).toBeVisible()
  })

  // Regression test for the reported JSON-parse crash in "Build my AI setter".
  // Every wizard step is pre-filled, so we just advance and build.
  test('wizard builds an AI setter end-to-end', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^Next/ }).click() // Niche -> Offer
    await page.getByRole('button', { name: /^Next/ }).click() // Offer -> Qualify
    await page.getByRole('button', { name: /^Next/ }).click() // Qualify -> Tone
    // Two "Build my AI setter" buttons exist (wizard + page CTA); the wizard's
    // is the one paired with "Back", so scope to that button's parent.
    await page.getByRole('button', { name: 'Back' })
      .locator('..')
      .getByRole('button', { name: /Build my AI setter/i })
      .click()
    // On success the live-test chat input appears (Gemini gen can take ~10s).
    await expect(page.getByPlaceholder('Reply as the lead…')).toBeVisible({ timeout: 45_000 })
  })

  test('blog index lists posts and a post opens', async ({ page }) => {
    await page.goto('/blog')
    const firstPost = page.locator('a[href^="/blog/"]').first()
    await expect(firstPost).toBeVisible()
    await firstPost.click()
    await expect(page).toHaveURL(/\/blog\/.+/)
  })
})
