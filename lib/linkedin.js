// LinkedIn OAuth 2.0 (3-legged) + message send.
// ponytail: scopes follow the GOAL spec (r_liteprofile/r_emailaddress/w_member_social).
// LinkedIn has since moved liteprofile to OpenID Connect (openid/profile/email +
// /v2/userinfo) — swap the scope string + profile call if the app is registered
// under the newer product. Needs a real LinkedIn app to exercise end to end.
const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const SCOPES = ['r_liteprofile', 'r_emailaddress', 'w_member_social']

export function authorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
    state,
    scope: SCOPES.join(' '),
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return res.json() // { access_token, expires_in, ... }
}

export async function fetchProfile(accessToken) {
  const res = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`LinkedIn profile fetch failed: ${res.status}`)
  const p = await res.json()
  const first = p.localizedFirstName || p.firstName?.localized && Object.values(p.firstName.localized)[0] || ''
  const last = p.localizedLastName || ''
  return { id: p.id, firstName: first, lastName: last, headline: p.localizedHeadline || '' }
}

export async function sendMessage(accessToken, authorUrn, recipientUrn, text) {
  // UGC share / message send shape varies by LinkedIn product approval.
  const res = await fetch('https://api.linkedin.com/v2/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients: [recipientUrn], body: text, author: authorUrn }),
  })
  if (!res.ok) throw new Error(`LinkedIn message send failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
