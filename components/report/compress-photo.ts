const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 3_000_000

function renderJpeg(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('canvas'))
  context.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/jpeg', quality)
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(blob)
  })
  const comma = dataUrl.indexOf(',')
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

export async function compressPhoto(file: File): Promise<{ base64: string; mimeType: 'image/jpeg'; previewUrl: string }> {
  if (!ACCEPTED.has(file.type)) throw new Error('type')
  const bitmap = await createImageBitmap(file)
  try {
    const attempts: Array<[number, number]> = [
      [1280, 0.8],
      [1280, 0.6],
      [1024, 0.6],
      [1024, 0.45],
    ]
    for (const [maxSide, quality] of attempts) {
      const blob = await renderJpeg(bitmap, maxSide, quality)
      if (blob.size <= MAX_BYTES) {
        return { base64: await blobToBase64(blob), mimeType: 'image/jpeg', previewUrl: URL.createObjectURL(blob) }
      }
    }
    throw new Error('size')
  } finally {
    bitmap.close()
  }
}
