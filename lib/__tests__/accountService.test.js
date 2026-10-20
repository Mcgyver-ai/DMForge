import { describe, it, expect, vi } from 'vitest'
import {
  eraseUserData,
  cancelSubscriptionBeforeErasure,
  SUBSCRIPTION_CANCEL_FAILED_MESSAGE,
} from '../services/accountService'
import { ValidationError } from '../errors'

const FieldValue = { arrayRemove: (...items) => ({ arrayRemove: items }) }

// Fake Firestore: doc refs carry their path; `owned` maps "collection.field=value" to
// matching doc paths, `docs` holds the data a doc read returns.
function fakeDb({ owned = {}, docs = {}, failPaths = [], updateError } = {}) {
  const recursiveDelete = vi.fn(async (ref) => {
    if (failPaths.includes(ref.path)) throw new Error(`boom ${ref.path}`)
  })
  const update = vi.fn(async () => {
    if (updateError) throw updateError
  })
  const docRef = (path) => ({
    path,
    get: async () => (docs[path] ? { exists: true, data: () => docs[path] } : { exists: false }),
    update: (data) => update(path, data),
  })
  const db = {
    recursiveDelete,
    update,
    collection: (name) => ({
      doc: (id) => docRef(`${name}/${id}`),
      where: (field, _op, value) => ({
        get: async () => ({
          docs: (owned[`${name}.${field}=${value}`] || []).map((path) => ({
            id: path.split('/')[1],
            ref: docRef(path),
          })),
        }),
      }),
    }),
  }
  return db
}

const deletedPaths = (db) => db.recursiveDelete.mock.calls.map(([ref]) => ref.path)

describe('eraseUserData (lib/services/accountService.js)', () => {
  it('rejects a missing uid', async () => {
    await expect(eraseUserData({ db: fakeDb(), FieldValue, uid: '' })).rejects.toThrow(ValidationError)
  })

  it('recursively deletes the uid-keyed trees and every owned top-level doc', async () => {
    const db = fakeDb({
      owned: {
        'agents.ownerUid=u1': ['agents/a1'],
        'conversations.ownerUid=u1': ['conversations/c1'],
        'results.ownerUid=u1': ['results/r1', 'results/r2'],
        'meta_channel_index.uid=u1': ['meta_channel_index/page1'],
        'inbound_tokens.uid=u1': ['inbound_tokens/tok1'],
        'ghl_events.uid=u1': ['ghl_events/e1'],
        'invites.agencyId=u1': ['invites/inv1'],
      },
    })

    const outcome = await eraseUserData({ db, FieldValue, uid: 'u1' })

    expect(deletedPaths(db)).toEqual([
      'users/u1', 'leads/u1', 'reminders/u1', 'agencies/u1',
      'agents/a1', 'conversations/c1', 'results/r1', 'results/r2', 'meta_channel_index/page1',
      'inbound_tokens/tok1', 'ghl_events/e1', 'invites/inv1',
    ])
    expect(outcome).toEqual({ deletedTrees: 12 })
    expect(db.update).not.toHaveBeenCalled()
  })

  it('also deletes orphan users docs sharing the stripeCustomerId, but not the user twice', async () => {
    const db = fakeDb({
      docs: { 'users/u1': { stripeCustomerId: 'cus_1' } },
      owned: { 'users.stripeCustomerId=cus_1': ['users/u1', 'users/cus_1'] },
    })

    await eraseUserData({ db, FieldValue, uid: 'u1' })

    const deleted = deletedPaths(db)
    expect(deleted).toContain('users/cus_1')
    expect(deleted.filter((p) => p === 'users/u1')).toHaveLength(1)
  })

  const inviteOwned = {
    'invites.acceptedBy=u1': ['invites/accepted'],
    'invites.email=coach@example.com': ['invites/pending', 'invites/accepted'],
  }

  it('deletes invites addressed to a verified email or accepted by the user, once each', async () => {
    const db = fakeDb({ owned: inviteOwned })

    await eraseUserData({ db, FieldValue, uid: 'u1', email: 'coach@example.com', emailVerified: true })

    const deleted = deletedPaths(db)
    expect(deleted).toEqual(expect.arrayContaining(['invites/accepted', 'invites/pending']))
    expect(deleted.filter((p) => p === 'invites/accepted')).toHaveLength(1)
  })

  it('leaves invites addressed to an unverified email alone', async () => {
    const db = fakeDb({ docs: { 'users/u1': { email: 'coach@example.com' } }, owned: inviteOwned })

    await eraseUserData({ db, FieldValue, uid: 'u1', email: 'coach@example.com', emailVerified: false })

    const deleted = deletedPaths(db)
    expect(deleted).not.toContain('invites/pending')
    expect(deleted).toContain('invites/accepted')
  })

  it("removes the uid from another owner's agency memberUids", async () => {
    const db = fakeDb({ docs: { 'users/u1': { agencyId: 'owner9' } } })

    await eraseUserData({ db, FieldValue, uid: 'u1' })

    expect(db.update).toHaveBeenCalledWith('agencies/owner9', { memberUids: { arrayRemove: ['u1'] } })
  })

  it('does not touch memberUids when the user owns the agency', async () => {
    const db = fakeDb({ docs: { 'users/u1': { agencyId: 'u1' } } })

    await eraseUserData({ db, FieldValue, uid: 'u1' })

    expect(db.update).not.toHaveBeenCalled()
  })

  it('tolerates an already-deleted agency but fails on any other update error', async () => {
    const gone = fakeDb({ docs: { 'users/u1': { agencyId: 'owner9' } }, updateError: { code: 5 } })
    await expect(eraseUserData({ db: gone, FieldValue, uid: 'u1' })).resolves.toEqual({ deletedTrees: 4 })

    const broken = fakeDb({ docs: { 'users/u1': { agencyId: 'owner9' } }, updateError: new Error('unavailable') })
    await expect(eraseUserData({ db: broken, FieldValue, uid: 'u1' })).rejects.toThrow('erasure incomplete: 1 of 5')
  })

  it('throws after attempting every delete when any of them fails', async () => {
    const db = fakeDb({ failPaths: ['leads/u1'] })

    await expect(eraseUserData({ db, FieldValue, uid: 'u1' })).rejects.toThrow('erasure incomplete: 1 of 4')
    expect(db.recursiveDelete).toHaveBeenCalledTimes(4)
  })
})

