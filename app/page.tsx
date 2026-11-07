import Link from 'next/link'
import { sourceSortingCards } from '@/components/schedule/schedule-helpers'
import { SOURCE_GUIDE_CITATION } from '@/lib/schedule/sourceTypes'

const LINKS = [
  {
    href: '/report',
    title: 'Laporkan tumpukan sampah',
    text: 'Tambahkan deskripsi, foto opsional, dan pin lokasi. Anda meninjau serta mengonfirmasi klasifikasi sebelum laporan disimpan.',
  },
  {
    href: '/schedule',
    title: 'Jadwal pengangkutan',
    text: 'Lihat jadwal simulasi 4 aliran (Organik, Anorganik, Residu, B3) per kecamatan untuk akun rumah tangga maupun perusahaan.',
  },
  {
    href: '/dashboard',
    title: 'Dasbor operasional',
    text: 'Pantau laporan demo sintetis pada peta Denpasar beserta total volume dan daftar khusus limbah B3.',
  },
  {
    href: '/planner',
    title: 'Perencana rute',
    text: 'Susun rute dari kapasitas truk dan jam kerja sif. Petugas menyetujui, mengedit, atau menolak usulan rute.',
  },
]

export default function HomePage() {
  const sortingCards = sourceSortingCards()

  return (
    <main id="main" className="grid gap-8">
      <div>
        <p className="text-sm font-semibold text-primary">
          Bali DigiFest 2026 · AI Web Innovation Challenge
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Agen Sampah Terpusat (Central Trash Agent)
        </h1>
        <p className="mt-4 max-w-2xl text-lg">
          Warga melaporkan tumpukan sampah beserta lokasinya. Petugas memantau sebaran kebutuhan
          dan memutuskan apakah usulan rute pengangkutan layak dijalankan.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((link) => (
            <li
              key={link.href}
              className="rounded-lg border border-ink/10 bg-card p-4 shadow-none"
            >
              <h2 className="text-xl font-semibold">
                <Link href={link.href}>{link.title}</Link>
              </h2>
              <p className="mt-2 text-sm">{link.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="home-sorting-guide"
        className="grid gap-3 rounded-lg border border-ink/10 bg-card p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Panduan Pemilahan dari Sumber · {SOURCE_GUIDE_CITATION}
        </p>
        <h2 id="home-sorting-guide" className="text-xl font-semibold">
          Pemilahan 5 Jenis Sampah di Sumber ke 4 Aliran Pengangkutan
        </h2>
        <p className="text-sm text-ink/80">
          Berdasarkan {SOURCE_GUIDE_CITATION}, sampah rumah tangga dipilah minimal menjadi 5
          jenis di sumber dan dipetakan secara logistik ke 4 aliran pengangkutan di aplikasi ini:
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sortingCards.map((card) => (
            <li
              key={card.sourceType}
              className="grid gap-1 rounded-md border border-ink/10 bg-bg p-3 text-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Aliran: {card.stream}
              </span>
              <strong className="font-semibold">{card.titleId}</strong>
              <span className="text-xs text-ink/70">{card.titleEn}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="max-w-2xl text-sm">
        Laporan awal adalah data sintetis untuk keperluan demonstrasi. Titik fasilitas di peta
        merupakan koordinat terpublikasi, bukan konfirmasi status operasional atau penerimaan
        sampah saat ini.
      </p>
    </main>
  )
}
