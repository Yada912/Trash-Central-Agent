import { createHash } from 'node:crypto'

/** Header Idempotency-Key wins. Otherwise the body field is used. */
export function idempotencyKeyFrom(header: string | null, clientRequestId?: string): string | null {
  const fromHeader = header?.trim()
  if (fromHeader) return fromHeader
  const fromBody = clientRequestId?.trim()
  return fromBody ? fromBody : null
}

/** Stable hash of the submitted report. Review fields and the idempotency key are excluded. */
export function canonicalReportBodyHash(body: {
  text: string
  lat: number
  lng: number
  image?: { base64: string; mimeType: string }
  accountType?: string
  classification: {
    types: Array<{ type: string; share: number }>
    volume: { liters: number; label: string }
    urgency: string
    confidence: number
    rationale: string
    flags: readonly string[]
  }
}): string {
  const canonical = {
    classification: {
      confidence: body.classification.confidence,
      flags: [...body.classification.flags].sort(),
      rationale: body.classification.rationale,
      types: [...body.classification.types]
        .map((entry) => ({ share: entry.share, type: entry.type }))
        .sort((a, b) => a.type.localeCompare(b.type) || a.share - b.share),
      urgency: body.classification.urgency,
      volume: body.classification.volume,
    },
    accountType: body.accountType ?? 'household',
    image: body.image ? { base64: body.image.base64, mimeType: body.image.mimeType } : null,
    lat: body.lat,
    lng: body.lng,
    text: body.text,
  }
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}
