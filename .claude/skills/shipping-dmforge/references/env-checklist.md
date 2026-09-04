# Env var checklist — DMForge

Source of truth is `.env.example` in the repo root — read it, don't trust this
summary blindly if the two disagree (this file can go stale; `.env.example` is
maintained alongside the code that reads each var). This file exists to answer
one question fast: **"is X actually configured, or silently disabled?"**

## Required — nothing works without these

| Var | Missing behavior |
|---|---|
| `GEMINI_API_KEY` | Agent chat / wizard generation fails |
| `FIREBASE_SERVICE_ACCOUNT_JSON` (or `FIREBASE_SERVICE_ACCOUNT_PATH` locally) | Every API route that touches Firestore/Auth fails |
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Client-side Firebase Auth/Firestore fails; local build also needs these at build time |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout/portal/webhook all fail |
| `ENCRYPTION_KEY` | **Any** channel connect (email/SMS/LinkedIn/GHL) 500s — this gates four features at once |
| `NEXT_PUBLIC_BASE_URL` | Stripe redirect URLs break |

## Feature-gated — fails closed by design, not a bug

| Var | Feature it unlocks | Missing behavior |
|---|---|---|
| `LINKEDIN_CLIENT_ID`/`SECRET`/`REDIRECT_URI` | LinkedIn channel connect | Returns 503 until all three are set — requires registering an app at developer.linkedin.com first |
| `GHL_WEBHOOK_SECRET` | GoHighLevel inbound webhook signature check | Unset = signature check skipped (works, but unverified) |
| `CRON_SECRET` | Secures `/api/cron/send-reminders` | Unset = endpoint open; also note this route may be deprecated in favor of Firebase Cloud Scheduler — check `references/reconciled-facts.md` |
| `SENTRY_DSN` | Error monitoring | Unset = SDK no-ops, silent, no crash |
| `NEXT_PUBLIC_POSTHOG_KEY` (+ `_HOST`) | Product analytics | Unset = no-op |
| `RESEND_API_KEY` + `MAIL_FROM` | Transactional email (agency invites) | Unset = `lib/mail.js` no-ops with a `console.warn`, callers don't break |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` | Cross-instance rate limiting | Unset = falls back to in-memory per-instance buckets (fine for low traffic, not for real scale — multiple serverless instances each get their own limit) |
| `AI_GATEWAY_API_KEY` (+ `_MODEL`) | Alternate LLM provider via Vercel AI Gateway | Not wired into the main pipeline regardless — experimental only |
| `GEMINI_BASE_URL` | Route Gemini through Cloudflare AI Gateway | Unset = calls Google directly |
| `CORS_ORIGINS` | Cross-origin API callers | Unset = defaults to `https://dmforge.org,https://www.dmforge.org` |
| `ENCRYPTION_KEY_PREVIOUS` | Key-rotation fallback | Only needed mid-rotation; remove once nothing needs it |
| `FIRESTORE_DATABASE_ID` | Named Firestore database | Defaults to `dmforge` if unset |

## Before telling anyone a channel/integration is "shippable"

Check the specific var(s) that gate it are set in **both**:
1. Vercel project settings (Production scope) — for anything the Next.js app reads
2. Google Secret Manager via `firebase functions:secrets:set` — for anything a
   Cloud Function reads (currently just `ENCRYPTION_KEY`/`ENCRYPTION_KEY_PREVIOUS`
   for `sendReminders()`)

A var set in Vercel does **not** automatically reach a Cloud Function, and vice
versa — they're two separate secret stores. This has been a real source of
"works on the frontend, 500s in the scheduled function" bugs here before.
