import { reasonSentence } from '@/components/report/report-labels'

export function ConfidenceAlert({
  needsReview,
  reasons,
  textLength,
  hasImage,
}: {
  needsReview: boolean
  reasons: readonly string[]
  textLength: number
  hasImage: boolean
}) {
  if (!needsReview) return null
  const detail = reasons.map((reason) => reasonSentence(reason, { textLength, hasImage })).join('; ')
  return (
    <p role="status" className="rounded-lg border border-alert/30 bg-alert/10 px-4 py-3 text-sm font-semibold text-alert">
      Please double-check this before you submit. {detail}.
    </p>
  )
}
