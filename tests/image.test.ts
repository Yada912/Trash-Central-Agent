import { describe, expect, it } from 'vitest'
import { decodedBase64Bytes, imageFieldErrors } from '@/lib/api/image'

describe('image limits', () => {
  it('counts decoded bytes and rejects a data-url prefix or an oversized photo', () => {
    expect(decodedBase64Bytes('YQ==')).toBe(1)
    expect(decodedBase64Bytes('data:image/jpeg;base64,YQ==')).toBeNull()
    const oversized = Buffer.alloc(3_000_001).toString('base64')
    expect(imageFieldErrors({ base64: oversized, mimeType: 'image/jpeg' })?.image?.[0]).toMatch(/3000000/)
    expect(imageFieldErrors({ base64: 'YQ==', mimeType: 'image/jpeg' })).toBeNull()
  })
})
