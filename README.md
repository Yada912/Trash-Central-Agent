# Central Trash Agent Bali

**Tim Punya Dendam** · AI Web Innovation Challenge — Bali DigiFest 2026 · Kategori Mahasiswa/Umum · Ruang lingkup Bali Smart Society

## Description

Central Trash Agent Bali adalah **agen AI yang mengelola sampah setiap rumah tangga** di Kota Denpasar. Setiap warga memiliki agen bernama **Kresna** yang menjalankan satu siklus kerja:

1. **Mengamati** chat, laporan teks/suara/foto, dan kalender rahinan Bali serta otonan.
2. **Memahami** masukan itu dengan Google Gemini.
3. **Mengingat** model timbulan rumah tangga dan memori jangka panjang tentang warga.
4. **Menghitung** permintaan per aliran (organik, anorganik, residu, B3) terhadap kapasitas dan toleransi (*leeway*) armada kecamatan.
5. **Bertindak** dengan rekomendasi: rutin, tertampung leeway, perlu jemput tambahan, atau B3 on-request.

Dengan begitu, pengangkutan berubah dari jadwal tetap menjadi **berbasis permintaan**. Di sisi petugas, laporan dan permintaan warga diubah oleh **solver rute deterministik** menjadi usulan rute, yang dijelaskan Gemini lalu disetujui, diedit, atau ditolak petugas dengan log audit.

> Agen mengusulkan, manusia memutuskan. Agen tidak memesan atau memberangkatkan armada sendiri.

> [!NOTE]
> **Catatan Status Proposal & Kemitraan:** Tim pengembang belum menjalin komunikasi resmi dengan pihak petugas operasional kebersihan maupun instansi kedinasan. Secara garis besar, platform ini diajukan sebagai usulan (proposal inovasi teknologi) dan bukti konsep (*proof of concept*) bahwa sistem persampahan desentralisasi cerdas berbasis agen AI dapat diwujudkan secara nyata di Bali.

## Problem & Target User

**Masalah.** Laporan sampah warga biasanya berupa teks bebas atau foto tanpa struktur (jenis, liter, urgensi, B3), sehingga sulit langsung dipakai untuk menyusun prioritas dan rute. Lonjakan sampah musiman khas Bali (Galungan, Kuningan, odalan) juga tidak tercermin di jadwal angkut yang tetap. Sebagai konteks skala, timbulan sampah Bali diperkirakan sekitar 3.400 ton/hari pada 2025 (Pemprov Bali, 29 Agustus 2025). Rujukan lengkap ada di [`docs/REGULATION-AND-DATA-REFERENCES.md`](./docs/REGULATION-AND-DATA-REFERENCES.md).

**Pengguna sasaran.**
- **Warga & UMKM Denpasar** (portal `/warga`): melapor cepat dari ponsel, melihat jadwal angkut per aliran sampah, dan memberi tahu lonjakan sampah saat upacara.
- **Petugas pengangkutan** (portal `/petugas`): memantau laporan per jenis, kecamatan, dan urgensi, memisahkan laporan B3, serta menyusun rute yang menghormati kapasitas truk, jumlah kru, dan jam sif.

## Key Features

Core feature yang sudah berfungsi:
- **Agen Kresna (portal `/warga`)**: chat dengan dikte suara, memori jangka panjang per warga, pembaruan model timbulan otomatis, status per aliran terhadap kapasitas + leeway kecamatan, dan rekomendasi tindakan. Kalender rahinan & otonan menambah perkiraan lonjakan.
- **Pelaporan warga (`/report`)**: kamera langsung atau galeri, dikte suara (Web Speech API peramban), chip kondisi cepat, klasifikasi Gemini, editor takaran 3 mode (hitung kantong/ember, liter, persen), geolokasi opt-in atau pin peta manual, konfirmasi akhir sebelum kirim.
- **Dasbor petugas (`/dashboard`)**: peta Leaflet dengan klaster grid 0,02°, total liter per jenis, kecamatan, dan urgensi, daftar B3 terpisah, filter kecamatan/status/tanggal/`needsReview`.
- **Perencana rute (`/planner`)**: input truk, kapasitas, kru, dan sif; solver deterministik; penjelasan Gemini; pemindahan pemberhentian antar-truk dengan validasi ulang. Persetujuan diblokir bila rute tidak layak atau penjelasan kedaluwarsa. Log audit mencatat versi, aksi, aktor, dan waktu WITA.
- **Akun & portal terpisah**: login warga dan petugas, akses berbasis peran, profil timbulan mingguan.

