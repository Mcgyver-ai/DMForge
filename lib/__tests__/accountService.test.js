import { describe, it, expect, vi } from 'vitest'
import { eraseUserData } from '../services/accountService'
import { ValidationError } from '../errors'

// Fake Firestore: doc refs are path strings; `owned` maps "collection.field" to matching doc paths.
function fakeDb({ owned = {}, failPaths = [] } = {}) {
  const recursiveDelete = vi.fn(async (ref) => {
    if (failPaths.includes(ref)) throw new Error(`boom ${ref}`)
  })
  const db = {
    recursiveDelete,
    collection: (name) => ({
      doc: (id) => `${name}/${id}`,
      where: (field, _op, value) => ({
        get: async () => ({
          docs: (owned[`${name}.${field}`] || []).map((path) => ({ ref: path, value })),
        }),
      }),
    }),
  }
  return db
}

describe('eraseUserData (lib/services/accountService.js)', () => {
  it('rejects a missing uid', async () => {
    await expect(eraseUserData({ db: fakeDb(), uid: '' })).rejects.toThrow(ValidationError)
  })

  it('recursively deletes the uid-keyed trees and every owned top-level doc', async () => {
    const db = fakeDb({
      owned: {
        'agents.ownerUid': ['agents/a1'],
        'conversations.ownerUid': ['conversations/c1'],
        'results.ownerUid': ['results/r1', 'results/r2'],
        'meta_channel_index.uid': ['meta_channel_index/page1'],
      },
    })

    const outcome = await eraseUserData({ db, uid: 'u1' })

    const deleted = db.recursiveDelete.mock.calls.map(([ref]) => ref)
    expect(deleted).toEqual([
      'users/u1', 'leads/u1', 'reminders/u1',
      'agents/a1', 'conversations/c1', 'results/r1', 'results/r2', 'meta_channel_index/page1',
    ])
    expect(outcome).toEqual({ deletedTrees: 8 })
  })

  it('throws after attempting every delete when any of them fails', async () => {
    const db = fakeDb({ failPaths: ['leads/u1'] })

    await expect(eraseUserData({ db, uid: 'u1' })).rejects.toThrow('erasure incomplete: 1 of 3')
    expect(db.recursiveDelete).toHaveBeenCalledTimes(3)
  })
})
