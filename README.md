# DMForge

AI DM appointment setter SaaS for online coaches. Build, live-test, and deploy AI agents that handle Instagram DM, Facebook Messenger, and email outreach, qualify leads, and book sales calls automatically — with SMS appointment reminders.

## Tech Stack

| Layer      | Technology                                                             |
| ---------- | ---------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19                                      |
| Backend    | Next.js API Routes (serverless)                                        |
| Database   | Firebase Firestore (named database "dmforge")                          |
| Auth       | Firebase Auth (email/password + Google OAuth)                          |
| Server SDK | `firebase-admin` 13.x — **pinned, do not bump to 14** (see note below) |
| LLM        | Google Gemini 2.5 Flash                                                |
| Payments   | Stripe (subscriptions)                                                 |
| UI         | Radix UI + shadcn/ui + Tailwind CSS                                    |

> **Why `firebase-admin` is pinned to 13.x:** v14 pulls in `jwks-rsa@4` → `jose@6`, which is
> ESM-only. That breaks every API route with a 500 on Vercel's Node runtime, while build and CI
> both stay green — the failure only shows up at request time in production. Any bump past 13.x
> must be proven on a live preview deployment first, not just a passing build.

## Local Development

### Prerequisites

- Node.js 22 (matches CI in `.github/workflows/ci.yml`)
- Yarn 1.x (`npm i -g yarn`) — pinned via `packageManager` in `package.json`; never npm/pnpm
- Firebase project with Firestore enabled
- Google AI Studio account (for Gemini API key)
- Stripe account

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo>
cd DMForge
yarn install
```

1. Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

1. Set up Firebase:
   - Create a Firebase project at <https://console.firebase.google.com>
   - Enable Firestore, set database ID to `dmforge`
   - Enable Authentication (email/password + Google)
   - Download the service account JSON → paste into `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local`
   - Copy the web app config into the `NEXT_PUBLIC_FIREBASE_*` vars

2. Start the development server:

```bash
yarn dev
```

Open <http://localhost:3000>

> **`yarn dev` talks to whatever Firebase project `.env.local` points at.** If that is
> production, every API call, wizard run and Stripe webhook test writes real documents.
> Use the emulated mode below for anything that writes.

### Local dev against the Firebase emulators (safe for webhook tests)

Needs the Firebase CLI (`npm i -g firebase-tools`) and Java 11+. Ports: Firestore `8085`,
Auth `9099`, Emulator UI `4000` (see `emulators` in `firebase.json`).

```bash
# terminal 1: Auth + Firestore emulators, UI at http://127.0.0.1:4000
yarn emulators

# terminal 2: Next.js wired to the emulators
yarn dev:emulated

# terminal 3: forward Stripe test-mode events, then fire one
stripe listen --project-name dmforge \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed \
  --forward-to localhost:3000/api/stripe/webhook
