import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { triggerWebhooks } from '../webhooks'
import { logError } from '@/lib/logger'

vi.mock('@/lib/logger', () => ({ logError: vi.fn() }))

const hookDoc = { data: () => ({ url: 'https://hooks.example.com/in', secret: 's3cret' }) }
vi.mock('@/lib/firebaseAdmin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          where: () => ({
            where: () => ({ get: async () => ({ empty: false, docs: [hookDoc] }) }),
          }),
        }),
      }),
    }),
  }),
}))

describe('triggerWebhooks delivery (lib/webhooks.js)', () => {
  const realFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  it('does not follow a 3xx redirect and logs it as a failed delivery', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 302,
      headers: { get: () => 'http://169.254.169.254/latest/meta-data' },
    })

    await triggerWebhooks('u1', 'booked', { id: 'p1' })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][1].redirect).toBe('manual')
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('webhook delivery failed'),
      expect.objectContaining({ message: 'refused 302 redirect' }),
    )
  })

  it('treats a 2xx as delivered', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 })

    await triggerWebhooks('u1', 'booked', { id: 'p1' })

    expect(logError).not.toHaveBeenCalled()
  })
})
