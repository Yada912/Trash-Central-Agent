import { describe, expect, it } from 'vitest'
import { classificationSchema } from '@/lib/schemas'
import { normalizeStoredClassification } from '@/lib/store/normalize-classification'

const stored = {
  types: [
    { type: 'plastic', share: 0.2 },
    { type: 'organic', share: 0.8 },
  ],
  volume: { liters: 40, label: 'small' },
  urgency: 'low',
  confidence: 0.8,
  rationale: 'Synthetic demo fixture. Not a model classification.',
  flags: ['no_image'],
  needsReview: false,
  reviewReasons: [],
  source: 'mock',
}

describe('stored classification order', () => {
  it('sorts shares before schema validation instead of rejecting the row', () => {
    expect(classificationSchema.safeParse(stored).success).toBe(false)
    const normalized = normalizeStoredClassification(stored)
    expect(normalized.types.map((entry) => entry.type)).toEqual(['organic', 'plastic'])
    expect(classificationSchema.safeParse(normalized).success).toBe(true)
  })
})
