# Proposal Teknis — Central Trash Agent Bali

**AI Web Innovation Challenge — Bali DigiFest 2026**
- **Kategori:** Mahasiswa / Umum
- **Ruang Lingkup:** Bali Smart Society
- **Tim Pengembang (Tim Punya Dendam):**
  - I Wayan Gde Adi Surya Wirawan — Universitas Udayana (Ketua Tim)
  - I Made Adi Wijaya — University of Western Australia
- **Repositori Kode Sumber:** `https://github.com/Yada912/Trash-Central-Agent`

---

## 1. Latar Belakang & Rumusan Masalah

**Central Trash Agent Bali** menjawab kebutuhan untuk menghubungkan laporan tumpukan sampah dari warga dengan keputusan operasional pengangkutan di Kota Denpasar secara terstruktur, transparan, dan tetap berada di bawah kendali manusia (*human-in-the-loop*). Dalam pengelolaan harian, laporan warga yang dikirim melalui teks bebas atau foto sering kali belum memiliki struktur jenis material, estimasi volume (liter), tingkat urgensi, maupun penandaan limbah berbahaya (B3) yang konsisten untuk langsung diolah menjadi prioritas dan rute armada.

Sebagai konteks skala wilayah:
- Pemerintah Provinsi Bali dalam rilis resmi tanggal 29 Agustus 2025 menyebutkan estimasi timbulan sampah Provinsi Bali sekitar **3.400 ton/hari** [1].
- Pemerintah Kota Denpasar dalam rilis resmi tanggal 13 Maret 2023 menyebutkan timbulan sampah di tingkat kota sekitar **800 ton/hari** [2].
- Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber (Pasal 6 ayat (2)) mewajibkan pemilahan sampah dari sumber menjadi lima kategori: sampah mudah terurai, dapat digunakan kembali, dapat didaur ulang, bahan berbahaya dan beracun (B3), serta residu [3].

Aplikasi ini dirancang sebagai prototipe sistem pendukung keputusan (*decision-support system*) berbasis web yang menjembatani pelaporan warga, asisten personalisasi timbulan (Agen Kresna) terintegrasi kalender Bali & wuku otonan, pemetaan klaster wilayah di 4 kecamatan Kota Denpasar, simulasi jadwal pengangkutan terdesentralisasi, serta perencanaan rute armada berbasis *Capacitated Vehicle Routing Problem* (CVRP) dengan tautan rute Google Maps dan audit keputusan petugas.

---

## 2. Pengguna Sasaran

1. **Warga Kota Denpasar (Pelapor & Pemilah Sumber):**
   Membutuhkan antarmuka web *mobile-first* berbahasa Indonesia untuk:
   - Memahami panduan pemilahan sampah dari sumber sesuai Pergub Bali No. 47 Tahun 2019 dan jadwal pengangkutannya per kecamatan (`/schedule`).
   - Melaporkan temuan tumpukan sampah dengan teks dan foto opsional (`/report`), memeriksa serta mengoreksi hasil klasifikasi AI sebelum memilih titik koordinat Denpasar (melalui geolokasi atas izin eksplisit atau pemilihan pin manual di peta), dan mengirim laporan yang telah dikonfirmasi.
   - Mengatur profil timbulan, wadah rutin mingguan, dan memantau lonjakan sampah upacara adat berdasarkan siklus kalender rahinan Bali dan wuku otonan keluarga (`/warga` & `/akun`).
   - Berinteraksi langsung dengan Agen Kresna untuk konsultasi pengelolaan sampah.
2. **Petugas Pengelola Pengangkutan (Operator Dasbor & Pengemudi Armada):**
   Membutuhkan dasbor operasional (`/dashboard`) dan perencana rute (`/planner` & `/petugas`) untuk:
   - Memantau total volume sampah terlapor (liter) per jenis material, per kecamatan, dan per tingkat urgensi, serta menyaring laporan yang memerlukan tinjauan manusia (`needsReview`) atau penanganan B3 terpisah.
   - Menyusun rencana rute armada berdasarkan kapasitas liter tiap truk, jumlah kru aktif (`truk_aktif = min(jumlah_truk, jumlah_kru)`), dan jam sif kerja.
   - Meninjau urutan rute VRP teroptimasi, membuka navigasi Google Maps langsung di gawai pengemudi, menyesuaikan toleransi lonjakan (*leeway*), dan mencatat log audit WITA (`UTC+8`).

