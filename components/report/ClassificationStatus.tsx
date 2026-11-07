import type { Classification } from '@/lib/schemas'

export function ClassificationStatus({
  busy,
  notTrashReason,
  classification,
}: {
  busy: boolean
  notTrashReason: string | null
  classification: Classification | null
}) {
  return (
    <section className="grid gap-2" aria-labelledby="classification-heading" aria-busy={busy}>
      <h2 id="classification-heading" className="text-xl font-semibold">
        Classification
      </h2>
      {busy ? <p>Classifying…</p> : null}
      {notTrashReason ? (
        <p>
          This does not look like waste: {notTrashReason} You can enter the details yourself. Your text and photo stay as they are.
        </p>
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
