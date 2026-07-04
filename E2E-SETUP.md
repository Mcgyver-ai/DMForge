# DMForge E2E — real-browser click tests (Playwright)

Validated against production. Catches what API smoke tests can't: client-side
flows, duplicate-label ambiguity, and broken end-to-end journeys (it caught a
full Firestore outage on its first run).

## Install (one time, in the DMForge repo root)

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

Then copy `playwright.config.js` to the repo root and the `tests/` folder
alongside it, and add these scripts to `package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:report": "playwright show-report"
}
```

## Run

```bash
npm run test:e2e                                  # against production (default)
BASE_URL=http://localhost:3000 npm run test:e2e   # against local dev
npm run test:e2e:headed                           # watch the browser click
```

## What it covers (tests/e2e/smoke.spec.js)

1. Homepage loads — hero + Sign in button.
2. Auth modal opens from "Sign in".
3. **Wizard regression** — advances all 4 steps, clicks "Build my AI setter",
   asserts the live-test chat appears. This is the guard for the build flow.
4. Blog index lists posts and a post opens.

## Reuse for future projects

The config reads `BASE_URL` (defaults to `https://www.dmforge.org`). For a new
project: copy `playwright.config.js`, drop a new spec in `tests/e2e/`, and point
`BASE_URL` at the new site. Selectors use visible text/placeholders rather than
CSS classes, so they survive restyling.

## Note: keep test files out of the deployed bundle

These live in `tests/` and won't be bundled by Next.js. No extra config needed.
