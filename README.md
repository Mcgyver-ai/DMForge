# DMForge

AI DM appointment setter SaaS for online coaches. Build, live-test, and deploy AI agents that handle Instagram/WhatsApp/Messenger DMs, qualify leads, and book sales calls automatically.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 18 |
| Backend | Next.js API Routes (serverless) |
| Database | Firebase Firestore (named database "dmforge") |
| Auth | Firebase Auth (email/password + Google OAuth) |
| LLM | Google Gemini 2.5 Flash |
| Payments | Stripe (subscriptions) |
| UI | Radix UI + shadcn/ui + Tailwind CSS |

## Local Development

### Prerequisites

- Node.js 18+
- Yarn (`npm i -g yarn`)
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

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore, set database ID to `dmforge`
   - Enable Authentication (email/password + Google)
   - Download the service account JSON → paste into `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local`
   - Copy the web app config into the `NEXT_PUBLIC_FIREBASE_*` vars

4. Start the development server:

```bash
yarn dev
```

Open http://localhost:3000

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

### Docker / Self-hosted

```bash
yarn build
# Standalone output is in .next/standalone
node .next/standalone/server.js
```

## Project Structure

```
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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/` | — | Health check |
| POST | `/api/agent/create` | optional | Create AI agent |
| POST | `/api/agent/chat` | — | Multi-turn chat |
| POST | `/api/result/save` | optional | Save transcript |
| GET | `/api/result/:id` | — | Get saved result |
| GET | `/api/me` | required | Current user info |
| GET | `/api/my/agents` | required | User's agents |
| GET | `/api/my/results` | required | User's transcripts |
| POST | `/api/billing/checkout` | required | Create Stripe checkout |
| POST | `/api/billing/portal` | required | Billing portal link |
| GET | `/api/billing/session` | — | Retrieve checkout session |
| GET | `/api/competitors` | — | List competitors |
| GET | `/api/plans` | — | List pricing plans |
| POST | `/api/agents/:id/sequences/generate` | owner-only if claimed | Generate Day 1/3/7 follow-up sequence |
| GET | `/api/agents/:id/sequences` | — | Get an agent's follow-up sequence |
| PUT | `/api/agents/:id/sequences/:seqId` | owner-only if claimed | Edit a sequence step |
| POST | `/api/webhooks` | required | Register an outbound webhook |
| GET | `/api/webhooks` | required | List your webhooks |
| DELETE | `/api/webhooks/:id` | required | Remove a webhook |

## Pricing

| Plan | Price | Interval |
|------|-------|----------|
| Free | $0 | forever |
| Pro | $39 | monthly |
| Pro Annual | $390 | yearly |
| Agency | $199 | monthly |

## Security

- All writes to Firestore go through the server-side Admin SDK
- Firebase Auth tokens verified server-side on protected routes
- Stripe webhook signatures verified with `STRIPE_WEBHOOK_SECRET`
- Input length limits enforced on all user-supplied fields
- Service account credentials loaded from environment variable (never committed)
- Per-uid (60/min) and per-IP (20/min) sliding-window rate limiting on the catch-all API route — see `lib/rateLimit.js`
- Outbound webhooks are HMAC-SHA256 signed (`X-DMForge-Signature` header) using a per-webhook secret
