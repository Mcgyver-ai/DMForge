// Twilio REST send — a single Basic-auth form POST, so we skip the heavy
// `twilio` SDK (one endpoint doesn't justify the dependency).
// ponytail: fetch wrapper, not the SDK — add the SDK only if we need its
// retry/validation/webhook helpers later.
const BASE = 'https://api.twilio.com/2010-04-01/Accounts'

function basicAuth(sid, token) {
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

export async function testTwilio({ accountSid, authToken }) {
  if (!accountSid || !authToken) return { success: false, error: 'accountSid and authToken required' }
  try {
    const res = await fetch(`${BASE}/${accountSid}.json`, { headers: { Authorization: basicAuth(accountSid, authToken) } })
    if (!res.ok) return { success: false, error: `Twilio auth failed: ${res.status}` }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function sendSMS({ accountSid, authToken, from }, to, body) {
  const form = new URLSearchParams({ To: to, From: from, Body: body })
  const res = await fetch(`${BASE}/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: basicAuth(accountSid, authToken), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
