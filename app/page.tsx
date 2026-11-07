'use client'

import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  SOURCE_GUIDE_CITATION,
  SOURCE_GUIDE_LABELS,
  SOURCE_TO_STREAM,
  SOURCE_TYPES,
  type SourceType,
} from '@/lib/schedule/sourceTypes'

const STREAM_BADGE_COLORS: Record<string, string> = {
  organik: 'bg-mint text-ink',
  anorganik: 'bg-sky text-ink',
  residu: 'bg-amber text-ink',
  B3: 'bg-coral text-alert',
}

const SOURCE_ICONS: Record<SourceType, string> = {
  mudah_terurai: 'compost',
  guna_ulang: 'replay',
  daur_ulang: 'recycling',
  b3: 'warning',
  residu: 'delete_sweep',
}

const SOURCE_EXAMPLES_ID: Record<SourceType, string> = {
  mudah_terurai: 'Sisa makanan, daun, canang/janur organik, potongan sayur & buah',
  guna_ulang: 'Botol kaca utuh, stoples layak pakai, kantong belanja guna ulang',
  daur_ulang: 'Botol plastik PET, kardus kering, kertas, kaleng aluminium/besi',
  b3: 'Baterai bekas, lampu neon/TL, kaleng cat/aerosol, limbah elektronik',
  residu: 'Popok sekali pakai, tisu kotor, styrofoam, residu sapuan tercampur',
}

