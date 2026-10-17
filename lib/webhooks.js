import crypto from 'crypto'
import { logError } from '@/lib/logger'
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
    logError('triggerWebhooks: failed to load webhooks', err, { uid })
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
      // The URL was vetted as public at registration; a redirect could point
      // anywhere (e.g. cloud metadata), so a 3xx is a failed delivery.
      redirect: 'manual',
    })
      .then((res) => {
        if (res.status >= 300 && res.status < 400) {
          logError(`webhook delivery failed for ${url}`, new Error(`refused ${res.status} redirect`))
        }
      })
      .catch((err) => logError(`webhook delivery failed for ${url}`, err))
      .finally(() => clearTimeout(timer))
  }))
}


