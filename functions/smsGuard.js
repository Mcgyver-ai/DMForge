'use strict'
// Opt-out guard for sendReminders. Mirrors normalizeE164 in
// lib/services/reminderService.js — the functions package can't import lib/.

// Twilio reports STOP senders in E.164 and smsSuppressed is keyed by that, so a
// number in any other format could never match an opt-out. No country-code guessing.
function normalizeE164(raw) {
  const compact = String(raw ?? '').replace(/\s+/g, '')
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null
}

// Returns the number to send to, or the status update that stops the send.
async function checkRecipient(db, uid, rawTo) {
  const to = normalizeE164(rawTo)
  if (!to) return { to: null, stop: { status: 'failed', error: 'invalid number' } }
  const suppressed = await db
    .collection('users').doc(uid)
    .collection('smsSuppressed').doc(to)
    .get()
  if (suppressed.exists) return { to, stop: { status: 'skipped', error: 'recipient opted out' } }
  return { to, stop: null }
}

module.exports = { normalizeE164, checkRecipient }
