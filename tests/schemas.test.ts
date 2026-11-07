import { describe, expect, it } from 'vitest'
import {
  classificationSchema,
  createReportSchema,
  decisionRequestSchema,
  explainRequestSchema,
  planRequestSchema,
  volumeLabelFor,
} from '@/lib/schemas'

const baseClassification = {
  types: [{ type: 'residual' as const, share: 1 }],
  volume: { liters: 50, label: 'medium' as const },
  urgency: 'medium' as const,
  confidence: 0.5,
  rationale: 'Checked by the resident.',
  flags: [] as const,
  needsReview: false,
  reviewReasons: [] as const,
  source: 'manual' as const,
}

describe('schemas', () => {
  it('accepts a classification and derives volume labels', () => {
    expect(classificationSchema.parse(baseClassification).volume.label).toBe('medium')
    expect(volumeLabelFor(49)).toBe('small')
    expect(volumeLabelFor(50)).toBe('medium')
    expect(volumeLabelFor(300)).toBe('medium')
    expect(volumeLabelFor(301)).toBe('large')
  })

  it('rejects share, order, and label mistakes', () => {
    expect(classificationSchema.safeParse({ ...baseClassification, types: [{ type: 'residual', share: 0.5 }] }).success).toBe(false)
    expect(
      classificationSchema.safeParse({
        ...baseClassification,
        types: [
          { type: 'organic', share: 0.4 },
          { type: 'plastic', share: 0.6 },
        ],
      }).success,
    ).toBe(false)
    expect(
      classificationSchema.safeParse({
        ...baseClassification,
        types: [
          { type: 'organic', share: 0.667 },
          { type: 'plastic', share: 0.333 },
        ],
      }).success,
    ).toBe(false)
    expect(classificationSchema.safeParse({ ...baseClassification, volume: { liters: 10, label: 'medium' } }).success).toBe(false)
    expect(classificationSchema.safeParse({ ...baseClassification, volume: { liters: 301, label: 'medium' } }).success).toBe(false)
    expect(classificationSchema.safeParse({ ...baseClassification, volume: { liters: 301, label: 'large' } }).success).toBe(true)
  })

  it('keeps reports inside the Denpasar bbox and photos to allowed types', () => {
    const report = {
      text: 'A pile of plastic',
      lat: -8.65,
      lng: 115.21,
      classification: baseClassification,
    }
    expect(createReportSchema.safeParse(report).success).toBe(true)
    expect(createReportSchema.safeParse({ ...report, lat: -8.8 }).success).toBe(false)
    expect(createReportSchema.safeParse({ ...report, image: { base64: 'YQ==', mimeType: 'image/gif' } }).success).toBe(false)
  })

  it('requires unique truck ids, a real shift, an empty explain body, and a reject note', () => {
    expect(
      planRequestSchema.safeParse({
        trucks: [
          { id: 'a', capacityLiters: 10 },
          { id: 'a', capacityLiters: 10 },
        ],
        crews: 1,
        shift: { start: '06:00', end: '07:00' },
      }).success,
    ).toBe(false)
    expect(
      planRequestSchema.safeParse({
        trucks: [{ id: 'a', capacityLiters: 10 }],
        crews: 1,
        shift: { start: '08:00', end: '08:00' },
      }).success,
    ).toBe(false)
    expect(explainRequestSchema.safeParse({}).success).toBe(true)
    expect(explainRequestSchema.safeParse({ extra: true }).success).toBe(false)
    expect(decisionRequestSchema.safeParse({ action: 'reject' }).success).toBe(false)
    expect(decisionRequestSchema.safeParse({ action: 'reject', note: 'The shift is too short.' }).success).toBe(true)
  })
})