stripe trigger --project-name dmforge checkout.session.completed
```

`dev:emulated` sets `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST` and
`NEXT_PUBLIC_FIREBASE_USE_EMULATORS=true`. With the emulator host set,
`lib/firebaseAdmin.js` never loads the service account, so nothing can reach production
Firestore. The named `dmforge` database is created on first write; the Emulator UI picks
the database from the URL, so open <http://127.0.0.1:4000/firestore/dmforge/data>. Emulator data is in-memory and resets on restart.
`STRIPE_WEBHOOK_SECRET` must be the `whsec_` that `stripe listen` prints.

### Running Tests

```bash
# Backend API tests (requires running server at localhost:3000)
python backend_test.py
```

## Deployment

### Environment Variables

See `.env.example` for all required variables. Key notes:

- **`FIREBASE_SERVICE_ACCOUNT_JSON`** — Paste the full service account JSON as a single-line string. Preferred over file path for cloud deployments.
- **`STRIPE_SECRET_KEY`** — Use `sk_test_...` for staging, `sk_live_...` for production.
- **`STRIPE_WEBHOOK_SECRET`** — Required in production. Get it from the Stripe dashboard → Webhooks → your endpoint.
- **`NEXT_PUBLIC_BASE_URL`** — Your public domain, used for Stripe redirect URLs.
- **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`** — Must match your deployed domain for Firebase Auth to work.
- **`ENCRYPTION_KEY`** — Any random string (32+ chars recommended); hashed to a 32-byte AES-256-GCM key for encrypting connected-channel credentials at rest (`lib/encryption.js`). Required for channel connections (email, SMS, Instagram, Messenger, GHL).
- **`GEMINI_BASE_URL`** — Optional. Overrides the Gemini host in `lib/llm.js`. Leave unset to call Google directly (`https://generativelanguage.googleapis.com`). Set it to a [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) instance (e.g. `http://127.0.0.1:8317`) to route all LLM calls through CLI-based auth instead of a paid `GEMINI_API_KEY` — the proxy serves the same `/v1beta/models/{model}:generateContent` shape, so no code changes are needed. When this is set, `GEMINI_API_KEY` is optional (the proxy carries its own auth).
- **`META_VERIFY_TOKEN` / `META_APP_SECRET`** — Optional, for Meta Webhook verification challenge and inbound HMAC-SHA256 signature verification. Set `META_VERIFY_TOKEN` to match the verify token configured in your Meta Developer App Webhooks (Instagram & Messenger). Individual user Page Access Tokens and Account IDs are encrypted per-user in Firestore.
- **`CRON_SECRET`** — New, optional but recommended. When set, the `/api/cron/send-reminders` endpoint requires `Authorization: Bearer <CRON_SECRET>` (Vercel attaches this automatically for scheduled cron invocations). Leave unset only for local testing — an unset secret leaves the cron endpoint open. **Twilio credentials are stored per-user (encrypted), not as env vars** — so `TWILIO_ACCOUNT_SID`/`AUTH_TOKEN`/`FROM_NUMBER` from the spec are not used; each user connects their own in Settings → Channels.
- **GoHighLevel webhooks** — no env var. `/api/integrations/ghl/webhook` requires a valid `X-GHL-Signature` (Ed25519 over the raw body, verified against GHL's published public key). GHL API keys/location IDs are stored per-user (encrypted), not as env vars.

### Stripe Webhook

Add a webhook in the Stripe dashboard pointing to `https://your-domain.com/api/stripe/webhook`.

Events to listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Vercel

```bash
# Build and deploy
vercel --prod
```

Set all `.env.example` variables in the Vercel project settings.

### Deploy target

This app targets Vercel serverless — `next.config.js` deliberately does **not** set
`output: 'standalone'` (that's a Docker/self-hosted build mode; Vercel builds its own output).
Self-hosting would require adding that config first.

## Project Structure

```js
app/
  page.js                    # Homepage (hero, wizard, simulator, pricing)
  dashboard/page.js          # User dashboard
  r/[id]/page.js             # Shareable result pages
  vs/[slug]/page.js          # Competitor comparison pages
  best/[slug]/page.js        # "Best of" landing pages
  api/[[...path]]/route.js   # All API endpoints
  api/stripe/webhook/        # Stripe webhook handler

lib/
  llm.js                     # Google Gemini wrapper
  stripe.js                  # Stripe client + plan management
  firebaseAdmin.js           # Firebase Admin SDK
  firebase.js                # Firebase client SDK
  auth-context.js            # React auth provider + authFetch
  competitors.js             # Competitor data (12 entries)
  blog.js                    # Seeded blog posts
  rateLimit.js               # In-memory sliding-window rate limiter
  webhooks.js                 # HMAC-signed outbound webhook delivery

components/
  auth-modal.jsx             # Firebase login/signup modal
  ui/                        # shadcn/ui components
```

## API Endpoints

| Method | Path                                 | Auth                    | Description                                                         |
| ------ | ------------------------------------ | ----------------------- | ------------------------------------------------------------------- |
| GET    | `/api/`                              | —                       | Health check                                                        |
| POST   | `/api/agent/create`                  | optional                | Create AI agent                                                     |
| POST   | `/api/agent/chat`                    | —                       | Multi-turn chat                                                     |
| POST   | `/api/result/save`                   | optional                | Save transcript                                                     |
| GET    | `/api/result/:id`                    | —                       | Get saved result                                                    |
| GET    | `/api/me`                            | required                | Current user info                                                   |
| GET    | `/api/my/agents`                     | required                | User's agents                                                       |
| GET    | `/api/my/results`                    | required                | User's transcripts                                                  |
| POST   | `/api/billing/checkout`              | required                | Create Stripe checkout                                              |
| POST   | `/api/billing/portal`                | required                | Billing portal link                                                 |
| GET    | `/api/billing/session`               | —                       | Retrieve checkout session                                           |
| GET    | `/api/competitors`                   | —                       | List competitors                                                    |
| GET    | `/api/plans`                         | —                       | List pricing plans                                                  |
| POST   | `/api/agents/:id/sequences/generate` | owner-only if claimed   | Generate Day 1/3/7 follow-up sequence                               |
| GET    | `/api/agents/:id/sequences`          | —                       | Get an agent's follow-up sequence                                   |
| PUT    | `/api/agents/:id/sequences/:seqId`   | owner-only if claimed   | Edit a sequence step                                                |
| POST   | `/api/webhooks`                      | required                | Register an outbound webhook                                        |
| GET    | `/api/webhooks`                      | required                | List your webhooks                                                  |
| DELETE | `/api/webhooks/:id`                  | required                | Remove a webhook                                                    |
| POST   | `/api/channels/email/connect`        | required                | Connect Gmail (SMTP+app password) or SMTP                           |
| DELETE | `/api/channels/email`                | required                | Disconnect email channel                                            |
| GET    | `/api/channels`                      | required                | List connected channels                                             |
| POST   | `/api/outreach/send`                 | required                | Send an email via the connected channel                             |
| POST   | `/api/channels/instagram/connect`    | required                | Connect Instagram Professional account (Page Token + IG Account ID) |
| DELETE | `/api/channels/instagram`            | required                | Disconnect Instagram channel                                        |
| POST   | `/api/channels/messenger/connect`    | required                | Connect Facebook Messenger (Page Token + Page ID)                   |
| DELETE | `/api/channels/messenger`            | required                | Disconnect Messenger channel                                        |
| POST   | `/api/outreach/instagram/send`       | required                | Send an outbound Instagram DM                                       |
| POST   | `/api/outreach/messenger/send`       | required                | Send an outbound Messenger message                                  |
| GET    | `/api/webhooks/meta`                 | —                       | Meta Webhook hub verification challenge                             |
| POST   | `/api/webhooks/meta`                 | optional sig            | Inbound Instagram & Messenger DM webhook handler                    |
| POST   | `/api/agency/invite`                 | required (owner)        | Invite a team member                                                |
| GET    | `/api/agency/accept`                 | required                | Accept an invite (`?token=`)                                        |
| POST   | `/api/agency/remove`                 | required (owner)        | Remove a member                                                     |
| GET    | `/api/agency`                        | required                | Agency + members for current user                                   |
| POST   | `/api/channels/sms/connect`          | required                | Connect Twilio (SID/token/from)                                     |
| DELETE | `/api/channels/sms`                  | required                | Disconnect SMS                                                      |
| POST   | `/api/reminders/schedule`            | required                | Schedule 24h + 1h reminder SMS                                      |
| GET    | `/api/cron/send-reminders`           | cron secret             | Fire overdue reminders (Vercel cron)                                |
| PUT    | `/api/agency/white-label`            | required (Agency owner) | Update white-label branding                                         |
| POST   | `/api/integrations/ghl/connect`      | required                | Connect GoHighLevel (API key + location)                            |
| DELETE | `/api/integrations/ghl`              | required                | Disconnect GoHighLevel                                              |
| GET    | `/api/integrations`                  | required                | List connected integrations                                         |
| POST   | `/api/integrations/ghl/sync`         | required                | Push contact + appointment to GHL                                   |
| POST   | `/api/integrations/ghl/webhook`      | signature               | Inbound GHL events (HMAC verified)                                  |

## Pricing

| Plan       | Price | Interval |
| ---------- | ----- | -------- |
| Free       | $0    | forever  |
| Pro        | $39   | monthly  |
| Pro Annual | $390  | yearly   |
| Agency     | $199  | monthly  |

## Security

- All writes to Firestore go through the server-side Admin SDK
- Firebase Auth tokens verified server-side on protected routes
- Stripe webhook signatures verified with `STRIPE_WEBHOOK_SECRET`
- Input length limits enforced on all user-supplied fields
- Service account credentials loaded from environment variable (never committed)
- Per-uid (60/min) and per-IP (20/min) sliding-window rate limiting on the catch-all API route — see `lib/rateLimit.js`
- Outbound webhooks are HMAC-SHA256 signed (`X-DMForge-Signature` header) using a per-webhook secret
