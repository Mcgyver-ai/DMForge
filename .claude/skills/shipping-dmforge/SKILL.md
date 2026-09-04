---
name: shipping-dmforge
description: >-
  Walks through actually shipping a DMForge change to production — pre-flight
  checks, the real (not aspirational) deploy path, the env vars that gate
  features, and post-deploy verification. Use when the user says "ship this,"
  "deploy DMForge," "is this ready to go live," "push to production," or asks
  what's left before a release. Complements, doesn't replace, the
  `deploy-cicd` agent (owns the workflow YAML files) and the `prod-verify`
  skill (owns proving a live deploy actually works) already in this repo.
---

# Shipping DMForge

DMForge is Next.js 16 on Vercel + Firebase (Firestore, Cloud Functions) + Stripe.
Repo: `D:\Dev\Workspaces\Active\DMForge`. `DEPLOYMENT.md` in the repo root is the
long-form runbook — read it for architecture and rollback procedures. This skill
is the short, current, "am I actually ready" checklist; where it disagrees with
`DEPLOYMENT.md`, trust this skill and `references/reconciled-facts.md` — that
file exists specifically because the runbook has drifted from reality before.

## Before touching anything: read the drift file

`references/reconciled-facts.md` lists every place this repo's docs describe an
aspirational process that isn't what actually happens (e.g. `DEPLOYMENT.md` says
Vercel's native Git integration deploys `main` — it's been dead since a
2026-06-30 history rewrite; a GitHub Actions workflow does it now). Don't trust
a doc's claim about the deploy path, build tool, or scheduler without checking
this file first — and if you discover a NEW piece of drift, add it there.

## Pre-flight checklist

Copy this and check items off as you verify them — don't skip to "looks fine":

```
- [ ] Working tree reviewed: `git status --short` — nothing unexpected staged/unstaged
- [ ] Build compiles: `next build --webpack` (see "Build" below — NOT plain `next build`)
- [ ] No secrets in the diff: `git diff --cached | grep -iE "sk_live|AIza|whsec_|api[_-]?key"` (spot-check, not exhaustive — gitleaks in ci.yml is the real gate)
- [ ] New env vars (if any) added to `.env.example` AND actually set in Vercel
- [ ] Firestore composite indexes deployed if a new query needs one: `firebase deploy --only firestore:indexes`
- [ ] Conventional-commit-style message (pre-deploy-verify.yml lints this on PR)
- [ ] Commit is scoped: `git add <specific files>`, never `git add -A` on this repo — there is
      almost always unrelated pre-existing drift in the working tree (see "Working tree hygiene" below)
```

## Build

**Don't run plain `next build`.** Turbopack (Next 16's default) is broken in
this repo as of the last verified check — pre-existing, not something to "fix"
casually. Validate with webpack instead:

```bash
yarn build --webpack     # or: ./node_modules/.bin/next build --webpack
```

If this is being run from the remote-devices bridge (Linux VM) rather than the
user's real Windows machine, see `references/reconciled-facts.md` for why it
frequently can't complete there and what to do instead — don't burn more than
one or two attempts chasing a bridge-only failure.

## The real deploy path

Push to `main` → **GitHub Actions** (`.github/workflows/deploy.yml`) drives
`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod` using
repo secrets `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`. This workflow
**self-skips (yellow, not red)** if those secrets are unset — a green check
doesn't guarantee a deploy happened; check the "Guard on required secrets" step
output, or just check whether `dmforge.org` actually changed.

Never run `vercel deploy --prod` or push to `main` yourself without the user's
go-ahead — that's the `deploy-cicd` agent's stated rule too, not just this
skill's.

## Env vars that gate real features

Full list lives in `references/env-checklist.md` (it's long: encryption keys,
LinkedIn OAuth, cron/webhook secrets, AI Gateway). Check it before telling
anyone a feature is "done" — several channel integrations 500 silently until
their specific env var is set, by design (fail closed, not fail with a fake
success).

## Post-deploy

This is exactly what the `prod-verify` skill does — invoke it rather than
improvising curl commands: it registers a real test account, drives the
authenticated journey (agent creation, chat, billing entry points), reads
Vercel/Firebase runtime logs on any failure instead of guessing from the HTTP
body, and reports pass/fail per surface. Minimum bar before calling a deploy
"done": homepage 200, `/api` reachable, sign-up works, no new Sentry errors in
the first 5 minutes.

## Working tree hygiene (read before your first `git add`)

This repo's working tree, viewed through the remote-devices bridge, often shows
the **entire repo** as modified (`git diff --stat -- <file>` vs
`git diff --stat --ignore-all-space -- <file>` differing wildly) — that's
line-ending drift between how git's index was built and how this bridge's
Linux VM presents the files, not real content changes, and it predates
whatever you're doing this session. Never `git add -A` or `git commit -a` here.
Stage only the exact files your task touched; if a huge unrelated diff shows up
for files you didn't edit, that's the known drift, not something to fix as
part of your task (raise it separately if the user wants it resolved).

See `references/reconciled-facts.md` for the git-lockfile and identity quirks
specific to running git through this bridge (stale `index.lock`, missing local
`user.name`/`user.email`) — same file as the build gotchas, since they're both
"bridge, not codebase" issues.

## Report format

```
## Ship check — DMForge — <date>
**Pre-flight:** <checklist above, pass/fail each>
**Build:** <webpack build result>
**Deployed via:** <GitHub Actions run URL, or "not deployed — here's what's blocking">
**Post-deploy verify:** <prod-verify summary, or "not run yet">
**New drift discovered:** <anything added to reconciled-facts.md this session>
```
