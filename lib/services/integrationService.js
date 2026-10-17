import { verifyGhlSignature } from '@/lib/webhookAuth'
import {
  ghlValidate,
  ghlGetContact,
  ghlCreateContact,
  ghlCreateAppointment,
} from '@/lib/ghl'
import { encrypt, decrypt } from '@/lib/encryption'
import { logError } from '@/lib/logger'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadGatewayError,
} from '@/lib/errors'
import {
  ghlConnectSchema,
  ghlSyncSchema,
  validate,
} from '@/lib/schemas'

function truncate(str, max) {
  if (typeof str !== 'string') return str
  return str.slice(0, max)
}

function defaultSer(doc) {
  if (!doc) return null
  const data = doc.data ? doc.data() : doc
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toDate === 'function') out[k] = v.toDate().toISOString()
    else out[k] = v
  }
  return out
}

/**
 * Connects GoHighLevel integration for a user.
 */
export async function connectGHL({
  db,
  FieldValue,
  user,
  body,
  ghlValidateFn = ghlValidate,
  encryptFn = encrypt,
}) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { apiKey, locationId } = validate(ghlConnectSchema, body)

  const result = await ghlValidateFn({ apiKey })
  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to validate GHL API key')
  }

  await db
    .collection('users')
    .doc(user.uid)
    .collection('integrations')
    .doc('ghl')
    .set({
      provider: 'ghl',
      connected: true,
      locationId: truncate(String(locationId), 100),
      encryptedCreds: encryptFn(JSON.stringify({ apiKey, locationId })),
      updatedAt: FieldValue.serverTimestamp(),
    })

  return { success: true }
}

/**
 * Disconnects GoHighLevel integration for a user.
 */
export async function disconnectGHL({ db, user }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  await db
    .collection('users')
    .doc(user.uid)
    .collection('integrations')
    .doc('ghl')
    .delete()
  return { ok: true }
}

/**
 * Lists connected integrations for an authenticated user without exposing secrets.
 */
export async function listIntegrations({ db, user, ser = defaultSer }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const qs = await db
    .collection('users')
    .doc(user.uid)
    .collection('integrations')
    .get()

  const integrations = qs.docs.map((d) => {
    const c = ser(d)
    delete c.encryptedCreds
    return { id: d.id, ...c }
  })

  return { integrations }
}

/**
 * Synchronizes lead contact details and appointment into GoHighLevel.
 */
export async function syncGHL({
  db,
  user,
  body,
  decryptFn = decrypt,
  ghlGetContactFn = ghlGetContact,
  ghlCreateContactFn = ghlCreateContact,
  ghlCreateAppointmentFn = ghlCreateAppointment,
}) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { email, phone, firstName, calendarId, startTime } = validate(ghlSyncSchema, body)

  const snap = await db
    .collection('users')
    .doc(user.uid)
    .collection('integrations')
    .doc('ghl')
    .get()

  if (!snap.exists || !snap.data().connected) {
    throw new ValidationError('GHL not connected')
  }

  const creds = JSON.parse(decryptFn(snap.data().encryptedCreds))
  try {
    let contact = await ghlGetContactFn(creds, { email, phone })
    if (!contact) {
      contact = await ghlCreateContactFn(creds, {
        email,
        phone,
        firstName: truncate(String(firstName || ''), 100),
      })
    }
    const contactId = contact?.id || contact?.contact?.id
    let appointment = null
    if (calendarId && startTime && contactId) {
      appointment = await ghlCreateAppointmentFn(creds, {
        contactId,
        calendarId,
        startTime,
      })
    }
    return { ok: true, contactId, appointment }
  } catch (e) {
    logError('GHL sync contact/appointment failed', e)
    throw new BadGatewayError('GoHighLevel synchronization failed')
  }
}

/**
 * Ingests inbound GoHighLevel webhook notifications.
 */
export async function handleGHLWebhook({
  db,
  FieldValue,
  rawBody,
  signature,
  publicKeyPem,
}) {
  if (!verifyGhlSignature(rawBody, signature, publicKeyPem)) {
    throw new UnauthorizedError('invalid signature')
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch (err) {
    logError('GHL webhook invalid JSON payload', err)
    throw new ValidationError('invalid JSON')
  }

  const locationId = payload.locationId || payload.location_id
  let uid = null
  if (locationId) {
    const owner = await db
      .collectionGroup('integrations')
      .where('provider', '==', 'ghl')
      .where('locationId', '==', String(locationId))
      .limit(1)
      .get()
    uid = owner.docs[0]?.ref.parent.parent?.id || null
  }

  await db.collection('ghl_events').add({
    uid,
    locationId: locationId || null,
    type: payload.type || payload.event || 'unknown',
    payload,
    receivedAt: FieldValue.serverTimestamp(),
  })

  return { received: true, uid }
}

