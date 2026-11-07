import { MAX_IMAGE_BYTES } from '@/lib/limits'

export function decodedBase64Bytes(base64: string): number | null {
  if (base64.includes('data:') || base64.includes(',') || /\s/.test(base64)) return null
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) return null
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length / 4) * 3 - padding
}

export function imageFieldErrors(image: { base64: string; mimeType: string } | undefined): Record<string, string[]> | null {
  if (!image) return null
  const bytes = decodedBase64Bytes(image.base64)
  if (bytes === null) {
    return { image: ['Send the photo as base64 without a data: prefix.'] }
  }
  if (bytes > MAX_IMAGE_BYTES) {
    return { image: ['The decoded photo is larger than 3000000 bytes.'] }
  }
  return null
}
