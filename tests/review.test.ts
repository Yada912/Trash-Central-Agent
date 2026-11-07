import { describe, expect, it } from 'vitest'
import { REVIEW_CONFIDENCE_THRESHOLD } from '@/lib/schemas'
import { reviewReasonsFor, stampClassification } from '@/lib/review'

const base = {
  confidence: REVIEW_CONFIDENCE_THRESHOLD,
  types: [{ type: 'plastic', share: 1 }],
  flags: ['no_image'],
  text: 'A pile of plastic bottles beside the lane',
  hasImage: false,
}

describe('reviewReasonsFor', () => {
  it('stays quiet at 0.5 confidence and does not treat no_image alone as review', () => {
    expect(REVIEW_CONFIDENCE_THRESHOLD).toBe(0.5)
    const reasons = reviewReasonsFor(base)
    expect(reasons).toEqual([])
    expect(
      stampClassification(
        { ...sample(), confidence: 0.5 },
        { text: base.text, hasImage: false, source: 'manual' },
      ).needsReview,
    ).toBe(false)
  })

  it('flags confidence only when it is strictly below 0.5', () => {
    expect(reviewReasonsFor({ ...base, confidence: 0.49 })).toEqual(['low_confidence'])
    expect(reviewReasonsFor({ ...base, confidence: 0.5 })).toEqual([])
  })

  it('flags hazardous material, weak text, contradictions, and a poor photo', () => {
    expect(reviewReasonsFor({ ...base, types: [{ type: 'hazardous', share: 0.01 }] })).toEqual(['hazardous'])
    expect(reviewReasonsFor({ ...base, flags: ['hazardous_present'] })).toEqual(['hazardous'])
    expect(reviewReasonsFor({ ...base, text: 'too short', hasImage: false })).toEqual(['insufficient_text'])
    expect(reviewReasonsFor({ ...base, text: 'too short', hasImage: true })).toEqual([])
    expect(reviewReasonsFor({ ...base, flags: ['insufficient_text'] })).toEqual(['insufficient_text'])
    expect(reviewReasonsFor({ ...base, flags: ['contradictory'] })).toEqual(['contradictory'])
    expect(reviewReasonsFor({ ...base, flags: ['low_image_quality'] })).toEqual(['low_image_quality'])
  })

  it('sets needsReview only when at least one reason is present', () => {
    const stamped = stampClassification(sample(), {
      text: 'hi',
      hasImage: false,
      source: 'mock',
    })
    expect(stamped.reviewReasons).toEqual(['low_confidence', 'insufficient_text'])
    expect(stamped.needsReview).toBe(true)
    expect(stamped.source).toBe('mock')
  })
})

function sample() {
  return {
    types: [{ type: 'residual' as const, share: 1 }],
    volume: { liters: 50, label: 'medium' as const },
    urgency: 'medium' as const,
    confidence: 0,
    rationale: 'Entered manually by the resident.',
    flags: [] as Array<'no_image'>,
  }
}
