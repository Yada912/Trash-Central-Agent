import {
  REVIEW_CONFIDENCE_THRESHOLD,
  type Classification,
  type ClassificationSource,
  type ReviewReason,
} from '@/lib/schemas'

export type ReviewInput = {
  confidence: number
  types: ReadonlyArray<{ type: string; share: number }>
  flags: readonly string[]
  text: string
  hasImage: boolean
}

export function reviewReasonsFor(input: ReviewInput): ReviewReason[] {
  const reasons: ReviewReason[] = []
  if (input.confidence < REVIEW_CONFIDENCE_THRESHOLD) reasons.push('low_confidence')
  const hazardousShare = input.types.find((entry) => entry.type === 'hazardous')?.share ?? 0
  if (hazardousShare > 0 || input.flags.includes('hazardous_present')) reasons.push('hazardous')
  if (input.flags.includes('insufficient_text') || (input.text.trim().length < 10 && !input.hasImage)) {
    reasons.push('insufficient_text')
  }
  if (input.flags.includes('contradictory')) reasons.push('contradictory')
  if (input.flags.includes('low_image_quality')) reasons.push('low_image_quality')
  return reasons
}

export function stampClassification(
  classification: Omit<Classification, 'needsReview' | 'reviewReasons' | 'source'> &
    Partial<Pick<Classification, 'needsReview' | 'reviewReasons' | 'source'>>,
  context: { text: string; hasImage: boolean; source: ClassificationSource },
): Classification {
  const reviewReasons = reviewReasonsFor({
    confidence: classification.confidence,
    types: classification.types,
    flags: classification.flags,
    text: context.text,
    hasImage: context.hasImage,
  })
  return {
    ...classification,
    source: context.source,
    reviewReasons,
    needsReview: reviewReasons.length > 0,
  }
}
