# DMForge — Security & Compliance Architecture

**Operator:** Tibor Rames (trading as DMForge, UK Sole Trader)  
**Registered Address:** Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom  
**Supervisory Authority:** Information Commissioner's Office (ICO), Tier 1 micro organisation  

---

## 1. Vulnerability Reporting

If you identify a security vulnerability in DMForge, disclose it responsibly. Do not open public issues.

Email **support@dmforge.org** (or **contact@dmforge.org**) with:
- Vulnerability description and impact assessment
- Reproduction steps and proof-of-concept
- Relevant request/response logs

We acknowledge security disclosures within 48 hours and coordinate remediation before public disclosure.

---

## 2. Multi-Framework Technical Controls Matrix

| Domain | Control ID | Implementation | Verification |
|---|---|---|---|
| **PCI-DSS SAQ A** | Req 2, 6, 8, 12 | Cardholder Data Environment (CDE) fully outsourced to Stripe Checkout & Customer Portal. Zero cardholder data (PAN/CVV) touches DMForge servers. | Automated via Stripe SDK; webhook HMAC verified via `STRIPE_WEBHOOK_SECRET`. |
| **SOC 2: Security** | CC6.1, CC6.6 | All protected API routes verify Firebase Auth Bearer tokens (`verifyRequest`). Strictest origin allow-list in CORS. AES-256-GCM encryption for stored channel tokens (`lib/encryption.js`). | Unit tests in `lib/__tests__`; automated token validation. |
| **SOC 2: Network** | CC6.6, CC6.7 | HTTP Strict Transport Security (`max-age=31536000; includeSubDomains`), CSP with strict script/connect sources, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. | Enforced in `next.config.js`. |
| **SOC 2: Availability** | CC7.1, CC7.2 | Sliding-window rate limiting via Upstash Redis (`lib/rateLimit.js`) with fail-closed daily spend limiter for anonymous LLM traffic. | Unit tests in `lib/__tests__/rateLimit.test.js`. |
| **SOC 2: Audit Logging** | CC7.2, CC7.3 | Structured immutable audit logging for security events (account deletions, Meta data erasures, billing modifications) via `recordAuditEvent()` (`lib/auditLog.js`). | Firestore `audit_logs` collection. |
| **Meta Platform Terms** | Tech Provider v21.0 | HMAC-SHA256 signature verification on inbound webhooks (`X-Hub-Signature-256`), signed request parsing for Meta Data Deletion callback (`POST /api/webhooks/meta/data-deletion`), public status tracker. | `lib/webhookAuth.js` and `app/api/[[...path]]/route.js`. |
| **UK GDPR / DUA Act 2025** | Art. 17, 32 / DUA § | Self-service DSAR erasure endpoint (`DELETE /api/account`), formal complaints procedure with statutory 30-day acknowledgement guarantee (`app/legal/complaints`). | Enforced in API and legal documentation. |

---

## 3. PCI-DSS SAQ A Scope

DMForge qualifies for **PCI-DSS Self-Assessment Questionnaire A (SAQ A)**:
1. All payment transactions are handled exclusively through Stripe Checkout and the Stripe Customer Portal.
2. No cardholder data is received, stored, processed, or transmitted on DMForge infrastructure.
3. Stripe JavaScript elements are restricted to `https://js.stripe.com` via Content Security Policy.
4. Server webhook endpoints verify raw payload HMAC signatures before processing subscription state updates.

---

## 4. Cryptographic Storage & Secrets

- **Channel Tokens:** Third-party OAuth tokens (Meta Page Access Tokens, SMTP passwords, Twilio Auth Tokens) are encrypted using AES-256-GCM before writing to Firestore.
- **Secret Sanitization:** All environment secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `META_APP_SECRET`, `ENCRYPTION_KEY`) have leading/trailing whitespace and enclosing quotes stripped prior to use.
- **SSRF Defenses:** Webhook delivery URLs are vetted by `isPublicHttpsUrl()` against RFC 1918 private subnets, loopback interfaces, link-local metadata addresses (169.254.169.254), and internal domain suffixes.
