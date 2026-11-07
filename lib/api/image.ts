import { MAX_IMAGE_BYTES } from '@/lib/limits'
import type { ClassificationFlag } from '@/lib/schemas'

export function decodedBase64Bytes(base64: string): number | null {
  if (base64.includes('data:') || base64.includes(',') || /\s/.test(base64)) return null
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) return null
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length / 4) * 3 - padding
}

export function decodeBase64(base64: string): Uint8Array | null {
  if (decodedBase64Bytes(base64) === null) return null
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value)
}

export function imageMagicMatches(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return hasPrefix(bytes, [0xff, 0xd8, 0xff])
  if (mimeType === 'image/png') return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (mimeType === 'image/webp') {
    return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes.length >= 12 && hasPrefix(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  }
  return false
}

export function imageFieldErrors(image: { base64: string; mimeType: string } | undefined): Record<string, string[]> | null {
  if (!image) return null
  const bytes = decodeBase64(image.base64)
  if (!bytes) {
    return { image: ['Send the photo as base64 without a data: prefix.'] }
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { image: ['The decoded photo is larger than 3000000 bytes.'] }
  }
  if (!imageMagicMatches(bytes, image.mimeType)) {
    return { image: ['The photo bytes do not match a JPEG, PNG, or WebP file.'] }
  }
  return null
}

/** A saved photo must not keep or gain the no_image flag. */
export function flagsForSavedReport(flags: readonly ClassificationFlag[], hasImage: boolean): ClassificationFlag[] {
  if (!hasImage) return [...flags]
  return flags.filter((flag) => flag !== 'no_image')
}
