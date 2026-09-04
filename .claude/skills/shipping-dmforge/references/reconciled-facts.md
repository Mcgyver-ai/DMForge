# Reconciled facts — where DMForge's docs drift from reality

The repo's docs (`DEPLOYMENT.md` especially) describe the intended/original
process. Reality has moved since. This file is the tie-breaker. Update it
whenever you catch a new piece of drift — that's the whole point of it existing.

## Deploy trigger

- **Doc claim** (`DEPLOYMENT.md` §1, §5): "Deploy trigger: Git push to `main`
  branch (via Vercel GitHub integration)."
- **Reality**: that native integration has been dead since a 2026-06-30 git
  history rewrite. `.github/workflows/deploy.yml` was added specifically to
  replace it — it drives the Vercel CLI directly using `VERCEL_TOKEN` /
  `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` repo secrets, and self-skips (yellow)
  if they're unset. **Check whether those secrets are actually set** (a recent
  Actions run shows `skip=true` on the "Guard on required secrets" step if
  not) before assuming a push to `main` ships anything.
- The `deploy-cicd` agent (`.claude/agents/deploy-cicd.md`) owns fully
  reconciling this — don't independently "fix" it by re-enabling the dashboard
  integration or rewriting the workflow without checking with the user; if you
  find the secrets are set and a recent deploy run is green, that's your
  confirmation this path is live and it's fine to rely on it.

## Build tool

- **Doc claim**: "Build: `yarn build` with Turbopack" (Next 16's default).
- **Reality**: Turbopack has been broken in this repo (pre-existing, not
  introduced by any specific change). Every verified build in this repo's
  history used `next build --webpack` instead. Use `--webpack` explicitly;
  don't assume plain `yarn build`/`next build` will tell you anything useful.

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
  this 500s *every* API route on Vercel, and it's invisible to `yarn build`
  and CI (only shows up on a live route). If a workflow or dependency-update
  tool suggests bumping it, don't, without proving a live API route works on
  a preview deploy first.
- The rest of `package.json` intentionally pins canary/beta/rc versions
  (`react@19.3.0-canary-*`, `zod@4.5.0-canary-*`, `react-hook-form@8.0.0-beta.2`,
  `next@16.3.0-preview.5`, `@playwright/test@1.62.0-alpha-*`) — this is a
  deliberate bleeding-edge stance, not drift. Don't "fix" it by pinning to
  stable unless the user asks.

## Node version drift across workflows

`ci.yml`/`deploy.yml` use Node 22; `pre-deploy-verify.yml`/`e2e.yml` use Node
20, as of the last check. Confirm which one matches Vercel's actual build
image before treating either as authoritative, and don't assume this has been
fixed without checking the current workflow files.

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
  const swc = require('next/dist/build/swc');
  await swc.loadBindings();
  await swc.transform(code, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true } } });
  ```
  Tell the user this is a compile check, not a full build, and that they
  should run `yarn build` on their real machine before actually shipping.
- **This VM's local git config has no `user.name`/`user.email`** (the global
  `.gitconfig` lives on the Windows side and isn't visible here) — first
  commit attempt fails with "Author identity unknown." Fix with a **local**
  (repo-scoped — never `--global`) config matching the existing commit
  history's author (`git log -3 --format='%an <%ae>'` first — don't invent an
  identity or use your own).
