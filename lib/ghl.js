// GoHighLevel REST wrapper (v1 — API key as Bearer).
// ponytail: thin fetch wrapper over the three calls we actually use. The v1 API
// is being superseded by v2 (services.leadconnectorhq.com + OAuth) — swap BASE
// and auth if/when an agency is on the newer API. Needs a real GHL key to test.
const BASE = 'https://rest.gohighlevel.com/v1'

function headers(apiKey) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
}

export async function ghlValidate({ apiKey }) {
  try {
    const res = await fetch(`${BASE}/contacts/?limit=1`, { headers: headers(apiKey) })
    if (res.status === 401 || res.status === 403) return { success: false, error: 'invalid GHL API key' }
    if (!res.ok) return { success: false, error: `GHL ${res.status}` }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function ghlGetContact({ apiKey }, { phone, email }) {
  const q = new URLSearchParams()
  if (email) q.set('email', email)
  if (phone) q.set('phone', phone)
  const res = await fetch(`${BASE}/contacts/lookup?${q.toString()}`, { headers: headers(apiKey) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GHL lookup ${res.status}`)
  const data = await res.json()
  return data.contacts?.[0] || data.contact || null
}

export async function ghlCreateContact({ apiKey, locationId }, data) {
  const res = await fetch(`${BASE}/contacts/`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ locationId, ...data }),
  })
  if (!res.ok) throw new Error(`GHL createContact ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const out = await res.json()
  return out.contact || out
}

export async function ghlCreateAppointment({ apiKey }, { contactId, calendarId, startTime }) {
  const res = await fetch(`${BASE}/appointments/`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ contactId, calendarId, startTime }),
  })
  if (!res.ok) throw new Error(`GHL createAppointment ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
