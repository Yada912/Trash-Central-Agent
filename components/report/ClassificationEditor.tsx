import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TRASH_TYPES, volumeLabelFor, type TrashType, type Urgency } from '@/lib/schemas'

export function ClassificationEditor({
  percents,
  liters,
  urgency,
  onPercent,
  onLiters,
  onUrgency,
}: {
  percents: Record<TrashType, number>
  liters: string
  urgency: Urgency
  onPercent: (type: TrashType, value: string) => void
  onLiters: (value: string) => void
  onUrgency: (value: Urgency) => void
}) {
  const total = TRASH_TYPES.reduce((sum, type) => sum + percents[type], 0)
  const litersNumber = Number(liters)
  const label =
    Number.isInteger(litersNumber) && litersNumber >= 1
      ? volumeLabelFor(litersNumber)
      : null
  const summary = TRASH_TYPES.filter((type) => percents[type] > 0)
    .map((type) => `${type} ${percents[type]}%`)
    .join(' / ')
  return (
    <fieldset className="grid gap-4 rounded-lg border border-ink/10 bg-card p-4">
      <legend className="px-1 text-base font-semibold">Edit klasifikasi</legend>
      <p className="text-sm font-semibold">{summary || 'Belum ada proporsi'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TRASH_TYPES.map((type) => (
          <div key={type} className="grid grid-cols-[1fr_6rem] items-center gap-2">
            <Label htmlFor={`share-${type}`}>{type} %</Label>
            <Input
              id={`share-${type}`}
              inputMode="numeric"
              value={String(percents[type])}
              onChange={(event) => onPercent(type, event.target.value)}
            />
          </div>
        ))}
      </div>
      <p className={total === 100 ? 'text-sm' : 'text-sm font-semibold text-alert'}>
        Total {total}%. Keenam persentase harus berjumlah 100.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="liters">Volume (liter)</Label>
          <Input
            id="liters"
            inputMode="numeric"
            value={liters}
            onChange={(event) => onLiters(event.target.value)}
          />
          <p className="text-sm">
            Label: {label ?? 'Masukkan angka bulat liter, minimal 1.'}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="urgency">Urgensi</Label>
          <Select
            id="urgency"
            value={urgency}
            onChange={(event) => onUrgency(event.target.value as Urgency)}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </Select>
        </div>
      </div>
    </fieldset>
  )
}
