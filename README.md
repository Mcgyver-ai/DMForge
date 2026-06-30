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
- **`ENCRYPTION_KEY`** — New. Any random string (32+ chars recommended); hashed to a 32-byte AES-256-GCM key for encrypting connected-channel credentials at rest (`lib/encryption.js`). Required before the email channel (or any future channel using the same helper) can connect. **Not yet set in Vercel — add it before this ships.**
- **`GEMINI_BASE_URL`** — Optional. Overrides the Gemini host in `lib/llm.js`. Leave unset to call Google directly (`https://generativelanguage.googleapis.com`). Set it to a [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) instance (e.g. `http://127.0.0.1:8317`) to route all LLM calls through CLI-based auth instead of a paid `GEMINI_API_KEY` — the proxy serves the same `/v1beta/models/{model}:generateContent` shape, so no code changes are needed. When this is set, `GEMINI_API_KEY` is optional (the proxy carries its own auth).
- **`LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` / `LINKEDIN_REDIRECT_URI`** — New, for the LinkedIn outreach channel. Create a LinkedIn app at developer.linkedin.com, add the `r_liteprofile`, `r_emailaddress`, `w_member_social` scopes, and set the redirect URI to `https://www.dmforge.org/api/auth/linkedin/callback`. **Not yet set — LinkedIn connect returns 503 until these exist.** State signing reuses `ENCRYPTION_KEY`.

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
| POST | `/api/channels/email/connect` | required | Connect Gmail (SMTP+app password) or SMTP |
| DELETE | `/api/channels/email` | required | Disconnect email channel |
| GET | `/api/channels` | required | List connected channels |
| POST | `/api/outreach/send` | required | Send an email via the connected channel |
| GET | `/api/auth/linkedin` | required | Get LinkedIn OAuth consent URL |
| GET | `/api/auth/linkedin/callback` | — | OAuth callback (browser redirect) |
| POST | `/api/outreach/linkedin/send` | required | Send a LinkedIn message |
| DELETE | `/api/channels/linkedin` | required | Disconnect LinkedIn |
| POST | `/api/agency/invite` | required (owner) | Invite a team member |
| GET | `/api/agency/accept` | required | Accept an invite (`?token=`) |
| POST | `/api/agency/remove` | required (owner) | Remove a member |
| GET | `/api/agency` | required | Agency + members for current user |

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
