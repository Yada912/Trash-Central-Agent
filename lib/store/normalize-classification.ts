type Share = { type: string; share: number }

function isShare(value: unknown): value is Share {
  if (!value || typeof value !== 'object') return false
  const entry = value as { type?: unknown; share?: unknown }
  return typeof entry.type === 'string' && typeof entry.share === 'number' && Number.isFinite(entry.share)
}

/** Sorts classification shares by descending share, then type name. Other fields stay as stored. */
export function normalizeStoredClassification<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  const record = value as { types?: unknown }
  if (!Array.isArray(record.types) || !record.types.every(isShare)) return value
  const types = [...record.types].sort(
    (left, right) => right.share - left.share || left.type.localeCompare(right.type),
  )
  return { ...value, types }
}
