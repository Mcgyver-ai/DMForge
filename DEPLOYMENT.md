# DMForge Deployment Runbook

This document describes how DMForge is deployed, how the scheduler works, how to manage secrets, and how to recover from failures.

**Last updated:** July 15, 2026  
**Contact:** tiborcc2@gmail.com  
**Project:** DMForge (DM appointment-setter SaaS)

---

## 1. Architecture Overview

### Frontend

- **Platform:** Vercel (serverless Next.js 16 App Router)
- **Build:** `yarn build` with Turbopack
- **Deploy trigger:** Git push to `main` branch (via Vercel GitHub integration)
- **Environment:** Production (`dmforge.org`), Staging (manual via Vercel dashboard)

### Backend

- **Firebase Firestore:** Named database `dmforge` (not default)
- **Firebase Cloud Functions v2:** Scheduled functions + webhook handlers
- **Firebase Auth:** Email/password + Google OAuth (client-side)
- **Firebase Admin SDK:** Server-side access via service account

### Scheduler (SMS Reminders)

- **Primary:** Firebase Cloud Scheduler triggers `sendReminders()` function every 15 minutes (UTC), Google-managed
- **Previous:** Vercel cron at `/api/cron/send-reminders` (NOW DISABLED as of July 15, 2026)
- **Why:** Firebase is more reliable (Google infrastructure), requires no external token, integrates with Secret Manager

### Secrets Management

- **Vercel:** Environment variables (dashboarded via `vercel.json` and `.env.local`)
- **Firebase:** Google Secret Manager for sensitive values passed to Cloud Functions (`ENCRYPTION_KEY`, `ENCRYPTION_KEY_PREVIOUS`)
- **GitHub:** Repository secrets for workflow CI/CD access (e.g., Vercel deploy token)

---

## 2. Deployment Checklist (Before Shipping)

### Pre-Deploy Verification (Automated by CI/CD)

```bash
# Run locally before pushing:
yarn build                    # Compile with Turbopack; must not fail
yarn test:e2e BASE_URL=http://localhost:3000  # Run tests against local (staging preferred)
git status                    # No uncommitted changes
git log -1 --format="%B"      # Verify last commit message follows Conventional Commits
```

### Manual Gate (Code Review)

- [ ] PR approved by another team member
- [ ] No critical security findings (Sentry, dependency scan)
- [ ] Database migrations tested (if applicable)
- [ ] Feature flags configured (if gated launch)
- [ ] Rollback plan documented (if high-risk)

### Pre-Merge Checks

- [ ] All CI/CD checks pass (GitHub Actions workflow)
- [ ] No breaking API changes without client updates
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Firebase secrets stored in Google Secret Manager (if adding new functions)
- [ ] `.env.example` updated with new env var documentation

### Deploy-Time Monitoring

- [ ] Deployment logs show "Build successful"
- [ ] No errors in Sentry during first 5 minutes post-deploy
- [ ] `/api` health check responds (curl `https://www.dmforge.org/api`)
- [ ] Stripe webhook endpoint reachable (test via Stripe dashboard)
- [ ] User can sign up / sign in without errors

---

## 3. Scheduler Runbook

### How Reminders Are Sent

1. **User books a call** → API stores appointment in `leads/{uid}/prospects/{id}`
2. **onProspectBooked hook fires** → calls `/api/reminders/schedule`, which enqueues two reminders:
   - 24 hours before call: `Hi [name], reminder: your call is in 24h.`
   - 1 hour before call: `Hi [name], reminder: your call is in 1h.`
3. **Firebase Cloud Scheduler** (every 15 min, UTC):
   - Queries `reminders/{uid}/pending` where `status='pending'` and `sendAt <= now`
   - Claims each reminder via Firestore transaction (atomic, prevents double-send)
   - Decrypts user's Twilio credentials from `users/{uid}/channels/sms`
   - Fires SMS via Twilio
   - Updates `status` → `'sent'` or `'failed'` + error message

### Manual Trigger (Testing)

```bash
# View the last 30 function executions
firebase functions:log --only sendReminders --lines 30

# Expected output if nothing is due:
# sendReminders: nothing due

# Expected output if reminders were sent:
# sendReminders: processed=2 sent=2 failed=0
```

### Verifying Pending Reminders

```bash
# Connect to Firestore via the CLI or console:
firebase firestore:list-documents reminders --database=dmforge
# or check the Firebase Console → Firestore → reminders collection
```

### Debugging Failed Reminders

1. **Check Firestore logs:**
   ```bash
   firebase functions:log --only sendReminders --lines 50 | grep -i error
   ```

2. **Common failures:**
   - `sms channel not connected` — user hasn't set up Twilio credentials
   - `Twilio 401` — Twilio creds are invalid/expired
   - Transaction failed — concurrent update conflict (retried automatically)

3. **Manual retry:**
   - Update the reminder doc in Firestore: change `status` from `'failed'` back to `'pending'`
   - Function will pick it up on the next 15-minute execution
   - Or trigger manually: `firebase functions:call sendReminders --region us-central1`

