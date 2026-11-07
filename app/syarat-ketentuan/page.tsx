import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan Layanan — Central Trash Agent Bali',
  description:
    'Ketentuan operasional dan kewajiban hukum pengelolaan sampah berbasis sumber Central Trash Agent Bali berdasarkan Pergub Bali No. 47/2019 dan Perda Denpasar No. 8/2023.',
}

export default function SyaratKetentuanPage() {
  return (
    <main id="main" className="grid gap-6 max-w-4xl mx-auto" data-testid="syarat-ketentuan-page">
      <section className="vector-card bg-card p-6 md:p-8 grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="vector-pill bg-sky text-ink font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="description" size="sm" />
            Ketentuan Layanan Resmi
          </span>
          <span className="vector-pill bg-mint text-ink font-extrabold">
            Pergub Bali No. 47/2019
          </span>
          <span className="vector-pill bg-amber text-ink font-extrabold">
            Perda Denpasar No. 8/2023
          </span>
        </div>

        <h1 className="text-3xl font-black text-ink tracking-tight">
          Syarat &amp; Ketentuan Layanan
        </h1>
        <p className="text-sm font-semibold text-ink/75">
          Berlaku Efektif: 1 Januari 2026 · Dinas Lingkungan Hidup dan Kebersihan Kota Denpasar
        </p>

        <div className="rounded-xl border-2 border-ink bg-sky/20 p-4 text-xs font-medium text-ink leading-relaxed">
          Dengan mengakses atau menggunakan platform <strong>Central Trash Agent Bali</strong>, Anda menyetujui seluruh ketentuan operasional, hak, dan kewajiban yang diatur berdasarkan regulasi pengelolaan sampah Kota Denpasar dan Provinsi Bali.
        </div>

        <div className="grid gap-6 pt-2 text-sm text-ink/90 leading-relaxed">
          {/* 1. Pemilahan di Sumber */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="checklist" className="text-primary" size="sm" />
              1. Kewajiban Warga: Pemilahan Wajib Berbasis Sumber
            </h2>
            <p>
              Berdasarkan <strong>Pergub Bali No. 47 Tahun 2019</strong>, setiap penghuni rumah tangga dan pelaku usaha di wilayah Kota Denpasar berkewajiban melakukan pemilahan sampah di tempat timbulan (sumber) menjadi minimal 3 kategori utama:
            </p>
            <ul className="list-disc pl-5 grid gap-1.5 text-xs font-semibold text-ink/85">
              <li><strong>Sampah Organik:</strong> Sisa makanan, daun, sisa banten, janur, canang sari, dan potongan ranting taman. Wajib ditempatkan pada wadah terpisah untuk pengolahan kompos di TPS3R desa/kelurahan.</li>
              <li><strong>Sampah Anorganik:</strong> Botol plastik PET, gelas plastik, kardus, kaleng, dan kertas yang bersih/kering. Ditujukan untuk Bank Sampah banjar atau industri daur ulang.</li>
              <li><strong>Sampah Residu:</strong> Popok sekali pakai, pembalut, puntung rokok, kain perca kotor, dan sisa bahan yang tidak dapat diolah. Ditujukan untuk penjemputan berkala menuju TPST.</li>
            </ul>
            <div className="rounded-lg border-2 border-ink bg-coral/20 p-3 text-xs font-bold text-alert">
              Sanksi Penundaan: Petugas armada DLHK berhak menunda penjemputan sampah yang terbukti tercampur tanpa pemilahan hingga warga memilahnya dengan benar.
            </div>
          </section>

          {/* 2. Pelarangan Limbah B3 */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="battery_alert" className="text-primary" size="sm" />
              2. Penanganan Khusus Limbah Berbahaya &amp; Beracun (B3)
            </h2>
            <p>
              Baterai bekas, aki, kaleng aerosol, lampu neon, sisa pestisida, dan limbah medis <strong>dilarang keras dicampur</strong> ke dalam kantong sampah harian biasa.
            </p>
            <p className="text-xs text-ink/80">
              Warga wajib memisahkan limbah B3 ke wadah kering tertutup dan meminta jadwal penjemputan khusus (on-request) atau membawanya ke drop-box B3 yang disediakan di kantor kelurahan/kecamatan.
            </p>
          </section>

          {/* 3. Hak Warga & Toleransi Leeway */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="schedule" className="text-primary" size="sm" />
              3. Hak Warga atas Ketepatan Jadwal &amp; Kuota Kelonggaran (Leeway)
            </h2>
            <p>
              Warga berhak mendapatkan penjemputan sampah sesuai jadwal desentralisasi TPS3R di kecamatannya. Pada masa hari raya keagamaan Hindu (Galungan, Kuningan, Nyepi, Piodalan, Purnama/Tilem) atau upacara keluarga (Otonan, Metatah, Pawiwahan), armada DLHK memberlakukan batas kelonggaran muatan (leeway) ekstra hingga +50% untuk menampung lonjakan sampah organik.
            </p>
          </section>

          {/* 4. Tanggung Jawab Petugas Armada */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="local_shipping" className="text-primary" size="sm" />
              4. Kewajiban &amp; Tanggung Jawab Petugas Armada DLHK / TPS3R
            </h2>
            <ul className="list-disc pl-5 grid gap-1 text-xs font-semibold text-ink/85">
              <li>Mengikuti sekuens rute perjalanan VRP yang dioptimalkan untuk meminimalkan emisi dan kemacetan jalanan Kota Denpasar.</li>
              <li>Menghormati jendela waktu pengangkutan sesuai jadwal tetap kecamatan.</li>
              <li>Menyalurkan sampah organik langsung ke unit komposter TPS3R dan anorganik ke Bank Sampah terdekat.</li>
            </ul>
          </section>

          {/* 5. Batasan Tanggung Jawab */}
          <section className="grid gap-2 border-t-2 border-ink/20 pt-4">
            <h2 className="text-lg font-black text-ink flex items-center gap-2">
              <MaterialIcon name="info" className="text-primary" size="sm" />
              5. Batasan Tanggung Jawab &amp; Kondisi Kahar (Force Majeure)
            </h2>
            <p className="text-xs text-ink/80">
              Jadwal penjemputan dapat mengalami penyesuaian darurat apabila terjadi kondisi kahar seperti cuaca ekstrem, banjir lahar/genangan tinggi, penutupan jalur saat prosesi Melasti/Tawur Kesanga, atau kendala teknis pada fasilitas TPST. Setiap penyesuaian akan diumumkan melalui aplikasi dan koordinat Banjar setempat.
            </p>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-ink">
          <Link
            href="/kebijakan-privasi"
            className="btn-tactile bg-mint text-ink px-4 py-2 text-xs font-black border-2 border-ink shadow-[2px_2px_0_#1F2933]"
          >
            ← Baca Kebijakan Privasi (UU PDP)
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

