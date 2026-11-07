'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'

type SupportedArea = {
  id: string
  name: string
  regency: string
  status: 'active' | 'pilot' | 'upcoming'
  statusLabel: string
  tps3rUnits: number
  tpstFacility: string
  schedule: {
    organik: string
    anorganik: string
    residu: string
  }
  highlightBanjar: string[]
  ruleNote: string
}

const SUPPORTED_AREAS: SupportedArea[] = [
  {
    id: 'dps-barat',
    name: 'Kecamatan Denpasar Barat',
    regency: 'Kota Denpasar',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    tps3rUnits: 7,
    tpstFacility: 'TPST Kesiman Kertalangu & Sentra Kompos Tahura',
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa, Jumat, Minggu (08:00–11:30 WITA)',
      residu: 'Kamis & Minggu (14:00–17:00 WITA)',
    },
    highlightBanjar: ['Br. Pekambingan', 'Br. Busungyeh', 'Br. Tegal Harum', 'Br. Padangsambian'],
    ruleNote: 'Perda Denpasar No. 8/2023 & Pergub Bali No. 47/2019: Pemilahan wajib di sumber. Sampah organik langsung ke TPS3R kompos desa.',
  },
  {
    id: 'dps-selatan',
    name: 'Kecamatan Denpasar Selatan',
    regency: 'Kota Denpasar',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    tps3rUnits: 8,
    tpstFacility: 'Sentra Kompos Tahura Ngurah Rai & TPST Suwung',
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa, Jumat, Minggu (08:00–11:30 WITA)',
      residu: 'Kamis & Minggu (13:00–16:00 WITA)',
    },
    highlightBanjar: ['Br. Intaran Sanur', 'Br. Sindu', 'Br. Panjer', 'Br. Renon'],
    ruleNote: 'Jalur wisata dan pemukiman pesisir. Bank sampah terpilah aktif setiap Selasa & Jumat.',
  },
  {
    id: 'dps-timur',
    name: 'Kecamatan Denpasar Timur',
    regency: 'Kota Denpasar',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    tps3rUnits: 6,
    tpstFacility: 'TPST Kesiman Kertalangu',
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa, Jumat, Minggu (08:00–11:00 WITA)',
      residu: 'Kamis & Minggu (14:00–17:00 WITA)',
    },
    highlightBanjar: ['Br. Kesiman', 'Br. Penatih', 'Br. Sumerta', 'Br. Dangin Puri'],
    ruleNote: 'Kawasan terhubung langsung dengan unit pengolahan RDF dan pelet bahan bakar ramah lingkungan.',
  },
  {
    id: 'dps-utara',
    name: 'Kecamatan Denpasar Utara',
    regency: 'Kota Denpasar',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    tps3rUnits: 5,
    tpstFacility: 'TPS3R Swakelola Desa & TPST Padangsambian',
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa, Jumat, Minggu (08:00–11:00 WITA)',
      residu: 'Kamis & Minggu (13:00–16:00 WITA)',
    },
    highlightBanjar: ['Br. Ubung', 'Br. Peguyangan', 'Br. Tonja', 'Br. Pemecutan Kaja'],
    ruleNote: 'Kemitraan TPS3R desa dengan kelompok tani lokal untuk penyerapan pupuk kompos sisa upacara.',
  },
  {
    id: 'badung-pilot',
    name: 'Badung Selatan (Kuta, Seminyak, Jimbaran)',
    regency: 'Kabupaten Badung',
    status: 'pilot',
    statusLabel: 'Tahap Integrasi Pilot',
    tps3rUnits: 12,
    tpstFacility: 'TPST Mengwi & TPS3R Swakelola Desa Adat',
    schedule: {
      organik: 'Senin s/d Sabtu (05:30–08:30 WITA)',
      anorganik: 'Rabu & Sabtu (09:00–12:00 WITA)',
      residu: 'Harian Terjadwal (15:00–18:00 WITA)',
    },
    highlightBanjar: ['Desa Adat Kuta', 'Desa Adat Jimbaran', 'Desa Adat Seminyak'],
    ruleNote: 'Pengelolaan limbah terpadu kawasan pariwisata dan sentra kuliner berbasis awig-awig desa adat.',
  },
  {
    id: 'gianyar-pilot',
    name: 'Kawasan Ubud & Sukawati',
    regency: 'Kabupaten Gianyar',
    status: 'pilot',
    statusLabel: 'Tahap Integrasi Pilot',
    tps3rUnits: 9,
    tpstFacility: 'Sentra Daur Ulang Gianyar & Rumah Kompos Ubud',
    schedule: {
      organik: 'Senin, Rabu, Jumat (06:00–09:00 WITA)',
      anorganik: 'Selasa & Sabtu (08:30–11:30 WITA)',
      residu: 'Kamis & Minggu (13:00–16:00 WITA)',
    },
    highlightBanjar: ['Desa Adat Ubud', 'Desa Adat Padangtegal', 'Desa Adat Batuan'],
    ruleNote: 'Fokus daur ulang sisa upacara seni banten dan sampah organik pasar seni.',
  },
]

