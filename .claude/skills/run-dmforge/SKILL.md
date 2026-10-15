---
name: run-dmforge
description: >-
  Run, start, launch, screenshot, or click through the DMForge Next.js app locally
  and drive it with a Playwright driver — boot the dev server, probe the API,
  screenshot pages, walk the homepage wizard, or call lib/ modules directly. Use
  when asked to "run DMForge", "start the dev server", "screenshot the homepage",
  "check my change works in the real app", or "test the API locally". For
  production checks use prod-verify instead.
---

# Run DMForge locally

Next.js 16 App Router app (plain JS). The agent path is `next dev` on port 3100
plus [driver.mjs](driver.mjs) — a Playwright/fetch driver for pages, API and the
homepage wizard. All paths below are relative to the repo root. Verified on
Windows 10 / Git Bash / Node 26.10 on 2026-10-09.

> **`.env.local` holds LIVE production credentials** (Firestore `dmforge`, Gemini,
> Stripe). Any local API call is production traffic. The driver's default commands
> only read; `wizard --live` writes. For anything that writes (wizard, Stripe
> webhook tests), run `yarn emulators` + `yarn dev:emulated` instead — Firestore
> and Auth then go to the local emulators (README → "Local dev against the
> Firebase emulators"). Gemini and Stripe calls stay real (Stripe in test mode).

## Prerequisites

Dependencies installed (`node_modules/` present) and Playwright's Chromium
(already under `%LOCALAPPDATA%\ms-playwright` on this machine). No Node 22 is
installed, hence `--ignore-engines` everywhere.

## Run (agent path)

1. Start the dev server in the background (Bash tool, `run_in_background: true`):

   ```bash
   yarn --ignore-engines dev --port 3100
   ```

2. Drive it (each command below was run and passed):

   ```bash
   node .claude/skills/run-dmforge/driver.mjs wait
   node .claude/skills/run-dmforge/driver.mjs api
   node .claude/skills/run-dmforge/driver.mjs pages
   node .claude/skills/run-dmforge/driver.mjs pages blog about
   node .claude/skills/run-dmforge/driver.mjs wizard
   ```

   - `wait` — polls `/` until 200. **On a cold `.next/` the first compile takes ~3–5 minutes** (instrumentation + proxy + `/`); with a warm cache a restart is ready in ~30 s. The driver allows 10 min.
   - `api` — read-only probes: `/api/health` (Firestore+Stripe+Gemini), `/plans`, `/competitors`, `/openapi.json`, `/me` (anon → `{"user":null}`), `/my/agents` (must be 401). Non-zero exit on mismatch.
   - `pages [path …]` — screenshots to `test-results/run-dmforge/*.png` (gitignored). Pass paths **without** a leading slash. Fails if any `/_next/` asset errors (= page not hydrated).
   - `wizard` — clicks through Niche → Offer → Qualify → Tone and screenshots `wizard-step4.png`; stops before "Build my AI setter".

   **Look at the PNGs** with the Read tool — the console-error lines the driver prints (CSP `eval()`, Vercel analytics script blocked, a hydration-attribute mismatch) are pre-existing dev-mode noise.

3. Stop: kill the PID recorded in `.next/dev/lock`, then undo the file `next dev` rewrites:

   ```bash
   taskkill //PID $(node -p "JSON.parse(require('fs').readFileSync('.next/dev/lock','utf8')).pid") //T //F
   git checkout -- AGENTS.md
   ```

### Unverified: live agent creation

`driver.mjs wizard --live` clicks Build → `POST /api/agent/create` → writes
`agents/<id>` to **production** Firestore and bills Gemini, then prints the id.
Delete it with `driver.mjs cleanup <id>`. The `--live` run was not executed while
authoring this skill (blocked as a prod write); `cleanup` was run only against a
non-existent id (`agents/… not found — nothing to delete`). Get the user's OK first.

## Direct invocation (for `lib/` changes)

Most recent commits touch `app/api/[[...path]]/route.js` and `lib/`. `lib/` files
without `@/` aliases import straight into Node — `driver.mjs cleanup` does this
with `lib/firebaseAdmin.js`. Pattern: load `.env.local` via `dotenv`, then
`await import(pathToFileURL(path.resolve('lib/x.js')).href)`. For API-route
changes, use `driver.mjs api` or `curl http://localhost:3100/api/<route>`.

## Test

```bash
yarn --ignore-engines test
```

Vitest, 16 files / 90 tests, ~80 s.

## Run (human path)

`yarn dev` → http://localhost:3000. Fails on this machine without
`--ignore-engines` (see Troubleshooting).

## Gotchas

- **Use `localhost`, never `127.0.0.1`.** Next 16 `next dev` answers 403 to every
  `/_next/static/chunks/*` request from the `127.0.0.1` origin. SSR HTML still
  renders, so screenshots look perfect — but React never hydrates and clicks do
  nothing. `playwright.config.js` defaults to `127.0.0.1:3000`, so `yarn test:e2e`
  against a dev server hits this. The driver defaults to `http://localhost:3100`
  and fails loudly on any `/_next/` 4xx.
- **Next.js Dev Tools button collides with `name: 'Next'`.** Once hydrated, the
  "Open Next.js Dev Tools" button also matches `getByRole('button', { name: 'Next' })`
  → strict-mode violation. Use `exact: true` (as the driver does).
  `tests/e2e/smoke.spec.js` uses the non-exact form.
- **`next dev` modifies tracked `AGENTS.md`** on every start ("Generated AGENTS.md
  for AI agents") — it re-adds a `#` to the Next.js rules heading. Revert before committing.
- **Git Bash mangles leading-slash args**: `driver.mjs pages /blog` arrives as
  `D:/Programs/Git/blog`. The driver rejects it with a hint; pass `blog`.
- **`yarn dev --port 3100` works** even though the script hardcodes `--port 3000` —
  the later flag wins.
- `/dashboard` and `/settings` render the homepage when anonymous (client redirect) —
  not a bug. Authenticated pages need a real sign-in, which the driver doesn't do.
- Windows dynamic `import()` of an absolute path needs a `file://` URL
  (`ERR_UNSUPPORTED_ESM_URL_SCHEME … Received protocol 'd:'`).
- Importing `lib/*.js` prints `MODULE_TYPELESS_PACKAGE_JSON` — harmless; Node
  re-parses it as ESM.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `error dmforge@1.0.0: The engine "node" is incompatible with this module. Expected version "22.x". Got "26.10.0"` | Add `--ignore-engines` (`yarn --ignore-engines dev`). The pin targets Vercel's runtime. |
| `curl` / `wait` times out on the first request | Normal first compile (3–5 min; "Slow filesystem detected" warning on D:). Keep waiting; `/api/openapi.json` alone took 161 s first time. |
| `N /_next/ asset(s) failed … page is NOT hydrated` | You used `BASE=http://127.0.0.1:…`. Use `localhost`. |
| `SyntaxError: Unexpected token ':'` reading `.next/dev/lock` | `require()` treats the extension-less file as JS — use `JSON.parse(fs.readFileSync(...))` as in the stop command. |
| Port still busy after killing the background shell | Killing the `yarn` wrapper leaves the Next process alive; kill the lock-file PID with `//T`. |
| `strict mode violation: getByRole('button', { name: 'Next' }) resolved to 2 elements` | Add `exact: true`. |
