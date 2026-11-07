import { flagsForSavedReport } from '@/lib/api/image'
import {
  CLASSIFICATION_FLAGS,
  REVIEW_CONFIDENCE_THRESHOLD,
  isHazardousClassification,
  type Classification,
  type ClassificationFlag,
  type ClassificationSource,
  type ReviewReason,
} from '@/lib/schemas'

export type ReviewInput = {
  confidence: number
  types: ReadonlyArray<{ type: string; share: number }>
  flags: readonly string[]
  text: string
  hasImage: boolean
  aiClassification?: { types: ReadonlyArray<{ type: string; share: number }>; flags: readonly string[] }
}

export function reviewReasonsFor(input: ReviewInput): ReviewReason[] {
  const reasons: ReviewReason[] = []
  if (input.confidence < REVIEW_CONFIDENCE_THRESHOLD) reasons.push('low_confidence')
  const confirmedHazardous = isHazardousClassification({ types: input.types, flags: input.flags })
  if (confirmedHazardous) reasons.push('hazardous')
  else if (input.aiClassification && isHazardousClassification(input.aiClassification)) {
    reasons.push('hazard_cleared_by_resident')
  }
  if (input.flags.includes('insufficient_text') || (input.text.trim().length < 10 && !input.hasImage)) {
    reasons.push('insufficient_text')
  }
  if (input.flags.includes('contradictory')) reasons.push('contradictory')
  if (input.flags.includes('low_image_quality')) reasons.push('low_image_quality')
  return reasons
}

export function normalizeClassificationFlags(
  flags: readonly ClassificationFlag[],
  context: { hasImage: boolean; types: ReadonlyArray<{ type: string; share: number }> },
): ClassificationFlag[] {
  const selected = new Set(flagsForSavedReport(flags, context.hasImage))
  // Share above 0 forces the flag. Share 0 keeps an explicit flag and drops it
  // only when the submitted flags omit it (an explicit uncheck).
  if (isHazardousClassification({ types: context.types, flags: [] })) selected.add('hazardous_present')
  return CLASSIFICATION_FLAGS.filter((flag) => selected.has(flag))
}

export function stampClassification(
  classification: Omit<Classification, 'needsReview' | 'reviewReasons' | 'source'> &
    Partial<Pick<Classification, 'needsReview' | 'reviewReasons' | 'source'>>,
  context: {
    text: string
    hasImage: boolean
    source: ClassificationSource
    aiClassification?: { types: ReadonlyArray<{ type: string; share: number }>; flags: readonly string[] }
  },
): Classification {
  const flags = normalizeClassificationFlags(classification.flags, {
    hasImage: context.hasImage,
    types: classification.types,
  })
  const reviewReasons = reviewReasonsFor({
    confidence: classification.confidence,
    types: classification.types,
    flags,
    text: context.text,
    hasImage: context.hasImage,
    aiClassification: context.aiClassification,
  })
  return {
    ...classification,
    flags,
    source: context.source,
    reviewReasons,
    needsReview: reviewReasons.length > 0,
  }
}
