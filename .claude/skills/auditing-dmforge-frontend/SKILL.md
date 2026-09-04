---
name: auditing-dmforge-frontend
description: >-
  Runs a frontend gap audit on the DMForge Next.js app (accessibility, error
  handling, Core Web Vitals, React/Next correctness) and fixes what's safe to
  fix in the same pass. Use when the user asks to audit, review, or "check for
  gaps/issues" in DMForge's frontend, before a release, after a batch of pages
  were added, or when asked to make the app "production ready." Scoped to
  `app/`, `components/`, and the Tailwind/shadcn UI layer — not the API routes
  under `app/api/`.
---

# Auditing DMForge's frontend

DMForge is a Next.js 16 (App Router) + React 19 canary app, dark-theme-only,
shadcn/Radix UI kit, all pages under `app/` are `'use client'`. Repo root:
`D:\Dev\Workspaces\Active\DMForge` (reach it via the remote-devices bridge —
request folder access to `D:\Dev\Workspaces\Active` if it isn't already
granted, then work on the files with `device_bash`, never by staging them into
the cloud workspace — see the device-bridge rules already in your system
prompt).

Read `references/known-gaps.md` first. It lists what a previous pass already
found and fixed, and the one architectural gap that's flagged but deliberately
untouched — don't re-report those as new findings; do re-check whether they
regressed.

## Workflow

1. **Map the surface.** `find app components -name "*.js" -o -name "*.jsx" | grep -v node_modules` via `device_bash`. Read every page under `app/**/page.js` and every file in `components/` (skip `components/ui/*` — that's the vendored shadcn kit, only touch it if a specific bug points there).
2. **Check each file against the gap categories below.** Don't just skim — these are the categories that have actually contained real bugs here twice already.
3. **Fix what's mechanical and safe** (see "What to fix live" below) directly on the user's machine with `device_bash` — read the file, apply an exact string replacement (Python read-modify-write, asserting the old string is found exactly once before writing), never regenerate a file from memory.
4. **Verify without a full build** — see "Verification" below; a real `next build` usually can't run from this bridge.
5. **Update `references/known-gaps.md`** with what you fixed and what's newly flagged, so the next audit doesn't repeat this one.
6. **Commit only the files you actually touched** (`git add <files...>`, never `-A`) — see the git gotchas in `references/known-gaps.md` if commands fail with lock/permission errors.

## Gap categories to check

- **Modals and overlays** (anything `fixed inset-0`): does it close on Escape? Does it have `role="dialog"` / `aria-modal="true"`? Does focus land somewhere sensible on open? DMForge has had every one of these missing by default — check every modal/drawer, not just the ones you already know about.
- **Icon-only buttons**: `grep -rn "<button" app components | grep -v aria-label` — anything left has no accessible name. A `title` attribute is not a substitute for `aria-label`.
- **Text inputs with only a placeholder**: shadcn's `Label` component exists in `components/ui/label.jsx` but historically nothing outside `ui/form.jsx` imports it — most forms label inputs with placeholder text alone. Add `aria-label` (cheapest, no visual change) or wire a real `<label htmlFor>`/`id` pair if a visible label already exists but isn't connected.
- **Unguarded fetch calls**: any `await res.json()` not preceded by a `try` or followed by a `res.ok` check. This app's fetch pattern is `authFetch(...)` then `.json()` then check a data field (`data.url`, `data.id`, etc.) — but many `load()`-style functions skip the try/catch entirely, so a network failure becomes an unhandled rejection and a silently dead page instead of a toast.
- **Client-only marketing/landing content**: `app/page.js` is one large `'use client'` component mixing static marketing copy with the interactive wizard/simulator. Don't silently "fix" this by splitting it — it's a real Core Web Vitals issue but a structural change to the highest-traffic page; flag it, don't restructure it without the user signing off.
- **React correctness**: missing `key` props, stale closures in `useEffect`, effects with missing deps that matter (not every missing dep is a bug — check whether it's a mount-once pattern), and any `<img>` where `next/image` would help (note: `next.config.js` sets `images: { unoptimized: true }` deliberately, so this buys less than usual here — don't push next/image migrations as high-priority for that reason).

## What to fix live vs. flag

**Fix live** (mechanical, low-risk, matches existing code style): missing `aria-label`, missing Escape/role-dialog on modals, missing try/catch around a fetch-then-json call, an unchecked `res.ok` that shows a broken/undefined message on error.

**Flag, don't fix without sign-off**: anything that changes visual layout, anything that splits a component into Server/Client boundaries, anything touching `app/api/**` (out of scope for this skill — that's the `api-security` agent's territory), dependency version changes.

## Verification

A real `next build` frequently can't complete from the remote-devices bridge — see `references/known-gaps.md` for the exact failure modes (Windows-built `node_modules` read from a Linux VM, missing `yarn` on PATH, FUSE blocking file deletion mid-build). Don't burn more than one or two attempts on it. Instead:

```bash
# Fast, accurate syntax/compile check using Next's own SWC compiler —
# catches real JSX/syntax errors without needing a full build:
node -e "
const swc = require('next/dist/build/swc');
const fs = require('fs');
const files = [/* the files you edited */];
(async () => {
  await swc.loadBindings();
  for (const f of files) {
    try {
      await swc.transform(fs.readFileSync(f, 'utf8'), { filename: f, jsc: { parser: { syntax: 'ecmascript', jsx: true } } });
      console.log('OK  ', f);
    } catch (e) { console.log('FAIL', f, '\n', e.message || e); }
  }
})();
"
```

If `next/dist/build/swc` can't find its native binding for the current platform, install it once (throwaway, doesn't touch the lockfile): `npm install --no-save --ignore-scripts --legacy-peer-deps @next/swc-linux-x64-gnu@<version from node_modules/next/package.json>`.

Tell the user plainly that this is a compile check, not a full build, and that `yarn build` should still be run on their real dev machine before shipping.

## Report format

Same shape every time, so audits are comparable across sessions:

```
## DMForge frontend audit — <date>
**Fixed:** <file — one line each on what changed and why>
**Flagged, not fixed:** <finding — why it needs a human call>
**Verified:** <SWC transform result / whether a real build ran>
**Committed:** <commit hash + files, or "left uncommitted, see diff">
```
