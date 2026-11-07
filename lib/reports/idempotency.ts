/** Header Idempotency-Key wins. Otherwise the body field is used. */
export function idempotencyKeyFrom(header: string | null, clientRequestId?: string): string | null {
  const fromHeader = header?.trim()
  if (fromHeader) return fromHeader
  const fromBody = clientRequestId?.trim()
  return fromBody ? fromBody : null
}
