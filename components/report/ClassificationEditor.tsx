import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const label = Number.isInteger(litersNumber) && litersNumber >= 1 ? volumeLabelFor(litersNumber) : null
  return (
    <fieldset className="grid gap-4">
      <legend className="text-base font-semibold">Edit the classification</legend>
      <div className="grid gap-3">
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
        <p className={total === 100 ? 'text-sm' : 'text-sm font-semibold text-alert'}>Total {total}%. The six percentages must sum to 100.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="liters">Litres</Label>
        <Input id="liters" inputMode="numeric" value={liters} onChange={(event) => onLiters(event.target.value)} />
        <p className="text-sm">Label: {label ?? 'Enter a whole number of litres, at least 1.'}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="urgency">Urgency</Label>
        <select
          id="urgency"
          className="rounded-md border border-ink/15 bg-card px-3 py-2"
          value={urgency}
          onChange={(event) => onUrgency(event.target.value as Urgency)}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </div>
    </fieldset>
  )
}