---

## 3. Solusi yang Diimplementasikan

Central Trash Agent Bali menerapkan alur kerja ujung-ke-ujung dengan pemisahan tegas antara **interpretasi/penjelasan AI** dan **perhitungan optimasi deterministik**:

1. **Pelaporan Warga dengan Konfirmasi Manusia (`/report`):**
   - Warga memasukkan deskripsi teks (1–1.000 karakter) dan/atau foto opsional (dikompresi di sisi klien ke maksimum 1280 px JPEG, $\le 3\text{ MB}$).
   - Endpoint `POST /api/reports/classify` memanggil model multimodal **Gemini 3.5 Flash** bila `GEMINI_CLASSIFY_MODEL` diisi demikian. Jika variabel kosong, kode memakai `gemini-2.5-flash`. Keluaran: komposisi jenis sampah (`organic`, `plastic`, `paper`, `metal`, `residual`, `hazardous`), estimasi volume (liter dan label `small`/`medium`/`large`), tingkat urgensi (`low`/`medium`/`high`), skor keyakinan (`confidence` $0\text{--}1$), alasan singkat (`rationale`), serta bendera kualitas/risiko (`flags`). Kata jumlah rumah tangga (kantong, karung, dan sejenisnya) dipetakan ke liter di server bila model menahan volume.
   - Warga wajib meninjau hasil tersebut, dapat mengubah proporsi jenis sampah atau volume secara langsung, menentukan koordinat di dalam kotak batas daratan Kota Denpasar (`lat -8.75..-8.57`, `lng 115.16..115.28`), serta mencentang persetujuan eksplisit sebelum mengirim ke `POST /api/reports`.
2. **Dasbor Pemantauan Spasial Wilayah (`/dashboard`):**
   - Menampilkan metrik teragregasi, klaster peta Leaflet interaktif untuk laporan biasa, penanda terpisah untuk laporan B3, serta daftar fasilitas referensi TPS3R Kota Denpasar.
   - Mendukung pemfilteran langsung berdasarkan kecamatan (`Denpasar Barat`, `Denpasar Timur`, `Denpasar Selatan`, `Denpasar Utara`), status (`new`, `planned`, `collected`), tanggal, dan status `needsReview`.
3. **Jadwal Pengangkutan & Pemilahan Sumber (`/schedule`):**
   - Menampilkan simulasi jadwal pengangkutan mingguan berdasarkan kecamatan, aliran sampah (`organik`, `anorganik`, `residu`, `B3`), dan jenis akun (`household` / `company`), lengkap dengan pemetaan 5 kategori sumber Pergub Bali No. 47 Tahun 2019.
4. **Perencana Rute Deterministik & Integrasi Google Maps (`/planner`):**
   - Petugas mengatur armada truk beserta kapasitas liter, jumlah kru, dan jam mulai/akhir sif, lalu menjalankan `POST /api/plans`.
   - Solver VRP deterministik (`lib/planner/vrp.ts`) memisahkan laporan B3 ke daftar `unassigned` (`hazardous_separate`), lalu menyusun rute truk untuk laporan biasa dari depo simulasi **TPA Suwung** menggunakan algoritma *cheapest-insertion* dan *2-opt*.
   - Model **Gemini 3.5 Flash-Lite** (`gemini-3.5-flash-lite` bila `GEMINI_EXPLAIN_MODEL` diisi demikian; default kode jika kosong adalah `gemini-2.5-flash-lite`) menyusun kode penjelasan. Jika model itu gagal, rantai model lain dicoba, lalu templat deterministik. Angka rute tetap dari solver.
   - Petugas dapat memindahkan pemberhentian antar-truk (`edit`), membuka tautan rute preloaded Google Maps, menyetujui rencana (`approve`), atau menolak rencana (`reject` dengan catatan audit).

---

## 4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia

