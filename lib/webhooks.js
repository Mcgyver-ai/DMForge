import crypto from 'crypto'
import { getAdminDb } from '@/lib/firebaseAdmin'

const TIMEOUT_MS = 5000

function sign(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

// Call from a request handler via `after(() => triggerWebhooks(...))` so the
// serverless function stays alive until every delivery settles.
export async function triggerWebhooks(uid, event, payload) {
  if (!uid) return
  let snap
  try {
    snap = await getAdminDb()
      .collection('users').doc(uid).collection('webhooks')
      .where('active', '==', true)
      .where('events', 'array-contains', event)
      .get()
  } catch (err) {
    console.error('triggerWebhooks: failed to load webhooks for', uid, err.message)
    return
  }
  if (snap.empty) return

  const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() })
  await Promise.allSettled(snap.docs.map((doc) => {
    const { url, secret } = doc.data()
    const signature = sign(secret, body)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-DMForge-Signature': signature },
      body,
      signal: controller.signal,
    })
      .catch((err) => console.error(`webhook delivery failed for ${url}:`, err.message))
      .finally(() => clearTimeout(timer))
  }))
}