export default function HomePage() {
  const { activeAccount, optimization } = useAccount()

  return (
    <main id="main" className="grid gap-10">
      {/* Hero Banner with Tactile Vector Geometry & Logo Slot */}
      <section className="vector-card relative overflow-hidden bg-gradient-to-br from-card via-card to-mint/50 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="vector-pill bg-amber text-ink tilt-left">
                <MaterialIcon name="eco" size="sm" />
                Sistem Pengelolaan Sampah Terpadu · Kota Denpasar
              </span>
              {activeAccount ? (
                <span className="vector-pill bg-sky text-ink">
                  <MaterialIcon name={activeAccount.role === 'petugas' ? 'badge' : 'person'} size="sm" />
                  Aktif: {activeAccount.name} ({activeAccount.role === 'petugas' ? 'Petugas' : 'Warga'})
                </span>
              ) : null}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Central Trash Agent
            </h1>

            <p className="max-w-2xl text-lg font-medium text-ink/85">
              Kenali kondisi sampah Anda hari ini, sesuaikan timbulan mingguan &amp; lonjakan hari raya dengan jadwal dan toleransi (<em>leeway</em>) petugas, lalu optimalkan rute pengangkutan di seluruh kecamatan Kota Denpasar.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild>
                <Link href="/report">
                  <MaterialIcon name="add_a_photo" />
                  Laporkan tumpukan
                </Link>
              </Button>
              <Button asChild variant="gold">
                <Link href="/akun">
                  <MaterialIcon name="tune" />
                  Atur Profil Sampah &amp; Acara
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/schedule">
                  <MaterialIcon name="calendar_month" />
                  Jadwal pengangkutan
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Vector Visual Summary Card */}
          <div className="vector-card bg-ink text-white p-5 grid gap-4 tilt-right">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-white bg-primary font-extrabold text-xs">
                  LOGO
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">Status Cerdas Hari Ini</p>
                  <p className="text-base font-extrabold">
                    {activeAccount ? `${activeAccount.kecamatan} · ${activeAccount.desa}` : 'Kota Denpasar'}
                  </p>
                </div>
              </div>
              <MaterialIcon name="verified" className="text-gold" size="lg" />
            </div>

            {optimization ? (
              <div className="grid gap-3 text-sm">
                <p className="font-bold text-mint">{optimization.headline}</p>
                <div className="grid grid-cols-2 gap-2 text-ink">
                  <div className="rounded-md border-2 border-white bg-mint p-2.5">
                    <p className="text-[11px] font-extrabold uppercase">Estimasi Mingguan</p>
                    <p className="text-lg font-extrabold">
                      {optimization.totalWeeklyLiters} L ({optimization.equivalentContainers} wadah)
                    </p>
                  </div>
                  <div className="rounded-md border-2 border-white bg-amber p-2.5">
                    <p className="text-[11px] font-extrabold uppercase">Lonjakan Acara</p>
                    <p className="text-lg font-extrabold">+{optimization.eventExtraLiters} L</p>
                  </div>
                </div>
                <Link
                  href="/akun"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gold underline underline-offset-4"
                >
                  <MaterialIcon name="arrow_forward" size="sm" />
                  Sesuaikan takaran kantong/ember atau jadwal acara Anda
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 text-sm text-white/90">
                <p>Mode Petugas aktif. Pantau klaster laporan warga, atur leeway jadwal kecamatan, dan jalankan solver rute VRP.</p>
                <div className="flex gap-2 pt-1">
                  <Link href="/dashboard" className="underline font-bold text-gold">
                    Buka Dasbor
                  </Link>
                  <span>·</span>
                  <Link href="/planner" className="underline font-bold text-gold">
                    Buka Perencana Rute
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dual Actor Action Grid (Warga & Petugas) */}
      <section aria-label="Menu Aktor Utama" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="vector-card bg-mint/45 p-5 grid content-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="vector-pill bg-card text-ink">Warga · Langkah 1</span>
              <MaterialIcon name="photo_camera" size="lg" className="text-primary" />
            </div>
            <h2 className="text-xl font-extrabold">Lapor via Kamera, Suara, atau Teks</h2>
            <p className="text-sm text-ink/80">
              Ambil foto langsung dari kamera, rekam suara Bahasa Indonesia, atau pilih takaran kantong kresek/ember tanpa hitung rumit.
            </p>
          </div>
          <Button asChild>
            <Link href="/report">Laporkan tumpukan</Link>
          </Button>
        </div>

        <div className="vector-card bg-amber/45 p-5 grid content-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="vector-pill bg-card text-ink">Warga &amp; Petugas</span>
              <MaterialIcon name="event_available" size="lg" className="text-ink" />
            </div>
            <h2 className="text-xl font-extrabold">Jadwal &amp; Leeway Kecamatan</h2>
            <p className="text-sm text-ink/80">
              Lihat jendela waktu pengangkutan organik, anorganik, residu, dan B3 beserta toleransi muatan saat hari raya/upacara.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/schedule">Jadwal pengangkutan</Link>
          </Button>
        </div>

        <div className="vector-card bg-sky/55 p-5 grid content-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="vector-pill bg-card text-ink">Petugas · Monitor</span>
              <MaterialIcon name="map" size="lg" className="text-accent" />
            </div>
            <h2 className="text-xl font-extrabold">Dasbor &amp; Klaster Peta Kota</h2>
            <p className="text-sm text-ink/80">
              Pantau total liter per jenis sampah, saring laporan yang perlu tinjauan manusia, dan pisahkan penanganan limbah B3.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Lihat dasbor</Link>
          </Button>
        </div>

        <div className="vector-card bg-lavender/55 p-5 grid content-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="vector-pill bg-card text-ink">Petugas · Rute VRP</span>
              <MaterialIcon name="local_shipping" size="lg" className="text-primary" />
            </div>
            <h2 className="text-xl font-extrabold">Perencana Rute &amp; Audit</h2>
            <p className="text-sm text-ink/80">
              Hitung rute truk deterministik berdasarkan kapasitas &amp; sif kerja, tinjau penjelasan AI, dan catat keputusan petugas.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/planner">Susun rencana penjemputan</Link>
          </Button>
        </div>
      </section>

      {/* Source Sorting Guide (Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)) */}
      <section aria-labelledby="sorting-guide-heading" className="vector-card p-6 grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <span className="vector-pill bg-mint text-ink w-fit tilt-left">
              <MaterialIcon name="verified" size="sm" />
              {SOURCE_GUIDE_CITATION}
            </span>
            <h2 id="sorting-guide-heading" className="text-2xl font-extrabold mt-1">
              Panduan Pemilahan Sampah dari Sumber
            </h2>
            <p className="max-w-3xl text-sm text-ink/80">
              Pilah sampah rumah tangga atau tempat usaha menjadi <strong>5 kategori sumber</strong> berikut. Sistem secara otomatis memetakannya ke <strong>4 aliran jadwal pengangkutan</strong> armada Kota Denpasar:
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/akun">
              <MaterialIcon name="person_check" />
              Cek Kesiapan Pilah Saya
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SOURCE_TYPES.map((type, idx) => {
            const label = SOURCE_GUIDE_LABELS[type]
            const stream = SOURCE_TO_STREAM[type]
            return (
              <div
                key={type}
                className={`vector-card-soft p-4 grid content-between gap-3 ${idx % 2 === 1 ? 'bg-bg' : 'bg-card'}`}
              >
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <MaterialIcon name={SOURCE_ICONS[type]} className="text-primary" size="lg" />
                    <span className={`vector-pill ${STREAM_BADGE_COLORS[stream] ?? 'bg-bg text-ink'}`}>
                      {stream}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold leading-snug">{label.id}</h3>
                  <p className="text-xs font-semibold text-ink/60">{label.en}</p>
                  <p className="text-xs text-ink/80">
                    <strong>Contoh:</strong> {SOURCE_EXAMPLES_ID[type]}.
                  </p>
                </div>
                <p className="border-t border-ink/15 pt-2 text-[11px] font-medium text-ink/75">
                  Aliran: <strong>{stream}</strong> ({label.citation})
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
