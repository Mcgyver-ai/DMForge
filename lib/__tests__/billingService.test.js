import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createCheckoutSession,
  createPortalSession,
  getBillingSession,
  findSubscriberDocId,
} from '../services/billingService'
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '../errors'

// Mock getStripe and helper methods
const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
}

vi.mock('@/lib/stripe', () => ({
  getStripe: () => mockStripe,
  PLANS: {
    pro_monthly: { key: 'pro_monthly', name: 'DMForge Pro', amount: 3900 },
  },
  ensurePrice: vi.fn().mockResolvedValue('price_123'),
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_123'),
}))

describe('Billing Service (lib/services/billingService.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  describe('createCheckoutSession', () => {
    it('creates a checkout session for valid authenticated user', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        url: 'https://checkout.stripe.com/session_abc',
        id: 'cs_123',
      })

      const res = await createCheckoutSession({
        decoded: { uid: 'user-1', email: 'user@test.com' },
        input: { planKey: 'pro_monthly' },
      })

      expect(res.url).toBe('https://checkout.stripe.com/session_abc')
      expect(res.id).toBe('cs_123')
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
    })

    it('throws UnauthorizedError when not signed in, even with a body email', async () => {
      await expect(
        createCheckoutSession({
          decoded: null,
          input: { planKey: 'pro_monthly', email: 'victim@test.com' },
        })
      ).rejects.toThrow(UnauthorizedError)
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('throws UnauthorizedError when the token has no email', async () => {
      await expect(
        createCheckoutSession({
          decoded: { uid: 'u1' },
          input: { planKey: 'pro_monthly', email: 'victim@test.com' },
        })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws ValidationError for an invalid planKey', async () => {
      await expect(
        createCheckoutSession({
          decoded: { uid: 'u1', email: 'u1@test.com' },
          input: { planKey: 'non_existent_plan' },
        })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('createPortalSession', () => {
    it('throws UnauthorizedError when user is not signed in', async () => {
      await expect(
        createPortalSession({ db: {}, decoded: null })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws NotFoundError if user has no stripeCustomerId', async () => {
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ email: 'test@user.com' }),
            }),
          }),
        }),
      }

      await expect(
        createPortalSession({ db: mockDb, decoded: { uid: 'user-1' } })
      ).rejects.toThrow(NotFoundError)
    })

    it('returns portal session URL when customer exists', async () => {
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ stripeCustomerId: 'cus_123' }),
            }),
          }),
        }),
      }

      mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
        url: 'https://billing.stripe.com/portal_123',
      })

      const res = await createPortalSession({
        db: mockDb,
        decoded: { uid: 'user-1' },
      })

      expect(res.url).toBe('https://billing.stripe.com/portal_123')
    })
  })

  describe('getBillingSession', () => {
    it('throws ValidationError if sessionId is missing', async () => {
      await expect(getBillingSession({ sessionId: '' })).rejects.toThrow(
        ValidationError
      )
    })

    it('throws ForbiddenError if session belongs to a different authenticated user', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        metadata: { uid: 'user-original' },
      })

      await expect(
        getBillingSession({
          sessionId: 'cs_123',
          decoded: { uid: 'user-attacker' },
        })
      ).rejects.toThrow(ForbiddenError)
    })

    it('returns session info for matching user', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        metadata: { uid: 'user-1', planKey: 'pro_monthly' },
        customer_details: { email: 'user@test.com' },
        status: 'complete',
      })

      const res = await getBillingSession({
        sessionId: 'cs_123',
        decoded: { uid: 'user-1' },
      })

      expect(res).toEqual({
        email: 'user@test.com',
        planKey: 'pro_monthly',
        status: 'complete',
      })
    })
  })
})

describe('findSubscriberDocId', () => {
  function usersDb(matches) {
    const where = vi.fn((field, op, value) => {
      if (value === undefined) throw new Error('undefined in where()')
      const id = matches[`${field}=${value}`]
      return { limit: () => ({ get: async () => ({ docs: id ? [{ id }] : [] }) }) }
    })
    return { db: { collection: () => ({ where }) }, where }
  }

  it('prefers the metadata uid without querying', async () => {
    const { db, where } = usersDb({})
    expect(await findSubscriberDocId({ db, uid: 'u1', email: 'a@b.com', customerId: 'cus_1' })).toBe('u1')
    expect(where).not.toHaveBeenCalled()
  })

  it('falls back to email, then stripeCustomerId', async () => {
    const { db } = usersDb({ 'email=a@b.com': 'byEmail', 'stripeCustomerId=cus_1': 'byCustomer' })
    expect(await findSubscriberDocId({ db, email: 'a@b.com', customerId: 'cus_1' })).toBe('byEmail')
    expect(await findSubscriberDocId({ db, email: 'x@b.com', customerId: 'cus_1' })).toBe('byCustomer')
  })

  it('handles a subscription with no metadata without passing undefined to where()', async () => {
    const { db, where } = usersDb({ 'stripeCustomerId=cus_1': 'byCustomer' })
    expect(await findSubscriberDocId({ db, uid: undefined, email: undefined, customerId: 'cus_1' })).toBe('byCustomer')
    expect(where).toHaveBeenCalledTimes(1)
    expect(await findSubscriberDocId({ db, customerId: 'cus_unknown' })).toBeNull()
    expect(await findSubscriberDocId({ db })).toBeNull()
  })
})
