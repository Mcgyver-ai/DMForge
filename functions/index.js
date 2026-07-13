'use strict'
// DMForge Firebase Cloud Functions
// Scheduled function: drain the reminders/{uid}/pending subcollection every 15 minutes.
// This mirrors the logic in app/api/[[...path]]/route.js (/cron/send-reminders) but
// runs in Google Cloud Scheduler instead of Vercel cron, so it doesn't need a
// CRON_SECRET — Google calls it directly over internal infrastructure.

const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp, getApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const crypto = require('crypto')

initializeApp()

// ENCRYPTION_KEY must be stored in Google Secret Manager:
//   firebase functions:secrets:set ENCRYPTION_KEY
// If you use key rotation, also set:
//   firebase functions:secrets:set ENCRYPTION_KEY_PREVIOUS
const ENCRYPTION_KEY = defineSecret('ENCRYPTION_KEY')
const ENCRYPTION_KEY_PREVIOUS = defineSecret('ENCRYPTION_KEY_PREVIOUS')

// ── Inline decrypt (mirrors lib/encryption.js) ────────────────────────────────
// Kept inline so the functions package has no dependency on the Next.js lib tree.
const VERSION_PREFIX = 'v1:'

function deriveKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest()
}

function unpackAndDecrypt(buf, key) {
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

function decrypt(payload, currentKey, previousKey = null) {
  const b64 = payload.startsWith(VERSION_PREFIX) ? payload.slice(VERSION_PREFIX.length) : payload
  const buf = Buffer.from(b64, 'base64')
  try {
    return unpackAndDecrypt(buf, currentKey)
  } catch (err) {
    if (!previousKey) throw err
    return unpackAndDecrypt(buf, previousKey)
  }
}

// ── Inline sendSMS (mirrors lib/sms.js) ──────────────────────────────────────
const TWILIO_BASE = 'https://api.twilio.com/2010-04-01/Accounts'

async function sendSMS({ accountSid, authToken, from }, to, body) {
  const form = new URLSearchParams({ To: to, From: from, Body: body })
  const res = await fetch(`${TWILIO_BASE}/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// ── Scheduled function ────────────────────────────────────────────────────────
// Runs every 15 minutes. Queries the collectionGroup index that already exists
// in firestore.indexes.json (status + sendAt on the "pending" collection group).
exports.sendReminders = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'UTC',
  secrets: [ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS],
  timeoutSeconds: 300,
  memory: '256MiB',
  // Uses the named "dmforge" database — not the default Firestore instance.
  region: 'us-central1',
}, async () => {
  const db = getFirestore(getApp(), 'dmforge')

  const encKey = deriveKey(ENCRYPTION_KEY.value())
  const prevKeyRaw = ENCRYPTION_KEY_PREVIOUS.value()
  const prevKey = prevKeyRaw ? deriveKey(prevKeyRaw) : null

  const now = new Date()
  let due
  try {
    due = await db
      .collectionGroup('pending')
      .where('status', '==', 'pending')
      .where('sendAt', '<=', now)
      .limit(100)
      .get()
  } catch (err) {
    console.error('sendReminders: failed to query pending reminders:', err.message)
    return
  }

  if (due.empty) {
    console.log('sendReminders: nothing due')
    return
  }

  let sent = 0
  let failed = 0

  for (const doc of due.docs) {
    const r = doc.data()

    // Claim the reminder atomically before firing — prevents double-send
    // if the function runs concurrently (e.g. a manual trigger overlaps the cron).
    let claimed = false
    try {
      claimed = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref)
        if (!fresh.exists || fresh.data().status !== 'pending') return false
        tx.update(doc.ref, { status: 'sent', sentAt: FieldValue.serverTimestamp() })
        return true
      })
    } catch (err) {
      console.error(`sendReminders: transaction failed for ${doc.ref.path}:`, err.message)
      continue
    }
    if (!claimed) continue

    try {
      const chSnap = await db
        .collection('users').doc(r.uid)
        .collection('channels').doc('sms')
        .get()
      if (!chSnap.exists || !chSnap.data().connected) throw new Error('sms channel not connected')
      const creds = JSON.parse(decrypt(chSnap.data().encryptedCreds, encKey, prevKey))
      await sendSMS(creds, r.to, r.body)
      sent++
    } catch (err) {
      failed++
      console.error(`sendReminders: failed to send to ${r.to}:`, err.message)
      await doc.ref.update({ status: 'failed', error: err.message })
    }
  }

  console.log(`sendReminders: processed=${due.size} sent=${sent} failed=${failed}`)
})
