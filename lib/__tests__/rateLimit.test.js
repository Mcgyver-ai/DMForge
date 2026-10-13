import { describe, it, expect, vi, beforeEach } from 'vitest'

const txState = { count: 0, throwOnTx: false }
vi.mock('@/lib/firebaseAdmin', () => ({
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (fn) => {
      if (txState.throwOnTx) throw new Error('firestore down')
      return fn({
        get: async () => ({ exists: txState.count > 0, data: () => ({ count: txState.count }) }),
        set: vi.fn(),
      })
    },
  }),
}))

const req = (ip) => ({ headers: new Headers({ 'x-forwarded-for': ip }) })

describe('rateLimit (in-memory fallback, no Upstash env)', () => {
  let checkRateLimit
  let checkLlmRateLimit

  beforeEach(async () => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    txState.count = 0
    txState.throwOnTx = false
    ;({ checkRateLimit, checkLlmRateLimit } = await import('@/lib/rateLimit'))
  })

  it('allows 20 anonymous requests per minute per IP then blocks the 21st', async () => {
    for (let i = 0; i < 20; i++) expect(await checkRateLimit(req('1.1.1.1'), null)).toBe(true)
    expect(await checkRateLimit(req('1.1.1.1'), null)).toBe(false)
  })

  it('tracks IPs independently', async () => {
    for (let i = 0; i < 20; i++) await checkRateLimit(req('2.2.2.2'), null)
    expect(await checkRateLimit(req('3.3.3.3'), null)).toBe(true)
  })

  it('uses only the first x-forwarded-for hop (spoofed chain cannot dodge the bucket)', async () => {
    for (let i = 0; i < 20; i++) await checkRateLimit(req('4.4.4.4, 9.9.9.9'), null)
    expect(await checkRateLimit(req('4.4.4.4, 8.8.8.8'), null)).toBe(false)
  })

  it('gives authenticated users 60/min keyed by uid', async () => {
    for (let i = 0; i < 60; i++) expect(await checkRateLimit(req('5.5.5.5'), 'u1')).toBe(true)
    expect(await checkRateLimit(req('5.5.5.5'), 'u1')).toBe(false)
  })

  it('limits anonymous LLM calls to 5/min', async () => {
    for (let i = 0; i < 5; i++) expect(await checkLlmRateLimit(req('6.6.6.6'), null)).toBe(true)
    expect(await checkLlmRateLimit(req('6.6.6.6'), null)).toBe(false)
  })

  it('denies anonymous LLM calls once the durable daily cap (30) is hit', async () => {
    txState.count = 30
    expect(await checkLlmRateLimit(req('7.7.7.7'), null)).toBe(false)
  })

  it('fails CLOSED for anonymous LLM calls when Firestore errors', async () => {
    txState.throwOnTx = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await checkLlmRateLimit(req('8.8.8.8'), null)).toBe(false)
  })

  it('does not touch Firestore for authenticated LLM calls', async () => {
    txState.throwOnTx = true
    expect(await checkLlmRateLimit(req('9.9.9.9'), 'u2')).toBe(true)
  })
})
