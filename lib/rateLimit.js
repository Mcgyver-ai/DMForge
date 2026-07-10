// Redis-backed rate limiting via Upstash when configured, so limits hold
// across serverless instances/cold starts. Falls back to the original
// in-memory per-instance buckets when UPSTASH_REDIS_REST_URL/TOKEN are
// unset, so local dev and the free tier keep working without a Redis account.
import { createHash } from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getAdminDb } from '@/lib/firebaseAdmin'

const WINDOW_MS = 60_000
const buckets = new Map() // in-memory fallback: key -> timestamps[]

// LLM routes burn paid Gemini credits, so anonymous callers get a much
// tighter minute window plus a durable per-IP daily cap (the in-memory
// buckets reset on every cold start and don't span instances).
const LLM_UNAUTH_PER_MIN = 5
const LLM_AUTH_PER_MIN = 20
const LLM_UNAUTH_PER_DAY = 30

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null

// One Ratelimit instance per distinct count (all our windows are 60s), built
// lazily so an unconfigured deployment never touches the Upstash SDK.
const limiters = new Map()
function getLimiter(limit) {
  if (!limiters.has(limit)) {
    limiters.set(limit, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, '60 s'),
      prefix: 'dmforge:ratelimit',
      analytics: false,
    }))
  }
  return limiters.get(limit)
}

function hitMemory(key, limit) {
  const now = Date.now()
  const arr = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS)
  const allowed = arr.length < limit
  if (allowed) arr.push(now)
  buckets.set(key, arr)
  return allowed
}

async function hit(key, limit) {
  if (!redis) return hitMemory(key, limit)
  try {
    const { success } = await getLimiter(limit).limit(key)
    return success
  } catch (err) {
    // Fail open — an Upstash outage shouldn't take down the app.
    console.error('rateLimit: Upstash check failed, allowing request:', err.message)
    return true
  }
}

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function checkRateLimit(request, uid) {
  if (uid) return hit(`uid:${uid}`, 60)
  return hit(`ip:${clientIp(request)}`, 20)
}

// Guard for routes that call the LLM. Authenticated users get the plain
// minute bucket; anonymous callers also consume a Firestore-backed daily
// counter keyed by hashed IP so the cap survives cold starts.
export async function checkLlmRateLimit(request, uid) {
  if (uid) return hit(`llm:uid:${uid}`, LLM_AUTH_PER_MIN)

  const ip = clientIp(request)
  if (!(await hit(`llm:ip:${ip}`, LLM_UNAUTH_PER_MIN))) return false

  const day = new Date().toISOString().slice(0, 10)
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32)
  const ref = getAdminDb().collection('llmDailyUsage').doc(`${day}_${ipHash}`)
  try {
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const count = snap.exists ? snap.data().count || 0 : 0
      if (count >= LLM_UNAUTH_PER_DAY) return false
      // expiresAt lets a Firestore TTL policy garbage-collect old counters
      tx.set(ref, { count: count + 1, day, expiresAt: new Date(Date.now() + 48 * 3600_000) }, { merge: true })
      return true
    })
  } catch (err) {
    // Fail open: the minute bucket above still applies, and an outage of the
    // counter shouldn't take down the public demo flow.
    console.error('llm daily cap check failed:', err.message)
    return true
  }
}
