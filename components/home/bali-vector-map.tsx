'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'

export type BaliRegionData = {
  id: string
  name: string
  category: 'kota' | 'kabupaten'
  status: 'active' | 'pilot' | 'upcoming'
  statusLabel: string
  tps3rCount: number
  tpstCount: number
  schedule: {
    organik: string
    anorganik: string
    residu: string
  }
  primaryFacility: string
  ruleNotice: string
  description: string
  pathD: string
  center: [number, number]
  fillColor: string
}

export const BALI_REGIONS: BaliRegionData[] = [
  {
    id: 'denpasar',
    name: 'Kota Denpasar (Pusat Layanan Aktif)',
    category: 'kota',
    status: 'active',
    statusLabel: 'Aktif Beroperasi Penuh (4 Kecamatan / 43 Desa & Kelurahan)',
    tps3rCount: 26,
    tpstCount: 3,
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa, Jumat, Minggu (08:00–11:30 WITA)',
      residu: 'Kamis & Minggu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Pemecutan, TPS3R Sanur Kauh, TPST Kertalangu, TPST Tahura, TPST Padangsambian',
    ruleNotice:
      'Pergub Bali No. 47/2019 & Perda Denpasar No. 8/2023: Pemilahan Wajib Berbasis Sumber. Sampah tanpa pilah ditunda penjemputannya oleh Swakelola Banjar.',
    description:
      'Wilayah operasional utama Central Trash Agent Bali. Terhubung langsung dengan 4 armada kecamatan, 26 TPS3R mandiri, dan 3 TPST sentral untuk pemrosesan kompos, RDF, dan daur ulang plastik.',
    // Denpasar coastal polygon
    pathD: 'M 445 425 L 485 415 L 495 445 L 480 470 L 440 465 L 435 440 Z',
    center: [462, 442],
    fillColor: '#00A676', // Mint/Emerald
  },
  {
    id: 'badung',
    name: 'Kabupaten Badung (Pilot Koridor Selatan)',
    category: 'kabupaten',
    status: 'pilot',
    statusLabel: 'Pilot Simpul TPS3R (Kuta, Mengwi & Kuta Selatan)',
    tps3rCount: 14,
    tpstCount: 2,
    schedule: {
      organik: 'Senin, Rabu, Sabtu (06:30–09:30 WITA)',
      anorganik: 'Selasa & Jumat (08:30–12:00 WITA)',
      residu: 'Kamis & Minggu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Mengwi & TPST Samtaku Jimbaran',
    ruleNotice:
      'Sinergi kawasan pariwisata: Hotel, resto, dan rumah tangga wajib menyalurkan organik ke kompos lokal.',
    description:
      'Penyangga utama koridor selatan dan destinasi wisata. Pilot desentralisasi terintegrasi untuk menangani sampah pasar seni, pantai, dan pemukiman padat.',
    // Badung polygon wrapping around Denpasar and narrow peninsula
    pathD:
      'M 410 330 L 445 330 L 445 425 L 435 440 L 440 465 L 425 490 L 435 520 L 460 540 L 435 550 L 415 510 L 415 440 L 410 330 Z',
    center: [430, 410],
    fillColor: '#60A5FA', // Sky
  },
  {
    id: 'gianyar',
    name: 'Kabupaten Gianyar (Pilot Simpul Seni & Budaya)',
    category: 'kabupaten',
    status: 'pilot',
    statusLabel: 'Pilot Simpul TPS3R (Ubud & Sukawati)',
    tps3rCount: 18,
    tpstCount: 1,
    schedule: {
      organik: 'Senin, Rabu, Kamis, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa & Jumat (08:00–11:00 WITA)',
      residu: 'Minggu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Ubud Berdikari & TPST Temesi Gianyar',
    ruleNotice:
      'Fokus pemrosesan organik canang rahinan dan limbah daun pisang/janur upacara seni.',
    description:
      'Pionir pengolahan kompos berbasis desa adat dan pariwisata hijau di Ubud, Sukawati, dan Tampaksiring.',
    // Gianyar polygon east of Denpasar
    pathD: 'M 450 310 L 515 310 L 525 380 L 485 415 L 445 330 Z',
    center: [480, 355],
    fillColor: '#93C5FD', // Light sky
  },
  {
    id: 'tabanan',
    name: 'Kabupaten Tabanan',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (Lumbung Pangan & Pertanian Organik)',
    tps3rCount: 8,
    tpstCount: 1,
    schedule: {
      organik: 'Senin & Kamis (06:00–09:00 WITA)',
      anorganik: 'Selasa & Sabtu (08:00–11:00 WITA)',
      residu: 'Rabu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Mandung & Simpul Pupuk Organik Tabanan',
    ruleNotice:
      'Optimalisasi sisa hasil panen dan pasar agrikultur menjadi pupuk kompos ramah lingkungan.',
    description:
      'Sentra lumbung padi Bali. Rencana integrasi sistem berfokus pada sirkularitas limbah organik pertanian ke pakan maggot dan pupuk hayati.',
    // Tabanan polygon west of Badung
    pathD: 'M 320 280 L 410 280 L 410 440 L 330 430 L 320 280 Z',
    center: [365, 360],
    fillColor: '#F3F4F6', // Neutral soft
  },
  {
    id: 'buleleng',
    name: 'Kabupaten Buleleng',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (Koridor Pesisir Utara)',
    tps3rCount: 11,
    tpstCount: 1,
    schedule: {
      organik: 'Senin, Rabu, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa & Jumat (08:00–11:00 WITA)',
      residu: 'Kamis (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Singaraja & Bank Sampah Induk Buleleng',
    ruleNotice: 'Perlindungan ekosistem teluk Lovina dan pesisir utara dari limbah plastik anorganik.',
    description:
      'Wilayah terluas membentang dari Seririt hingga Tejakula. Integrasi masa depan difokuskan pada armada pesisir utara.',
    // Buleleng northern strip
    pathD: 'M 180 160 L 530 180 L 490 260 L 320 250 L 220 220 Z',
    center: [350, 205],
    fillColor: '#E5E7EB',
  },
  {
    id: 'jembrana',
    name: 'Kabupaten Jembrana',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (Gerbang Barat Bali & STOP Ocean Plastics)',
    tps3rCount: 12,
    tpstCount: 1,
    schedule: {
      organik: 'Senin & Kamis (06:30–09:30 WITA)',
      anorganik: 'Selasa & Sabtu (08:30–11:30 WITA)',
      residu: 'Rabu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPST Negara & Inisiatif Project STOP Jembrana',
    ruleNotice: 'Pencegahan kebocoran plastik ke Selat Bali dan integrasi bank sampah unit desa.',
    description:
      'Terkenal dengan program percontohan bebas sampah plastik berbasis komunitas di Negara dan Gilimanuk.',
    // Jembrana western wedge
    pathD: 'M 80 230 L 220 220 L 320 280 L 330 430 L 140 370 L 80 280 Z',
    center: [210, 310],
    fillColor: '#F3F4F6',
  },
  {
    id: 'bangli',
    name: 'Kabupaten Bangli',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (Hulu Mata Air & Kaldera Batur)',
    tps3rCount: 6,
    tpstCount: 1,
    schedule: {
      organik: 'Senin, Rabu, Jumat (06:30–09:30 WITA)',
      anorganik: 'Selasa & Sabtu (08:30–11:30 WITA)',
      residu: 'Kamis (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Kintamani & Perlindungan DAS Danau Batur',
    ruleNotice: 'Konservasi hulu air bersih Bali: dilarang membuang residu ke jurang kaldera.',
    description:
      'Satu-satunya kabupaten tanpa laut di Bali. Kunci konservasi hulu air bersih dan pertanian hortikultura Kintamani.',
    // Bangli inland polygon
    pathD: 'M 490 260 L 550 260 L 540 330 L 480 320 Z',
    center: [515, 290],
    fillColor: '#E5E7EB',
  },
  {
    id: 'klungkung',
    name: 'Kabupaten Klungkung',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (TOSS Sentral & Kepulauan Nusa Penida)',
    tps3rCount: 9,
    tpstCount: 2,
    schedule: {
      organik: 'Senin, Rabu, Sabtu (06:00–09:00 WITA)',
      anorganik: 'Selasa & Jumat (08:00–11:00 WITA)',
      residu: 'Minggu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TOSS Center Karangdadi Klungkung & TPS3R Nusa Lembongan',
    ruleNotice: 'Inovasi Tempat Olah Sampah Setempat (TOSS) menjadi briket pelet bahan bakar ramah lingkungan.',
    description:
      'Mencakup daratan Klungkung dan 3 pulau Nusa Penida. Memiliki reputasi unggul dalam teknologi pelet biomassa TOSS.',
    // Klungkung mainland + islands
    pathD: 'M 525 380 L 565 370 L 560 410 L 525 410 Z M 550 440 L 610 450 L 595 490 L 540 475 Z',
    center: [545, 395],
    fillColor: '#F3F4F6',
  },
  {
    id: 'karangasem',
    name: 'Kabupaten Karangasem',
    category: 'kabupaten',
    status: 'upcoming',
    statusLabel: 'Ekspansi Tahap 2 (Kawasan Gunung Agung & Ujung Timur)',
    tps3rCount: 7,
    tpstCount: 1,
    schedule: {
      organik: 'Senin & Kamis (06:30–09:30 WITA)',
      anorganik: 'Selasa & Jumat (08:30–11:30 WITA)',
      residu: 'Sabtu (13:00–16:00 WITA)',
    },
    primaryFacility: 'TPS3R Butus & Pengolahan Sampah Kawasan Pura Besakih',
    ruleNotice: 'Penanganan sampah upacara besar di Pura Agung Besakih dan pesisir Amed/Candidasa.',
    description:
      'Wilayah timur Pulau Dewata dengan kompleks peribadatan terbesar di Besakih. Desentralisasi krusial saat upacara Tawur Kasanga dan Bhatara Turun Kabeh.',
    // Karangasem eastern horn
    pathD: 'M 550 260 L 640 280 L 620 370 L 565 370 L 540 330 Z',
    center: [590, 315],
    fillColor: '#E5E7EB',
  },
]

export function BaliVectorMap() {
  const [selectedId, setSelectedId] = useState<string>('denpasar')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const activeRegion = BALI_REGIONS.find((r) => r.id === selectedId) ?? BALI_REGIONS[0]
  const hoveredRegion = hoveredId ? BALI_REGIONS.find((r) => r.id === hoveredId) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]" data-testid="bali-vector-map-component">
      {/* Left: Custom 3D Vector SVG Map */}
      <div className="vector-card bg-card p-5 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="vector-pill bg-mint text-ink tilt-left">
                <MaterialIcon name="map" size="sm" />
                Peta Vektor Bali
              </span>
              <span className="text-xs font-extrabold text-ink/75">
                9 Kabupaten / Kota
              </span>
            </div>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight">
              Cakupan Wilayah & Desentralisasi Sampah
            </h3>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1 rounded border border-ink bg-mint px-2 py-0.5 text-ink">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Aktif Beroperasi
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-ink bg-sky px-2 py-0.5 text-ink">
              <span className="h-2 w-2 rounded-full bg-sky" />
              Pilot TPS3R
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-ink bg-card px-2 py-0.5 text-ink/70">
              <span className="h-2 w-2 rounded-full bg-ink/30" />
              Ekspansi Tahap 2
            </span>
          </div>
        </div>

        <p className="text-xs text-ink/80">
          Arahkan kursor ke wilayah mana pun untuk melihat nama kawasan, dan klik untuk melihat jadwal resmi penjemputan, simpul TPS3R desa, serta aturan pilah berbasis sumber.
        </p>

        {/* SVG Canvas with 3D tactile styling */}
        <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-[#E8F4F8] p-3">
          {/* Ocean Watermark / Compass */}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md border border-ink/40 bg-white/70 px-2 py-1 text-[10px] font-extrabold text-ink/60 select-none">
            <MaterialIcon name="explore" size="sm" />
            <span>LAUT BALI · UTARA</span>
          </div>

          <svg
            viewBox="50 130 620 440"
            className="w-full h-auto max-h-[380px] drop-shadow-[2px_2px_0px_rgba(31,41,51,0.9)]"
            aria-label="Peta Interaktif Wilayah Bali"
          >
            {/* Draw 3D shadow under islands */}
            <g transform="translate(4, 4)" opacity="0.35">
              {BALI_REGIONS.map((region) => (
                <path
                  key={`shadow-${region.id}`}
                  d={region.pathD}
                  fill="#1F2933"
                  stroke="#1F2933"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {/* Region Polygons */}
            {BALI_REGIONS.map((region) => {
              const isSelected = region.id === activeRegion.id
              const isHovered = region.id === hoveredId
              const isDenpasar = region.id === 'denpasar'

              let fill = region.fillColor
              if (isSelected) {
                fill = isDenpasar ? '#00A676' : '#FCD34D' // Highlight color
              } else if (isHovered) {
                fill = isDenpasar ? '#34D399' : '#BAE6FD'
              }

              return (
                <g key={region.id} className="cursor-pointer">
                  <path
                    d={region.pathD}
                    fill={fill}
                    stroke="#1F2933"
                    strokeWidth={isSelected ? 3.5 : 2}
                    strokeLinejoin="round"
                    className="transition-colors duration-150"
                    onMouseEnter={() => setHoveredId(region.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(region.id)}
                    data-testid={`map-region-${region.id}`}
                  />
                  {/* Region Label on Map */}
                  <text
                    x={region.center[0]}
                    y={region.center[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none text-[11px] font-black"
                    fill={isSelected && isDenpasar ? '#FFFFFF' : '#1F2933'}
                    style={{
                      paintOrder: 'stroke',
                      stroke: isSelected && isDenpasar ? '#1F2933' : '#FFFFFF',
                      strokeWidth: '2.5px',
                    }}
                  >
                    {region.id === 'denpasar' ? '★ KOTA DENPASAR' : region.name.split(' ')[1] ?? region.name}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredRegion ? (
            <div
              className="pointer-events-none absolute bottom-3 left-3 rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold text-ink transition-opacity"
              style={{ boxShadow: '2px 2px 0 #1F2933' }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full',
                    hoveredRegion.status === 'active'
                      ? 'bg-primary'
                      : hoveredRegion.status === 'pilot'
                        ? 'bg-sky'
                        : 'bg-ink/30',
                  ].join(' ')}
                />
                <span>{hoveredRegion.name}</span>
                <span className="text-[10px] text-ink/75">({hoveredRegion.statusLabel.split(' ')[0]})</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: Selected Region Operational Detail Card */}
      <div
        className="vector-card bg-card p-5 grid content-start gap-4"
        data-testid="bali-map-detail"
      >
        <div className="border-b-2 border-ink pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'vector-pill text-xs',
                activeRegion.status === 'active'
                  ? 'bg-mint text-ink'
                  : activeRegion.status === 'pilot'
                    ? 'bg-sky text-ink'
                    : 'bg-card text-ink',
              ].join(' ')}
            >
              <MaterialIcon
                name={
                  activeRegion.status === 'active'
                    ? 'check_circle'
                    : activeRegion.status === 'pilot'
                      ? 'science'
                      : 'schedule'
                }
                size="sm"
              />
              {activeRegion.statusLabel}
            </span>
          </div>
          <h4 className="mt-2 text-2xl font-extrabold tracking-tight">
            {activeRegion.name}
          </h4>
          <p className="mt-1 text-xs text-ink/80 leading-relaxed">
            {activeRegion.description}
          </p>
        </div>

        {/* Standard Decentralized Pickup Timetable */}
        <div className="grid gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
            <MaterialIcon name="event_repeat" size="sm" />
            Jadwal Standar Pengangkutan Berbasis Sumber
          </span>

          <div className="rounded-lg border-2 border-ink bg-mint/30 p-2.5 text-xs text-ink">
            <div className="flex items-center justify-between font-extrabold">
              <span className="flex items-center gap-1 text-primary">
                <MaterialIcon name="compost" size="sm" />
                Sampah Organik (Sisa Makanan, Janur & Canang):
              </span>
            </div>
            <p className="mt-0.5 font-bold">{activeRegion.schedule.organik}</p>
            <p className="text-[10px] text-ink/70">Tujuan: Diolah di TPS3R Desa / Swakelola menjadi kompos & eco-enzyme.</p>
          </div>

          <div className="rounded-lg border-2 border-ink bg-sky/30 p-2.5 text-xs text-ink">
            <div className="flex items-center justify-between font-extrabold">
              <span className="flex items-center gap-1 text-sky">
                <MaterialIcon name="recycling" size="sm" />
                Sampah Anorganik (Plastik, Kertas, Kaleng):
              </span>
            </div>
            <p className="mt-0.5 font-bold">{activeRegion.schedule.anorganik}</p>
            <p className="text-[10px] text-ink/70">Tujuan: Disalurkan ke Bank Sampah Banjar / Unit Daur Ulang.</p>
          </div>

          <div className="rounded-lg border-2 border-ink bg-amber/30 p-2.5 text-xs text-ink">
            <div className="flex items-center justify-between font-extrabold">
              <span className="flex items-center gap-1 text-ink">
                <MaterialIcon name="delete" size="sm" />
                Sampah Residu (Non-Daur Ulang):
              </span>
            </div>
            <p className="mt-0.5 font-bold">{activeRegion.schedule.residu}</p>
            <p className="text-[10px] text-ink/70">Tujuan: Diangkut armada DLHK menuju TPST pengolahan akhir.</p>
          </div>
        </div>

        {/* Node & Infrastructure Summary */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
          <div className="rounded-lg border-2 border-ink bg-card p-2">
            <p className="text-xl font-black text-primary">{activeRegion.tps3rCount}</p>
            <p className="text-[11px] text-ink/70">Unit TPS3R Aktif</p>
          </div>
          <div className="rounded-lg border-2 border-ink bg-card p-2">
            <p className="text-xl font-black text-ink">{activeRegion.tpstCount}</p>
            <p className="text-[11px] text-ink/70">TPST Sentral Terhubung</p>
          </div>
        </div>

        {/* Rules & Action Buttons */}
        <div className="rounded-lg border-2 border-ink bg-lavender/30 p-3 text-xs text-ink">
          <div className="flex items-center gap-1.5 font-extrabold text-ink">
            <MaterialIcon name="gavel" size="sm" className="text-primary" />
            <span>Aturan Resmi Wilayah:</span>
          </div>
          <p className="mt-1 text-[11px] font-medium leading-relaxed">
            {activeRegion.ruleNotice}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild className="w-full">
            <Link href="/schedule">
              <MaterialIcon name="calendar_month" size="sm" />
              Buka Jadwal & Kalender Rahinan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
