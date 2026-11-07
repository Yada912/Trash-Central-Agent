import type { Classification, InsufficientMissing } from '@/lib/schemas'

const MISSING_TEXT: Record<InsufficientMissing, string> = {
  type: 'what kind of waste it is',
  volume: 'how much there is',
  location_context: 'where it is sitting',
}

export function ClassificationStatus({
  busy,
  heading,
  demoLabel,
  notTrashReason,
  insufficient,
  classification,
}: {
  busy: boolean
  heading: string
  demoLabel?: string | null
  notTrashReason: string | null
  insufficient: { reason: string; missing: readonly InsufficientMissing[] } | null
  classification: Classification | null
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4" aria-labelledby="classification-heading" aria-busy={busy}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Classifier result</p>
      <h2 id="classification-heading" className="text-xl font-semibold">
        {heading}
      </h2>
      {demoLabel ? <p className="text-sm font-semibold">{demoLabel}</p> : null}
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
          <p className={classification.confidence < 0.5 ? 'font-semibold text-alert' : 'font-semibold'}>
            Confidence: {Math.round(classification.confidence * 100)}% ({classification.confidence.toFixed(2)})
            {classification.confidence < 0.5 ? ' — low' : ''}
          </p>
          <p>Rationale: {classification.rationale}</p>
          <p>Classifier flags: {classification.flags.length > 0 ? classification.flags.join(', ') : 'none'}</p>
          <p>This result stays as it was returned. Edits below change the confirmed shares, volume, urgency, and flags.</p>
        </div>
      ) : null}
    </section>
  )
}
