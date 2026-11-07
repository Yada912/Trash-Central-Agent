import type { Classification, InsufficientMissing } from '@/lib/schemas'

const MISSING_TEXT: Record<InsufficientMissing, string> = {
  type: 'jenis sampah',
  volume: 'perkiraan volume',
  location_context: 'konteks lokasi',
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
    <section
      className="grid gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4"
      aria-labelledby="classification-heading"
      aria-busy={busy}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Hasil klasifikasi
      </p>
      <h2 id="classification-heading" className="text-xl font-semibold">
        {heading}
      </h2>
      {demoLabel ? <p className="text-sm font-semibold">{demoLabel}</p> : null}
      {busy ? <p>Mengklasifikasikan…</p> : null}
      {notTrashReason ? (
        <div className="grid gap-2">
          <p>{notTrashReason}</p>
          <p>
            Anda dapat mengisi detail secara manual. Teks dan foto Anda tetap tersimpan.
          </p>
        </div>
      ) : null}
      {insufficient ? (
        <div className="grid gap-2">
          <p>{insufficient.reason}</p>
          <p>
            Tambahkan foto atau deskripsi yang lebih rinci, atau isi secara manual. Informasi
            yang masih dibutuhkan:{' '}
            {insufficient.missing.map((item) => MISSING_TEXT[item]).join('; ')}. Teks dan
            foto Anda tetap tersimpan.
          </p>
        </div>
      ) : null}
      {classification ? (
        <div className="grid gap-1 text-sm">
          <p
            className={
              classification.confidence < 0.5
                ? 'font-semibold text-alert'
                : 'font-semibold'
            }
          >
            Keyakinan: {Math.round(classification.confidence * 100)}% (
            {classification.confidence.toFixed(2)})
            {classification.confidence < 0.5 ? ' — rendah' : ''}
          </p>
          <p>Alasan: {classification.rationale}</p>
          <p>
            Classifier flags:{' '}
            {classification.flags.length > 0 ? classification.flags.join(', ') : 'none'}
          </p>
          <p>
            Hasil awal ini tetap disimpan apa adanya. Perubahan di bawah akan memperbarui
            proporsi, volume, urgensi, dan flag terkonfirmasi.
          </p>
        </div>
      ) : null}
    </section>
  )
}