describe('cancelSubscriptionBeforeErasure (lib/services/accountService.js)', () => {
  const stripeWith = ({ cancel = async () => ({ status: 'canceled' }), retrieve }) => ({
    subscriptions: { cancel: vi.fn(cancel), retrieve: vi.fn(retrieve) },
  })
  const missing = () => Object.assign(new Error('No such subscription'), { code: 'resource_missing' })

  it('is a no-op without a subscription', async () => {
    await expect(cancelSubscriptionBeforeErasure({ stripe: null, subscriptionId: undefined })).resolves.toBeUndefined()
  })

  it('cancels an active subscription', async () => {
    const stripe = stripeWith({ retrieve: async () => ({ status: 'active' }) })
    await cancelSubscriptionBeforeErasure({ stripe, subscriptionId: 'sub_1' })
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_1')
  })

  it.each(['canceled', 'incomplete_expired'])('skips the cancel for a %s subscription', async (status) => {
    const stripe = stripeWith({ retrieve: async () => ({ status }) })
    await expect(cancelSubscriptionBeforeErasure({ stripe, subscriptionId: 'sub_1' })).resolves.toBeUndefined()
    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled()
  })

  it('continues when Stripe no longer has the subscription', async () => {
    const stripe = stripeWith({ retrieve: async () => { throw missing() } })
    await expect(cancelSubscriptionBeforeErasure({ stripe, subscriptionId: 'sub_1' })).resolves.toBeUndefined()
  })

  it('aborts with the user-facing 502 when the cancel fails', async () => {
    const stripe = stripeWith({
      retrieve: async () => ({ status: 'past_due' }),
      cancel: async () => { throw Object.assign(new Error('api down'), { code: 'api_error' }) },
    })
    await expect(cancelSubscriptionBeforeErasure({ stripe, subscriptionId: 'sub_1' })).rejects.toMatchObject({
      message: SUBSCRIPTION_CANCEL_FAILED_MESSAGE,
      statusCode: 502,
    })
  })

  it('aborts when the status check itself fails', async () => {
    const stripe = stripeWith({ retrieve: async () => { throw new Error('timeout') } })
    await expect(cancelSubscriptionBeforeErasure({ stripe, subscriptionId: 'sub_1' })).rejects.toThrow(SUBSCRIPTION_CANCEL_FAILED_MESSAGE)
    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled()
  })
})
