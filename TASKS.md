# DMForge Backlog

- ✅ Rate limiting — sliding-window limiter (`lib/rateLimit.js`) wired into `handleRoute` in the catch-all API route: 60 req/min per uid, 20 req/min per IP for unauthenticated requests, 429 `{ error: "rate_limit_exceeded" }` on breach.
- ✅ Zapier / webhook outbound — `users/{uid}/webhooks` CRUD (`POST`/`GET /api/webhooks`, `DELETE /api/webhooks/:id`) + `triggerWebhooks()` in `lib/webhooks.js`, fired (fire-and-forget, HMAC-SHA256 signed) from `/result/save` when `state.booked` is true.
- ✅ Follow-up sequence builder — "campaign" mapped to the existing `agents` collection (no separate campaign model exists). `agents/{id}/sequences` + Gemini-generated Day 1/3/7 sequence (`POST/GET /api/agents/:id/sequences[/generate]`, `PUT .../sequences/:seqId`), inline expandable panel + edit on the dashboard agent cards.
- ✅ Inbox view — BUILT (2026-07-06). `leads/{uid}/prospects/{id}` model with denormalized `latestReply`/`latestReplyAt`/`lastMessageAt`/`status` + a `messages` subcollection thread. Full CRUD (`POST/GET /api/prospects`, `GET/PUT/DELETE /api/prospects/:id`, `POST /api/prospects/:id/messages`) and a token-scoped public **reply-ingestion pipeline** (`POST /api/inbound/token` mints the URL, `POST /api/inbound/:token` matches-or-creates a prospect from any channel poller/Zapier/email parser). `/inbox` UI: status-filtered list, thread drawer, outbound logging, status transitions. A transition into `booked` now **auto-fires** the reminder + GHL-sync + webhook side effects (`lib/prospects.js onProspectBooked`) — closing the auto-trigger gap that tasks 8/10 flagged.
- ✅ Email outreach channel — `users/{uid}/channels/email` (Gmail-via-SMTP or generic SMTP), AES-256-GCM creds at rest (`lib/encryption.js`, needs `ENCRYPTION_KEY` — not yet set in Vercel), connection tested before saving, `/settings/channels` UI. `/api/outreach/send` dedups by content hash under `users/{uid}/sentMessages` (the spec's `leads/{uid}/prospects/{id}/sentMessages` path doesn't exist — no lead model — flagged, not faked). Gmail is SMTP+app-password, not 3-legged OAuth (no GMAIL_CLIENT_ID/SECRET registered).
- ✅ LinkedIn OAuth connect — 3-legged OAuth (`GET /api/auth/linkedin` → consent URL with encrypted-state-carried uid, `GET /api/auth/linkedin/callback` → token exchange + profile fetch, encrypted token in `users/{uid}/channels/linkedin`), `POST /api/outreach/linkedin/send`, Connect/Disconnect card on `/settings/channels`. Reuses `lib/encryption.js` + channel pattern. NEEDS `LINKEDIN_CLIENT_ID/SECRET/REDIRECT_URI` (returns 503 until set) — requires a registered LinkedIn app.
- ✅ Team / agency seats — `users/{uid}` gains `role`/`agencyId` (additive, no query breakage), `agencies/{ownerUid}` = `{ ownerUid, seats, memberUids[] }`. `POST /api/agency/invite` (Agency-plan gated, creates agency on first invite), `GET /api/agency/accept?token=` (transactional seat check), `POST /api/agency/remove`, `GET /api/agency`, Settings → Team page. Seat limit from Stripe `subscription.metadata.seats` (fallback 10). NOTE: invite link is returned/copied to clipboard — no system transactional email provider exists, so no email is auto-sent (flagged in code).
- ✅ SMS appointment reminders — `users/{uid}/channels/sms` (Twilio, encrypted), `lib/sms.js` (fetch wrapper, not the heavy SDK — one endpoint), `POST /api/reminders/schedule` enqueues 24h+1h reminders to `reminders/{uid}/pending` (skips past-due), `GET /api/cron/send-reminders` (Vercel cron `*/15`, `vercel.json`) fires overdue with a transactional double-send guard. SMS card on `/settings/channels`. FLAGGED: cron + optional `CRON_SECRET` are deployment changes; auto-firing on a "booked" transition needs a lead phone + `scheduledAt` the demo flow doesn't capture, so `/reminders/schedule` is the explicit primitive instead.
- ✅ White-label mode — `agencies/{id}.whiteLabel` = `{ brandName, primaryColor, logoUrl?, domain?, hideParentBranding }`, `PUT /api/agency/white-label` (Agency-plan owner only, hex-validated color), surfaced via `GET /api/agency`. Gated Settings → White Label page with live preview; dashboard applies `brandName` to `<title>`, `primaryColor` to `--brand-primary`, and `logoUrl` in the nav. Custom domain is documented as a manual CNAME→Vercel-alias step (not automated, per spec).
- ✅ GoHighLevel integration — `lib/ghl.js` (v1 REST wrapper: validate/getContact/createContact/createAppointment), `POST /api/integrations/ghl/connect` (encrypted key, plaintext locationId for webhook routing), `POST /api/integrations/ghl/sync` (push contact+appointment), `POST /api/integrations/ghl/webhook` (HMAC-verified via `GHL_WEBHOOK_SECRET`, routes to user by locationId), Settings → Integrations card. FLAGGED: inbound webhook persists events to `ghl_events` linked to the uid, but there's no DMForge "lead" doc to flip to booked (no lead model) — and the outbound auto-sync on "booked" needs lead contact fields the demo flow doesn't capture, so `/sync` is the explicit primitive.
- ✅ Cloudflare AI Gateway (2026-07-02) — gateway `dmforge` created (logs on, 100k retention); `lib/llm.js` now sends the API key via `x-goog-api-key` header (never the URL, so gateways don't log it) and `GEMINI_BASE_URL` in Vercel production points Gemini traffic through `gateway.ai.cloudflare.com/.../dmforge/google-ai-studio`. Unset the var to fall back to direct Google.
- ✅ Customer support email (2026-07-02) — `support@dmforge.org` live via Cloudflare Email Routing → forwards to the owner Gmail (destination already verified; rule "Customer support inbox"). Linked from the site footer Contact.
- ✅ Support chatbot (2026-07-02) — public `POST /api/support/chat` (fact-locked system prompt, global per-IP rate limit, 30-msg/1k-char caps, escalates to support@dmforge.org) + floating `components/support-chat.jsx` widget mounted site-wide in `app/layout.js`.

---

## Sprint summary (2026-07-01)

**9 of 10 built, 1 skipped (Task 4 inbox — no lead/reply model exists to read from).**

### Env vars to add in Vercel before features go live
- `ENCRYPTION_KEY` — **required** for email/LinkedIn/SMS/GHL credential encryption (any 32+ char string). Without it, every channel connect 500s.
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` / `LINKEDIN_REDIRECT_URI` — LinkedIn connect returns 503 until set.
- `CRON_SECRET` — recommended; secures the `/api/cron/send-reminders` endpoint (unset = open endpoint).
- `GHL_WEBHOOK_SECRET` — recommended; verifies inbound GHL webhooks.
- `GEMINI_BASE_URL` — optional; point at a CLIProxyAPI to run LLM calls without a paid `GEMINI_API_KEY`.

### Manual steps (external accounts — can't be done from code)
- **LinkedIn**: register an app at developer.linkedin.com, request `r_liteprofile`/`r_emailaddress`/`w_member_social`, set redirect to `https://www.dmforge.org/api/auth/linkedin/callback`.
- **Twilio / GHL**: per-user — each user connects their own credentials in-app (Settings → Channels / Integrations). No platform-level account needed.
- **White-label custom domain**: per agency — CNAME → `cname.vercel-dns.com`, then add the domain as a Vercel project alias.
- **Vercel cron**: `vercel.json` adds `*/15` cron for reminders — auto-registers on next deploy.

### `ponytail:` ceilings flagged for upgrade
- `lib/rateLimit.js` — in-memory store; swap to Redis/Upstash when multi-instance.
- `lib/llm.js` `repairLLMJson` — regex JSON repair; upgrade to a tolerant parser if it stops covering Gemini output.
- LLM `GEMINI_BASE_URL` — lets the function route through CLIProxyAPI instead of a paid key.
- `lib/sms.js` / `lib/ghl.js` / `lib/linkedin.js` — fetch wrappers, not full SDKs; add an SDK only if retry/validation helpers are needed. GHL is v1 (v2 = OAuth) and LinkedIn scopes are pre-OpenID-Connect — swap if an account is on the newer API.

### Cross-cutting model gap (the recurring "flagged, not faked" note)
This codebase has `agents` (ICP/offer config) + one-shot demo `results` — **no `leads`/`prospects` model and no inbound-reply ingestion.** Tasks 4 (inbox), and the *auto-trigger* halves of 8 (SMS-on-booked) and 10 (GHL sync-on-booked) all depend on that missing pipeline. Built the explicit primitives (`/reminders/schedule`, `/integrations/ghl/sync`) instead of faking lead data. A real `leads/{uid}/prospects` subsystem with reply tracking is the prerequisite to wire those auto-triggers and to ship the inbox.

### Verification done
- All changes compiled via `next build --webpack` (Turbopack is broken in this repo pre-existing — webpack used only to validate; the prerender failures are an unrelated missing Firebase API key at build time).
- Non-trivial logic (rate-limit window, HMAC signing, AES roundtrip, reminder offsets, GHL signature) covered by standalone assertion checks.
- 20 Playwright specs across 10 files parse and list. ~~Not yet run against production~~ → **run 2026-07-06: 20/20 pass against production** (see session log below).

---

## Session log (2026-07-05 → 2026-07-06) — key rotation, build repair, prod redeploy + outage fix

### Shipped (all commits on `main`, CI green, live in production)
- **Encryption key rotation** (`a099f89`) — `lib/encryption.js` writes `v1:`-prefixed ciphertext (legacy bare-base64 still decrypts; base64 can't contain `:` so the marker is unambiguous). New optional `ENCRYPTION_KEY_PREVIOUS` env var: decrypt falls back to it, so rotating `ENCRYPTION_KEY` no longer bricks stored channel credentials. Rotation procedure documented in the module header. Both vars added to `.env.example`.
- **Build repair** — the earlier bulk dep-bump had broken `yarn build` and CI three ways, all fixed: Tailwind restored to v3-lts 3.4.19 (repo configs are v3-shaped; `0f374b6`), stale `yarn.lock` synced, `lucide-react` `Linkedin` icon → `Link2` (brand icons removed upstream; `43f4fc7`), CI runner Node 20 → 22 (`610f647`).
- **Reminder cron moved to GitHub Actions** (`52b5b1b`) — Vercel Hobby rejects sub-daily crons and was **blocking every production deploy**. `vercel.json` keeps a daily backstop; `.github/workflows/cron-reminders.yml` now drives the 15-min cadence (sends `Bearer CRON_SECRET` when the repo secret is set).
- **Production API outage found & fixed during prod-verify** — deploying current `main` revealed `firebase-admin@14` (from the same bulk bump) 500s **every** API route on Vercel: the ESM default-export namespace loses `admin.apps` (TypeError), and its `jwks-rsa@4 → jose@6` chain can't `require()` (ESM-only). Fixed by migrating `lib/firebaseAdmin.js` to the modular API (`1b63aae`) and pinning `firebase-admin` **13.10.0** (`db927b7`). **Do not bump firebase-admin past 13.x without proving a live API route on a preview deploy** — this failure is invisible to `yarn build` and CI.
- **Firestore composite indexes** (`bef5030`) — `pending` (status+sendAt) and `integrations` (locationId+provider) collection-group indexes defined in `firestore.indexes.json` and **created + READY** on the `dmforge` database; the reminders cron and GHL webhook 500'd (`FAILED_PRECONDITION`) without them.

### Production state after this session
- Deployed current `main` via CLI (production had been stuck on a June 30 build). **Vercel Git auto-deploy is broken** since the 2026-06-30 history rewrite — no deploy fires on push. Manual `vercel deploy --prod` required until the repo is reconnected (dashboard → dm-forge → Settings → Git). ⚠ open item.
- Full e2e suite **20/20 green against production**, including the wizard build flow (live Gemini call — the 2026-06-29 "prepayment credits depleted" 429 is resolved). Note: the anonymous per-IP rate caps throttle the suite when run in parallel from one IP; re-run stragglers with `--workers=1`.
- `ENCRYPTION_KEY` is set and working in prod (channel-connect specs pass) — the sprint-note above saying it's "not yet set in Vercel" is stale.
- Deploying `main` **removed the pre-rewrite sprint's campaigns/leads/analytics dashboard** that the June 30 build still served (that code only existed in the rewritten-away history). Intentional: the `leads-model` agent owns rebuilding this properly on a real lead/reply pipeline.
- Test artifacts cleaned: all 3 anonymous "TestBot" agents (2026-06-29/30 + this session's) deleted from Firestore.

### Still open
- Reconnect Vercel Git integration (manual deploys until then).
- LinkedIn app registration + `LINKEDIN_*` env vars (unchanged from sprint notes).
- `CRON_SECRET` / `GHL_WEBHOOK_SECRET` still recommended-but-unset; `CRON_SECRET` now also needs adding as a **GitHub repo secret** for the Actions cron once set in Vercel.

---

## Session log (2026-07-06) — closing open items 1–4

Worked the four open items from the previous session. Two were fully closeable in
code; two are gated on external dashboards/accounts and are now prepared + documented.

### 1. Vercel auto-deploy restored (code-side) — `.github/workflows/deploy.yml`
- The native Git integration has been dead since the 2026-06-30 history rewrite. Added
  a GitHub Actions workflow that deploys production on every push to `main` via the
  Vercel CLI (`vercel pull → build → deploy --prebuilt --prod`). Self-skips (yellow
  warning, not red) until the three secrets are set, so it never blocks CI.
- **Manual step remaining (you):** add repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
  `VERCEL_PROJECT_ID` (org/project IDs are in `.vercel/project.json` after `vercel link`).
  Alternatively still fixable via dashboard → dm-forge → Settings → Git (either restores
  auto-deploy; the workflow needs no dashboard access).

### 2. LinkedIn — **blocked on external account, cannot be done from code**
- The connect flow is already fully built; it only lacks a registered app. Documented the
  exact setup (scopes, redirect URI) in `.env.example`. **Manual step (you):** register the
  app at developer.linkedin.com, then set `LINKEDIN_CLIENT_ID/SECRET/REDIRECT_URI` in Vercel.
  Nothing further to build.

### 3. Cron / webhook secrets — generated + documented, **setting them is manual**
- Added `CRON_SECRET` + `GHL_WEBHOOK_SECRET` to `.env.example` with usage notes. Strong
  values were generated for you this session (see the PR / chat — not committed).
  **Manual step (you):** set both in Vercel env; also add `CRON_SECRET` as a GitHub repo
  secret so `cron-reminders.yml` authenticates.

### 4. Leads / prospects model + inbox — **BUILT** (the keystone)
- `lib/prospects.js` — `PROSPECT_STATUSES`/`CHANNELS`, normalizers, and `onProspectBooked()`
  (fire-and-forget webhooks + SMS reminders + GHL sync, each independently guarded).
- Catch-all route — full prospect CRUD, `messages` subcollection logging, and the
  token-scoped inbound-reply ingestion endpoints. A `→ booked` transition fires the side
  effects via `after()`, finally wiring the auto-trigger halves of tasks 8 (SMS-on-booked)
  and 10 (GHL-sync-on-booked) that were flagged unbuildable without a lead model.
- `app/inbox/page.js` + dashboard nav link — status-filtered inbox, thread drawer with
  outbound logging, status pills, call-time picker, and a copy-able ingestion URL.
- Model: `leads/{uid}/prospects/{id}` (mirrors `reminders/{uid}/pending`). Queries are all
  single-parent equality/no-orderBy, so **no new Firestore composite index is required**.
- ponytail: the public `/api/inbound/:token` endpoint is still under the anonymous 20/req/min
  per-IP cap (token isn't treated as auth by the rate limiter); raise/exempt it if a
  high-volume channel poller starts hitting it.

### Verification
- `yarn build` green (the new `/inbox` route prerenders; API route compiles).

---

## Session log (2026-07-12) — Vercel AI Gateway added (alternate provider)

- `lib/aiGateway.js` — thin wrapper around Vercel AI Gateway (`generateText`/
  `streamText` from the `ai@7` package). Uses `createGateway` (re-exported from
  `ai`) to wrap model-ID strings into provider objects; lazy-init singleton so
  a missing key throws at runtime rather than at build time. Not wired into the
  main chat/chatJSON pipeline — `lib/llm.js` + Gemini (via Cloudflare AI
  Gateway) stays the default for `app/api/[[...path]]`. Available for future
  features/experiments wanting multi-provider routing or non-Gemini models.
- `AI_GATEWAY_API_KEY` documented in `.env.example` (server-only secret, read
  at request time — build succeeds without it, same as GEMINI_API_KEY).
- ponytail: default model is `openai/gpt-5.4`, overridable via
  `AI_GATEWAY_MODEL`. No fallback/routing config yet — add
  `providerOptions.gateway.models` for automatic failover if this becomes
  the primary path for something.

### Verification
- `yarn build` green on Vercel (the deploy run that shipped the auth-modal logo
  fix in this same session compiled 68/68 pages). Local build requires
  `NEXT_PUBLIC_*` Firebase vars readable at build time — `.env.local` is UTF-16
  LE (Windows Notepad default), which Next.js's dotenv parser can't read; local
  builds pass when `.next` cache exists (prerender skipped) but fail from cold
  start. Fix: recreate `.env.local` as UTF-8.
- Manual end-to-end check with the real `AI_GATEWAY_API_KEY` confirmed the
  gateway is reachable and the key authenticates against
  `https://ai-gateway.vercel.sh/v4/ai/language-model`. Returned
  `customer_verification_required` (403) — not a code error; Vercel requires a
  credit card on file to unlock AI Gateway free credits. Add a card at
  vercel.com/~/ai → the gateway will then serve requests.
