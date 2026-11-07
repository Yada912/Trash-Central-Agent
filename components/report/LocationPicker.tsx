'use client'

import { useState } from 'react'
import { CityMap } from '@/components/map/map-loader'
import { CoordinateInputs } from '@/components/report/CoordinateInputs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { DENPASAR_REGIONS } from '@/lib/data/denpasar-regions'
import { DENPASAR_CENTER, isInsideDenpasar } from '@/lib/geo'

type LocationMode = 'pinpoint' | 'gps' | 'desa' | 'manual'

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
  const [mode, setMode] = useState<LocationMode>('pinpoint')
  const [selectedDesa, setSelectedDesa] = useState<string>('')

  const latNum = Number(lat)
  const lngNum = Number(lng)
  const hasPin =
    lat !== '' && lng !== '' && Number.isFinite(latNum) && Number.isFinite(lngNum)
  const pin = hasPin ? { lat: latNum, lng: lngNum } : null
  const isValidInDenpasar = hasPin && isInsideDenpasar(latNum, lngNum)

  function handleSetPin(nextLat: number, nextLng: number) {
    onLat(nextLat.toFixed(6))
    onLng(nextLng.toFixed(6))
  }

  function handleCenterDenpasar() {
    handleSetPin(DENPASAR_CENTER[0], DENPASAR_CENTER[1])
  }

  function handleClearPin() {
    onLat('')
    onLng('')
  }

  function handleSelectDesa(desaName: string) {
    setSelectedDesa(desaName)
    const found = DENPASAR_REGIONS.find(
      (r) => r.name.toLowerCase() === desaName.trim().toLowerCase(),
    )
    if (found) {
      handleSetPin(found.lat, found.lng)
    }
  }

  return (
    <section
      className="grid gap-4 rounded-xl border-2 border-ink bg-card p-5 shadow-[2px_2px_0_#1F2933]"
      aria-labelledby="location-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white font-black text-xs shadow-[1px_1px_0_#1F2933]">
              <MaterialIcon name="pin_drop" size="sm" />
            </span>
            <h2 id="location-heading" className="text-xl font-extrabold text-ink">
              Titik Lokasi Penjemputan
            </h2>
          </div>
          <p className="text-xs font-semibold text-ink/80">
            Tentukan koordinat penjemputan armada dengan menandai titik di peta, menggunakan GPS, atau memilih desa.
          </p>
        </div>

        {hasPin ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-black px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                isValidInDenpasar
                  ? 'bg-mint text-ink border-ink'
                  : 'bg-coral/25 text-alert border-alert'
              }`}
            >
              <MaterialIcon
                name={isValidInDenpasar ? 'check_circle' : 'warning'}
                size="sm"
                className={isValidInDenpasar ? 'text-primary' : 'text-alert'}
              />
              <span>{isValidInDenpasar ? 'Wilayah Denpasar' : 'Di Luar Denpasar'}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button
          type="button"
          onClick={() => setMode('pinpoint')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-ink text-xs font-black transition-all ${
            mode === 'pinpoint'
              ? 'bg-primary text-white shadow-[2px_2px_0_#1F2933]'
              : 'bg-bg text-ink hover:bg-mint/30'
          }`}
        >
          <MaterialIcon name="touch_app" size="sm" />
          <span>Klik di Peta</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('gps')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-ink text-xs font-black transition-all ${
            mode === 'gps'
              ? 'bg-primary text-white shadow-[2px_2px_0_#1F2933]'
              : 'bg-bg text-ink hover:bg-mint/30'
          }`}
        >
          <MaterialIcon name="my_location" size="sm" />
          <span>GPS Saya</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('desa')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-ink text-xs font-black transition-all ${
            mode === 'desa'
              ? 'bg-primary text-white shadow-[2px_2px_0_#1F2933]'
              : 'bg-bg text-ink hover:bg-mint/30'
          }`}
        >
          <MaterialIcon name="holiday_village" size="sm" />
          <span>Pilih Desa</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-ink text-xs font-black transition-all ${
            mode === 'manual'
              ? 'bg-primary text-white shadow-[2px_2px_0_#1F2933]'
              : 'bg-bg text-ink hover:bg-mint/30'
          }`}
        >
          <MaterialIcon name="edit_location" size="sm" />
          <span>Ketik Angka</span>
        </button>
      </div>

      {/* Contextual Action Panels based on Active Mode */}
      {mode === 'pinpoint' ? (
        <div className="rounded-lg border border-ink/20 bg-mint/20 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <MaterialIcon name="ads_click" className="text-primary" size="sm" />
            <span>
              {hasPin
                ? 'Klik titik lain di peta jika ingin memindahkan pin jemput.'
                : 'Ketuk atau klik langsung pada peta untuk menancapkan pin lokasi.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!hasPin ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCenterDenpasar}
                className="text-[11px] h-7 px-2 font-bold min-h-0"
              >
                <MaterialIcon name="near_me" size="sm" />
                <span>Titik Tengah Kota</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearPin}
                className="text-[11px] h-7 px-2 font-bold min-h-0 text-alert hover:bg-coral/20"
              >
                <MaterialIcon name="clear" size="sm" />
                <span>Hapus Pin</span>
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {mode === 'gps' ? (
        <div className="rounded-lg border border-ink/20 bg-lavender/25 p-3 text-xs grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink">
              Deteksi koordinat tempat Anda berada sekarang melalui sensor peramban:
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={onGeolocate}
              className="text-xs font-black flex items-center gap-1.5 py-1.5 px-3 min-h-0"
            >
              <MaterialIcon name="gps_fixed" size="sm" />
              <span>Ambil Koordinat GPS Sekarang</span>
            </Button>
          </div>
          {geoMessage ? (
            <p className="text-[11px] font-bold text-primary">{geoMessage}</p>
          ) : null}
        </div>
      ) : null}

      {mode === 'desa' ? (
        <div className="rounded-lg border border-ink/20 bg-amber/25 p-3 text-xs grid gap-2">
          <Label htmlFor="quick-desa-select" className="font-black text-ink">
            Pusatkan Peta ke Pusat Kelurahan / Desa:
          </Label>
          <div className="grid sm:grid-cols-2 gap-2">
            <Select
              id="quick-desa-select"
              value={selectedDesa}
              onChange={(e) => handleSelectDesa(e.target.value)}
            >
              <option value="">-- Pilih Kelurahan / Desa di Denpasar --</option>
              {DENPASAR_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.kecamatan})
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-ink/80 flex items-center">
              Memilih desa akan menaruh pin awal di sentra desa tersebut; Anda dapat mengetuk gang/rumah terdekat pada peta.
            </p>
          </div>
        </div>
      ) : null}

      {mode === 'manual' ? (
        <div className="rounded-lg border border-ink/20 bg-bg p-3 grid gap-2">
          <CoordinateInputs lat={lat} lng={lng} onLat={onLat} onLng={onLng} />
          <p className="text-[11px] text-ink/70">
            Batas daratan Kota Denpasar: Lintang -8.750000 s/d -8.570000, Bujur 115.160000 s/d 115.280000.
          </p>
        </div>
      ) : null}

      {/* The Interactive Map */}
      <div className="relative rounded-xl border-2 border-ink overflow-hidden shadow-[2px_2px_0_#1F2933]">
        <CityMap
          height="340px"
          pin={pin}
          onPick={(nextLat, nextLng) => {
            handleSetPin(nextLat, nextLng)
          }}
        />

        {/* Floating Pin Guidance Badge on Map */}
        <div className="absolute top-2.5 left-2.5 z-[1000] pointer-events-none">
          <div className="rounded-lg border-2 border-ink bg-card/95 px-3 py-1.5 text-[11px] font-black text-ink shadow-[2px_2px_0_#1F2933] backdrop-blur-sm flex items-center gap-1.5">
            <MaterialIcon name="place" className="text-primary" size="sm" />
            <span>
              {hasPin
                ? `Pin: ${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`
                : 'Klik peta untuk menancapkan pin'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Coordinate Bar & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ink/10 text-xs font-semibold text-ink">
        <div className="flex items-center gap-2">
          <span className="font-extrabold">Koordinat Terpilih:</span>
          {hasPin ? (
            <code className="rounded bg-bg border border-ink/30 px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
              {latNum.toFixed(6)}, {lngNum.toFixed(6)}
            </code>
          ) : (
            <span className="text-ink/60 italic">Belum ditentukan</span>
          )}
        </div>

        {hasPin && !isValidInDenpasar ? (
          <p className="text-alert font-bold text-xs flex items-center gap-1">
            <MaterialIcon name="error" size="sm" />
            <span>Titik berada di luar batas daratan Kota Denpasar.</span>
          </p>
        ) : null}
      </div>
    </section>
  )
}
