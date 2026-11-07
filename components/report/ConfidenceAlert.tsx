import type { ReviewReason } from '@/lib/schemas'

const REASON_TEXT: Record<ReviewReason, string> = {
  low_confidence: 'confidence is under 0.5',
  hazardous: 'hazardous material is indicated',
  insufficient_text: 'the description is very short and there is no photo',
  contradictory: 'the description and photo disagree',
  low_image_quality: 'the photo is hard to read',
}

export function ConfidenceAlert({
  needsReview,
  reasons,
}: {
  needsReview: boolean
  reasons: readonly ReviewReason[]
}) {
  if (!needsReview) return null
  return (
    <p role="status" className="rounded-md border border-alert px-3 py-2 text-sm font-semibold text-alert">
      Please double-check this before you submit. {reasons.map((reason) => REASON_TEXT[reason]).join('; ')}.
    </p>
  )
}
