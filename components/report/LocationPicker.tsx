import { CityMap } from '@/components/map/map-loader'
import { CoordinateInputs } from '@/components/report/CoordinateInputs'
import { Button } from '@/components/ui/button'

export function LocationPicker({
  lat,
  lng,
  onLat,
  onLng,
  onGeolocate,
  geoMessage,
}: {
  lat: string
  lng: string
  onLat: (value: string) => void
  onLng: (value: string) => void
  onGeolocate: () => void
  geoMessage: string | null
}) {
  const latNum = Number(lat)
  const lngNum = Number(lng)
  const pin =
    Number.isFinite(latNum) && Number.isFinite(lngNum) && lat !== '' && lng !== ''
      ? { lat: latNum, lng: lngNum }
      : null
  return (
    <section
      className="grid gap-4 rounded-lg border border-ink/10 bg-card p-4"
      aria-labelledby="location-heading"
    >
      <div className="grid gap-2">
        <h2 id="location-heading" className="text-xl font-semibold">
          Lokasi
        </h2>
        <p className="text-sm">
          Lokasi hanya diperlukan saat Anda mengirim laporan. Geolokasi bersifat opsional —
          Anda dapat menaruh pin di peta atau mengetik koordinat.
        </p>
        <p className="text-sm">
          Batas wilayah Denpasar: lintang -8.75 s/d -8.57, bujur 115.16 s/d 115.28.
        </p>
      </div>
      <Button variant="secondary" onClick={onGeolocate}>
        Gunakan lokasi saya
      </Button>
      {geoMessage ? <p className="text-sm">{geoMessage}</p> : null}
      <CityMap
        height="280px"
        pin={pin}
        onPick={(nextLat, nextLng) => {
          onLat(nextLat.toFixed(6))
          onLng(nextLng.toFixed(6))
        }}
      />
      <CoordinateInputs lat={lat} lng={lng} onLat={onLat} onLng={onLng} />
    </section>
  )
}
