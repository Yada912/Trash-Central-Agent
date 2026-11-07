import type { Classification, InsufficientMissing } from '@/lib/schemas'

const MISSING_TEXT: Record<InsufficientMissing, string> = {
  type: 'what kind of waste it is',
  volume: 'how much there is',
  location_context: 'where it is sitting',
}

export function ClassificationStatus({
  busy,
  notTrashReason,
  insufficient,
  classification,
}: {
  busy: boolean
  notTrashReason: string | null
  insufficient: { reason: string; missing: readonly InsufficientMissing[] } | null
  classification: Classification | null
}) {
  return (
    <section className="grid gap-2" aria-labelledby="classification-heading" aria-busy={busy}>
      <h2 id="classification-heading" className="text-xl font-semibold">
        Classification
      </h2>
      {busy ? <p>Classifying…</p> : null}
      {notTrashReason ? (
        <div className="grid gap-2">
          <p>{notTrashReason}</p>
          <p>You can enter the details yourself. Your text and photo stay as they are.</p>
        </div>
      ) : null}
      {insufficient ? (
        <div className="grid gap-2">
          <p>{insufficient.reason}</p>
          <p>
            Add a photo or a bit more detail, or enter it manually. Still needed:{' '}
            {insufficient.missing.map((item) => MISSING_TEXT[item]).join('; ')}. Your text and photo stay as they are.
          </p>
        </div>
      ) : null}
      {classification ? (
        <div className="grid gap-1 text-sm">
          <p>Confidence: {classification.confidence.toFixed(2)}</p>
          <p>Rationale: {classification.rationale}</p>
          <p>Flags: {classification.flags.length > 0 ? classification.flags.join(', ') : 'none'}</p>
        </div>
      ) : null}
    </section>
  )
}
