# DMForge Backlog

- ✅ Rate limiting — sliding-window limiter (`lib/rateLimit.js`) wired into `handleRoute` in the catch-all API route: 60 req/min per uid, 20 req/min per IP for unauthenticated requests, 429 `{ error: "rate_limit_exceeded" }` on breach.
- ✅ Zapier / webhook outbound — `users/{uid}/webhooks` CRUD (`POST`/`GET /api/webhooks`, `DELETE /api/webhooks/:id`) + `triggerWebhooks()` in `lib/webhooks.js`, fired (fire-and-forget, HMAC-SHA256 signed) from `/result/save` when `state.booked` is true.
- ✅ Follow-up sequence builder — "campaign" mapped to the existing `agents` collection (no separate campaign model exists). `agents/{id}/sequences` + Gemini-generated Day 1/3/7 sequence (`POST/GET /api/agents/:id/sequences[/generate]`, `PUT .../sequences/:seqId`), inline expandable panel + edit on the dashboard agent cards.
- ⛔ Inbox view — SKIPPED. Spec needs `leads/{uid}/prospects` with `latestReply`/`latestReplyAt` (ongoing reply tracking). Nothing in this codebase ingests inbound replies — `results` are one-shot saved transcripts from the demo simulator, not a live conversation thread. Building an inbox here means designing the missing reply-ingestion pipeline first; flagged per user decision rather than faked.
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
- 20 Playwright specs across 10 files parse and list. **Not yet run against production** — the new endpoints need a deploy first (smoke suite targets `https://www.dmforge.org`).
