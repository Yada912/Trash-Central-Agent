import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function DescriptionField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="description">Apa yang Anda lihat?</Label>
      <Textarea
        id="description"
        name="description"
        maxLength={1000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Contoh: tumpukan botol plastik dan sisa makanan di tepi gang"
      />
      <p className="text-sm text-ink/80">{value.trim().length} / 1000</p>
    </div>
  )
}
