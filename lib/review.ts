import { flagsForSavedReport } from '@/lib/api/image'
import {
  CLASSIFICATION_FLAGS,
  REVIEW_CONFIDENCE_THRESHOLD,
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

export function normalizeClassificationFlags(
  flags: readonly ClassificationFlag[],
  context: { hasImage: boolean; hazardousShare: number },
): ClassificationFlag[] {
  const selected = new Set(flagsForSavedReport(flags, context.hasImage))
  if (context.hazardousShare > 0) selected.add('hazardous_present')
  return CLASSIFICATION_FLAGS.filter((flag) => selected.has(flag))
}

export function stampClassification(
  classification: Omit<Classification, 'needsReview' | 'reviewReasons' | 'source'> &
    Partial<Pick<Classification, 'needsReview' | 'reviewReasons' | 'source'>>,
  context: { text: string; hasImage: boolean; source: ClassificationSource },
): Classification {
  const hazardousShare = classification.types.find((entry) => entry.type === 'hazardous')?.share ?? 0
  const flags = normalizeClassificationFlags(classification.flags, {
    hasImage: context.hasImage,
    hazardousShare,
  })
  const reviewReasons = reviewReasonsFor({
    confidence: classification.confidence,
    types: classification.types,
    flags,
    text: context.text,
    hasImage: context.hasImage,
  })
  return {
    ...classification,
    flags,
    source: context.source,
    reviewReasons,
    needsReview: reviewReasons.length > 0,
  }
}
