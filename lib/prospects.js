import { v4 as uuidv4 } from 'uuid'
import { decrypt } from '@/lib/encryption'
import { triggerWebhooks } from '@/lib/webhooks'
import { sendSMS } from '@/lib/sms'
import { ghlGetContact, ghlCreateContact, ghlCreateAppointment } from '@/lib/ghl'

// Lifecycle a prospect moves through. `latestReply`/`latestReplyAt` are
// denormalized onto the prospect doc so the inbox list can render without
// reading each thread's messages subcollection.
export const PROSPECT_STATUSES = ['new', 'contacted', 'replied', 'qualified', 'booked', 'lost']
export const PROSPECT_CHANNELS = ['instagram', 'linkedin', 'email', 'sms', 'manual']

export function normalizeStatus(s, fallback = 'new') {
  return PROSPECT_STATUSES.includes(s) ? s : fallback
}
export function normalizeChannel(c, fallback = 'manual') {
  return PROSPECT_CHANNELS.includes(c) ? c : fallback
}

// Fired (fire-and-forget, via `after()`) the first time a prospect enters the
// "booked" state. This is the auto-trigger half that the demo `results` flow
// could never wire, because it had no lead record carrying a phone / email /
// scheduledAt. Each side effect is independently guarded so one failure never
// blocks the others, and none of them ever throws out of here.
export async function onProspectBooked({ db, FieldValue, uid, prospect }) {
  if (!uid || !prospect) return

  // 1. Outbound webhooks (Zapier etc.) — same event the demo flow emitted.
  try {
    await triggerWebhooks(uid, 'appointment.booked', {
      prospectId: prospect.id,
      name: prospect.name || null,
      channel: prospect.channel || null,
      scheduledAt: prospect.scheduledAt || null,
    })
  } catch (e) { console.error('[prospect.booked] webhook failed:', e.message) }

  // 2. SMS appointment reminders — needs a phone, a future scheduledAt, and a
  // connected Twilio channel. Enqueues into reminders/{uid}/pending, which the
  // existing send-reminders cron drains.
  try {
    const when = prospect.scheduledAt ? Date.parse(prospect.scheduledAt) : NaN
    if (prospect.phone && Number.isFinite(when)) {
      const chSnap = await db.collection('users').doc(uid).collection('channels').doc('sms').get()
      if (chSnap.exists && chSnap.data().connected) {
        const pendingRef = db.collection('reminders').doc(uid).collection('pending')
        const name = String(prospect.name || 'there').slice(0, 80)
        for (const o of [{ ms: 24 * 3600_000, label: '24h' }, { ms: 3600_000, label: '1h' }]) {
          const sendAt = when - o.ms
          if (sendAt <= Date.now()) continue // skip reminders already in the past
          const id = uuidv4()
          await pendingRef.doc(id).set({
            id, uid, to: String(prospect.phone).slice(0, 40),
            body: `Hi ${name}, reminder: your call is in ${o.label}.`,
            sendAt: new Date(sendAt), status: 'pending',
            prospectId: prospect.id, createdAt: FieldValue.serverTimestamp(),
          })
        }
      }
    }
  } catch (e) { console.error('[prospect.booked] reminders failed:', e.message) }

  // 3. GoHighLevel sync — upsert the contact and (if a calendar + time exist)
  // create the appointment.
  try {
    if (prospect.email || prospect.phone) {
      const snap = await db.collection('users').doc(uid).collection('integrations').doc('ghl').get()
      if (snap.exists && snap.data().connected) {
        const creds = JSON.parse(decrypt(snap.data().encryptedCreds))
        let contact = await ghlGetContact(creds, { email: prospect.email, phone: prospect.phone })
        if (!contact) {
          contact = await ghlCreateContact(creds, {
            email: prospect.email, phone: prospect.phone,
            firstName: String(prospect.name || '').slice(0, 100),
          })
        }
        const contactId = contact?.id || contact?.contact?.id
        if (contactId && prospect.ghlCalendarId && prospect.scheduledAt) {
          await ghlCreateAppointment(creds, {
            contactId, calendarId: prospect.ghlCalendarId, startTime: prospect.scheduledAt,
          })
        }
      }
    }
  } catch (e) { console.error('[prospect.booked] GHL sync failed:', e.message) }
}