Fitur tambahan yang sudah berfungsi: jadwal angkut per kecamatan/aliran/jenis akun, panduan pemilahan Pergub Bali 47/2019 Pasal 6(2), kalender hari raya Bali 2026, dan daftar wilayah layanan.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js 15.5 (App Router), React 19.3, TypeScript 5.9, Tailwind CSS 3.4, Radix UI, Leaflet 1.9 + React-Leaflet 5 (ubin OpenStreetMap) |
| Backend | Next.js Route Handlers (`app/api/*`), Node.js ≥ 22, validasi Zod 3.25 |
| Database | Adaptor penyimpanan (`lib/store/`): Supabase PostgreSQL bila `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` diatur, jika tidak memakai penyimpanan memori server yang dimuat dari data seed |
| AI | Google Gemini API melalui Vercel AI SDK (`ai`, `@ai-sdk/google`) |
| Hosting | Vercel (region `sin1`), branch `production` |
| Pengujian | Vitest (35 berkas uji), Playwright (E2E), CI GitHub Actions |

## AI Implementation

| Fungsi | Model (produksi) | Input → Output |
|---|---|---|
| Klasifikasi laporan `POST /api/reports/classify` | `gemini-3.5-flash` | Teks (1–1.000 karakter) + ≤1 foto → proporsi 6 jenis (organic, plastic, paper, metal, residual, hazardous), liter + label volume, urgensi, confidence 0–1, alasan, penanda; atau `not_trash` |
| Asisten Kresna `POST /api/agent/chat` | `gemini-3.5-flash` | Pesan warga + profil + jadwal → balasan dan pembaruan profil terstruktur (kondisi, liter ekstra acara, aliran dominan) |
| Penjelasan rute `POST /api/plans`, `POST /api/plans/:id/explain` | `gemini-3.5-flash-lite` | Hasil solver → ringkasan dan risiko. Model hanya memilih kode, sedangkan kalimat dan angka dirender server dari fakta solver |

Model diatur lewat `GEMINI_CLASSIFY_MODEL` / `GEMINI_EXPLAIN_MODEL`. Jika variabel kosong, kode memakai `gemini-2.5-flash` / `gemini-2.5-flash-lite` ([`lib/ai/keys.ts`](./lib/ai/keys.ts)). Lingkungan produksi mengisi `gemini-3.5-flash` dan `gemini-3.5-flash-lite`. Hingga 4 kunci API dirotasi otomatis saat terkena 429/503. Penjelasan rute mencoba model explain, lalu model klasifikasi, lalu `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-3.5-flash`, dan `gemini-3.5-flash-lite`, lalu templat deterministik jika semuanya gagal. Klasifikasi tidak mengganti kegagalan model dengan mock.

**Pengaman:**
- `needsReview` dihitung server secara deterministik ([`lib/review.ts`](./lib/review.ts)): confidence < 0,5, ada B3, teks terlalu pendek, kontradiksi, atau foto berkualitas rendah.
- Laporan dengan porsi B3 > 0 tidak pernah masuk rute truk biasa (`hazardous_separate`).
- Penghapusan label B3 oleh warga diaudit (`hazard_cleared_by_resident`).
- Tanpa kunci API → mode `demo` berlabel. Dengan kunci, kegagalan klasifikasi dilaporkan sebagai galat. Kegagalan penjelasan rute beralih ke model berikutnya, lalu ke templat berlabel `template-fallback`. Kresna yang gagal memanggil model menandai balasan `source: template`.
- Guard *prompt injection*, penyamaran data pribadi, dan pembatasan laju ([`lib/security/guard.ts`](./lib/security/guard.ts)).

**Optimasi rute bukan AI.** [`lib/planner/vrp.ts`](./lib/planner/vrp.ts) memakai *cheapest insertion* berbasis urgensi + 2-opt, jarak Haversine garis lurus, 25 km/jam, dan 8 menit per pemberhentian.

