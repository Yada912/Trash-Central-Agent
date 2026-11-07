# Panduan Deployment ke Vercel — Central Trash Agent

Dokumen ini menjelaskan langkah demi langkah untuk men-deploy **Central Trash Agent** ke **Vercel** baik melalui dasbor web Vercel (terhubung ke GitHub) maupun melalui **Vercel CLI**.

---

## 1. File Konfigurasi yang Sudah Disiapkan

Repositori ini telah dilengkapi dengan [`vercel.json`](../vercel.json) yang mengatur:
- **Region Server (`sin1` — Singapura):** Memastikan latensi terendah untuk pengguna di Bali / Indonesia.
- **Batas Waktu Fungsi Serverless (`maxDuration: 30` detik):** Memberikan ruang waktu yang cukup untuk pemanggilan multimodal Gemini (`POST /api/reports/classify`) dan penjelasan rute VRP (`POST /api/plans`, `POST /api/plans/[id]/explain`) beserta failover multi-kunci.

---

## 2. Langkah 1 — Push Kode ke Repositori GitHub Anda

Jalankan perintah berikut di terminal pada direktori proyek:

```bash
git add .
git commit -m "feat: complete warga & petugas platform, accounts, camera, speech-to-text, and timetable leeway"
git push origin main
```

---

## 3. Langkah 2 — Hubungkan Proyek di Dasbor Vercel

1. Buka [https://vercel.com/new](https://vercel.com/new) dan masuk menggunakan akun GitHub Anda.
2. Pilih repositori **`Trash-Central-Agent`** lalu klik **Import**.
3. Pastikan pengaturan *Build & Development Settings* terdeteksi otomatis sebagai **Next.js**:
   - **Framework Preset:** `Next.js`
   - **Build Command:** `next build` (default)
   - **Install Command:** `pnpm install` atau `npm install`

---

## 4. Langkah 3 — Atur Environment Variables di Vercel

Sebelum menekan tombol **Deploy**, buka bagian **Environment Variables** di halaman konfigurasi Vercel dan tambahkan variabel berikut:

| Nama Variabel | Nilai yang Direkomendasikan | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | *(Kunci API 1 Anda)* | Kunci utama Google Gemini |
| `GEMINI_API_KEY_2` | *(Kunci API 2 Anda)* | Kunci cadangan otomatis ke-2 (failover `429`/`503`) |
| `GEMINI_API_KEY_3` | *(Kunci API 3 Anda)* | Kunci cadangan otomatis ke-3 |
| `GEMINI_API_KEY_4` | *(Kunci API 4 Anda)* | Kunci cadangan otomatis ke-4 |
| `GEMINI_CLASSIFY_MODEL` | `gemini-3.5-flash` | Model multimodal untuk klasifikasi foto/teks laporan warga |
| `GEMINI_EXPLAIN_MODEL` | `gemini-3.5-flash-lite` | Model cepat untuk penjelasan rute VRP petugas |

### Catatan Penting tentang Penyimpanan Data (`In-Memory` vs `Supabase`):
- **Untuk Deployment Cepat (Tanpa Setup Database):**
  **Jangan** mengisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Aplikasi akan otomatis menggunakan penyimpanan lokal (`lib/store/memory.ts`) yang langsung memuat **150 laporan awal Kota Denpasar**, **5 fasilitas**, serta **data akun & jadwal petugas** tanpa perlu konfigurasi database eksternal.
- **Untuk Penyimpanan Cloud Persisten dengan Supabase (Opsional):**
  Jika Anda ingin menggunakan proyek Supabase Anda:
  1. Buka **SQL Editor** di dasbor Supabase Anda.
  2. Jalankan seluruh file migrasi SQL di folder `supabase/migrations/` secara berurutan (`0001_...sql` hingga `0005_...sql`).
  3. Ambil **`service_role` secret key** (bukan `anon` / `publishable` key) dari *Project Settings → API* di Supabase.
  4. Barulah tambahkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di Vercel, lalu jalankan `npm run seed:supabase` sekali dari perangkat lokal Anda untuk mengisi tabel awal.

---

## 5. Alternatif: Deploy Langsung dari Terminal menggunakan Vercel CLI

Jika Anda ingin men-deploy langsung dari terminal lokal:

```bash
# 1. Jalankan Vercel CLI
npx vercel

# 2. Ikuti petunjuk login dan pilih scope proyek Anda
# 3. Untuk merilis ke URL produksi utama:
npx vercel --prod
```

