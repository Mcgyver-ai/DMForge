# Inbound Webhook & Inbound Token Rate Limiting Task List

## Specification & Background
- **Context:** In `app/api/[[...path]]/route.js`, `handleRoute` runs `checkRateLimit(request, decoded?.uid)` on all requests. Because external webhooks (Meta Graph API, Twilio SMS, GoHighLevel) and external inbound reply pollers (`/api/inbound/:token`) lack Firebase session auth (`decoded == null`), they are restricted by the 20 req/min per-IP anonymous rate limiter.
- **Problem:** Legitimate high-volume DM events from Meta, SMS opt-out batches from Twilio, or polling scripts for inbound tokens get dropped with 429 `rate_limit_exceeded`.
- **Target:** Isolate inbound endpoints into dedicated rate-limit buckets with appropriate operational ceilings.

---

### [x] Task 1: Implement `checkInboundRateLimit` in `lib/rateLimit.js`
- Export `checkInboundRateLimit(request, { route, path })`.
- Rate limits:
  - Meta Webhook (`/webhooks/meta`): 300 req/min.
  - Inbound Token (`/inbound/:token`): 120 req/min keyed by `inbound:token:${token}`.
  - Twilio Webhook (`/webhooks/twilio`): 120 req/min.
  - GoHighLevel Webhook (`/integrations/ghl/webhook`): 120 req/min.
  - Meta Data Deletion (`/meta/data-deletion`): 60 req/min.
- Returns `{ isHandled: true, allowed: boolean }` if the route matches an inbound endpoint, or `{ isHandled: false }` otherwise.

### [x] Task 2: Unit Tests in `lib/__tests__/rateLimit.test.js`
- Add unit tests for `checkInboundRateLimit`:
  - Verify `/api/inbound/:token` allows up to 120 requests per minute and blocks the 121st.
  - Verify independent tokens do not share rate limit buckets.
  - Verify Meta webhook allows up to 300 requests per minute.
  - Verify non-inbound routes return `isHandled: false`.

### [x] Task 3: Wire `checkInboundRateLimit` into `app/api/[[...path]]/route.js`
- In `handleRoute`, check `checkInboundRateLimit(request, { route, path })` before the general anonymous check.
- If handled and allowed is false, return 429 `rate_limit_exceeded`.
- If not handled, fall through to `checkRateLimit(request, decoded?.uid)`.

### [x] Task 4: EvidenceQA Verification & Integration
- Run Vitest suite: `yarn --ignore-engines test` (must pass 100%).
- Run production build: `yarn --ignore-engines build` (exit code 0).
- Update task checklist to validated.
