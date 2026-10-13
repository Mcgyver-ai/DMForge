import crypto from 'crypto'
import {
  ValidationError,
  UnauthorizedError,
} from '@/lib/errors'
import { webhookCreateSchema, validate } from '@/lib/schemas'
import { isPublicHttpsUrl } from '@/lib/webhookAuth'

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
 * Registers an outbound webhook for an authenticated user.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {any} params.FieldValue
 * @param {object} params.user
 * @param {unknown} params.body
 * @returns {Promise<{ id: string, url: string, events: string[], active: boolean, secret: string }>}
 */
export async function createWebhook({ db, FieldValue, user, body }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { url, events } = validate(webhookCreateSchema, body)

  if (!isPublicHttpsUrl(url)) {
    throw new ValidationError('valid public https url required')
  }

  const id = crypto.randomUUID()
  const secret = crypto.randomBytes(32).toString('hex')
  const webhook = {
    id,
    url: truncate(url, 500),
    events: events.slice(0, 20),
    secret,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  }

  await db
    .collection('users')
    .doc(user.uid)
    .collection('webhooks')
    .doc(id)
    .set(webhook)

  return {
    id,
    url: webhook.url,
    events: webhook.events,
    active: true,
    secret,
  }
}

/**
 * Lists registered webhooks for an authenticated user, stripping sensitive secrets.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {object} params.user
 * @param {Function} [params.ser]
 * @returns {Promise<{ webhooks: object[] }>}
 */
export async function listWebhooks({ db, user, ser = defaultSer }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')

  const qs = await db
    .collection('users')
    .doc(user.uid)
    .collection('webhooks')
    .get()

  const webhooks = qs.docs.map((d) => {
    const w = ser(d)
    delete w.secret
    return w
  })

  return { webhooks }
}

/**
 * Deletes a registered webhook for an authenticated user.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {object} params.user
 * @param {string} params.webhookId
 * @returns {Promise<{ ok: boolean }>}
 */
export async function deleteWebhook({ db, user, webhookId }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  if (!webhookId || typeof webhookId !== 'string') {
    throw new ValidationError('webhook id required')
  }

  await db
    .collection('users')
    .doc(user.uid)
    .collection('webhooks')
    .doc(webhookId)
    .delete()

  return { ok: true }
}