### Disabling / Re-enabling

```bash
# Disable (if critical bug):
firebase deploy --only functions --except sendReminders

# Re-enable:
firebase deploy --only functions

# Verify it's active:
firebase functions:describe sendReminders --region us-central1
# Look for state: "ACTIVE"
```

---

## 4. Secrets Management

### Vercel Environment Variables (Frontend + Next.js API Routes)

Set via **Vercel Dashboard → Settings → Environment Variables**. They're auto-deployed with each new build.

**Required for local dev:**

Create `.env.local` in the repo root with these values copied from Vercel:

```bash
GEMINI_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dmforge-1df2e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
ENCRYPTION_KEY=<random 32+ char string>
ENCRYPTION_KEY_PREVIOUS=<old key if rotating>
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

Never commit `.env.local` — it's in `.gitignore`.

### Firebase Secret Manager (Cloud Functions)

Firebase Cloud Functions receive secrets via `defineSecret()` from `firebase-functions/params`. These are stored in **Google Cloud Console → Security → Secret Manager**, not visible in code.

**Current secrets:**

- `ENCRYPTION_KEY` — Same value as Vercel's `ENCRYPTION_KEY` (used by `sendReminders()`)
- `ENCRYPTION_KEY_PREVIOUS` — Optional; fallback key during rotation

**To set a secret:**

```bash
firebase functions:secrets:set ENCRYPTION_KEY
# Paste the value when prompted
```

**To rotate `ENCRYPTION_KEY`:**

1. Generate a new key: `openssl rand -base64 32`
2. Set it as `ENCRYPTION_KEY_PREVIOUS` in Firebase Secret Manager (old value)
3. Update `ENCRYPTION_KEY` in Firebase Secret Manager to the new value
4. Update `ENCRYPTION_KEY` in Vercel (same value)
5. Deploy: `firebase deploy --only functions`
6. Once all credentials are re-encrypted with the new key, remove `ENCRYPTION_KEY_PREVIOUS`

---

## 5. Deployment Workflow

### Typical Flow

1. **Local development:**
   ```bash
   yarn dev                    # Start dev server (port 3000)
   yarn test:e2e BASE_URL=http://localhost:3000  # Test locally
   ```

2. **Push to branch:**
   ```bash
   git add .
   git commit -m "feat: add SMS reminder scheduling"  # Conventional Commits
   git push origin my-feature-branch
   ```

3. **GitHub Actions** (automatic):
   - Runs pre-deploy verification (build, tests, linting)
   - Creates a PR with automatic checks
   - Blocks merge if any check fails

4. **Code review:**
   - Team member reviews changes
   - Approves or requests changes

5. **Merge to main:**
   ```bash
   # Merge via GitHub UI or:
   git merge my-feature-branch
   git push origin main
   ```

6. **Vercel auto-deploys:**
   - Builds and deploys to production (`dmforge.org`)
   - Vercel sends status to GitHub (green checkmark if successful)

7. **Post-deploy:**
   ```bash
   # Monitor for errors (5 min)
   # Check Sentry dashboard
   # Verify /api health check
   # Run a smoke test: sign up, create agent, test chat
   ```

### High-Risk Deployments (Database Migrations, Auth Changes)

1. Deploy to **staging first:**
   ```bash
   # Via Vercel dashboard: create/preview deployment, test thoroughly
   ```

2. Document **rollback plan:**
   - What can be reverted instantly?
   - What requires data migration?
   - Who has permission to roll back?

3. **Notify on-call:** Slack/email team before shipping

4. Deploy to **production** with team watching

---

## 6. Rollback Procedures

### Frontend Rollback (Vercel)

**Instant rollback (revert to previous build):**

```bash
# Via Vercel Dashboard → Deployments → Previous deployment → "Make Production"
# OR via CLI:
vercel rollback --prod
```

**Full Git rollback (if code needs to be reverted):**

```bash
git revert HEAD                   # Create a new commit that undoes the last one
git push origin main              # Trigger a new Vercel deployment
```

### Backend Rollback (Firebase Functions)

```bash
# Deploy previous version from git history
git checkout <previous-commit> -- functions/
firebase deploy --only functions