export function SupportedAreasList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'pilot'>('all')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('dps-barat')

  const filteredAreas = SUPPORTED_AREAS.filter((area) => {
    if (filter === 'all') return true
    return area.status === filter
  })

  const activeArea = SUPPORTED_AREAS.find((a) => a.id === selectedAreaId) ?? SUPPORTED_AREAS[0]

  return (
    <div
      className="vector-card bg-card p-6 grid gap-5 border-2 border-ink shadow-[4px_4px_0_#1F2933]"
      data-testid="supported-areas-list"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <span className="vector-pill bg-mint text-ink font-black text-xs">
            <MaterialIcon name="verified" size="sm" />
            Cakupan Operasional &amp; Desentralisasi TPS3R
          </span>
          <h3 className="mt-1.5 text-2xl font-black text-ink">
            Wilayah yang Didukung oleh Central Trash Agent Bali
          </h3>
          <p className="text-xs font-bold text-ink/85 mt-0.5">
            Setiap wilayah menerapkan jadwal terpisah untuk sampah organik, anorganik, dan residu sesuai Pergub Bali No. 47 Tahun 2019.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg border-2 border-ink px-3 py-1.5 transition-all shadow-[2px_2px_0_#1F2933] ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-card text-ink hover:bg-amber/30'
            }`}
          >
            Semua Wilayah ({SUPPORTED_AREAS.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-lg border-2 border-ink px-3 py-1.5 transition-all shadow-[2px_2px_0_#1F2933] ${
              filter === 'active' ? 'bg-mint text-ink' : 'bg-card text-ink hover:bg-mint/30'
            }`}
          >
            Aktif Penuh (4 Kecamatan)
          </button>
          <button
            type="button"
            onClick={() => setFilter('pilot')}
            className={`rounded-lg border-2 border-ink px-3 py-1.5 transition-all shadow-[2px_2px_0_#1F2933] ${
              filter === 'pilot' ? 'bg-lavender text-ink' : 'bg-card text-ink hover:bg-lavender/30'
            }`}
          >
            Tahap Pilot (2 Wilayah)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.3fr]">
        {/* Left: Scrollable List of Areas */}
        <div className="grid gap-2.5 content-start">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            Pilih Wilayah untuk Melihat Jadwal &amp; Armada:
          </span>
          {filteredAreas.map((area) => {
            const isSelected = area.id === activeArea.id
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaId(area.id)}
                className={`w-full text-left rounded-xl border-2 border-ink p-3.5 transition-all flex items-start justify-between gap-3 shadow-[2px_2px_0_#1F2933] ${
                  isSelected ? 'bg-mint/35 border-primary ring-2 ring-primary' : 'bg-bg hover:bg-card'
                }`}
              >
                <div className="grid gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-ink">{area.name}</span>
                  </div>
                  <p className="text-xs font-black text-ink">{area.regency}</p>
                  <p className="text-[11px] font-bold text-ink mt-1">
                    {area.tps3rUnits} Unit TPS3R Swakelola · {area.highlightBanjar.slice(0, 2).join(', ')}...
                  </p>
                </div>
                <span
                  className={`rounded-md border border-ink px-2 py-0.5 text-[11px] font-black shrink-0 ${
                    area.status === 'active' ? 'bg-mint text-ink' : 'bg-lavender text-ink'
                  }`}
                >
                  {area.statusLabel}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: Detailed Area Card */}
        <div className="vector-card-soft bg-card p-5 grid content-start gap-4 border-2 border-ink shadow-[3px_3px_0_#1F2933]">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-ink/20 pb-3">
            <div>
              <span className="vector-pill bg-sky text-ink text-[11px] font-black">
                {activeArea.regency}
              </span>
              <h4 className="text-xl font-black text-ink mt-1">{activeArea.name}</h4>
              <p className="text-xs font-bold text-ink/80 mt-0.5">
                Pusat Pengolahan: {activeArea.tpstFacility}
              </p>
            </div>
            <span
              className={`rounded-lg border-2 border-ink px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_#1F2933] ${
                activeArea.status === 'active' ? 'bg-mint text-ink' : 'bg-lavender text-ink'
              }`}
            >
              {activeArea.statusLabel}
            </span>
          </div>

          {/* Schedule Breakdown */}
          <div className="grid gap-2.5 text-xs">
            <span className="font-black uppercase tracking-wider text-ink">
              Jadwal Penjemputan Desentralisasi:
            </span>

            <div className="rounded-lg border-2 border-ink bg-mint/40 p-3 text-ink shadow-[2px_2px_0_#1F2933]">
              <div className="flex items-center gap-1.5 font-black text-xs text-ink">
                <MaterialIcon name="eco" size="sm" className="text-primary" />
                <span>Sampah Organik (Sisa Makanan, Janur, Banten, Daun):</span>
              </div>
              <p className="mt-1 font-black text-sm text-ink">{activeArea.schedule.organik}</p>
              <p className="text-[11px] font-semibold text-ink/80 mt-0.5">
                Tujuan: Diolah menjadi pupuk kompos di {activeArea.tps3rUnits} unit TPS3R swakelola.
              </p>
            </div>

            <div className="rounded-lg border-2 border-ink bg-sky/35 p-3 text-ink shadow-[2px_2px_0_#1F2933]">
              <div className="flex items-center gap-1.5 font-black text-xs text-ink">
                <MaterialIcon name="recycling" size="sm" className="text-sky" />
                <span>Sampah Anorganik (Botol Plastik, Kardus, Kaleng):</span>
              </div>
              <p className="mt-1 font-black text-sm text-ink">{activeArea.schedule.anorganik}</p>
              <p className="text-[11px] font-semibold text-ink/80 mt-0.5">
                Tujuan: Disalurkan ke Bank Sampah Banjar untuk didaur ulang.
              </p>
            </div>

            <div className="rounded-lg border-2 border-ink bg-amber/35 p-3 text-ink shadow-[2px_2px_0_#1F2933]">
              <div className="flex items-center gap-1.5 font-black text-xs text-ink">
                <MaterialIcon name="delete" size="sm" />
                <span>Sampah Residu (Non-Daur Ulang):</span>
              </div>
              <p className="mt-1 font-black text-sm text-ink">{activeArea.schedule.residu}</p>
              <p className="text-[11px] font-semibold text-ink/80 mt-0.5">
                Tujuan: Diangkut armada DLHK menuju TPST pengolahan akhir.
              </p>
            </div>
          </div>

          {/* Banjar Highlights & Policy */}
          <div className="rounded-lg border border-ink/30 bg-bg p-3 text-xs grid gap-1">
            <span className="font-extrabold text-ink">Banjar Terhubung:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeArea.highlightBanjar.map((b, idx) => (
                <span
                  key={idx}
                  className="rounded border border-ink bg-card px-2 py-0.5 text-[11px] font-bold text-ink"
                >
                  📍 {b}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-medium text-ink/85 leading-relaxed">
              <strong>Ketentuan:</strong> {activeArea.ruleNote}
            </p>
          </div>

          <div className="pt-1">
            <Button asChild className="w-full btn-tactile">
              <Link href="/schedule">
                <MaterialIcon name="calendar_month" size="sm" />
                <span>Buka Jadwal Lengkap &amp; Kalender Rahinan</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
