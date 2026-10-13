import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { safeEqual, verifyMetaSignature, isPublicHttpsUrl } from '@/lib/webhookAuth'

const sign = (body, secret) => 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')

describe('safeEqual', () => {
  it('matches equal strings and rejects different or different-length ones', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual(undefined, '')).toBe(true)
  })
})

describe('verifyMetaSignature', () => {
  const body = '{"object":"instagram","entry":[]}'
  it('accepts a correct signature', () => {
    expect(verifyMetaSignature(body, sign(body, 's3cret'), 's3cret')).toBe(true)
  })
  it('rejects a tampered body, wrong secret, missing header, or missing secret', () => {
    expect(verifyMetaSignature(body + ' ', sign(body, 's3cret'), 's3cret')).toBe(false)
    expect(verifyMetaSignature(body, sign(body, 'other'), 's3cret')).toBe(false)
    expect(verifyMetaSignature(body, null, 's3cret')).toBe(false)
    expect(verifyMetaSignature(body, sign(body, 's3cret'), '')).toBe(false)
  })
  it('rejects a signature without the sha256= prefix', () => {
    const bare = crypto.createHmac('sha256', 's3cret').update(body).digest('hex')
    expect(verifyMetaSignature(body, bare, 's3cret')).toBe(false)
  })
})

describe('isPublicHttpsUrl (SSRF guard)', () => {
  it('allows ordinary public https URLs', () => {
    expect(isPublicHttpsUrl('https://hooks.zapier.com/hooks/catch/1/abc')).toBe(true)
    expect(isPublicHttpsUrl('https://example.com:8443/x?y=1')).toBe(true)
    expect(isPublicHttpsUrl('https://8.8.8.8/hook')).toBe(true)
  })
  it.each([
    'http://example.com/hook',
    'ftp://example.com',
    'not a url',
    'https://localhost/x',
    'https://LOCALHOST./x'.replace('./x', '/x'),
    'https://127.0.0.1/x',
    'https://10.0.0.5/x',
    'https://172.16.0.1/x',
    'https://172.31.255.255/x',
    'https://192.168.1.1/x',
    'https://169.254.169.254/latest/meta-data',
    'https://100.64.0.1/x',
    'https://0.0.0.0/x',
    'https://[::1]/x',
    'https://[fd00::1]/x',
    'https://[fe80::1]/x',
    'https://[::ffff:127.0.0.1]/x',
    'https://[::ffff:a9fe:a9fe]/latest/meta-data',
    'https://[::ffff:a00:1]/x',
    'https://[::ffff:c0a8:101]/x',
    'https://metadata/x',
    'https://printer.local/x',
    'https://db.internal/x',
    'https://user:pass@example.com/x',
  ])('blocks %s', (url) => {
    expect(isPublicHttpsUrl(url)).toBe(false)
  })
  it('does not over-block 172.x public ranges', () => {
    expect(isPublicHttpsUrl('https://[::ffff:808:808]/x')).toBe(true)
    expect(isPublicHttpsUrl('https://172.32.0.1/x')).toBe(true)
    expect(isPublicHttpsUrl('https://172.15.0.1/x')).toBe(true)
  })
})
