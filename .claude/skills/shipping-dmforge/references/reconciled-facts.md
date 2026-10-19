# Reconciled facts — where DMForge's docs drift from reality

The repo's docs (`DEPLOYMENT.md` especially) describe the intended/original
process. Reality has moved since. This file is the tie-breaker. Update it
whenever you catch a new piece of drift — that's the whole point of it existing.

## Deploy trigger

- **Doc claim** (`DEPLOYMENT.md` §1, §5): "Deploy trigger: Git push to `main`
  branch (via Vercel GitHub integration)."
- **Reality (as of 2026-09-14)**: the doc is correct again. The integration was
  dead from a 2026-06-30 git history rewrite until some point after
  2026-09-07; merging PR #9 (`472d4a1`) went live 2 seconds later with the
  `dm-forge-git-main-*` alias. The GitHub Actions workaround (`deploy.yml`) was
  removed the same day — its `VERCEL_*` secrets were never set, so it skipped
  every run, and setting them now would deploy every push twice.

## Build tool

- **Doc claim**: "Build: `yarn build` with Turbopack" (Next 16's default).
- **Reality (as of 2026-09-14)**: plain `next build` (Turbopack) works — it
  compiled 69/69 pages repeatedly during the September audit, and CI's
  `yarn build` is green. The earlier "Turbopack is broken, use `--webpack`"
  note is stale. On the Windows dev machine `yarn` itself is broken (corepack
  shim missing), so run `npx next build` there.

## Scheduler (SMS reminders)

- **Doc claim**: Firebase Cloud Scheduler (`sendReminders()`) is the sole
  15-minute trigger; Vercel cron was disabled 2026-07-15.
- **Reality to verify, not assume**: `.github/workflows/cron-reminders.yml`
  still exists and may still be live, hitting `/api/cron/send-reminders` on
  its own 15-minute schedule. If both fire, the Firestore transactional claim
  in the reminders flow is what prevents a double-send — don't assume it's
  fine, check that the transaction is still there before treating double-firing
  as harmless. If you're touching reminders at all, check whether
  `cron-reminders.yml` is still enabled before assuming Firebase is the only path.

## Dependency pins — do not "helpfully" bump these

- **`firebase-admin` is pinned to `13.x`.** Version 14's ESM default export
  loses `admin.apps` and its `jose@6` dependency can't be `require()`'d —
  this 500s _every_ API route on Vercel, and it's invisible to `yarn build`
  and CI (only shows up on a live route). If a workflow or dependency-update
  tool suggests bumping it, don't, without proving a live API route works first.
- **Vercel Preview has no Firebase Admin credentials.** Every API route on a
  preview returns the JSON `"Firebase Admin SDK not configured"` 500 — that
  proves the bundle loads (a module-init failure returns an empty body), not
  that the routes work. Prove API routes with a local
  `next start -H 127.0.0.1 -p 3100` against `.env.local` (live Firestore —
  delete QA docs by id), crawl the preview's pages, then re-verify production
  right after deploy.
- The rest of `package.json` intentionally pins canary/beta/rc versions
  (`react@19.3.0-canary-*`, `zod@4.5.0-canary-*`, `react-hook-form@8.0.0-beta.2`,
  `@playwright/test@1.62.0-alpha-*`) — this is a deliberate bleeding-edge
  stance, not drift. Don't "fix" it by pinning to stable unless the user asks.
  `next` moved from `16.3.0-preview.5` to stable `16.3.3` on 2026-09-15 at the
  user's request, for two critical RCE advisories.

## Node versions

As of 2026-09-14 every workflow that sets up Node uses 22 (`pre-deploy-verify.yml`
no longer installs Node — it only lints commits). The deployed `sendReminders`
Cloud Function runs `nodejs24` since 2026-09-14 (`functions/package.json`
`engines.node`). Any change under `functions/` (lockfile included) only reaches
production through `npx firebase-tools@15.30.1 deploy --only functions:sendReminders`
— a push to `main` does not deploy it. Set `FUNCTIONS_DISCOVERY_TIMEOUT=60` on
this machine or the CLI's local code discovery times out.

---

## Bridge-only quirks (remote-devices / device_bash), not codebase issues

Everything below is about running tooling on this repo **through the
remote-devices bridge** (a Linux VM mounting the user's Windows folder), not a
property of the codebase itself. They don't apply if the user is working
directly on their own machine.

- **`node_modules` here is Windows-built** — only `@next/swc-win32-x64-msvc`
  exists under `node_modules/@next/`, so any Linux-side `next build` fails
  immediately with "Failed to load SWC binary for linux/x64" until you
  install `@next/swc-linux-x64-gnu@<exact version from node_modules/next/package.json>`
  (`npm install --no-save --ignore-scripts --legacy-peer-deps ...` — `--no-save`
  keeps this from touching `package.json`/`yarn.lock`).
- **No `yarn` on this VM's PATH**, despite `package.json`'s
  `"packageManager": "yarn@1.22.22..."` and a committed `yarn.lock`. Fix per
  session: `mkdir -p /tmp/corepack-bin && corepack enable --install-directory /tmp/corepack-bin && export PATH="/tmp/corepack-bin:$PATH"`.
- **The mounted folder is FUSE and blocks deletion by default.** `device_bash`
  can't `rm`/`unlink` there without the user approving
  `device_request_delete_permission`. This breaks anything that deletes before
  recreating: `next build`'s own cache cleanup (`.next/BUILD_ID`,
  `.fuse_hidden*`), and git's lockfile cleanup (`.git/index.lock`,
  `.git/HEAD.lock`, `.git/objects/*/tmp_obj_*`). Git still completes the
  operation correctly — it just can't clean up after itself, so a later git
  command sees a stale lock and refuses to run. Work around both by **renaming**
  instead of deleting: `mv .next ".next-backup-$(date +%s)"` before a
  from-scratch build, and `mv .git/index.lock ".git/index.lock.stale-$(date +%s)"`
  immediately before any git command if the previous one left one behind
  (check every time — each git invocation can leave a fresh one).
- **A full `next build --webpack` from this bridge is unreliable** even after
  the fixes above — FUSE permission errors can resurface mid-build on cache
  writes. Don't chase it past one or two attempts. Fall back to compiling the
  changed files through Next's own SWC transformer directly (fast, catches
  real syntax errors, not a substitute for a real build):

  ```js
  const swc = require("next/dist/build/swc");
  await swc.loadBindings();
  await swc.transform(code, {
    filename,
    jsc: { parser: { syntax: "ecmascript", jsx: true } },
  });
  ```

  Tell the user this is a compile check, not a full build, and that they
  should run `yarn build` on their real machine before actually shipping.

- **This VM's local git config has no `user.name`/`user.email`** (the global
  `.gitconfig` lives on the Windows side and isn't visible here) — first
  commit attempt fails with "Author identity unknown." Fix with a **local**
  (repo-scoped — never `--global`) config matching the existing commit
  history's author (`git log -3 --format='%an <%ae>'` first — don't invent an
  identity or use your own).

## Git index corruption (0-byte index)

- **Symptom**: `git status` fails with `fatal: .git/index: index file smaller than expected`.
- **Cause**: Interrupted command, filesystem disconnect, or crash leaving `.git/index` at 0 bytes.
- **Fix**: `Move-Item .git\index .git\index.corrupted-$(Get-Date -Format 'yyyyMMddHHmmss'); git reset`. This safely rebuilds the index from `HEAD` without discarding unstaged file changes.
