import crypto from 'crypto'
import net from 'net'

// Constant-time string compare. Length mismatch returns false without
// calling timingSafeEqual (which throws on unequal lengths).
export function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''))
  const right = Buffer.from(String(b ?? ''))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

// Meta signs the raw request body: `X-Hub-Signature-256: sha256=<hex hmac>`
// keyed with the app secret. Must be checked against the exact raw bytes.
export function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  return safeEqual(signatureHeader, expected)
}

// Meta signed_request parsing for Data Deletion callbacks and Canvas/Login payloads.
// Format is `<encoded_sig>.<payload>` where both segments are base64url encoded.
export function parseMetaSignedRequest(signedRequest, appSecret) {
  if (!signedRequest || typeof signedRequest !== 'string' || !appSecret) {
    return null
  }
  const parts = signedRequest.split('.')
  if (parts.length !== 2) return null

  const [encodedSig, payload] = parts
  try {
    const sigBuffer = Buffer.from(encodedSig, 'base64url')
    const expectedBuffer = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest()

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null
    }

    const json = Buffer.from(payload, 'base64url').toString('utf8')
    const data = JSON.parse(json)
    if (data.algorithm && data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
      return null
    }
    return data
  } catch {
    return null
  }
}

function isPrivateIPv4(host) {
  const [a, b] = host.split('.').map(Number)
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  )
}

function isPrivateIPv6(host) {
  const h = host.toLowerCase()
  if (h === '::' || h === '::1') return true
  if (h.startsWith('fc') || h.startsWith('fd')) return true // unique local
  if (h.startsWith('fe8') || h.startsWith('fe9') || h.startsWith('fea') || h.startsWith('feb')) return true // link-local
  const dotted = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (dotted) return isPrivateIPv4(dotted[1])
  // new URL() normalises ::ffff:127.0.0.1 to ::ffff:7f00:1 (hex pair form)
  const hex = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  return false
}

const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost', '.lan', '.home', '.corp']

// Outbound-webhook target check. Rejects non-https, credentials in the URL,
// IP literals in private/loopback/link-local ranges, and internal hostnames.
// Does NOT defend against DNS rebinding (a public name that later resolves to
// a private IP); that needs resolve-then-connect pinning at delivery time.
export function isPublicHttpsUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (parsed.username || parsed.password) return false

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host) return false

  const ipVersion = net.isIP(host)
  if (ipVersion === 4) return !isPrivateIPv4(host)
  if (ipVersion === 6) return !isPrivateIPv6(host)

  if (host === 'localhost') return false
  if (!host.includes('.')) return false // bare internal names like "metadata"
  return !BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

// GoHighLevel signs webhook bodies with Ed25519 and sends the base64 signature
// in `X-GHL-Signature`; the key is GHL's published one (not a per-account
// secret). The legacy RSA `X-WH-Signature` header is past its deprecation date.
// https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
export const GHL_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`

export function verifyGhlSignature(rawBody, signatureHeader, publicKeyPem = GHL_WEBHOOK_PUBLIC_KEY) {
  if (!signatureHeader || typeof rawBody !== 'string') return false
  try {
    return crypto.verify(null, Buffer.from(rawBody, 'utf8'), publicKeyPem, Buffer.from(signatureHeader, 'base64'))
  } catch {
    return false
  }
}
