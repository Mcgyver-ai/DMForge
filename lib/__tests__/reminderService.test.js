import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  connectSMSChannel,
  disconnectSMSChannel,
  scheduleReminders,
  sendDueReminders,
  normalizeE164,
} from '../services/reminderService'
import {
  ValidationError,
  UnauthorizedError,
} from '../errors'

describe('Reminder Service (lib/services/reminderService.js)', () => {
  const fakeFieldValue = {
    serverTimestamp: () => 'MOCK_TIMESTAMP',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connectSMSChannel', () => {
    it('throws UnauthorizedError if user is not provided', async () => {
      await expect(
        connectSMSChannel({ db: {}, FieldValue: fakeFieldValue, user: null, body: {} })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws ValidationError if Twilio test fails', async () => {
      const mockTestTwilio = vi.fn().mockResolvedValue({ success: false, error: 'Invalid SID' })
      await expect(
        connectSMSChannel({
          db: {},
          FieldValue: fakeFieldValue,
          user: { uid: 'u1' },
          body: { accountSid: 'AC123', authToken: 'auth123', from: '+1234567890' },
          testTwilioFn: mockTestTwilio,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('saves encrypted credentials when valid', async () => {
      const setDoc = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: () => ({
          doc: () => ({
            collection: () => ({
              doc: () => ({
                set: setDoc,
              }),
            }),
          }),
        }),
      }
      const mockTestTwilio = vi.fn().mockResolvedValue({ success: true })
      const mockEncrypt = vi.fn().mockReturnValue('encrypted_str')

      const res = await connectSMSChannel({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'u1' },
        body: { accountSid: 'AC123', authToken: 'auth123', from: '+1234567890' },
        testTwilioFn: mockTestTwilio,
        encryptFn: mockEncrypt,
      })

      expect(res.success).toBe(true)
      expect(setDoc).toHaveBeenCalled()
      expect(mockEncrypt).toHaveBeenCalled()
    })
  })

  describe('disconnectSMSChannel', () => {
    it('deletes sms channel doc for user', async () => {
      const deleteDoc = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: () => ({
          doc: () => ({
            collection: () => ({
              doc: () => ({
                delete: deleteDoc,
              }),
            }),
          }),
        }),
      }

      const res = await disconnectSMSChannel({ db: mockDb, user: { uid: 'u1' } })
      expect(res.ok).toBe(true)
      expect(deleteDoc).toHaveBeenCalled()
    })
  })

  describe('scheduleReminders', () => {
    it('enqueues future reminders', async () => {
      const setDoc = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: () => ({
          doc: () => ({
            collection: () => ({
              doc: () => ({
                set: setDoc,
              }),
            }),
          }),
        }),
      }

      // Schedule 2 days ahead so both 24h and 1h reminders are in the future
      const futureDate = new Date(Date.now() + 48 * 3600_000).toISOString()
      const res = await scheduleReminders({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'u1' },
        body: {
          to: '+1234567890',
          scheduledAt: futureDate,
          leadName: 'Jane',
        },
      })

      expect(res.scheduled.length).toBe(2)
      expect(setDoc).toHaveBeenCalledTimes(2)
    })
  })
})

