import crypto from 'crypto'
import { testTwilio, sendSMS } from '@/lib/sms'
import { encrypt, decrypt } from '@/lib/encryption'
import { logError } from '@/lib/logger'
import { getBaseUrl } from '@/lib/baseUrl'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import {
  smsConnectSchema,
  reminderScheduleSchema,
  validate,
} from '@/lib/schemas'

export const E164_ERROR = 'to must be E.164, e.g. +447700900123'

/**
 * Returns the number in E.164 form (spaces stripped) or null. Twilio reports
 * STOP senders in E.164 and smsSuppressed is keyed by that, so a reminder
 * stored in any other format would never match an opt-out. No country-code
 * guessing: a number we can't prove is E.164 is rejected.
 */
export function normalizeE164(raw) {
  const compact = String(raw ?? '').replace(/\s+/g, '')
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null
}

function truncate(str, max) {
  if (typeof str !== 'string') return str
  return str.slice(0, max)
}

/**
 * Saves and verifies encrypted Twilio SMS credentials for a user.
 */
export async function connectSMSChannel({
  db,
  FieldValue,
  user,
  body,
  testTwilioFn = testTwilio,
  encryptFn = encrypt,
}) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { accountSid, authToken, from } = validate(smsConnectSchema, body)

  const result = await testTwilioFn({ accountSid, authToken })
  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to authenticate with Twilio')
  }

  await db
    .collection('users')
    .doc(user.uid)
    .collection('channels')
    .doc('sms')
    .set({
      provider: 'twilio',
      connected: true,
      email: truncate(from, 40),
      encryptedCreds: encryptFn(
        JSON.stringify({ accountSid, authToken, from })
      ),
      updatedAt: FieldValue.serverTimestamp(),
    })

  return { success: true }
}

/**
 * Disconnects the SMS channel for a user.
 */
export async function disconnectSMSChannel({ db, user }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  await db
    .collection('users')
    .doc(user.uid)
    .collection('channels')
    .doc('sms')
    .delete()
  return { ok: true }
}

/**
 * Enqueues 24h and 1h reminders prior to appointment scheduledAt.
 */
export async function scheduleReminders({ db, FieldValue, user, body }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { to: rawTo, scheduledAt, leadName } = validate(reminderScheduleSchema, body)
  const to = normalizeE164(rawTo)
  if (!to) throw new ValidationError(E164_ERROR)
  const when = Date.parse(scheduledAt)

  const pendingRef = db
    .collection('reminders')
    .doc(user.uid)
    .collection('pending')
  const name = truncate(String(leadName || 'there'), 80)
  const offsets = [
    { ms: 24 * 3600_000, label: '24h' },
    { ms: 1 * 3600_000, label: '1h' },
  ]
  const scheduled = []
  const writes = []

  for (const o of offsets) {
    const sendAt = when - o.ms
    if (sendAt <= Date.now()) continue // skip past reminders
    const id = crypto.randomUUID()
    writes.push(
      pendingRef.doc(id).set({
        id,
        uid: user.uid,
        to,
        body: `Hi ${name}, reminder: your call is in ${o.label}.`,
        sendAt: new Date(sendAt),
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      })
    )
    scheduled.push({
      id,
      label: o.label,
      sendAt: new Date(sendAt).toISOString(),
    })
  }

  await Promise.all(writes)
  return { scheduled }
}

/**
 * Fires overdue appointment reminders (called by Vercel/GitHub cron).
 */
export async function sendDueReminders({
  db,
  FieldValue,
  cronSecret = process.env.CRON_SECRET,
  authHeader = '',
  isProduction = process.env.NODE_ENV === 'production',
  decryptFn = decrypt,
  sendSMSFn = sendSMS,
}) {
  if (!cronSecret && isProduction) {
    throw new UnauthorizedError('unauthorized')
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw new UnauthorizedError('unauthorized')
  }

  const now = new Date()
  const due = await db
    .collectionGroup('pending')
    .where('status', '==', 'pending')
    .where('sendAt', '<=', now)
    .limit(100)
    .get()

  let sent = 0
  let failed = 0

  for (const doc of due.docs) {
    const r = doc.data()
    // Double-send guard transaction
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref)
      if (!fresh.exists || fresh.data().status !== 'pending') return false
      tx.update(doc.ref, {
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
      })
      return true
    })
    if (!claimed) continue

    try {
      // Reminders queued before E.164 validation may hold numbers no opt-out
      // can match; never send to those.
      const to = normalizeE164(r.to)
      if (!to) {
        failed++
        await doc.ref.update({ status: 'failed', error: 'invalid number' })
        continue
      }
      const suppressed = await db
        .collection('users')
        .doc(r.uid)
        .collection('smsSuppressed')
        .doc(to)
        .get()
      if (suppressed.exists) {
        await doc.ref.update({
          status: 'skipped',
          error: 'recipient opted out',
        })
        continue
      }
      const chSnap = await db
        .collection('users')
        .doc(r.uid)
        .collection('channels')
        .doc('sms')
        .get()
      if (!chSnap.exists || !chSnap.data().connected) {
        throw new Error('sms channel not connected')
      }
      const creds = JSON.parse(decryptFn(chSnap.data().encryptedCreds))
      await sendSMSFn(creds, to, r.body)
      sent++
    } catch (e) {
      failed++
      logError('SMS reminder delivery failed', e, { to: r.to, uid: r.uid })
      await doc.ref.update({ status: 'failed', error: e.message })
    }
  }

  return { processed: due.size, sent, failed }
}

/**
 * Handles inbound Twilio SMS messages (STOP / START / HELP).
 */
export async function handleTwilioInbound({
  db,
  FieldValue,
  uid,
  params,
  signature,
  requestUrl,
  decryptFn = decrypt,
}) {
  if (!uid) throw new NotFoundError('uid required')
  const chSnap = await db
    .collection('users')
    .doc(uid)
    .collection('channels')
    .doc('sms')
    .get()

  if (!chSnap.exists) throw new NotFoundError('sms channel not found')
  const { authToken } = JSON.parse(decryptFn(chSnap.data().encryptedCreds))

  const expectedUrl = requestUrl || `${getBaseUrl()}/api/webhooks/twilio?uid=${uid}`
  const signedString = Object.keys(params)
    .sort()
    .reduce((s, k) => s + k + params[k], expectedUrl)
  const expected = crypto
    .createHmac('sha1', authToken)
    .update(signedString, 'utf8')
    .digest('base64')

  const sigBuf = Buffer.from(signature || '')
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new ForbiddenError('invalid twilio signature')
  }

  const body = String(params.Body || '').trim().toUpperCase()
  const from = String(params.From || '')
  let reply = ''

  if (
    ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(body) &&
    from
  ) {
    await db
      .collection('users')
      .doc(uid)
      .collection('smsSuppressed')
      .doc(from)
      .set({ suppressedAt: FieldValue.serverTimestamp() })
    reply =
      'You have been unsubscribed and will not receive further messages. Reply START to resubscribe.'
  } else if (body === 'START' && from) {
    await db
      .collection('users')
      .doc(uid)
      .collection('smsSuppressed')
      .doc(from)
      .delete()
    reply = 'You have been resubscribed to messages.'
  } else if (body === 'HELP') {
    reply =
      'For help, contact the number that texted you. Reply STOP to opt out.'
  }

  const twiml = reply
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

  return twiml
}

