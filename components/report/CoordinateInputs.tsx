import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CoordinateInputs({
  lat,
  lng,
  onLat,
  onLng,
}: {
  lat: string
  lng: string
  onLat: (value: string) => void
  onLng: (value: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="lat">Lintang (Latitude)</Label>
        <Input
          id="lat"
          name="lat"
          inputMode="decimal"
          value={lat}
          onChange={(event) => onLat(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lng">Bujur (Longitude)</Label>
        <Input
          id="lng"
          name="lng"
          inputMode="decimal"
          value={lng}
          onChange={(event) => onLng(event.target.value)}
        />
      </div>
    </div>
  )
}
