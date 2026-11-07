import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function DescriptionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="description">What do you see?</Label>
      <Textarea
        id="description"
        name="description"
        maxLength={1000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: a pile of plastic bottles beside the lane"
      />
      <p className="text-sm text-ink/80">{value.trim().length} / 1000</p>
    </div>
  )
}
