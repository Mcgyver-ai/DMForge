# Testing Protocol

ALL agents MUST follow these rules. Do NOT edit this section.

1. Read this whole file BEFORE invoking any sub-testing agent.
2. Backend testing uses `deep_testing_backend_nextjs`. Frontend testing uses `deep_testing_frontend_nextjs` ONLY with explicit user permission.
3. Append new findings under each agent's section. Never delete prior findings.
4. Main agent must never fix issues already fixed by a testing sub-agent.

---

## Project: DMForge — AI DM setter builder + Stripe-enabled SaaS

### Stack
- Next.js 15 App Router + MongoDB + Stripe (test mode)
- LLM: Google Gemini API directly (`gemini-2.5-flash`)

### API endpoints (all working)
- LLM: `POST /api/agent/create`, `POST /api/agent/chat`, `POST /api/result/save`, `GET /api/result/:id`
- Billing: `POST /api/billing/checkout` (auto-creates product/price), `POST /api/billing/portal`, `GET /api/billing/session?session_id=…`, `POST /api/stripe/webhook`
- Misc: `GET /api/me?email=…`, `GET /api/plans`, `GET /api/competitors`

### Pages
- `/` — homepage with hero + wizard + chat simulator + features + vs-table + pricing (Stripe-wired) + faq
- `/r/[id]` — branded shareable result page
- `/vs/[slug]` — 12 competitor pages with FAQPage JSON-LD
- `/billing/success?session_id=…` — Stripe redirect target
- `/sitemap.xml`, `/robots.txt`

### Stripe wiring (TEST MODE)
- Real Checkout sessions confirmed against user's Stripe test account
- Products/prices auto-created on first checkout call, cached in `billing_meta` collection
- Webhook accepts payload with dev fallback when `STRIPE_WEBHOOK_SECRET` is empty; signs when set
- Webhook URL to register: `${NEXT_PUBLIC_BASE_URL}/api/stripe/webhook`

### Phase 2 NOT yet built
- Auth (currently email-prompt at checkout); Google OAuth + magic link pending
- Dashboard with saved agents/history per user
- 12+ seeded blog posts (pillar + cluster), `/blog`, `/blog/[slug]`
- Programmatic long-tail landing pages (`/best-ai-dm-setter`, `/[category]-tool`, etc.)
- Per-page dynamic OG image generation
- Permanent production deployment

## Backend sub-agent log
(empty)

## Frontend sub-agent log
(empty — requires explicit user permission)
