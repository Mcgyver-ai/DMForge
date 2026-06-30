// ponytail: in-memory rate limit, swap to Redis/Upstash if multi-instance
const WINDOW_MS = 60_000
const buckets = new Map() // key -> timestamps[]

function hit(key, limit) {
  const now = Date.now()
  const arr = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS)
  const allowed = arr.length < limit
  if (allowed) arr.push(now)
  buckets.set(key, arr)
  return allowed
}

export function checkRateLimit(request, uid) {
  if (uid) return hit(`uid:${uid}`, 60)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  return hit(`ip:${ip}`, 20)
}
