import type { Classification } from '@/lib/schemas'

function canonical(classification: Classification): string {
  const types = classification.types
    .map((entry) => ({ type: entry.type, share: entry.share }))
    .sort((a, b) => b.share - a.share || a.type.localeCompare(b.type))
  return JSON.stringify({
    types,
    liters: classification.volume.liters,
    label: classification.volume.label,
    urgency: classification.urgency,
  })
}

export function classificationWasEdited(submitted: Classification, ai?: Classification): boolean {
  if (!ai) return false
  return canonical(submitted) !== canonical(ai)
}
