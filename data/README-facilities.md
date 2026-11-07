# Fasilitas Pengelolaan Sampah Denpasar (`facilities.json`) — Provenans & Aturan Penggunaan

- **Berkas Terkait:** [`data/facilities.json`](./facilities.json), [`data/facilities-sourced.json`](./facilities-sourced.json), dan [`data/bank-sampah-sourced.json`](./bank-sampah-sourced.json)
- **Referensi Lengkap:** [`docs/REGULATION-AND-DATA-REFERENCES.md`](../docs/REGULATION-AND-DATA-REFERENCES.md)
- **Jumlah Rekaman Utama:** 5 fasilitas di wilayah Kota Denpasar

## Arti `verified` dan `coordinatesVerified`

- `coordinatesVerified: true` berarti fasilitas tersebut adalah **fasilitas nyata yang terdokumentasi secara publik** di Kota Denpasar dan koordinat lintang/bujurnya merupakan **perkiraan titik tingkat fasilitas dari sumber terbuka** (OpenStreetMap / publikasi pemerintah daerah). Ini **bukan** titik gerbang masuk truk yang telah disurvei maupun konfirmasi jam operasional/kapasitas waktu nyata.
- `coordinatesVerified: false` (dengan `lat: null, lng: null`) berarti fasilitas tersebut disebut dalam referensi publik tetapi **tidak memiliki koordinat titik yang terverifikasi** dalam repositori ini. Koordinatnya sengaja dibiarkan `null` agar sistem tidak pernah menampilkan titik koordinat rekaan.
- Untuk kompatibilitas dengan `GET /api/dashboard`, setiap rekaman juga menyertakan boolean `verified` yang nilainya sama dengan `coordinatesVerified`.

## Aturan Perencanaan Rute & Peta UI

1. **Depo Perencana (`fac-tpa-suwung` — TPA Regional Sarbagita Suwung):**
   - Digunakan sebagai titik awal/akhir simulasi untuk penyelesai rute truk di `POST /api/plans`.
   - Mengingat kebijakan pembatasan pembuangan sampah terbuka (*open dumping*) serta pengalihan ke TPST/TPS3R, **baik UI maupun penjelasan rencana AI wajib memberi label TPA Suwung sebagai _simulated depot (operational status unverified)_ / depo simulasi (status operasional belum terverifikasi)**.
2. **Titik Konteks TPS3R (`fac-tps3r-cemara`, `fac-tps3r-sesetan`):**
   - Ditampilkan di peta dasbor sebagai konteks pengolahan sampah di tingkat desa/kelurahan (`published point only`).
3. **Rekaman Bank Sampah (`fac-bank-sampah-induk`, `fac-bank-sampah-unit`):**
   - Memiliki `lat: null, lng: null` dan `coordinatesVerified: false`.
   - Sistem **tidak pernah** merutekan truk ke rekaman yang memiliki `lat: null` atau `lng: null`, dan **tidak pernah** menggambar pin peta untuk rekaman tersebut. Rekaman ini ditampilkan hanya sebagai entri daftar referensi.
