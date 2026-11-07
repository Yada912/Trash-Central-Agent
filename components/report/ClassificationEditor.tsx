'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { TRASH_TYPES, volumeLabelFor, type TrashType, type Urgency } from '@/lib/schemas'

const TYPE_META: Record<TrashType, { labelId: string; icon: string; color: string }> = {
  organic: { labelId: 'Organik (Sisa Makanan / Canang / Daun)', icon: 'compost', color: 'bg-mint' },
  plastic: { labelId: 'Plastik (Botol / Kresek / Kemasan)', icon: 'recycling', color: 'bg-sky' },
  paper: { labelId: 'Kertas & Kardus', icon: 'description', color: 'bg-amber' },
  metal: { labelId: 'Logam & Kaleng', icon: 'hardware', color: 'bg-lavender' },
  residual: { labelId: 'Residu (Popok / Tisu / Campuran)', icon: 'delete_sweep', color: 'bg-bg' },
  hazardous: { labelId: 'B3 Berbahaya (Baterai / Lampu / Cat)', icon: 'warning', color: 'bg-coral' },
}

type InputMode = 'bags' | 'direct_liters' | 'percent'

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
  const [inputMode, setInputMode] = useState<InputMode>('bags')
  const [bagSizeLiters, setBagSizeLiters] = useState<number>(15)

  const total = TRASH_TYPES.reduce((sum, type) => sum + percents[type], 0)
  const litersNumber = Number(liters)
  const validLiters = Number.isFinite(litersNumber) && litersNumber >= 1 ? Math.round(litersNumber) : 30
  const label =
    Number.isInteger(litersNumber) && litersNumber >= 1
      ? volumeLabelFor(litersNumber)
      : null

  const summary = TRASH_TYPES.filter((type) => percents[type] > 0)
    .map((type) => `${type} ${percents[type]}%`)
    .join(' / ')

  // Compute direct liters per trash type from current total liters and percents
  const directLitersByType: Record<TrashType, number> = {
    organic: Math.round((validLiters * percents.organic) / 100),
    plastic: Math.round((validLiters * percents.plastic) / 100),
    paper: Math.round((validLiters * percents.paper) / 100),
    metal: Math.round((validLiters * percents.metal) / 100),
    residual: Math.round((validLiters * percents.residual) / 100),
    hazardous: Math.round((validLiters * percents.hazardous) / 100),
  }

  function applyDirectLiters(nextLitersMap: Record<TrashType, number>) {
    const sumLiters = TRASH_TYPES.reduce((acc, t) => acc + Math.max(0, Math.round(nextLitersMap[t] || 0)), 0)
    if (sumLiters <= 0) {
      onLiters('15')
      for (const t of TRASH_TYPES) {
        onPercent(t, t === 'organic' ? '100' : '0')
      }
      return
    }
    onLiters(String(sumLiters))
    // Calculate rounded integer percentages that sum to exactly 100
    const rawPercents = TRASH_TYPES.map((t) => ({
      type: t,
      exact: (Math.max(0, nextLitersMap[t]) / sumLiters) * 100,
    }))
    const floored = rawPercents.map((item) => ({
      type: item.type,
      val: Math.floor(item.exact),
      rem: item.exact - Math.floor(item.exact),
    }))
    let remainder = 100 - floored.reduce((acc, item) => acc + item.val, 0)
    floored.sort((a, b) => b.rem - a.rem)
    for (let i = 0; i < floored.length && remainder > 0; i++) {
      floored[i].val += 1
      remainder -= 1
    }
    for (const item of floored) {
      onPercent(item.type, String(item.val))
    }
  }

  function adjustBags(type: TrashType, deltaBags: number) {
    const currentBags = Math.round(directLitersByType[type] / bagSizeLiters)
    const nextBags = Math.max(0, currentBags + deltaBags)
    const nextMap = { ...directLitersByType, [type]: nextBags * bagSizeLiters }
    applyDirectLiters(nextMap)
  }

  function autoBalanceTo100() {
    if (total <= 0) {
      onPercent('organic', '100')
      for (const t of TRASH_TYPES) {
        if (t !== 'organic') onPercent(t, '0')
      }
      return
    }
    const scaled = TRASH_TYPES.map((t) => ({
      type: t,
      exact: (percents[t] / total) * 100,
    }))
    const floored = scaled.map((item) => ({
      type: item.type,
      val: Math.floor(item.exact),
      rem: item.exact - Math.floor(item.exact),
    }))
    let rem = 100 - floored.reduce((acc, item) => acc + item.val, 0)
    floored.sort((a, b) => b.rem - a.rem)
    for (let i = 0; i < floored.length && rem > 0; i++) {
      floored[i].val += 1
      rem -= 1
    }
    for (const item of floored) {
      onPercent(item.type, String(item.val))
    }
  }

  return (
    <fieldset className="vector-card p-5 grid gap-5">
      <legend className="px-2 text-lg font-extrabold flex items-center gap-1.5">
        <MaterialIcon name="tune" className="text-primary" />
        Edit Klasifikasi & Takaran Sampah
      </legend>

      {/* 3-Mode Input Switcher for Easy Non-Technical Use */}
      <div className="vector-card-soft bg-bg p-3.5 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
            Pilih Cara Mengisi yang Paling Mudah bagi Anda:
          </p>
          <span className="vector-pill bg-card text-ink">{summary || 'Belum ada proporsi'}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setInputMode('bags')}
            className={
              inputMode === 'bags'
                ? 'vector-card bg-primary text-white p-2.5 text-left text-xs font-extrabold'
                : 'vector-card-soft bg-card p-2.5 text-left text-xs font-bold hover:bg-amber/30'
            }
          >
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="shopping_bag" size="sm" />
              <span>1. Hitung Kantong / Ember</span>
            </div>
            <p className={inputMode === 'bags' ? 'mt-1 text-[11px] text-white/90' : 'mt-1 text-[11px] text-ink font-semibold'}>
              Paling mudah! Cukup klik + / - jumlah kantong, persen dihitung otomatis.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('direct_liters')}
            className={
              inputMode === 'direct_liters'
                ? 'vector-card bg-primary text-white p-2.5 text-left text-xs font-extrabold'
                : 'vector-card-soft bg-card p-2.5 text-left text-xs font-bold hover:bg-amber/30'
            }
          >
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="straighten" size="sm" />
              <span>2. Nilai Langsung (Liter)</span>
            </div>
            <p className={inputMode === 'direct_liters' ? 'mt-1 text-[11px] text-white/90' : 'mt-1 text-[11px] text-ink font-semibold'}>
              Ketik liter per jenis sampah, total & persentase dihitung otomatis.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('percent')}
            className={
              inputMode === 'percent'
                ? 'vector-card bg-primary text-white p-2.5 text-left text-xs font-extrabold'
                : 'vector-card-soft bg-card p-2.5 text-left text-xs font-bold hover:bg-amber/30'
            }
          >
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="percent" size="sm" />
              <span>3. Persentase (%) Manual</span>
            </div>
            <p className={inputMode === 'percent' ? 'mt-1 text-[11px] text-white/90' : 'mt-1 text-[11px] text-ink font-semibold'}>
              Atur porsi % secara langsung + tombol seimbangkan otomatis ke 100%.
            </p>
          </button>
        </div>
      </div>

      {/* Mode 1: Easy Bag/Bucket Counter */}
      {inputMode === 'bags' ? (
        <div className="vector-card-soft bg-mint/25 p-4 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-extrabold">
              Klik tombol + / - sesuai jumlah wadah per jenis sampah:
            </p>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>Ukuran 1 wadah:</span>
              {[
                { label: 'Kantong (15L)', val: 15 },
                { label: 'Ember (25L)', val: 25 },
                { label: 'Karung (50L)', val: 50 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setBagSizeLiters(preset.val)}
                  className={
                    bagSizeLiters === preset.val
                      ? 'rounded border-2 border-ink bg-gold px-2 py-1 font-extrabold'
                      : 'rounded border border-ink bg-card px-2 py-1'
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {TRASH_TYPES.map((type) => {
              const meta = TYPE_META[type]
              const approxBags = Math.round(directLitersByType[type] / bagSizeLiters)
              return (
                <div key={`bag-${type}`} className={`vector-card-soft ${meta.color} p-3 flex items-center justify-between gap-2`}>
                  <div className="grid gap-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
                      <MaterialIcon name={meta.icon} size="sm" />
                      {meta.labelId}
                    </span>
                    <span className="text-[11px] font-bold text-ink">
                      ≈ {directLitersByType[type]} L ({percents[type]}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="secondary" className="min-h-9 px-2.5 py-1" onClick={() => adjustBags(type, -1)}>
                      -
                    </Button>
                    <span className="min-w-10 text-center text-sm font-extrabold">{approxBags}</span>
                    <Button variant="secondary" className="min-h-9 px-2.5 py-1" onClick={() => adjustBags(type, 1)}>
                      +
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Mode 2: Direct Liters per Type */}
      {inputMode === 'direct_liters' ? (
        <div className="vector-card-soft bg-sky/25 p-4 grid gap-3">
          <p className="text-sm font-extrabold">
            Masukkan perkiraan volume langsung (Liter) untuk jenis sampah yang ada — persentase dihitung otomatis:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRASH_TYPES.map((type) => {
              const meta = TYPE_META[type]
              return (
                <div key={`dl-${type}`} className="grid grid-cols-[1fr_7rem] items-center gap-2 rounded-md border border-ink/20 bg-card p-2.5">
                  <Label htmlFor={`direct-liters-${type}`} className="text-xs font-extrabold">
                    {meta.labelId} ({percents[type]}%)
                  </Label>
                  <Input
                    id={`direct-liters-${type}`}
                    type="number"
                    min={0}
                    value={String(directLitersByType[type])}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0)
                      applyDirectLiters({ ...directLitersByType, [type]: val })
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Canonical Percent Inputs (Always rendered & accessible so resident or E2E can inspect/edit exact %) */}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-wide text-ink">
            Rincian Persentase per Jenis (harus berjumlah 100%):
          </p>
          {total !== 100 ? (
            <Button variant="gold" className="min-h-9 py-1 text-xs" onClick={autoBalanceTo100}>
              <MaterialIcon name="balance" size="sm" />
              Seimbangkan Otomatis ke 100%
            </Button>
          ) : null}
        </div>
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
      </div>

      <p className={total === 100 ? 'text-sm font-bold text-primary' : 'text-sm font-extrabold text-alert'}>
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
          <p className="text-xs font-semibold">
            Label: {label ?? 'Masukkan angka bulat liter, minimal 1.'} (≈ {Math.max(1, Math.round(validLiters / 15))} kantong kresek)
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="urgency">Urgensi</Label>
          <Select
            id="urgency"
            value={urgency}
            onChange={(event) => onUrgency(event.target.value as Urgency)}
          >
            <option value="low">low (Biasa / Terjadwal)</option>
            <option value="medium">medium (Mulai Menumpuk)</option>
            <option value="high">high (Mendesak / Meluber / B3)</option>
          </Select>
        </div>
      </div>
    </fieldset>
  )
}
