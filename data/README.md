# Data Laporan Awal (`reports.json`) — Catatan Provenans & Penggunaan

- **Skema Acuan:** [`docs/API-CONTRACT.md`](../docs/API-CONTRACT.md) dan [`lib/schemas.ts`](../lib/schemas.ts) (tipe rekaman `Report`)
- **Jumlah Rekaman Awal:** 150 laporan (`rep-001` .. `rep-150`)

## Provenans & Kejujuran Data

Seluruh 150 rekaman awal di dalam `data/reports.json` adalah **data simulasi untuk demonstrasi** (`isDemo: true`, `provenance: "synthetic_demo_derived_from_sipsn_aggregates"`). Rekaman ini **bukan** tiket laporan warga nyata dan tidak disajikan sebagai lokasi tumpukan sampah langsung yang terverifikasi.

Distribusi statistiknya dikalibrasi terhadap sumber publik yang terdokumentasi di [`docs/REGULATION-AND-DATA-REFERENCES.md`](../docs/REGULATION-AND-DATA-REFERENCES.md):

1. **Komposisi jenis sampah** mencerminkan profil timbulan sampah Kota Denpasar pada **SIPSN KLHK** (Sistem Informasi Pengelolaan Sampah Nasional, `sipsn.menlhk.go.id`):
   - Sisa makanan / organik mendominasi (~55–60% timbulan kota), diikuti plastik (~15–18%), kertas (~8–10%), residu (~10–12%), logam (~2–3%), dan B3/berbahaya rumah tangga (<2%).
   - Dalam kumpulan 150 laporan ini, jenis dominan tersebar menjadi: `organic` 65, `plastic` 45, `residual` 17, `paper` 9, `metal` 7, `hazardous` 7.
2. **Sebaran geografis** mencakup keempat kecamatan resmi di **Kota Denpasar** (BPS Kota Denpasar, *Kota Denpasar Dalam Angka*):
   - `Denpasar Selatan` (41 laporan) — koridor pesisir Sanur, Serangan, Sidakarya, Sesetan, Panjer, Renon, Pedungan, Pemogan.
   - `Denpasar Barat` (39 laporan) — koridor pasar dan permukiman padat di Pemecutan, Dauh Puri, Padangsambian, Tegal Harum, Tegal Kertha.
   - `Denpasar Utara` (36 laporan) — koridor terminal dan pasar di Ubung, Peguyangan, Tonja, Dauh Puri Kaja, Dangin Puri Kaja.
   - `Denpasar Timur` (34 laporan) — Sumerta, Kesiman (Kertalangu, Petilan), Penatih, Dangin Puri.
   - Seluruh koordinat berada tepat di dalam kotak batas kontrak API (`lat -8.75..-8.57`, `lng 115.16..115.28`) dan di daratan.
3. **Rentang waktu:** Stempel waktu mencakup 14 hari dalam zona waktu WITA (`2026-10-25` hingga `2026-11-07`, `+08:00`). Status laporan terdiri dari `new` (96), `planned` (34), dan `collected` (20) sehingga dasbor dan perencana rute langsung memiliki antrean aktif maupun riwayat.

## Aturan Kontrak yang Diterapkan

- `classification.types`: 1–6 entri per laporan, terurut menurun berdasarkan `share`, setiap nilai `share` dibulatkan ke 2 angka desimal dan berjumlah `1.00`.
- `classification.volume`: `small` (<50 L), `medium` (50–300 L), `large` (>300 L).
- `classification.needsReview` mengikuti aturan deterministik di [`lib/review.ts`](../lib/review.ts):
  - `low_confidence` jika `confidence < 0.5`
  - `hazardous` jika proporsi `hazardous > 0` atau terdapat bendera `hazardous_present`
  - `low_image_quality` jika terdapat bendera `low_image_quality`
  - `insufficient_text` atau `contradictory` jika model menyetel bendera tersebut
- **Penanganan B3:** 10 laporan memiliki `hazardous > 0` atau `hazardous_present`. Laporan-laporan ini selalu dikecualikan dari rute truk reguler oleh perencana dan dikembalikan di `result.unassigned` dengan alasan `'hazardous_separate'`.
- **Kolom tambahan untuk konteks UI/penjelasan** (diteruskan oleh API):
  - `descriptionEn`: ringkasan Bahasa Inggris yang mendampingi `description` Bahasa Indonesia.
  - `estimatedWeightKg`: perkiraan berat dalam kilogram menggunakan kepadatan sampah lepas (~0,22 kg/L untuk organik/campuran, ~0,12 kg/L untuk plastik/kertas, ~0,35 kg/L untuk logam).
  - `provenance`: `"synthetic_demo_derived_from_sipsn_aggregates"`.
