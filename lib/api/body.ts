import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { imageFieldErrors } from '@/lib/api/image'
import { jsonErr } from '@/lib/api/respond'
import { MAX_BODY_BYTES } from '@/lib/limits'
import { zodFieldErrors } from '@/lib/schemas'

export async function readJson(
  request: Request,
  requestId: string,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const declared = request.headers.get('content-length')
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: jsonErr(requestId, 413, 'PAYLOAD_TOO_LARGE', 'The request body is larger than 4.2 MB.'),
    }
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: jsonErr(requestId, 413, 'PAYLOAD_TOO_LARGE', 'The request body is larger than 4.2 MB.'),
    }
  }
  if (!raw.trim()) return { ok: true, value: {} }
  try {
    return { ok: true, value: JSON.parse(raw) as unknown }
  } catch {
    return {
      ok: false,
      response: jsonErr(requestId, 400, 'VALIDATION', 'Request body must be JSON.'),
    }
  }
}

export function parseSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  requestId: string,
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonErr(requestId, 400, 'VALIDATION', 'The request is not valid.', zodFieldErrors(parsed.error)),
    }
  }
  return { ok: true, data: parsed.data }
}

export function guardImage(
  image: { base64: string; mimeType: string } | undefined,
  requestId: string,
): NextResponse | null {
  const fields = imageFieldErrors(image)
  if (!fields) return null
  return jsonErr(requestId, 400, 'VALIDATION', 'The photo is not valid.', fields)
}
