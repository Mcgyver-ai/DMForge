import { describe, it, expect } from 'vitest'
import {
  agentCreateSchema,
  billingCheckoutSchema,
  outreachRecipientSchema,
  prospectCreateSchema,
  agentChatSchema,
  validate
} from '../schemas'
import { ValidationError } from '../errors'

describe('Domain Schemas (lib/schemas.js)', () => {
  describe('agentCreateSchema', () => {
    it('accepts valid agent creation data with defaults', () => {
      const input = {
        niche: 'Fitness Coaching',
        offer: '12-week body transformation for $2k',
      }
      const parsed = validate(agentCreateSchema, input)
      expect(parsed.niche).toBe('Fitness Coaching')
      expect(parsed.offer).toBe('12-week body transformation for $2k')
      expect(parsed.agentName).toBe('Coach')
      expect(parsed.calendarSlots).toHaveLength(3)
    })

    it('throws ValidationError when niche or offer is missing', () => {
      expect(() => validate(agentCreateSchema, {})).toThrow(ValidationError)
      expect(() => validate(agentCreateSchema, { niche: 'Fitness' })).toThrow(ValidationError)
      expect(() => validate(agentCreateSchema, { offer: 'Coaching' })).toThrow(ValidationError)
    })

    it('rejects oversized inputs', () => {
      expect(() => validate(agentCreateSchema, {
        niche: 'A'.repeat(250),
        offer: 'Valid offer'
      })).toThrow(ValidationError)
    })
  })

  describe('billingCheckoutSchema', () => {
    it('accepts valid plan checkout', () => {
      const parsed = validate(billingCheckoutSchema, {
        planKey: 'pro_monthly',
        email: 'coach@example.com'
      })
      expect(parsed.planKey).toBe('pro_monthly')
      expect(parsed.email).toBe('coach@example.com')
    })

    it('throws on invalid email or missing planKey', () => {
      expect(() => validate(billingCheckoutSchema, {})).toThrow(ValidationError)
      expect(() => validate(billingCheckoutSchema, { planKey: 'pro_monthly', email: 'not-an-email' })).toThrow(ValidationError)
    })
  })

  describe('prospectCreateSchema', () => {
    it('sanitizes and applies channel and status defaults', () => {
      const parsed = validate(prospectCreateSchema, {
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
      expect(parsed.name).toBe('Jane Doe')
      expect(parsed.channel).toBe('manual')
      expect(parsed.status).toBe('new')
    })

    it('rejects invalid channel enum', () => {
      expect(() => validate(prospectCreateSchema, {
        name: 'Jane Doe',
        channel: 'unsupported_platform'
      })).toThrow(ValidationError)
    })
  })
})

describe('outreachRecipientSchema', () => {
  it('accepts one address and trims it', () => {
    expect(outreachRecipientSchema.parse('  lead@example.com ')).toBe('lead@example.com')
  })

  it('rejects a comma or semicolon list that would bypass the unsubscribe check', () => {
    for (const to of ['unsub@x.com, new@y.com', 'unsub@x.com,new@y.com', 'a@x.com; b@y.com', 'Name <a@x.com>']) {
      expect(outreachRecipientSchema.safeParse(to).success).toBe(false)
    }
  })
})