### 4.1 Arsitektur Pembagian Tugas Model (*Task-Split Models*) & Failover Multi-Kunci
Untuk mengoptimalkan akurasi multimodal sekaligus menjaga efisiensi kuota dan latensi, sistem membagi beban kerja ke model Gemini melalui [`lib/ai/keys.ts`](../lib/ai/keys.ts):
- **Tugas Klasifikasi Laporan & Asisten Kresna (`GEMINI_CLASSIFY_MODEL`):** Produksi memakai `gemini-3.5-flash`. Default kode bila variabel kosong adalah `gemini-2.5-flash`. Tugas ini menangani analisis citra tumpukan sampah, teks laporan warga, serta percakapan personal warga Kresna.
- **Tugas Penjelasan Rencana Rute (`GEMINI_EXPLAIN_MODEL`):** Produksi memakai `gemini-3.5-flash-lite`. Default kode bila variabel kosong adalah `gemini-2.5-flash-lite`. Kegagalan model berlanjut ke rantai model lalu templat, tanpa mengubah angka solver (`PlanExplanation`).
- **Rotasi & Failover hingga 4 Kunci API:** Konfigurasi `GEMINI_API_KEY` hingga `GEMINI_API_KEY_4`. Jika kunci aktif mengalami pembatasan laju (`429`) atau gangguan layanan (`503`), sistem otomatis beralih ke kunci cadangan berikutnya.
- **Kejujuran Mode (`live` vs `demo`):** Mode `demo` hanya aktif jika seluruh kunci API kosong. Jika kunci terpasang, kegagalan dilaporkan secara jujur tanpa menggantikan diam-diam menjadi data tiruan.

### 4.2 Penentuan `needsReview` Deterministik & Audit Koreksi B3
Server menghitung status `needsReview` secara deterministik di [`lib/review.ts`](../lib/review.ts):
- `low_confidence`: skor `confidence < 0.5`.
- `hazardous`: proporsi `hazardous > 0` atau bendera `hazardous_present` aktif.
- `low_image_quality`: bendera kualitas foto rendah aktif.
- `insufficient_text` atau `contradictory`: deskripsi terlalu pendek (< 10 karakter tanpa foto) atau terdapat kontradiksi antara teks dan foto.
- `hazard_cleared_by_resident`: AI mendeteksi indikasi limbah B3 pada klasifikasi awal (`aiClassification`), tetapi warga mengubah proporsi `hazardous` menjadi `0%` saat konfirmasi. Server menyimpan `aiClassification` asli untuk audit dan menandai laporan dengan `hazard_cleared_by_resident` agar tetap diverifikasi oleh petugas.

### 4.3 Penanganan Konservatif Limbah B3 pada Solver Rute
Setiap laporan tersimpan yang memiliki proporsi `hazardous > 0` atau bendera `hazardous_present` **tidak pernah** dimasukkan ke rute truk pengangkut sampah biasa. Solver menempatkannya di `result.unassigned` dengan alasan `'hazardous_separate'` untuk penanganan khusus.

---

## 5. Fitur Utama & Status Implementasi

| Komponen / Fitur | Cakupan Implementasi | Bukti Modul & Pengujian |
|---|---|---|
| **Pelaporan Warga (`/report`)** | Masukan teks & foto opsional (kompresi 1280 px), klasifikasi Gemini / fallback demo jujur, editor proporsi & volume, pelacak `hazard_cleared_by_resident`, geolokasi opt-in + peta klik Denpasar, kunci idempotensi (`Idempotency-Key`) | `components/report/*`, `app/api/reports/*`, `tests/empty-report.test.ts` |
| **Dasbor Pemantauan Spasial (`/dashboard`)** | Agregasi liter per jenis, per kecamatan, dan per urgensi; klaster peta Leaflet untuk laporan biasa & penanda B3 terpisah; filter interaktif kecamatan, status, tanggal, dan `needsReview` | `components/dashboard/*`, `lib/dashboard/aggregate.ts`, `tests/ui-dashboard-filter.test.ts` |
| **Perencana Rute VRP (`/planner`)** | Konfigurasi truk/kru/sif (`min(truk, kru)`), solver VRP deterministik dari depo TPA Suwung, optimasi 2-opt, penjelasan narasi Gemini, tautan rute Google Maps, pemindahan pemberhentian antar-truk, log audit WITA | `components/planner/*`, `lib/planner/vrp.ts`, `lib/planner/explain.ts`, `tests/decisions.test.ts` |
| **Portal Warga & Asisten Kresna (`/warga`)** | Manajemen timbulan mandiri, kalender lonjakan rahinan Bali, integrasi wuku otonan pawukon (210 hari), dialog interaktif personalisasi Kresna AI, riwayat pengangkutan | `components/warga/*`, `app/api/agent/chat/*`, `lib/calendar/*`, `tests/agent-chat-flow.test.ts` |
| **Portal Petugas Armada (`/petugas`)** | Pengaturan batas kelonggaran (*leeway*), toleransi lonjakan rahinan adat (+35-40%), jadwal desentralisasi TPS3R per kecamatan | `app/petugas/*`, `lib/accounts/store.ts`, `tests/accounts-optimization.test.ts` |
| **Jadwal Kota (`/schedule`)** | Panduan pemilahan sumber Pergub Bali 47/2019 ke 4 aliran operasional, filter jadwal mingguan per kecamatan/aliran/akun | `components/schedule/*`, `lib/schedule/*`, `tests/schedule-api.test.ts` |
| **Data Awal & Fasilitas Denpasar** | 150 laporan sintetis terkalibrasi profil komposisi SIPSN (`isDemo: true`) di 4 kecamatan Denpasar; data fasilitas TPS3R/TPA; akun percontohan evaluasi juri | `data/reports.json`, `data/facilities.json`, `data/accounts.json`, `data/timetable.json` |

