import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resolveSeats,
  inviteAgencyMember,
  acceptAgencyInvite,
  removeAgencyMember,
  getAgencyDetails,
  updateWhiteLabel,
} from '../services/agencyService'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../errors'

const mockRetrieve = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: mockRetrieve,
    },
  }),
}))

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}))

vi.mock('@/lib/mail', () => ({
  sendMail: vi.fn().mockResolvedValue(true),
}))

describe('Agency Service (lib/services/agencyService.js)', () => {
  const fakeFieldValue = {
    serverTimestamp: () => 'MOCK_TIMESTAMP',
    delete: () => 'MOCK_DELETE',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resolveSeats', () => {
    it('returns 10 when owner has no stripeSubscriptionId', async () => {
      const seats = await resolveSeats({})
      expect(seats).toBe(10)
    })

    it('returns seats from subscription metadata when present', async () => {
      mockRetrieve.mockResolvedValueOnce({ metadata: { seats: '25' } })
      const seats = await resolveSeats({ stripeSubscriptionId: 'sub_123' })
      expect(seats).toBe(25)
    })

    it('falls back to 10 when Stripe retrieve throws', async () => {
      mockRetrieve.mockRejectedValueOnce(new Error('Stripe timeout'))
      const seats = await resolveSeats({ stripeSubscriptionId: 'sub_err' })
      expect(seats).toBe(10)
    })
  })

  describe('inviteAgencyMember', () => {
    it('throws UnauthorizedError when user is missing', async () => {
      await expect(
        inviteAgencyMember({ db: {}, FieldValue: fakeFieldValue, user: null, body: { email: 'a@b.com' } })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws ForbiddenError when user does not have an active agency plan', async () => {
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ plan: 'pro', status: 'active' }),
            }),
          }),
        }),
      }

      await expect(
        inviteAgencyMember({
          db: mockDb,
          FieldValue: fakeFieldValue,
          user: { uid: 'u1' },
          body: { email: 'client@example.com' },
        })
      ).rejects.toThrow(ForbiddenError)
    })

    it('creates agency if not exists and issues invite token', async () => {
      mockRetrieve.mockResolvedValueOnce({ metadata: { seats: '15' } })
      const setDoc = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: (col) => {
          if (col === 'users') {
            return {
              doc: () => ({
                get: async () => ({
                  exists: true,
                  data: () => ({ plan: 'agency', status: 'active', stripeSubscriptionId: 'sub_agency' }),
                }),
                set: setDoc,
              }),
            }
          }
          if (col === 'agencies') {
            return {
              doc: () => ({
                get: async () => ({ exists: false }),
                set: setDoc,
              }),
            }
          }
          if (col === 'invites') {
            return {
              doc: () => ({
                set: setDoc,
              }),
            }
          }
          return { doc: () => ({ set: setDoc }) }
        },
      }

      const res = await inviteAgencyMember({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'owner1' },
        body: { email: 'invitee@example.com' },
        baseUrl: 'https://app.dmforge.org',
      })

      expect(res.token).toBeDefined()
      expect(res.acceptUrl).toContain(res.token)
      expect(setDoc).toHaveBeenCalled()
    })
  })

  describe('acceptAgencyInvite', () => {
    const NOW = Date.UTC(2026, 9, 17)
    const DAY = 24 * 60 * 60 * 1000
    const verified = { uid: 'u1', email: 'Invitee@Example.com', email_verified: true }

    function inviteDb(invite, agency = { seats: 5, memberUids: [] }) {
      const inviteUpdate = vi.fn().mockResolvedValue(true)
      const tx = { get: vi.fn(async () => ({ exists: true, data: () => agency })), update: vi.fn(), set: vi.fn() }
      const db = {
        collection: (col) => ({
          doc: (id) => ({
            col,
            id,
            get: async () => (invite ? { exists: true, data: () => invite } : { exists: false }),
            update: inviteUpdate,
          }),
        }),
        runTransaction: vi.fn(async (fn) => fn(tx)),
      }
      return { db, tx, inviteUpdate }
    }

    const freshInvite = (overrides = {}) => ({
      status: 'pending',
      email: 'invitee@example.com',
      agencyId: 'owner1',
      createdAt: { toMillis: () => NOW - DAY },
      ...overrides,
    })

    it('throws ValidationError if token is missing or invite not pending', async () => {
      await expect(acceptAgencyInvite({ db: {}, token: null, user: verified })).rejects.toThrow(ValidationError)
      const { db } = inviteDb(null)
      await expect(acceptAgencyInvite({ db, token: 'invalid_token', user: verified, now: NOW })).rejects.toThrow(ValidationError)
    })

    it('rejects an unverified email before reading the invite', async () => {
      const { db, tx } = inviteDb(freshInvite())
      await expect(
        acceptAgencyInvite({ db, token: 't', user: { ...verified, email_verified: false }, now: NOW })
      ).rejects.toThrow('verify your email before accepting')
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('rejects a token with no email instead of letting it pass', async () => {
      const { db, tx } = inviteDb(freshInvite())
      await expect(
        acceptAgencyInvite({ db, token: 't', user: { uid: 'u1', email_verified: true }, now: NOW })
      ).rejects.toThrow(ForbiddenError)
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('throws ForbiddenError if invite email does not match user email', async () => {
      const { db } = inviteDb(freshInvite())
      await expect(
        acceptAgencyInvite({ db, token: 't', user: { ...verified, email: 'other@example.com' }, now: NOW })
      ).rejects.toThrow(ForbiddenError)
    })

    it('expires an invite older than 7 days and marks it expired', async () => {
      const { db, tx, inviteUpdate } = inviteDb(freshInvite({ createdAt: { toMillis: () => NOW - 8 * DAY } }))
      await expect(acceptAgencyInvite({ db, token: 't', user: verified, now: NOW })).rejects.toThrow('invite expired')
      expect(inviteUpdate).toHaveBeenCalledWith({ status: 'expired' })
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('accepts a fresh invite for the verified, case-insensitively matching invitee', async () => {
      const { db, tx } = inviteDb(freshInvite())
      const res = await acceptAgencyInvite({ db, token: 't', user: verified, now: NOW })
      expect(res).toEqual({ ok: true, agencyId: 'owner1' })
      expect(tx.update).toHaveBeenCalledWith(expect.objectContaining({ col: 'agencies' }), { memberUids: ['u1'] })
      expect(tx.set).toHaveBeenCalledWith(
        expect.objectContaining({ col: 'users', id: 'u1' }),
        { role: 'member', agencyId: 'owner1' },
        { merge: true },
      )
    })
  })

  describe('removeAgencyMember', () => {
    function agencyDb(agency) {
      const tx = {
        get: vi.fn(async () => (agency ? { exists: true, data: () => agency } : { exists: false })),
        update: vi.fn(),
        set: vi.fn(),
      }
      const db = {
        collection: (col) => ({ doc: (id) => ({ col, id }) }),
        runTransaction: vi.fn(async (fn) => fn(tx)),
      }
      return { db, tx }
    }

    it('throws NotFoundError if agency does not exist', async () => {
      const { db } = agencyDb(null)
      await expect(
        removeAgencyMember({ db, FieldValue: fakeFieldValue, user: { uid: 'owner1' }, body: { memberUid: 'mem1' } })
      ).rejects.toThrow(NotFoundError)
    })

    it('leaves a non-member user doc untouched and 404s', async () => {
      const { db, tx } = agencyDb({ memberUids: ['mem1'] })
      await expect(
        removeAgencyMember({ db, FieldValue: fakeFieldValue, user: { uid: 'owner1' }, body: { memberUid: 'victim' } })
      ).rejects.toThrow('member not found')
      expect(tx.set).not.toHaveBeenCalled()
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('refuses to remove the owner themself', async () => {
      const { db, tx } = agencyDb({ memberUids: ['owner1'] })
      await expect(
        removeAgencyMember({ db, FieldValue: fakeFieldValue, user: { uid: 'owner1' }, body: { memberUid: 'owner1' } })
      ).rejects.toThrow('member not found')
      expect(tx.set).not.toHaveBeenCalled()
    })

    it('updates agency and removes member reference', async () => {
      const { db, tx } = agencyDb({ memberUids: ['mem1', 'mem2'] })
      const res = await removeAgencyMember({
        db,
        FieldValue: fakeFieldValue,
        user: { uid: 'owner1' },
        body: { memberUid: 'mem1' },
      })
      expect(res.ok).toBe(true)
      expect(tx.update).toHaveBeenCalledWith(expect.objectContaining({ col: 'agencies' }), { memberUids: ['mem2'] })
      expect(tx.set).toHaveBeenCalledWith(
        expect.objectContaining({ col: 'users', id: 'mem1' }),
        { role: 'member', agencyId: 'MOCK_DELETE' },
        { merge: true },
      )
    })
  })

  describe('updateWhiteLabel', () => {
    it('validates and applies white label configuration for agency owner', async () => {
      const updateAgency = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: (col) => {
          if (col === 'users') {
            return {
              doc: () => ({
                get: async () => ({
                  exists: true,
                  data: () => ({ plan: 'agency', status: 'active' }),
                }),
              }),
            }
          }
          return {
            doc: () => ({
              get: async () => ({ exists: true }),
              update: updateAgency,
            }),
          }
        },
      }

      const res = await updateWhiteLabel({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'owner1' },
        body: {
          brandName: 'Alpha Setter Agency',
          primaryColor: '#6B5BFF',
          hideParentBranding: true,
        },
      })

      expect(res.ok).toBe(true)
      expect(res.whiteLabel.brandName).toBe('Alpha Setter Agency')
      expect(res.whiteLabel.primaryColor).toBe('#6B5BFF')
      expect(res.whiteLabel.hideParentBranding).toBe(true)
    })
  })
})

