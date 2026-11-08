import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'

export const metadata: Metadata = {
  title: 'Ketentuan Prototipe — Central Trash Agent Bali',
  description:
    'Ketentuan penggunaan dan simulasi aturan operasional pengelolaan sampah cerdas berbasis sumber Central Trash Agent Bali.',
}

export default function SyaratKetentuanPage() {
  return (
    <main id="main" className="grid gap-6 max-w-4xl mx-auto" data-testid="syarat-ketentuan-page">
      <section className="vector-card bg-card p-6 md:p-8 grid gap-4">
        {/* DISCLAIMER PROTOTIPE KOMPETISI & PROPOSAL */}
        <div
          role="note"
          className="rounded-xl border-2 border-ink bg-coral/30 p-4 text-xs font-semibold text-ink leading-relaxed shadow-[2px_2px_0_#1F2933]"
        >
          <div className="flex items-center gap-2 font-black text-sm text-alert pb-1">
            <MaterialIcon name="warning" size="sm" />
            <span>Pemberitahuan Status Prototipe Kompetisi &amp; Proposal Teknis</span>
          </div>
          <p>
            <strong>Prototipe kompetisi:</strong> Central Trash Agent Bali adalah prototipe karya <strong>Tim Punya Dendam</strong> untuk <em>AI Web Innovation Challenge Bali DigiFest 2026</em>. Aplikasi ini tidak berafiliasi, tidak dioperasikan, dan tidak diakui oleh Pemerintah Kota Denpasar, DLHK, atau instansi pemerintah mana pun. Peran &quot;Petugas&quot; adalah simulasi. Seluruh akun dan laporan bawaan berisi data fiktif.
          </p>
          <p className="mt-1.5 text-ink/90 font-medium">
            <strong>Catatan Proposal Teknis:</strong> Tim pengembang belum menjalin komunikasi resmi dengan pihak petugas operasional kebersihan maupun instansi kedinasan. Secara garis besar, aplikasi ini kami ajukan sebagai proposal inovasi dan bukti konsep (proof of concept) bahwa sistem persampahan desentralisasi cerdas berbasis agen AI dapat diwujudkan secara nyata di Bali.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="vector-pill bg-sky text-ink font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="description" size="sm" />
            Ketentuan Prototipe
          </span>
          <span className="vector-pill bg-mint text-ink font-extrabold">
            Simulasi Pergub Bali No. 47/2019
          </span>
          <span className="vector-pill bg-lavender text-ink font-extrabold">
            Karya Tim Punya Dendam
          </span>
        </div>

        <h1 className="text-3xl font-black text-ink tracking-tight">
          Syarat &amp; Ketentuan Prototipe
        </h1>
        <p className="text-sm font-black text-ink">
          Terakhir Diperbarui: 7 November 2026 · Tim Pengembang Tim Punya Dendam
        </p>

        <div className="rounded-xl border-2 border-ink bg-sky/20 p-4 text-xs font-medium text-ink leading-relaxed">
          Dengan mengakses atau menguji platform prototipe <strong>Central Trash Agent Bali</strong>, Anda memahami bahwa platform ini adalah media demonstrasi inovasi teknologi untuk menyimulasikan tata kelola persampahan terdesentralisasi berbasis sumber.
        </div>

        <div className="grid gap-6 pt-2 text-sm text-ink/90 leading-relaxed">
          {/* 1. Pemilahan di Sumber */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="checklist" className="text-primary" size="sm" />
              1. Simulasi Aturan Warga: Pemilahan Berbasis Sumber
            </h2>
            <p>
              Mengadopsi <strong>Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)</strong>, pemilahan dari sumber paling sedikit lima jenis: mudah terurai, dapat digunakan kembali, dapat didaur ulang, B3, dan residu. Aplikasi memetakannya ke empat aliran operasional. Tiga aliran rutin di bawah ini berjalan terjadwal; B3 ditangani terpisah:
            </p>
            <ul className="list-disc pl-5 grid gap-1.5 text-xs font-semibold text-ink/85">
              <li><strong>Sampah Organik:</strong> Sisa makanan, daun, sisa banten, janur, canang sari, dan potongan ranting taman. Ditujukan untuk pengolahan kompos di TPS3R desa/kelurahan setempat.</li>
              <li><strong>Sampah Anorganik:</strong> Botol plastik, kardus, kaleng, dan kertas kering. Ditujukan untuk Bank Sampah banjar atau unit daur ulang.</li>
              <li><strong>Sampah Residu:</strong> Bahan yang tidak dapat didaur ulang/dikomposkan untuk diangkut berkala menuju fasilitas pengolahan residu.</li>
            </ul>
          </section>

          {/* 2. Pelarangan Limbah B3 */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="battery_alert" className="text-primary" size="sm" />
              2. Simulasi Penanganan Khusus Limbah Berbahaya (B3)
            </h2>
            <p>
              Baterai bekas, aki, kaleng aerosol, lampu neon, dan limbah medis <strong>tidak diperbolehkan dicampur</strong> ke dalam kantong sampah harian biasa.
            </p>
            <p className="text-xs text-ink/80">
              Prototipe menyediakan penanda khusus untuk limbah B3 agar dipisahkan dan memerlukan penanganan terpisah.
            </p>
          </section>

          {/* 3. Hak Warga & Toleransi Leeway */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="schedule" className="text-primary" size="sm" />
              3. Simulasi Fleksibilitas Jadwal &amp; Kuota Toleransi (Leeway)
            </h2>
            <p>
              Pada masa hari raya keagamaan Hindu (Galungan, Kuningan, Nyepi, Piodalan, Purnama/Tilem) atau upacara keluarga (Otonan), sistem menyimulasikan batas kelonggaran muatan (leeway) ekstra hingga +50% untuk menampung lonjakan sampah organik upacara adat.
            </p>
          </section>

          {/* 4. Tanggung Jawab Petugas Armada */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="local_shipping" className="text-primary" size="sm" />
              4. Simulasi Peran Petugas Armada &amp; Rute VRP
            </h2>
            <ul className="list-disc pl-5 grid gap-1 text-xs font-semibold text-ink/85">
              <li>Peran Petugas dalam aplikasi ini merupakan simulasi operasional armada pengangkutan.</li>
              <li>Sistem menghitung urutan titik penjemputan menggunakan algoritma VRP deterministik untuk meminimalkan jarak tempuh dan emisi.</li>
              <li>Tautan rute yang dihasilkan terintegrasi dengan Google Maps untuk navigasi di lapangan.</li>
            </ul>
          </section>

          {/* 5. Batasan Tanggung Jawab */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="info" className="text-primary" size="sm" />
              5. Batasan Tanggung Jawab &amp; Sifat Demonstrasi
            </h2>
            <p className="text-xs text-ink/80">
              Aplikasi ini disediakan &quot;sebagaimana adanya&quot; (*as-is*) untuk tujuan kompetisi ilmiah dan inovasi teknologi. Pengembang tidak bertanggung jawab atas tindakan di luar lingkup pengujian prototipe ini.
            </p>
          </section>

          {/* 6. Kontak Pengembang */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="contact_mail" className="text-primary" size="sm" />
              6. Kontak Tim Pengembang
            </h2>
            <div className="vector-card-soft bg-sky/30 p-4 text-xs font-medium text-ink grid gap-1">
              <p className="font-extrabold text-sm">Tim Pengembang — Tim Punya Dendam</p>
              <p>Repositori: github.com/Yada912/Trash-Central-Agent (Issues)</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-ink">
          <Link
            href="/kebijakan-privasi"
            className="btn-tactile bg-mint text-ink px-4 py-2 text-xs font-black border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            ← Baca Kebijakan Privasi Prototipe
          </Link>
          <Link
            href="/"
            className="btn-tactile bg-card text-ink px-4 py-2 text-xs font-black border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </main>
  )
}
