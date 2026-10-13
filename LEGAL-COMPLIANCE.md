# DMForge — Legal & Regulatory Compliance Architecture

**This is not legal advice.** It is research grounded in primary regulator sources and this codebase, updated following the multi-framework compliance audit. Last verified: October 2026.

## Business Snapshot

DMForge is operated by **Tibor Rames** trading as DMForge, a **UK-based sole trader** (per `app/legal/terms` and `app/legal/privacy`). The primary legal framework is UK law: UK GDPR, Data Protection Act 2018, Privacy and Electronic Communications Regulations (PECR), Consumer Protection from Unfair Trading Regulations 2008 (CPUT), and the Data (Use and Access) Act 2025.

- **Supervisory Authority:** Information Commissioner's Office (ICO), Tier 1 micro organisation.
- **Address for Service of Documents:** Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom.
- **Live Channels:** Meta Graph API v21.0 (`instagram`, `messenger`), `email` (SMTP cold outreach), and `sms` (Twilio appointment reminders). LinkedIn integration was retired to eliminate unofficial scraping risk and false states.

---

## Multi-Framework Remediation Summary (Audit Rounds 1–3)

### Round 1 & 2: Platform Hygiene & Content Realignment
- Gated analytics behind an affirmative cookie consent banner (`components/cookie-consent.jsx`) satisfying UK PECR reg. 6.
- Added signed unsubscribe links to outbound emails (CAN-SPAM / PECR reg. 22).
- Added opt-out STOP handling for SMS reminders (CTIA Messaging Principles; TCPA 47 U.S.C. §227).
- Removed legacy competitor and channel misrepresentations across seeded blogs and marketing pages.

### Round 3: Comprehensive Multi-Framework Controls (Current Pass)
1. **UK GDPR & Data (Use and Access) Act 2025 Readiness:**
   - **Trader Identity & Address:** Disclosed true legal name (**Tibor Rames**) and service address in Privacy Policy and Terms of Service, satisfying the Ecommerce Regulations 2002 and Solo Maker profile requirements.
   - **Data Protection Complaints Procedure:** Created `/legal/complaints` and updated `/legal/privacy` committing to a statutory 30-day written acknowledgement guarantee, formal investigation steps, and clear escalation pathways to the ICO.
   - **DSAR & Right to Erasure:** Implemented authenticated self-service account erasure endpoint (`DELETE /api/account` and `POST /api/account/delete`) cascading deletion of Firebase Auth credentials, Firestore user data, agents, prospects, webhooks, and active Stripe subscriptions with immutable audit logging.
2. **Meta Platform Terms & Tech Provider Verification:**
   - **Data Deletion Callback URL:** Implemented `POST /api/webhooks/meta/data-deletion` (and `/api/meta/data-deletion`) supporting Meta's `signed_request` protocol. Validates HMAC-SHA256 signatures via `parseMetaSignedRequest()` in `lib/webhookAuth.js` using `META_APP_SECRET`.
   - **Deletion Instructions & Status Tracking:** Created `/legal/data-deletion` satisfying Meta App Review requirements for user instructions and confirmation status verification.
   - **Meta Graph API Compliance:** Documented 24-hour messaging window boundaries and AES-256-GCM token encryption in Privacy Policy.
3. **PCI-DSS SAQ A & Stripe Billing:**
   - Fully attested SAQ A eligibility in `SECURITY.md` — Cardholder Data Environment (CDE) is completely out-of-scope; all card data is hosted on Stripe Checkout and Customer Portal.
   - Enforced sanitization on `STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY` with `.trim().replace(/^["']|["']$/g, '')`.
4. **SOC 2 Type I/II Baseline Security Controls:**
   - **HSTS Hardening:** Enabled `Strict-Transport-Security: max-age=31536000; includeSubDomains` in `next.config.js`.
   - **Security Headers:** Added `X-XSS-Protection: 0` and whitelisted Stripe in `Permissions-Policy`.
   - **Audit Logging:** Created `lib/auditLog.js` recording security and compliance events (`account.deleted`, `meta.data_deletion`) in Firestore `audit_logs`.

---

## Key Regulatory Boundaries

### 1. UK GDPR / DPA 2018 / DUA Act 2025
- Prospect PII is stored in Firestore with infrastructure-level encryption at rest; OAuth tokens and API secrets are encrypted at the application layer with AES-256-GCM (`lib/encryption.js`).
- Subject access and erasure requests are supported via both the authenticated API (`/api/account`) and email requests acknowledged within 30 days.

### 2. Meta Graph API v21.0
- Webhook subscriptions verify challenges via `hub.verify_token` and validate inbound event signatures using `X-Hub-Signature-256`.
- Data deletion callbacks return JSON payloads pointing to `/legal/data-deletion?id=<confirmation_code>`.

### 3. Stripe & Financial Compliance
- HMRC records are retained for at least 5 years following the relevant 31 January Self Assessment deadline.
- Stripe events maintain idempotency via atomic document creation in `processed_stripe_events`.