---

## 6. Pengungkapan Teknologi (*Technology Disclosure*)

| Kategori | Teknologi / Komponen yang Digunakan |
|---|---|
| **Frontend & UI** | Next.js 15.5.29 (App Router), React 19.3.1, TypeScript 5.9.3, Tailwind CSS 3.4.19, `@fontsource/inter`, Google Material Symbols |
| **Peta & Geospasial** | Leaflet 1.9.4 & React-Leaflet 5.0.0 dengan ubin peta OpenStreetMap (`© OpenStreetMap contributors`) |
| **Backend & Penyimpanan** | Next.js Route Handlers (`app/api/*`), Zod 3.25.76 untuk validasi skema, adaptor penyimpanan Supabase PostgreSQL (`lib/store/supabase.ts`) dan in-memory server fallback (`lib/store/memory.ts`) |
| **Model AI Produk** | Vercel AI SDK (`ai` v7, `@ai-sdk/google` v4) terhubung ke Google Gemini API: `gemini-3.5-flash` (klasifikasi multimodal & agen Kresna) dan `gemini-3.5-flash-lite` (penjelasan rute VRP) dengan rotasi multi-kunci |
| **Algoritma Optimasi** | Solver CVRP deterministik kustom (`lib/planner/vrp.ts`) menggunakan algoritma *cheapest-insertion* + *2-opt* (kecepatan rata-rata 25 km/jam, waktu henti 8 menit/titik) dan alokator jadwal mingguan (`lib/planner/weekly.ts`) |
| **Data & Referensi** | 150 laporan awal sintetis (`data/reports.json`) terkalibrasi SIPSN KLHK; 5 entri fasilitas referensi Kota Denpasar (`data/facilities.json`); kalender rahinan & wuku pawukon Bali 2026 |
| **Pengujian Kualitas** | Vitest 5.1 (36 berkas uji, 176 pengujian unit/integrasi lolos) dan Playwright 1.65 (pengujian E2E) |

---

## 7. Referensi

1. Pemerintah Provinsi Bali, *"Kementerian LH Apresiasi PSBS Bali, Dewa Indra: Ini Cambuk Bagi Daerah"*, 29 Agustus 2025. https://www.baliprov.go.id/web/kementerian-lh-apresiasi-psbs-bali-dewa-indra-ini-cambuk-bagi-daerah/
2. Pemerintah Kota Denpasar, *"Presiden RI Joko Widodo Resmikan TPST Kota Denpasar"*, 13 Maret 2023. https://www.denpasarkota.go.id/berita/presiden-ri-joko-widodo-resmikan-tpst-kota-denpasar
3. Pemerintah Provinsi Bali, *Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber*, Pasal 6 ayat (2).
4. Kementerian Lingkungan Hidup dan Kehutanan (KLHK), *Sistem Informasi Pengelolaan Sampah Nasional (SIPSN)* — Data Komposisi Sampah Kota Denpasar. https://sipsn.menlhk.go.id
5. Waste4Change (https://waste4change.com) & Rekosistem (https://rekosistem.com) — Referensi layanan pengelolaan sampah terpilah.
6. FixMyStreet (https://www.fixmystreet.com) & LAPOR! (https://www.lapor.go.id) — Referensi kanal pelaporan publik.
7. Google for Developers, *"Capacity Constraints (CVRP)"*, Dokumentasi OR-Tools. https://developers.google.com/optimization/routing/cvrp
