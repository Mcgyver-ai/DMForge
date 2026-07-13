// Resend transactional email — a single Bearer-auth JSON POST, so we skip the
// `resend` SDK (one endpoint doesn't justify the dependency, same call as
// lib/sms.js makes for Twilio).
const RESEND_API = 'https://api.resend.com/emails'

// Fail-soft, env-gated: no RESEND_API_KEY/MAIL_FROM configured = no-op with a
// console.warn instead of throwing, so callers that treat mail as
// fire-and-forget never break because of a missing key.
export async function sendMail({ to, subject, text, html }) {
  const { RESEND_API_KEY, MAIL_FROM } = process.env
  if (!RESEND_API_KEY || !MAIL_FROM) {
    console.warn('lib/mail: RESEND_API_KEY or MAIL_FROM not set — skipping email send')
    return
  }
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, text, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
