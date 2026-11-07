# Panduan Deployment ke Vercel — Central Trash Agent Bali

Dokumen ini menjelaskan langkah demi langkah untuk men-deploy **Central Trash Agent Bali** ke **Vercel** baik melalui dasbor web Vercel (terhubung ke GitHub branch `production` atau `main`) maupun melalui **Vercel CLI**.

---

## 1. File Konfigurasi yang Sudah Disiapkan

Repositori ini telah dilengkapi dengan [`vercel.json`](../vercel.json) yang mengatur:
- **Region Server (`sin1` — Singapura):** Memastikan latensi terendah untuk pengguna di Bali / Indonesia.
- **Batas Waktu Fungsi Serverless (`maxDuration: 30-60` detik):** Memberikan ruang waktu yang cukup untuk pemanggilan multimodal Gemini (`POST /api/reports/classify`), chat asisten timbulan Kresna (`POST /api/agent/chat`), uji evaluasi sistem (`POST /api/eval`), dan solver VRP (`POST /api/plans`, `POST /api/plans/[id]/explain`) beserta failover multi-kunci.

---

## 2. Langkah 1 — Branch Rilis Produksi (`production`)

Repositori ini memiliki branch terisolasi khusus rilis deployment bernama **`production`**.

Untuk memperbarui rilis produksi di Vercel:
```bash
# Beralih ke branch production
git checkout production

# Sinkronkan perubahan terbaru dari main
git merge main -m "release: production deployment update"

# Push ke remote repository untuk memicu build otomatis di Vercel
git push origin production
```

---

## 3. Langkah 2 — Hubungkan Proyek di Dasbor Vercel

1. Buka [https://vercel.com/new](https://vercel.com/new) dan masuk menggunakan akun GitHub Anda.
2. Pilih repositori **`Trash-Central-Agent`** lalu klik **Import**.
3. Pada pengaturan proyek:
   - **Production Branch:** Pilih `production` (atau `main` jika menggunakan default).
   - **Framework Preset:** `Next.js`
   - **Build Command:** `next build` (otomatis)
   - **Install Command:** `pnpm install` atau `npm install`

---

## 4. Langkah 3 — Atur Environment Variables di Vercel

Sebelum menekan tombol **Deploy**, buka bagian **Environment Variables** di halaman konfigurasi Vercel dan tambahkan variabel berikut:

| Nama Variabel | Nilai yang Direkomendasikan | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | *(Kunci API 1 Anda)* | Kunci utama Google Gemini AI Studio |
| `GEMINI_API_KEY_2` | *(Kunci API 2 Anda)* | Kunci cadangan otomatis ke-2 (failover `429`/`503`) |
| `GEMINI_API_KEY_3` | *(Kunci API 3 Anda)* | Kunci cadangan otomatis ke-3 |
| `GEMINI_API_KEY_4` | *(Kunci API 4 Anda)* | Kunci cadangan otomatis ke-4 |
| `GEMINI_CLASSIFY_MODEL` | `gemini-3.5-flash` | Model multimodal untuk klasifikasi foto/teks laporan warga |
| `GEMINI_EXPLAIN_MODEL` | `gemini-3.5-flash-lite` | Model cepat untuk asisten Kresna & penjelasan rute VRP |

### Catatan Penting tentang Penyimpanan Data (`In-Memory` vs `Supabase`):
- **Untuk Deployment Cepat (Tanpa Setup Database Eksternal):**
  **Jangan** mengisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Aplikasi akan otomatis menggunakan penyimpanan lokal server (`lib/store/memory.ts`) yang langsung memuat **150 laporan awal Kota Denpasar**, **5 fasilitas TPS3R/TPST**, serta **data akun warga & jadwal armada petugas** tanpa perlu konfigurasi database eksternal.
- **Untuk Penyimpanan Cloud Persisten dengan Supabase (Opsional):**
  Jika Anda ingin menggunakan database PostgreSQL Supabase Anda:
  1. Buka **SQL Editor** di dasbor Supabase Anda.
  2. Jalankan seluruh file migrasi SQL di folder `supabase/migrations/` secara berurutan (`0001_...sql` hingga `0005_...sql`).
  3. Ambil **`service_role` secret key** (bukan `anon` / `publishable` key) dari *Project Settings → API* di Supabase.
  4. Tambahkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di Vercel, lalu jalankan `npm run seed:supabase` sekali dari terminal lokal Anda untuk mengisi data awal.

---

## 5. Alternatif: Deploy Langsung dari Terminal menggunakan Vercel CLI

Jika Anda ingin men-deploy langsung dari terminal:

```bash
# 1. Jalankan Vercel CLI
npx vercel

# 2. Ikuti petunjuk login dan pilih scope proyek Anda
# 3. Untuk merilis ke URL produksi utama:
npx vercel --prod
```