describe('SMS opt-out safety (lib/services/reminderService.js)', () => {
  const fakeFieldValue = { serverTimestamp: () => 'MOCK_TIMESTAMP' }

  it('normalizeE164 strips spaces and refuses anything not provably E.164', () => {
    expect(normalizeE164('+44 7700 900123')).toBe('+447700900123')
    expect(normalizeE164('07700 900123')).toBeNull()
    expect(normalizeE164('447700900123')).toBeNull()
    expect(normalizeE164('+0123456789')).toBeNull()
    expect(normalizeE164('+1234567')).toBeNull()
    expect(normalizeE164(undefined)).toBeNull()
  })

  it('rejects a non-E.164 number at schedule time without writing', async () => {
    const setDoc = vi.fn()
    const db = { collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ set: setDoc }) }) }) }) }
    await expect(
      scheduleReminders({
        db,
        FieldValue: fakeFieldValue,
        user: { uid: 'u1' },
        body: { to: '07700 900123', scheduledAt: new Date(Date.now() + 48 * 3600_000).toISOString() },
      })
    ).rejects.toThrow('to must be E.164, e.g. +447700900123')
    expect(setDoc).not.toHaveBeenCalled()
  })

  function cronDb({ reminders, suppressed = [] }) {
    const docs = reminders.map((r) => ({ data: () => r, ref: { update: vi.fn(async () => {}) } }))
    const smsSuppressedLookups = []
    const db = {
      collectionGroup: () => {
        const q = { where: () => q, limit: () => q, get: async () => ({ size: docs.length, docs }) }
        return q
      },
      runTransaction: async (fn) => fn({ get: async () => ({ exists: true, data: () => ({ status: 'pending' }) }), update: () => {} }),
      collection: () => ({
        doc: () => ({
          collection: (sub) => ({
            doc: (id) => ({
              get: async () => {
                if (sub === 'smsSuppressed') smsSuppressedLookups.push(id)
                if (sub === 'smsSuppressed') return { exists: suppressed.includes(id) }
                return { exists: true, data: () => ({ connected: true, encryptedCreds: 'enc' }) }
              },
            }),
          }),
        }),
      }),
    }
    return { db, docs, smsSuppressedLookups }
  }

  it('skips a suppressed E.164 recipient in the cron', async () => {
    const sendSMSFn = vi.fn()
    const { db, docs } = cronDb({
      reminders: [{ uid: 'u1', to: '+447700900123', body: 'hi' }],
      suppressed: ['+447700900123'],
    })
    const res = await sendDueReminders({ db, FieldValue: fakeFieldValue, cronSecret: 's', authHeader: 'Bearer s', decryptFn: () => '{}', sendSMSFn })
    expect(sendSMSFn).not.toHaveBeenCalled()
    expect(docs[0].ref.update).toHaveBeenCalledWith({ status: 'skipped', error: 'recipient opted out' })
    expect(res.sent).toBe(0)
  })

  it('matches suppression for a legacy spaced number via its E.164 form', async () => {
    const sendSMSFn = vi.fn()
    const { db, smsSuppressedLookups } = cronDb({
      reminders: [{ uid: 'u1', to: '+44 7700 900123', body: 'hi' }],
      suppressed: ['+447700900123'],
    })
    await sendDueReminders({ db, FieldValue: fakeFieldValue, cronSecret: 's', authHeader: 'Bearer s', decryptFn: () => '{}', sendSMSFn })
    expect(smsSuppressedLookups).toEqual(['+447700900123'])
    expect(sendSMSFn).not.toHaveBeenCalled()
  })

  it('fails an already-queued non-E.164 reminder without sending', async () => {
    const sendSMSFn = vi.fn()
    const { db, docs, smsSuppressedLookups } = cronDb({ reminders: [{ uid: 'u1', to: '07700 900123', body: 'hi' }] })
    const res = await sendDueReminders({ db, FieldValue: fakeFieldValue, cronSecret: 's', authHeader: 'Bearer s', decryptFn: () => '{}', sendSMSFn })
    expect(docs[0].ref.update).toHaveBeenCalledWith({ status: 'failed', error: 'invalid number' })
    expect(smsSuppressedLookups).toEqual([])
    expect(sendSMSFn).not.toHaveBeenCalled()
    expect(res.failed).toBe(1)
  })

  it('sends to an unsuppressed E.164 recipient', async () => {
    const sendSMSFn = vi.fn(async () => {})
    const { db } = cronDb({ reminders: [{ uid: 'u1', to: '+447700900123', body: 'hi' }] })
    const res = await sendDueReminders({ db, FieldValue: fakeFieldValue, cronSecret: 's', authHeader: 'Bearer s', decryptFn: () => '{}', sendSMSFn })
    expect(sendSMSFn).toHaveBeenCalledWith({}, '+447700900123', 'hi')
    expect(res.sent).toBe(1)
  })
})
