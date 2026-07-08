# DMForge — Design Decisions

Companion to [README.md](README.md) (what the project is) and [CLAUDE.md](CLAUDE.md) (working rules).
This document records **why** the system is built the way it is.

## 设计目标 (Design Goals)

1. **60-second time-to-value.** A non-technical coach must be able to build and live-test an AI DM
   appointment setter in under a minute, before connecting any real account — the live simulator is
   the core trust-builder and the main conversion lever.
2. **Zero-ops serverless.** One person maintains this product. Everything must run on Vercel
   serverless + managed services (Firebase, Stripe, Gemini) with no servers, queues, or long-lived state.
3. **Cheap at free-tier scale.** A free-forever tier means marginal cost per user must stay near zero:
   flash-class LLM by default, flat-rate pricing, no per-message metering infrastructure.
4. **Testable in production.** Deploys are verified black-box against the live site (Playwright e2e
   targets production by default; `prod-verify` skill) because a green build alone has repeatedly
   failed to catch runtime-only breakage.

## 方案选择 (Alternatives Considered)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Language | Plain JavaScript | TypeScript | Solo-maintained, small surface; TS build/typing overhead not worth it. Enforced: no `.ts`/`.tsx`. |
| API layout | Single catch-all `app/api/[[...path]]/route.js` | One route file per endpoint | One auth/CORS/rate-limit wrapper, one cold start path; trade-off: the file is large (~955 lines, above the 500-line quality guideline) and is the first candidate for a split. |
| LLM access | Hand-rolled `fetch` to Gemini REST (`lib/llm.js`) | Vercel AI SDK / official SDK | Full control of request shape, no dependency churn, easy routing through Cloudflare AI Gateway via `GEMINI_BASE_URL`. |
| Database | Firestore, **named DB `dmforge`** | `(default)` database; SQL | Named DB isolates the app from other projects in the same Firebase project. All access goes through `lib/firebaseAdmin.js` (server) / `lib/firebase.js` (client) singletons. |
| Payments | Stripe subscriptions (flat plans) | Usage-based billing | Flat $0/$39/$199 pricing is the product's positioning ("no per-message tax"); webhook signature always verified with `STRIPE_WEBHOOK_SECRET`. |
| UI kit | shadcn/ui (Radix) + Tailwind | Component library (MUI etc.) | Owned, themeable primitives; tokens live in `app/globals.css` as shadcn HSL triples. |
| Scheduled work | GitHub Actions cron hitting API routes | Vercel Cron | Vercel cron limits on the current plan; 15-min reminder cron moved to Actions (52b5b1b). |

## 关键决策 (Key Decisions)

- **firebase-admin pinned to 13.x.** v14 500s every API route on Vercel (ESM namespace removal +
  `jose@6` `ERR_REQUIRE_ESM`) while remaining invisible to build and CI. Any bump must be proven on a
  live preview route first. (db927b7, reverting 1b63aae)
- **Secrets are read at request time, never at build time.** The build must succeed with no server
  secrets present; CI uses placeholders. Client-side vars are `NEXT_PUBLIC_*` only. New env vars must
  be added to `.env.example` and `.github/workflows/ci.yml`.
- **Third-party credentials are encrypted at rest** (`lib/encryption.js`) before being stored in
  Firestore (SMTP, Twilio, LinkedIn, GoHighLevel).
- **Package manager is yarn 1.x, pinned.** Never npm/pnpm; lockfile never hand-edited.
- **Design system is governed by `.impeccable.md`.** Dark-only navy base, coral `#FF4D6D` as the
  single signal color, purple `#6B5BFF` sparing, Fraunces + IBM Plex Sans, WCAG AA floor. Gradient text,
  neon glow shadows, and coral→purple gradient fills are banned (removed 2026-07-07); featured
  surfaces use `.elevate-coral`/`.elevate-purple` tinted elevation.
- **Design tokens are shadcn HSL triples** in `app/globals.css` `:root`, consumed as
  `hsl(var(--*))` by `tailwind.config.js`. Raw hex vars were removed after they silently broke all
  shadcn semantic color utilities.

## 已知限制 (Known Limitations)

- **No leads/prospects data model yet.** The demo flow persists one-shot `results` transcripts; a
  live conversation/lead pipeline (inbox, SMS auto-triggers, GHL sync) is designed but not shipped.
- **Catch-all API route is ~955 lines** — above the 500-line quality guideline; splitting it is
  pending and must preserve the single middleware wrapper.
- **Vercel Git auto-deploy is broken** since the 2026-06-30 history rewrite; production deploys are
  manual (`vercel deploy --prod`) until the integration is reconnected.
- **Local `.env.local` is not usable** (only `VERCEL_OIDC_TOKEN`); local builds rely on CI
  placeholder values.
- **Dark theme only.** Light mode is a possible future evolution, not currently supported
  (`dark` class is hardcoded in `app/layout.js`).
- Root directory carries a few loose scripts (`create-firestore.js`, `smoke.spec.js`) flagged by the
  module scanner; Next.js config files legitimately live at root.

## 变更历史 (Change History)

| Date | Change |
|------|--------|
| 2026-07-07 | Design-token fix (shadcn HSL triples), anti-slop pass across all pages, WCAG AA button/badge contrast, `.impeccable.md` design context established |
| 2026-07-06 | Unified brand `Logo` component across pages (990872d); closed open items 1–4: auto-deploy diagnosis, leads/inbox pipeline plan, env docs (c992a0c) |
| 2026-07-05 | Composite Firestore indexes for reminders cron + GHL webhook (bef5030) |
| 2026-07-0x | firebase-admin downgraded to 13.10.0 after v14 broke all API routes on Vercel (db927b7) |
| earlier | 15-min reminder cron moved from Vercel Cron to GitHub Actions (52b5b1b) |
