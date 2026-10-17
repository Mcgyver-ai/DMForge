import { describe, it, expect } from 'vitest'
import { toPublicResult } from '../resultState'

describe('toPublicResult (lib/resultState.js)', () => {
  it('drops the owner identity from a public result', () => {
    const out = toPublicResult({
      id: 'r1',
      transcript: [{ role: 'assistant', content: 'hey' }],
      ownerEmail: 'coach@example.com',
      ownerUid: 'uid-1',
    })
    expect(out).not.toHaveProperty('ownerEmail')
    expect(out).not.toHaveProperty('ownerUid')
    expect(out).toEqual({ id: 'r1', transcript: [{ role: 'assistant', content: 'hey' }] })
  })

  it('tolerates a null result', () => {
    expect(toPublicResult(null)).toEqual({})
  })
})