# OR re-deploy current main
firebase deploy --only functions
```

### Database Rollback (Firestore)

**If data was corrupted:**

1. **Check if backup exists:**
   - Firebase Console → Firestore → Backups (manual backups only; auto backups not available in free tier)
   
2. **Restore from backup:**
   - Firebase Console → Backups → Select backup → "Restore"

3. **Prevent future corruption:**
   - Add Firestore rules validation
   - Use transactions for multi-document changes
   - Test migrations in staging first

---

## 7. Troubleshooting

### "Build failed: Cannot find module 'X'"

**Cause:** Missing dependency or install issue

**Fix:**

```bash
yarn install       # Reinstall all dependencies
yarn build         # Try build again
```

### "Firestore: Error (auth/invalid-api-key)"

**Cause:** `NEXT_PUBLIC_FIREBASE_API_KEY` not set in `.env.local` during local build

**Fix:**

```bash
# Copy from Vercel dashboard → Settings → Environment Variables
# Add to .env.local:
NEXT_PUBLIC_FIREBASE_API_KEY=AIz...
```

### "SMS reminders aren't sending"

**Diagnosis:**

1. Check if function is running:
   ```bash
   firebase functions:log --only sendReminders
   ```

2. Check if reminders are pending:
   - Firebase Console → Firestore → reminders/{uid}/pending
   - Look for docs with `status: 'pending'` and `sendAt <= now`

3. Check if SMS channel is connected:
   - Firebase Console → users/{uid}/channels/sms
   - Confirm `connected: true` and `encryptedCreds` exists

4. Check Twilio credentials:
   ```bash
   # Decrypt and test manually via Twilio API
   curl -X POST https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json \
     -u "{accountSid}:{authToken}" \
     -d "To={phone}&From={from}&Body=Test"
   ```

### "Deployment hangs or times out"

**Cause:** Large dependency install or slow build

**Fix:**

```bash
# Check yarn cache:
yarn cache clean
yarn install

# Use Vercel's large-files analyzer:
vercel build --verbose
```

---

## 8. Monitoring & Alerts

### Key Metrics to Watch

- **Build time:** Should be <3 min. If >5 min, profile with `--verbose`
- **Error rate:** Check Sentry → Issues. Should be <0.1% of requests
- **Function latency:** Firebase Console → Functions → sendReminders → Metrics
- **Firestore reads/writes:** Firebase Console → Billing. Watch for runaway queries
- **Stripe webhook failures:** Stripe Dashboard → Webhooks → Event Log

### Automated Alerts (Setup)

**Sentry:**
- Threshold: Alert on 5+ errors in 5 minutes
- Destination: Slack #alerts

**Firebase:**
- Console → Settings → Notifications → Alert policy
- Alert on high daily costs or high error rates

---

## 9. Security Checklist

- [ ] Never commit secrets to Git (use `.env.local`, `.env.example` only)
- [ ] Rotate `ENCRYPTION_KEY` yearly
- [ ] Review IAM permissions: only necessary admins have Vercel/Firebase console access
- [ ] Enable 2FA on Vercel and Google Cloud accounts
- [ ] Use API keys with minimum required scopes (Gemini, Stripe, LinkedIn)
- [ ] Test webhook signature verification works (GHL, Stripe)
- [ ] Rate limits active on unauthenticated endpoints (`/api/agent/chat`, `/api/support/chat`)
- [ ] CORS origin allow-list configured (`CORS_ORIGINS` env var)

---

## 10. Contacts & Escalation

| Issue | Contact | Urgency |
|-------|---------|---------|
| Site down (404 / 500 errors) | tiborcc2@gmail.com | P0 (immediate) |
| SMS reminders not sending | Check Firebase logs first, then escalate | P1 (1 hour) |
| Stripe webhook failures | Stripe dashboard → Webhooks, then escalate | P1 (1 hour) |
| Memory/cost spikes | Check Firestore queries, consider indexing | P2 (4 hours) |
| Dependency security alerts | Review PR, merge if tests pass | P3 (next week) |

---

## 11. Appendix: Commands Reference

```bash
# ─── Build & Deploy ──────────────────────────────────────────────────
yarn build                              # Local production build
yarn test:e2e                           # E2E tests (defaults to production)
yarn test:e2e BASE_URL=http://localhost:3000  # E2E tests on local

# ─── Firebase ─────────────────────────────────────────────────────────
firebase login                          # Authenticate with Google
firebase use dmforge-1df2e              # Select Firebase project
firebase deploy --only functions        # Deploy Cloud Functions
firebase deploy --only firestore:indexes # Deploy Firestore indexes
firebase deploy --only firestore:rules  # Deploy Firestore security rules
firebase functions:log --only sendReminders --lines 50  # View function logs
firebase functions:describe sendReminders --region us-central1  # Function details
firebase functions:secrets:set ENCRYPTION_KEY  # Store a secret
firebase functions:secrets:destroy ENCRYPTION_KEY  # Delete a secret

# ─── Vercel ──────────────────────────────────────────────────────────
vercel login                            # Authenticate with Vercel
vercel                                  # Deploy to preview
vercel --prod                           # Deploy to production
vercel rollback --prod                  # Rollback to previous production build
vercel env ls                           # List environment variables

# ─── Git ──────────────────────────────────────────────────────────────
git log --oneline -10                   # Recent commits
git show HEAD                           # Last commit details
git revert HEAD                         # Undo last commit (safe for shared branches)
git reset --hard HEAD~1                 # Undo last commit (destructive, local only)
```

---

**Document version:** 1.0 (July 15, 2026)  
**Next review:** October 15, 2026
