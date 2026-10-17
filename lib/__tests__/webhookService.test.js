import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
} from '../services/webhookService'
import {
  ValidationError,
  UnauthorizedError,
} from '../errors'

describe('Webhook Service (lib/services/webhookService.js)', () => {
  const fakeFieldValue = {
    serverTimestamp: () => 'MOCK_TIMESTAMP',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createWebhook', () => {
    it('throws UnauthorizedError if user is not provided', async () => {
      await expect(
        createWebhook({ db: {}, FieldValue: fakeFieldValue, user: null, body: {} })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('throws ValidationError if url is not https or invalid', async () => {
      await expect(
        createWebhook({
          db: {},
          FieldValue: fakeFieldValue,
          user: { uid: 'u1' },
          body: { url: 'http://insecure.example.com', events: ['booked'] },
        })
      ).rejects.toThrow(ValidationError)
    })

    it.each([
      'https://127.0.0.1/hook',
      'https://10.0.0.5/hook',
      'https://169.254.169.254/latest/meta-data',
      'https://[::1]/hook',
      'https://localhost/hook',
    ])('rejects private/internal url %s without writing', async (url) => {
      const set = vi.fn()
      const db = { collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ set }) }) }) }) }
      await expect(
        createWebhook({ db, FieldValue: fakeFieldValue, user: { uid: 'u1' }, body: { url, events: ['booked'] } })
      ).rejects.toThrow(ValidationError)
      expect(set).not.toHaveBeenCalled()
    })

    it('creates webhook with secret and returns it', async () => {
      const setDoc = vi.fn().mockResolvedValue(true)
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            collection: vi.fn().mockReturnValue({
              doc: vi.fn().mockReturnValue({
                set: setDoc,
              }),
            }),
          }),
        }),
      }

      const res = await createWebhook({
        db: mockDb,
        FieldValue: fakeFieldValue,
        user: { uid: 'u1' },
        body: {
          url: 'https://webhook.site/test',
          events: ['appointment.booked'],
        },
      })

      expect(res.id).toBeDefined()
      expect(res.url).toBe('https://webhook.site/test')
      expect(res.events).toEqual(['appointment.booked'])
      expect(res.secret).toBeDefined()
      expect(res.active).toBe(true)
      expect(setDoc).toHaveBeenCalled()
    })
  })

  describe('listWebhooks', () => {
    it('returns webhooks list without secrets', async () => {
      const mockDocs = [
        {
          id: 'w1',
          data: () => ({
            id: 'w1',
            url: 'https://a.com',
            events: ['appointment.booked'],
            secret: 'supersecret',
            active: true,
          }),
        },
      ]
      const mockDb = {
        collection: () => ({
          doc: () => ({
            collection: () => ({
              get: async () => ({ docs: mockDocs }),
            }),
          }),
        }),
      }

      const res = await listWebhooks({
        db: mockDb,
        user: { uid: 'u1' },
      })

      expect(res.webhooks).toHaveLength(1)
      expect(res.webhooks[0].secret).toBeUndefined()
      expect(res.webhooks[0].url).toBe('https://a.com')
    })
  })

  describe('deleteWebhook', () => {
    it('deletes webhook doc by id', async () => {
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

      const res = await deleteWebhook({
        db: mockDb,
        user: { uid: 'u1' },
        webhookId: 'w_123',
      })

      expect(res.ok).toBe(true)
      expect(deleteDoc).toHaveBeenCalled()
    })

    it('throws ValidationError if webhookId is missing', async () => {
      await expect(
        deleteWebhook({ db: {}, user: { uid: 'u1' }, webhookId: null })
      ).rejects.toThrow(ValidationError)
    })
  })
})

