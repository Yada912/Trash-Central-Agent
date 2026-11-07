export type IdempotencyState = { key: string; fingerprint: string }

export function reportPayloadFingerprint(input: {
  text: string
  lat: number
  lng: number
  imageBase64: string | null
  classification: unknown
  aiClassification: unknown
  accountType?: 'household' | 'company'
}): string {
  return JSON.stringify(input)
}

/** Keep the key for a retry of the same payload. A changed payload gets nextKey. */
export function nextIdempotencyState(current: IdempotencyState | null, fingerprint: string, nextKey: string): IdempotencyState {
  if (current && current.fingerprint === fingerprint) return current
  return { key: nextKey, fingerprint }
}
