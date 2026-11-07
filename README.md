# Central Trash Agent (Agen Sampah Terpusat) — Denpasar

Prototipe **Bali Smart Society** untuk **AI Web Innovation Challenge — Bali DigiFest 2026**. Menghubungkan pelaporan sampah warga (teks dan foto opsional) dengan dasbor pemantauan kota, panduan jadwal pemilahan berbasis sumber (**Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)**), serta perencana rute pengangkutan deterministik (*Capacitated Vehicle Routing Problem*) dengan prinsip **manusia dalam kendali** (*human-in-the-loop*).

---

## Fitur Utama

1. **Pelaporan Warga (`/report`):**
   - Masukan deskripsi teks dan foto opsional (dikompresi di sisi klien ke $\le 1280\text{ px}$ JPEG sebelum diunggah).
   - Klasifikasi otomatis komposisi jenis sampah, volume (liter), tingkat urgensi, dan skor keyakinan menggunakan **Gemini 2.5 Flash** (`gemini-2.5-flash`).
   - Peninjauan & pengeditan wajib oleh warga sebelum laporan dikirim, termasuk pelacakan audit deterministik apabila warga menghapus indikasi limbah B3 (`hazard_cleared_by_resident`).
   - Penentuan lokasi di dalam kotak batas Kota Denpasar (`-8.75..-8.57`, `115.16..115.28`) melalui geolokasi atas izin eksplisit atau pemilihan pin manual pada peta.
2. **Panduan Pemilahan & Jadwal Pengangkutan (`/schedule` & `/`):**
   - Panduan pemilahan 5 jenis sampah dari sumber sesuai **Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)** (`mudah_terurai`, `guna_ulang`, `daur_ulang`, `b3`, `residu`) yang dipetakan ke 4 aliran operasional (`organik`, `anorganik`, `residu`, `B3`).
   - Simulasi jadwal pengangkutan mingguan berdasarkan kecamatan, aliran sampah, dan jenis akun (`household` / `company`).
3. **Dasbor Petugas (`/dashboard`):**
   - Ringkasan volume liter per jenis material, per kecamatan, dan per tingkat urgensi.
   - Peta klaster interaktif Kota Denpasar (Leaflet/OpenStreetMap) dengan pemisahan visual untuk laporan limbah berbahaya (B3) dan filter laporan yang memerlukan tinjauan (`needsReview`).
4. **Perencana Rute VRP & Audit Keputusan (`/planner`):**
   - Perhitungan rute truk, beban liter, jarak, dan durasi sif dilakukan oleh **solver VRP deterministik** ([`lib/planner/solve.ts`](./lib/planner/solve.ts)) dari depo simulasi **TPA Suwung**.
   - Penjelasan naratif rute dan risiko operasional disusun secara terpisah oleh **Gemini 2.5 Flash-Lite** (`gemini-2.5-flash-lite`) tanpa mengubah angka solver.
   - Limbah B3 secara otomatis dikecualikan dari rute truk biasa (`hazardous_separate`).
   - Petugas memegang keputusan akhir (`approve`, `edit`, `reject`) dengan pengendalian versi optimistik dan pencatatan log audit berstempel waktu WITA (`UTC+8`).

---

## Pembagian Model AI & Rotasi Multi-Kunci

Sistem membagi beban kerja AI berdasarkan kompleksitas tugas ([`lib/ai/keys.ts`](./lib/ai/keys.ts)):
- **Klasifikasi Laporan (`POST /api/reports/classify`):** menggunakan `gemini-2.5-flash` (dapat diubah melalui `GEMINI_CLASSIFY_MODEL`).
- **Penjelasan Rencana Rute (`POST /api/plans`, `POST /api/plans/:id/explain`):** menggunakan `gemini-2.5-flash-lite` (dapat diubah melalui `GEMINI_EXPLAIN_MODEL`).
- **Failover Otomatis hingga 4 Kunci API:** mendukung `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, dan `GEMINI_API_KEY_4` (atau daftar koma pada `GEMINI_API_KEYS`). Jika satu kunci terkena batas kuota (`429`) atau gangguan sementara (`503`), sistem otomatis beralih ke kunci berikutnya.

---

## Cara Menjalankan

```bash
pnpm install
cp .env.example .env   # opsional: isi GEMINI_API_KEY..GEMINI_API_KEY_4 untuk mode live
pnpm dev               # buka http://localhost:3000
```

- **Mode `live`:** aktif apabila minimal satu `GEMINI_API_KEY` diisi. Kegagalan panggil model setelah mencoba seluruh kunci cadangan akan mengembalikan error secara jujur dan tidak pernah diam-diam digantikan oleh mock.
- **Mode `demo`:** aktif apabila tidak ada `GEMINI_API_KEY` yang diatur. Aplikasi tetap berjalan penuh menggunakan aturan kata kunci deterministik dan penjelasan templat yang diberi label `demo` secara eksplisit di UI.

---

## Pengujian Kualitas

```bash
pnpm test              # Menjalankan 31 berkas pengujian unit & integrasi (Vitest)
pnpm typecheck         # Memeriksa tipe TypeScript (tsc --noEmit)
pnpm e2e               # Menjalankan pengujian ujung-ke-ujung peramban (Playwright)
```

---

## Dokumentasi Lengkap

- [`docs/API-CONTRACT.md`](./docs/API-CONTRACT.md) — Spesifikasi kontrak REST API, skema Zod, aturan `needsReview`, dan state machine keputusan rencana rute.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Arsitektur teknis, diagram sistem & alur pengguna, desain solver VRP deterministik, dan strategi multi-kunci Gemini.
- [`docs/REGULATION-AND-DATA-REFERENCES.md`](./docs/REGULATION-AND-DATA-REFERENCES.md) — Landasan regulasi Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2), statistik timbulan sampah, dan provenans data.
- [`docs/PROPOSAL.md`](./docs/PROPOSAL.md) — Dokumen proposal teknis lengkap Bali DigiFest 2026.
- [`docs/DEMO-GUIDE.md`](./docs/DEMO-GUIDE.md) — Panduan skenario demonstrasi langkah demi langkah.
- [`data/README.md`](./data/README.md) & [`data/README-facilities.md`](./data/README-facilities.md) — Dokumentasi provenans 150 laporan sintetis (`data/reports.json`) dan fasilitas pengelolaan sampah Denpasar (`data/facilities.json`).

---

## Batasan & Kejujuran Data

- Rekaman awal di `data/reports.json` adalah **data demo sintetis** (`isDemo: true`) yang dikalibrasi terhadap profil komposisi publik SIPSN KLHK untuk Kota Denpasar, bukan laporan warga nyata.
- **TPA Suwung** digunakan sebagai **depo simulasi (status operasional belum terverifikasi)** untuk perhitungan jarak garis lurus berkelokan pada solver rute; fasilitas Bank Sampah tanpa koordinat terverifikasi (`lat/lng: null`) hanya ditampilkan sebagai daftar referensi dan tidak pernah dipetakan pada titik koordinat rekaan.
