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
