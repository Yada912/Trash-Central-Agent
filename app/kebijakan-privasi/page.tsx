import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Central Trash Agent Bali',
  description:
    'Kebijakan perlindungan data pribadi pengguna layanan persampahan cerdas Central Trash Agent Bali berdasarkan UU No. 27 Tahun 2022 (UU PDP).',
}

export default function KebijakanPrivasiPage() {
  return (
    <main id="main" className="grid gap-6 max-w-4xl mx-auto" data-testid="kebijakan-privasi-page">
      <section className="vector-card bg-card p-6 md:p-8 grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="vector-pill bg-mint text-ink font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="verified_user" size="sm" />
            UU No. 27 Tahun 2022 (UU PDP)
          </span>
          <span className="vector-pill bg-amber text-ink font-extrabold">
            Perda Denpasar No. 8/2023
          </span>
          <span className="vector-pill bg-lavender text-ink font-extrabold">
            Pergub Bali No. 47/2019
          </span>
        </div>

        <h1 className="text-3xl font-black text-ink tracking-tight">
          Kebijakan Privasi &amp; Pelindungan Data Pribadi
        </h1>
        <p className="text-sm font-black text-ink">
          Berlaku Efektif: 1 Januari 2026 · Terakhir Diperbarui: 7 November 2026
        </p>

        <div className="rounded-xl border-2 border-ink bg-mint/30 p-4 text-xs font-medium text-ink leading-relaxed">
          Pemerintah Kota Denpasar melalui Dinas Lingkungan Hidup dan Kebersihan (DLHK) berkomitmen penuh melindungi hak privasi dan keamanan data pribadi setiap warga, pelaku usaha, dan pengemudi armada persampahan sesuai amanat <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
        </div>

        <div className="grid gap-6 pt-2 text-sm text-ink/90 leading-relaxed">
          {/* 1. Pengendali & Dasar Hukum */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="gavel" className="text-primary" size="sm" />
              1. Identitas Pengendali Data &amp; Dasar Hukum Pemrosesan
            </h2>
            <p>
              Pengendali Data Pribadi pada platform Central Trash Agent Bali adalah <strong>Dinas Lingkungan Hidup dan Kebersihan (DLHK)</strong> bekerja sama dengan Unit Pengelola Sampah Terpadu (TPS3R) di tingkat desa dan kelurahan.
            </p>
            <p>Pemrosesan data dilaksanakan berdasarkan ketentuan:</p>
            <ul className="list-disc pl-5 grid gap-1 text-xs font-semibold text-ink/80">
              <li>Pasal 20 ayat (2) huruf b UU No. 27/2022: Pelaksanaan kewajiban hukum pengelola pelayanan publik persampahan.</li>
              <li>Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber di Desa/Kelurahan dan Desa Adat.</li>
              <li>Peraturan Daerah Kota Denpasar Nomor 8 Tahun 2023 tentang Pengelolaan Sampah.</li>
            </ul>
          </section>

          {/* 2. Data yang Dikumpulkan */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="folder_shared" className="text-primary" size="sm" />
              2. Jenis Data Pribadi yang Diproses
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Data Identitas Umum</span>
                <p>Nama lengkap, alamat email kedinasan/pribadi, nomor telepon (bila diisi), dan jenis akun (rumah tangga atau badan usaha).</p>
              </div>
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Data Lokasi Geospasial</span>
                <p>Kecamatan, nama desa/kelurahan, nama banjar adat, dan koordinat GPS (latitude/longitude) titik penjemputan sampah.</p>
              </div>
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Karakteristik Timbulan &amp; Foto</span>
                <p>Foto tumpukan sampah untuk estimasi volume, catatan kondisi tempat sampah, dan jenis wadah penampungan rutin.</p>
              </div>
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Kalender Adat &amp; Pawukon (Otonan)</span>
                <p>Tanggal lahir (opsional) semata-mata untuk mengalkulasi siklus Otonan Pawukon 210 hari guna mengantisipasi lonjakan sampah upacara adat keluarga.</p>
              </div>
            </div>
          </section>

          {/* 3. Pemrosesan AI & Foto */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="psychology" className="text-primary" size="sm" />
              3. Pemrosesan Citra oleh Kecerdasan Buatan (AI) Tanpa Pengenalan Wajah
            </h2>
            <p>
              Model penglihatan komputer (vision AI) yang terpasang pada platform ini dirancang secara ketat untuk menganalisis material fisik sampah (organik, botol plastik, kertas, residu, dan indikasi B3) serta volume wadah.
            </p>
            <div className="rounded-lg border-2 border-ink bg-sky/20 p-3 text-xs font-semibold text-ink">
              <strong>Prinsip Privasi di Sumber:</strong> Sistem TIDAK melakukan pengenalan wajah biometrik (facial recognition), tidak mengidentifikasi pelat kendaraan bermotor, dan secara otomatis menyaring dokumen berharga atau data sensitif yang tidak sengaja tertangkap dalam foto.
            </div>
          </section>

          {/* 4. Hak Subjek Data */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="shield" className="text-primary" size="sm" />
              4. Hak-Hak Anda sebagai Subjek Data (UU PDP Pasal 5–13)
            </h2>
            <p>Sebagai warga terdaftar, Anda memiliki hak penuh untuk:</p>
            <ul className="list-disc pl-5 grid gap-1 text-xs font-semibold text-ink/80">
              <li><strong>Hak Akses:</strong> Melihat seluruh data profil timbulan, riwayat penjemputan, dan memori personal yang dicatat oleh agen AI Kresna.</li>
              <li><strong>Hak Pembaruan:</strong> Mengubah alamat, banjar, perkiraan kantong mingguan, atau pilihan rahinan Bali kapan saja melalui halaman Profil.</li>
              <li><strong>Hak Penghapusan (Right to Erasure):</strong> Meminta penghapusan akun dan riwayat koordinat penjemputan melalui layanan kontak DLHK.</li>
              <li><strong>Hak Menolak Otomatisasi:</strong> Warga memiliki hak menentukan persentase pemilahan manual tanpa wajib mengikuti saran otomatis AI.</li>
            </ul>
          </section>

          {/* 5. Keamanan & Retensi Data */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="lock" className="text-primary" size="sm" />
              5. Keamanan &amp; Retensi Data
            </h2>
            <p>
              Seluruh transmisi data dilindungi protokol enkripsi HTTPS (TLS 1.3). Kredensial kata sandi diverifikasi menggunakan pencocokan waktu-konstan guna mencegah serangan timing attack, dan batasan laju panggilan (rate-limiting) diterapkan pada seluruh gerbang API.
            </p>
          </section>

          {/* 6. Kontak DPO */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="contact_mail" className="text-primary" size="sm" />
              6. Pejabat Pelindung Data Pribadi (Data Protection Officer)
            </h2>
            <div className="vector-card-soft bg-mint/40 p-4 text-xs font-medium text-ink grid gap-1">
              <p className="font-extrabold text-sm">Unit Pelindung Data — DLHK Kota Denpasar</p>
              <p>Alamat: Jl. Mulawarman No. 1, Lumintang, Denpasar Utara, Kota Denpasar, Bali 80231</p>
              <p>Surel Resmi: dpo-persampahan@dlhk.denpasar.id</p>
              <p>Telepon: (0361) 424245 / Layanan Pengaduan PRO Denpasar</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-ink">
          <Link
            href="/syarat-ketentuan"
            className="btn-tactile bg-sky text-ink px-4 py-2 text-xs font-black border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            Baca Syarat &amp; Ketentuan Layanan →
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

