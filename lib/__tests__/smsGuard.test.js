import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'module'

// functions/ is a CommonJS package deployed on its own; load it the way the function does.
const { normalizeE164, checkRecipient } = createRequire(import.meta.url)('../../functions/smsGuard.js')

function suppressionDb(suppressed = []) {
  const lookups = []
  const db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: (id) => ({
            get: vi.fn(async () => {
              lookups.push(id)
              return { exists: suppressed.includes(id) }
            }),
          }),
        }),
      }),
    }),
  }
  return { db, lookups }
}

describe('sendReminders opt-out guard (functions/smsGuard.js)', () => {
  it('normalizes spaced E.164 and rejects local formats', () => {
    expect(normalizeE164('+44 7700 900123')).toBe('+447700900123')
    expect(normalizeE164('07700 900123')).toBeNull()
  })

  it('stops a reminder to a lead who replied STOP', async () => {
    const { db } = suppressionDb(['+447700900123'])
    expect(await checkRecipient(db, 'u1', '+44 7700 900123')).toEqual({
      to: '+447700900123',
      stop: { status: 'skipped', error: 'recipient opted out' },
    })
  })

  it('fails a non-E.164 number without looking it up', async () => {
    const { db, lookups } = suppressionDb()
    expect(await checkRecipient(db, 'u1', '07700 900123')).toEqual({
      to: null,
      stop: { status: 'failed', error: 'invalid number' },
    })
    expect(lookups).toEqual([])
  })

  it('lets an unsuppressed E.164 number through', async () => {
    const { db } = suppressionDb()
    expect(await checkRecipient(db, 'u1', '+447700900123')).toEqual({ to: '+447700900123', stop: null })
  })
})
