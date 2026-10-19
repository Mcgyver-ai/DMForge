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
    it('throws ValidationError if token is missing or invite not pending', async () => {
      await expect(acceptAgencyInvite({ db: {}, token: null, user: { uid: 'u1' } })).rejects.toThrow(ValidationError)

      const mockDb = {
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: false }),
          }),
        }),
      }
      await expect(acceptAgencyInvite({ db: mockDb, token: 'invalid_token', user: { uid: 'u1' } })).rejects.toThrow(ValidationError)
    })

    it('throws ForbiddenError if invite email does not match user email', async () => {
      const mockDb = {
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({ status: 'pending', email: 'specific@example.com', agencyId: 'owner1' }),
            }),
          }),
        }),
      }
      await expect(
        acceptAgencyInvite({
          db: mockDb,
          token: 'tok_1',
          user: { uid: 'u1', email: 'other@example.com' },
        })
      ).rejects.toThrow(ForbiddenError)
    })
  })

  describe('removeAgencyMember', () => {
    it('throws NotFoundError if agency does not exist', async () => {
      const mockDb = {
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: false }),
          }),
        }),
      }
      await expect(
        removeAgencyMember({
          db: mockDb,
          FieldValue: fakeFieldValue,
          user: { uid: 'owner1' },
          body: { memberUid: 'mem1' },
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('updates agency and removes member reference', async () => {
      const updateAgency = vi.fn().mockResolvedValue(true)
      const setUser = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: (col) => {
          if (col === 'agencies') {
            return {
              doc: () => ({
                get: async () => ({
                  exists: true,
                  data: () => ({ memberUids: ['mem1', 'mem2'] }),
                }),
                update: updateAgency,
              }),
            }
          }
          return {
            doc: () => ({
              set: setUser,
            }),
          }
        },
      }

      const res = await removeAgencyMember({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'owner1' },
        body: { memberUid: 'mem1' },
      })

      expect(res.ok).toBe(true)
      expect(updateAgency).toHaveBeenCalledWith({ memberUids: ['mem2'] })
      expect(setUser).toHaveBeenCalled()
    })

    it('refuses a uid that is not a member and writes nothing', async () => {
      const updateAgency = vi.fn()
      const setUser = vi.fn()
      const mockDb = {
        collection: (col) =>
          col === 'agencies'
            ? {
                doc: () => ({
                  get: async () => ({ exists: true, data: () => ({ memberUids: ['mem1'] }) }),
                  update: updateAgency,
                }),
              }
            : { doc: () => ({ set: setUser }) },
      }
      await expect(
        removeAgencyMember({
          db: mockDb,
          FieldValue: fakeFieldValue,
          user: { uid: 'owner1' },
          body: { memberUid: 'other-agency-owner' },
        })
      ).rejects.toThrow(NotFoundError)
      expect(updateAgency).not.toHaveBeenCalled()
      expect(setUser).not.toHaveBeenCalled()
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

