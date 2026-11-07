import { describe, expect, it } from 'vitest'
import { decodedBase64Bytes, flagsForSavedReport, imageFieldErrors } from '@/lib/api/image'

describe('image limits', () => {
  it('counts decoded bytes and rejects a data-url prefix or an oversized photo', () => {
    expect(decodedBase64Bytes('YQ==')).toBe(1)
    expect(decodedBase64Bytes('data:image/jpeg;base64,YQ==')).toBeNull()
    const oversized = Buffer.alloc(3_000_001).toString('base64')
    expect(imageFieldErrors({ base64: oversized, mimeType: 'image/jpeg' })?.image?.[0]).toMatch(/3000000/)
    expect(imageFieldErrors({ base64: 'YQ==', mimeType: 'image/jpeg' })?.image?.[0]).toMatch(/do not match/)
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')
    expect(imageFieldErrors({ base64: jpeg, mimeType: 'image/jpeg' })).toBeNull()
    expect(imageFieldErrors({ base64: Buffer.from('notanimage').toString('base64'), mimeType: 'image/png' })?.image?.[0]).toMatch(/do not match/)
    expect(flagsForSavedReport(['no_image', 'hazardous_present'], true)).toEqual(['hazardous_present'])
    expect(flagsForSavedReport(['no_image'], false)).toEqual(['no_image'])
    expect(flagsForSavedReport([], false)).toEqual(['no_image'])
    expect(flagsForSavedReport(['low_image_quality', 'no_image'], false)).toEqual(['no_image'])
    expect(flagsForSavedReport(['low_image_quality'], true)).toEqual(['low_image_quality'])
  })
})
