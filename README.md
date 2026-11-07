# Central Trash Agent Bali — Sistem Pengelolaan & Pengangkutan Sampah Terpadu Provinsi Bali

Platform web adaptif (*desktop & mobile*) yang menghubungkan **Warga** dan **Petugas DLHK Kota Denpasar** dalam satu alur kerja terpadu: mulai dari pencatatan profil timbulan sampah mingguan & lonjakan acara adat, pelaporan kondisi sampah melalui kamera/suara/takaran mudah, penyesuaian jadwal & toleransi (*leeway*) armada per kecamatan, hingga perencanaan rute pengangkutan deterministik (*Capacitated Vehicle Routing Problem*) dengan prinsip **manusia dalam kendali** (*human-in-the-loop*).

---

## Kapabilitas Utama untuk Kedua Aktor

### 1. Warga (Rumah Tangga & Tempat Usaha)
- **Profil Sampah Mingguan & Acara Khusus (`/akun`):**
  - Mencatat kondisi sampah saat ini (*Terkendali*, *Mulai Menumpuk*, *Meluber*, atau *Pasca Upacara*), jumlah timbulan rutin mingguan menggunakan satuan wadah sehari-hari (**Kantong Kresek 15L**, **Ember 25L**, **Karung 50L**, atau **Gerobak 150L**), serta lonjakan sampah saat **Hari Raya Galungan/Kuningan, Odalan, atau Acara Keluarga**.
  - Menghitung secara otomatis apakah total timbulan sampah mingguan masih tertampung dalam jadwal rutin petugas, masuk dalam batas **toleransi kelonggaran (*leeway*) armada**, atau memerlukan penjemputan tambahan.
- **Pelaporan Kondisi Sampah Cerdas (`/report`):**
  - **Kamera Langsung & Impor Gambar:** Memotret langsung melalui kamera perangkat (*WebRTC live viewfinder* maupun kamera ponsel) atau mengimpor dari galeri dengan kompresi otomatis $\le 1280\text{ px}$.
  - **Suara ke Teks (*Speech-to-Text* Bahasa Indonesia) & Tombol Kondisi Cepat:** Mendiktekan kondisi sampah secara langsung dengan suara atau memilih chip kondisi terkurasi (*"Bagaimana kondisi sampah sekarang?"*).
  - **3 Mode Masukan Takaran Mudah:** Mengedit hasil klasifikasi AI menggunakan **Hitung Kantong/Ember (`+`/`-`)**, **Nilai Langsung (Liter per Jenis)**, atau **Persentase (`%`) dengan Penyeimbang Otomatis ke 100%**.
- **Panduan Pemilahan Sumber (`/schedule` & `/`):**
  - Memetakan 5 kategori wajib **Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)** (`mudah_terurai`, `guna_ulang`, `daur_ulang`, `b3`, `residu`) ke 4 aliran pengangkutan (`organik`, `anorganik`, `residu`, `B3`).

### 2. Petugas Pengelola Pengangkutan (DLHK)
- **Pengaturan Jadwal Tetap & Kelonggaran (*Leeway*) Armada (`/akun` & `/schedule`):**
  - Mengatur hari pengangkutan, rentang jam WITA, toleransi waktu ($\pm\text{menit}$), batas normal liter per penjemputan, serta persentase cadangan kapasitas (*surge tolerance*) per kecamatan saat minggu hari raya.
- **Dasbor Pemantauan & Peta Klaster (`/dashboard`):**
  - Memantau volume sampah terlapor per jenis material, per kecamatan, dan per tingkat urgensi, menyaring laporan yang memerlukan tinjauan manusia (`needsReview`), serta memisahkan laporan limbah berbahaya (B3).
- **Perencana Rute VRP & Audit Keputusan (`/planner`):**
  - Menjalankan solver CVRP deterministik ([`lib/planner/solve.ts`](./lib/planner/solve.ts)) berdasarkan kapasitas truk, jumlah kru, dan jam sif kerja dari depo simulasi **TPA Suwung**.
  - Meninjau penjelasan rute naratif yang disusun oleh Gemini, memindahkan pemberhentian antar-truk (`edit`), serta mencatat keputusan persetujuan (`approve`) atau penolakan (`reject`) dalam log audit berstempel waktu WITA (`UTC+8`).

---

## Pembagian Model AI & Rotasi Multi-Kunci

Dikonfigurasi di [`lib/ai/keys.ts`](./lib/ai/keys.ts):
- **Klasifikasi Laporan (`POST /api/reports/classify`):** menggunakan model multimodal `gemini-3.5-flash` (atau `gemini-2.5-flash` melalui `GEMINI_CLASSIFY_MODEL`).
- **Penjelasan Rencana Rute (`POST /api/plans`, `POST /api/plans/:id/explain`):** menggunakan model cepat `gemini-3.5-flash-lite` (melalui `GEMINI_EXPLAIN_MODEL`).
- **Failover Otomatis hingga 4 Kunci API:** mendukung `GEMINI_API_KEY` hingga `GEMINI_API_KEY_4`. Jika kunci utama terkena batas kuota (`429`) atau gangguan sementara (`503`), sistem otomatis beralih ke kunci cadangan berikutnya.

---

## Cara Menjalankan di Perangkat Lokal

```bash
npm install
cp .env.example .env   # isi GEMINI_API_KEY..GEMINI_API_KEY_4 untuk mode live
npm run dev            # buka http://localhost:3000
```

---

## Pengujian Kualitas

```bash
npm test               # Menjalankan pengujian unit & integrasi (Vitest)
npm run typecheck      # Memeriksa tipe TypeScript (tsc --noEmit)
npm run e2e            # Menjalankan pengujian ujung-ke-ujung peramban (Playwright)
```

---

## Dokumentasi Lengkap

- [`docs/VERCEL-DEPLOYMENT.md`](./docs/VERCEL-DEPLOYMENT.md) — Panduan lengkap langkah demi langkah untuk men-deploy aplikasi ke Vercel.
- [`docs/API-CONTRACT.md`](./docs/API-CONTRACT.md) — Spesifikasi kontrak REST API, skema Zod, aturan `needsReview`, dan state machine keputusan rencana rute.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Arsitektur teknis, diagram sistem & alur pengguna, desain solver VRP deterministik, dan strategi multi-kunci Gemini.
- [`docs/REGULATION-AND-DATA-REFERENCES.md`](./docs/REGULATION-AND-DATA-REFERENCES.md) — Landasan regulasi Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2), statistik timbulan sampah, dan provenans data.
- [`docs/DEMO-GUIDE.md`](./docs/DEMO-GUIDE.md) — Panduan skenario penggunaan lengkap dari sisi Warga dan Petugas.
