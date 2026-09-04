# Known gaps log — DMForge frontend

Running log so repeat audits don't rediscover the same ground. Newest entry on top.
Update this file whenever you run the `auditing-dmforge-frontend` skill.

---

## 2026-09-04 audit

**Fixed** (commit `9af4428`, files: `components/auth-modal.jsx`, `app/inbox/page.js`,
`app/dashboard/page.js`, `app/page.js`, `app/settings/team/page.js`,
`app/settings/channels/page.js`, `app/settings/integrations/page.js`,
`app/settings/white-label/page.js`):

- Auth modal + inbox thread drawer: no Escape-to-close, no `role="dialog"`, no focus
  management. Fixed both.
- Icon-only buttons with no `aria-label` (modal/drawer close, sign-out ×2, remove-teammate).
- Text inputs relying on placeholder-only labeling across auth modal, inbox new-lead form,
  channels (Twilio/Gmail/SMTP), integrations (GHL), team invite — added `aria-label`.
- White-label settings: visible `<label>` text existed but wasn't wired to its input
  (`htmlFor`/`id` missing) for all 4 fields — fixed.
- `load()`-style functions with zero try/catch around fetch+`.json()` (dashboard, channels,
  integrations, team, white-label loaders; inbox openThread/sendMessage/patchProspect/
  createLead/loadInboundUrl) — an network failure was an unhandled rejection, page just sat
  dead. Wrapped all of them.
- `portal()` in both the landing-page Pricing section and the dashboard had no try/catch and
  no failure feedback. Fixed both.
- Landing-page `ChatSimulator` didn't check `res.ok` before reading `data.reply` — an errored
  or rate-limited `/api/agent/chat` call rendered a literal "undefined" chat bubble. Now shows
  a real toast + friendly fallback.

**Flagged, not fixed — still open, re-check on next audit:**

1. `app/page.js` (~500 lines) is one `'use client'` component: nav, pricing table, FAQ,
   features grid — all client-rendered, re-renders on every auth-state change. Real Core Web
   Vitals lever (split static marketing sections into Server Components, keep only
   Wizard/ChatSimulator/Pricing-buttons as client islands) but it's the highest-traffic page —
   needs the user's sign-off and a visual smoke-test after, not a silent audit-pass fix.
2. `next-themes` is an installed but unused dependency — app is hardcoded dark
   (`className="... dark"` on `<html>`). Not a bug, just dead weight. User's call whether to
   drop the dep or build a real toggle.
3. `images: { unoptimized: true }` in `next.config.js` is deliberate (cost/plan-related) —
   don't flag missing `next/image` usage as high-priority; it buys less here than usual.

**Confirmed resolved from earlier sessions (don't re-flag):**
- `.env.local` is ASCII, not UTF-16LE — the local-build-breaking encoding issue from the
  2026-07-12 session log is gone.

## Environment gotchas hit while auditing via the remote-devices bridge

These aren't code bugs — they're quirks of running tooling on this repo through
`device_bash` (the Linux VM bridge) instead of the user's normal Windows dev setup. Worth
knowing before you burn a retry loop on them:

- **`node_modules` here is Windows-built.** Only `@next/swc-win32-x64-msvc` is present under
  `node_modules/@next/` — no Linux SWC binary, so `next build` fails immediately with
  "Failed to load SWC binary for linux/x64" until you install
  `@next/swc-linux-x64-gnu@<version>` (`--no-save --ignore-scripts --legacy-peer-deps`,
  matching the exact `next` version in `node_modules/next/package.json` — this repo pins
  canary/preview versions, an npm-resolvable range often doesn't exist).
- **No `yarn` on PATH in this VM**, even though `package.json` specifies
  `"packageManager": "yarn@1.22.22..."` and `yarn.lock` is what's actually committed. `npx`
  internally shells out to `yarn config get registry` during some installs and fails loudly
  (usually harmless, but confusing). Fix once per session:
  `mkdir -p /tmp/corepack-bin && corepack enable --install-directory /tmp/corepack-bin && export PATH="/tmp/corepack-bin:$PATH"`.
- **The mounted folder is FUSE and blocks deletion by default** (`device_bash` can't
  `rm`/`unlink` there without the user approving `device_request_delete_permission`). This
  breaks anything that deletes-then-recreates a file: `next build`'s cache cleanup
  (`.next/BUILD_ID`, `.fuse_hidden*` temp files), and git's lockfile cleanup (`index.lock`,
  `HEAD.lock`, `.git/objects/*/tmp_obj_*`) — git still completes correctly, it just leaves
  stale lock files behind that block the *next* git command. Work around both by renaming
  (`mv`) rather than deleting: move `.next` aside before a from-scratch build attempt, and
  `mv .git/index.lock .git/index.lock.stale-$(date +%s)` immediately before any git command
  if a previous one left one behind.
- **A full `next build --webpack` from this bridge is unreliable** even after the above fixes
  (FUSE permission errors resurface mid-build on cache writes). Don't chase it past one or two
  attempts — use the SWC-transform check in the main skill file instead, and tell the user to
  run the real build on their own machine.
- **Git identity isn't set in this VM's local git config** (global `.gitconfig` lives on the
  Windows side, invisible here). First commit attempt fails with "Author identity unknown".
  Fix with a **local** (repo-scoped, never `--global`) config matching the existing commit
  history's author — check with `git log -3 --format='%an <%ae>'` first, don't invent an
  identity.
