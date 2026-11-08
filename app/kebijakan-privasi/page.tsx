import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Central Trash Agent Bali',
  description:
    'Kebijakan perlindungan data pribadi pengguna prototipe Central Trash Agent Bali berdasarkan prinsip UU No. 27 Tahun 2022 (UU PDP).',
}

export default function KebijakanPrivasiPage() {
  return (
    <main id="main" className="grid gap-6 max-w-4xl mx-auto" data-testid="kebijakan-privasi-page">
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
          <span className="vector-pill bg-mint text-ink font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="verified_user" size="sm" />
            Prinsip UU No. 27 Tahun 2022 (UU PDP)
          </span>
          <span className="vector-pill bg-lavender text-ink font-extrabold">
            Karya Tim Punya Dendam
          </span>
          <span className="vector-pill bg-sky text-ink font-extrabold">
            Bali DigiFest 2026
          </span>
        </div>

        <h1 className="text-3xl font-black text-ink tracking-tight">
          Kebijakan Privasi &amp; Pelindungan Data Pribadi
        </h1>
        <p className="text-sm font-black text-ink">
          Terakhir Diperbarui: 7 November 2026 · Tim Pengembang Tim Punya Dendam
        </p>

        <div className="rounded-xl border-2 border-ink bg-mint/30 p-4 text-xs font-medium text-ink leading-relaxed">
          Tim Punya Dendam sebagai pengembang prototipe Central Trash Agent Bali berkomitmen menerapkan standar keamanan dan pelindungan data pribadi pengguna sesuai prinsip <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
        </div>

        <div className="grid gap-6 pt-2 text-sm text-ink/90 leading-relaxed">
          {/* 1. Pengendali & Konteks Prototipe */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="gavel" className="text-primary" size="sm" />
              1. Identitas Pengendali Data &amp; Konteks Prototipe
            </h2>
            <p>
              Pengendali Data pada prototipe Central Trash Agent Bali adalah <strong>Tim Punya Dendam (Tim Pengembang)</strong> untuk keperluan demonstrasi dan evaluasi kompetisi <em>AI Web Innovation Challenge Bali DigiFest 2026</em>.
            </p>
            <p>
              Prinsip pemrosesan data merujuk pada standar etika pelindungan data dan simulasi operasional berbasis sumber sesuai semangat Pergub Bali No. 47/2019.
            </p>
          </section>

          {/* 2. Data yang Dikumpulkan */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="folder_shared" className="text-primary" size="sm" />
              2. Jenis Data yang Diproses
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Data Identitas Sesi</span>
                <p>Nama profil, email percontohan/pendaftaran, dan tipe tempat timbulan (rumah tangga atau badan usaha).</p>
              </div>
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Data Lokasi Geospasial</span>
                <p>Kecamatan, desa/kelurahan, nama banjar adat, dan koordinat GPS titik penjemputan sampah.</p>
              </div>
              <div className="vector-card-soft bg-bg p-3.5 text-xs grid gap-1">
                <span className="font-extrabold text-primary">Karakteristik Timbulan &amp; Foto</span>
                <p>Foto tumpukan sampah untuk estimasi volume, catatan kondisi tempat sampah, dan ukuran wadah rutin.</p>
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
              Model penglihatan komputer (vision AI) yang terpasang pada prototipe ini dirancang secara ketat untuk menganalisis material fisik sampah (organik, botol plastik, kertas, residu, dan indikasi B3) serta volume wadah.
            </p>
            <div className="rounded-lg border-2 border-ink bg-sky/20 p-3 text-xs font-semibold text-ink">
              <strong>Prinsip Privasi di Sumber:</strong> Sistem TIDAK melakukan pengenalan wajah biometrik (facial recognition), tidak mengidentifikasi pelat kendaraan bermotor, dan menyaring teks sensitif secara otomatis.
            </div>
          </section>

          {/* 4. Hak Subjek Data */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="shield" className="text-primary" size="sm" />
              4. Hak Pengguna sebagai Subjek Data
            </h2>
            <p>Pengguna memiliki hak penuh dalam prototipe ini untuk:</p>
            <ul className="list-disc pl-5 grid gap-1 text-xs font-semibold text-ink/80">
              <li><strong>Hak Akses:</strong> Melihat data profil timbulan, riwayat penjemputan, dan memori yang dicatat oleh asisten personal Kresna.</li>
              <li><strong>Hak Pembaruan:</strong> Mengubah alamat, banjar, perkiraan kantong mingguan, atau pilihan rahinan Bali kapan saja melalui halaman Profil.</li>
              <li><strong>Hak Penghapusan (Right to Erasure):</strong> Keluar akun atau meminta pembersihan data uji coba melalui kanal pengembang.</li>
              <li><strong>Hak Kontrol:</strong> Warga memiliki hak menentukan persentase pemilahan manual tanpa wajib mengikuti estimasi otomatis AI.</li>
            </ul>
          </section>

          {/* 5. Keamanan Data */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="lock" className="text-primary" size="sm" />
              5. Keamanan &amp; Retensi Data
            </h2>
            <p>
              Transmisi data memakai HTTPS (TLS 1.2 atau yang lebih baru, mengikuti setelan server). Sesi masuk disimpan di cookie httpOnly yang ditandatangani server. Kata sandi baru disimpan sebagai hash; baris demo yang masih plaintext diverifikasi lalu ditingkatkan saat masuk berhasil. Pembatasan laju berlaku pada masuk, klasifikasi, percakapan Kresna, evaluasi live, serta permintaan yang mengubah data (laporan, rencana, penjelasan, keputusan, dan akun). Batas itu dihitung di memori tiap instans, bukan satu gerbang bersama untuk seluruh API.
            </p>
          </section>

          {/* 6. Kontak Pengembang */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="contact_mail" className="text-primary" size="sm" />
              6. Kontak Tim Pengembang
            </h2>
            <div className="vector-card-soft bg-mint/40 p-4 text-xs font-medium text-ink grid gap-1">
              <p className="font-extrabold text-sm">Tim Pengembang — Tim Punya Dendam</p>
              <p>Proyek: Prototipe Central Trash Agent Bali (Bali DigiFest 2026)</p>
              <p>Repositori: github.com/Yada912/Trash-Central-Agent (Issues)</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-ink">
          <Link
            href="/syarat-ketentuan"
            className="btn-tactile bg-sky text-ink px-4 py-2 text-xs font-black border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            Baca Ketentuan Prototipe →
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
