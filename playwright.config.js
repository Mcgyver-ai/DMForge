const { defineConfig, devices } = require('@playwright/test')

// Reusable across projects: point it anywhere with BASE_URL=... yarn test:e2e
// IMPORTANT: Defaults to localhost (safe for local/CI testing).
// To test production: BASE_URL=https://www.dmforge.org yarn test:e2e
// (requires explicit opt-in to avoid accidental production test runs)
const baseURL = process.env.BASE_URL || 'http://localhost:3000'

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,            // whole test; the wizard build calls Gemini (~10s)
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