## Architecture / Data Flow

```
Warga ──► /report ──► POST /api/reports/classify ──► Gemini (klasifikasi)
                         │
                         ▼
            Tinjau & koreksi warga ──► lokasi (GPS opt-in / pin) ──► POST /api/reports
                                                                        │ needsReview (server)
                                                                        ▼
                                                           Store (Supabase | memori + seed)
                                                                        │
Petugas ──► /dashboard (agregasi, klaster, B3) ◄────────────────────────┘
        └─► /planner ──► POST /api/plans ──► solver VRP deterministik ──► Gemini (penjelasan berbasis kode)
                                   └─► approve / edit / reject ──► log audit WITA
```

Detail: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · Kontrak API: [`docs/API-CONTRACT.md`](./docs/API-CONTRACT.md)

## Installation / Run Instructions

Prasyarat: Node.js ≥ 22 dan pnpm 10.

```bash
pnpm install
cp .env.example .env     # isi GEMINI_API_KEY (s.d. GEMINI_API_KEY_4) untuk mode live
pnpm dev                 # http://localhost:3000
```

Tanpa `GEMINI_API_KEY`, aplikasi berjalan dalam mode `demo` berlabel. Supabase bersifat opsional (lihat [`docs/VERCEL-DEPLOYMENT.md`](./docs/VERCEL-DEPLOYMENT.md)).

Pengujian: `pnpm test` (Vitest) · `pnpm typecheck` · `pnpm lint` · `pnpm e2e` (Playwright).

## Deployment URL

- Produksi: **https://central-trash-agent-bali.vercel.app**
- Versi yang dinilai Tahap 1: tag `v1.0-submission`

## Demo Account (jika diperlukan - jangan simpan password sensitif di public repo)

Portal petugas memerlukan login. Akun demo untuk juri **dikirim melalui formulir panitia**, tidak dicantumkan di README ini. Akun demo hanya berisi data fiktif.

## Known Limitations

- Laporan bawaan adalah **150 data sintetis** (`isDemo: true`), bukan laporan warga nyata.
- Jarak rute adalah perkiraan **garis lurus** (Haversine), bukan rute jalan. Rute tidak diklaim optimal.
- Volume dan jenis dari foto adalah perkiraan AI. Confidence belum terkalibrasi, dan penanda B3 bukan identifikasi B3 bersertifikat.
- Tanpa Supabase, data tersimpan di memori satu instans server dan dapat hilang saat instans berganti.
- TPA Suwung dipakai sebagai **depo simulasi** (status operasional belum diverifikasi). Tidak ada kemitraan atau integrasi dengan DLH/DLHK, dan tidak ada armada yang benar-benar diberangkatkan.
- Bergantung pada kuota Gemini API.
- Future work (belum ada di MVP): peta wilayah Bali (branch terpisah), titik daur ulang, marketplace UMKM, integrasi bank sampah.

## Third-party Resources / Credits

- Pustaka: Next.js, React, Tailwind CSS, Radix UI, Zod, Supabase JS (MIT); Vercel AI SDK, Playwright (Apache-2.0); Leaflet (BSD-2); React-Leaflet (Hippocratic-2.1); Vitest, ESLint (MIT).
- Peta: © OpenStreetMap contributors (ODbL). Font: Inter (SIL OFL 1.1), Google Material Symbols (Apache-2.0).
- Data: statistik Pemprov Bali & Pemkot Denpasar, Pergub Bali No. 47/2019, dan titik fasilitas dari sumber publik. Lihat [`data/README-facilities.md`](./data/README-facilities.md).
- AI coding assistant: Cursor (Cursor Agent) dan Google Antigravity (Gemini). Rincian di [`docs/AI-TECHNOLOGY-DISCLOSURE.md`](./docs/AI-TECHNOLOGY-DISCLOSURE.md).

## Team Members

| Nama | Peran | Instansi |
|---|---|---|
| I Wayan Gde Adi Surya Wirawan | Ketua tim, pengembangan produk & integrasi | Universitas Udayana |
| I Made Adi Wijaya | Anggota | University of Western Australia |

Lisensi: Apache-2.0 (lihat [`LICENSE`](./LICENSE)).