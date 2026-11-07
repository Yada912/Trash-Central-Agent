# Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar

Dokumen ini merangkum landasan regulasi daerah Provinsi Bali, statistik publik timbulan sampah Kota Denpasar, serta aturan provenans data yang digunakan dalam **Central Trash Agent Bali**.

---

## 1. Landasan Regulasi Pemilahan Sampah dari Sumber

### Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber
- **Pasal 6 ayat (1):** Setiap rumah tangga dan pengelola kawasan wajib melakukan pemilahan sampah dari sumbernya.
- **Pasal 6 ayat (2):** Pemilahan sampah sebagaimana dimaksud pada ayat (1) dikelompokkan paling sedikit menjadi **5 (lima) jenis sampah**:
  1. **Sampah mudah terurai** (`mudah_terurai`) — sisa makanan, daun, canang/upakara organik, sisa kebun.
  2. **Sampah yang dapat digunakan kembali** (`guna_ulang`) — botol kaca utuh, wadah layak pakai, kantong/kemasan guna ulang.
  3. **Sampah yang dapat didaur ulang** (`daur_ulang`) — botol plastik PET, kardus, kertas bersih, kaleng aluminium/logam.
  4. **Sampah bahan berbahaya dan beracun (B3)** (`b3`) — baterai bekas, lampu neon/TL, kaleng cat/aerosol, limbah elektronik/medis rumah tangga.
  5. **Sampah residu** (`residu`) — popok sekali pakai, pembalut, styrofoam, tisu kotor, residu sapuan tercampur yang tidak dapat didaur ulang.

### Pemetaan 5 Jenis Sumber ke 4 Aliran Pengangkutan Operasional
Di dalam modul [`lib/schedule/sourceTypes.ts`](../lib/schedule/sourceTypes.ts), kelima kategori sumber pada Pergub Bali No. 47 Tahun 2019 dipetakan secara eksplisit ke dalam 4 aliran jadwal operasional aplikasi:

| Kategori Sumber (Pergub Bali 47/2019 Pasal 6(2)) | Kode `SourceType` | Aliran Operasional (`WasteStream`) | Mode Penanganan pada Aplikasi |
|---|---|---|---|
| Sampah mudah terurai | `mudah_terurai` | `organik` | Pengangkutan rutin terjadwal (kompos / TPS3R) |
| Sampah yang dapat digunakan kembali | `guna_ulang` | `anorganik` | Pengangkutan rutin terjadwal / Bank Sampah |
| Sampah yang dapat didaur ulang | `daur_ulang` | `anorganik` | Pengangkutan rutin terjadwal / Bank Sampah |
| Sampah bahan berbahaya dan beracun (B3) | `b3` | `B3` | Penanganan terpisah berdasarkan permintaan (`on_request` DLH), dikecualikan dari truk biasa |
| Sampah residu | `residu` | `residu` | Pengangkutan rutin terjadwal (residu akhir) |

### Regulasi Pendukung Lainnya
- **Peraturan Gubernur Bali Nomor 97 Tahun 2018** tentang Pembatasan Timbulan Sampah Plastik Sekali Pakai (kantong plastik, polistirena/styrofoam, dan sedotan plastik).
- **Undang-Undang Nomor 18 Tahun 2008** tentang Pengelolaan Sampah.

---

## 2. Geografi Administratif Kota Denpasar

Kota Denpasar terdiri atas **4 kecamatan** dan **43 desa/kelurahan** (27 desa dan 16 kelurahan) dengan luas wilayah daratan sekitar 127,78 km²:

1. **Denpasar Barat:** Pemecutan, Pemecutan Klod, Dauh Puri, Dauh Puri Kauh, Dauh Puri Kangin, Dauh Puri Klod, Padangsambian, Padangsambian Kaja, Padangsambian Klod, Tegal Harum, Tegal Kertha.
2. **Denpasar Timur:** Sumerta, Sumerta Kauh, Sumerta Kaja, Sumerta Klod, Kesiman, Kesiman Petilan, Kesiman Kertalangu, Dangin Puri, Dangin Puri Klod, Penatih, Penatih Dangin Puri.
3. **Denpasar Selatan:** Sanur, Sanur Kaja, Sanur Kauh, Renon, Panjer, Sesetan, Sidakarya, Pedungan, Pemogan, Serangan.
4. **Denpasar Utara:** Ubung, Ubung Kaja, Peguyangan, Peguyangan Kaja, Peguyangan Kangin, Tonja, Dauh Puri Kaja, Dangin Puri Kaja, Dangin Puri Kauh, Dangin Puri Kangin, Pemecutan Kaja.

- **Kotak Batas (*Bounding Box*) Validasi Koordinat ([`lib/schemas.ts`](../lib/schemas.ts)):**
  - Lintang (*Latitude*): `-8.75` hingga `-8.57`
  - Bujur (*Longitude*): `115.16` hingga `115.28`

**Sumber Referensi:** Badan Pusat Statistik (BPS) Kota Denpasar — *Kota Denpasar Dalam Angka* (`https://denpasarkota.bps.go.id`).

---

## 3. Konteks Timbulan & Komposisi Sampah

Berdasarkan rilis publik Pemerintah Provinsi Bali, Pemerintah Kota Denpasar, dan Sistem Informasi Pengelolaan Sampah Nasional (SIPSN KLHK):
- **Skala Provinsi Bali:** Pemerintah Provinsi Bali (rilis 29 Agustus 2025) menyebutkan estimasi timbulan sampah Provinsi Bali sekitar **3.400 ton/hari**.
- **Skala Kota Denpasar:** Rilis Pemerintah Kota Denpasar (13 Maret 2023) dan data SIPSN KLHK mencatat timbulan sampah harian Kota Denpasar berada pada kisaran **800–1.000 ton/hari**.
- **Profil Komposisi Material (Acuan Kalibrasi Data Demo):**
  - Sisa makanan & organik (daun, canang/upakara, sisa dapur/pasar): ~55%–62%
  - Plastik (kemasan sekali pakai, botol PET, kantong plastik): ~14%–18%
  - Kertas / karton: ~8%–11%
  - Residu tercampur: ~10%–14%
  - Logam / kaleng: ~1,5%–3%
  - B3 rumah tangga (baterai, lampu neon, kaleng aerosol, limbah elektronik): ~0,5%–2%

---

## 4. Provenans Data Fasilitas & Laporan Awal

1. **Data Laporan Awal ([`data/reports.json`](../data/reports.json)):**
   - Berisi **150 rekaman laporan sintetis** (`isDemo: true`, `provenance: "synthetic_demo_derived_from_sipsn_aggregates"`).
   - Digunakan untuk mendemonstrasikan pengelompokan klaster peta, pemfilteran dasbor, dan optimasi rute VRP tanpa mengklaim tiket pelaporan warga nyata.
2. **Data Fasilitas ([`data/facilities.json`](../data/facilities.json), [`data/facilities-sourced.json`](../data/facilities-sourced.json), [`data/bank-sampah-sourced.json`](../data/bank-sampah-sourced.json)):**
   - **TPA Regional Sarbagita Suwung (`fac-tpa-suwung`):** Digunakan sebagai titik awal/akhir simulasi rute (`DEPOT_LABEL = 'simulated depot (operational status unverified)'`) mengingat kebijakan pembatasan pembuangan terbuka (*open dumping*) dan pengalihan pengolahan sampah ke TPST/TPS3R.
   - **TPS3R (`fac-tps3r-cemara`, `fac-tps3r-sesetan`):** Ditampilkan pada dasbor sebagai titik referensi terpublikasi (`published point only`).
   - **Bank Sampah (`fac-bank-sampah-induk`, `fac-bank-sampah-unit`):** Disertakan sebagai referensi direktori dengan `lat: null, lng: null` sehingga tidak pernah dipetakan pada titik koordinat rekaan atau dijadikan tujuan rute truk.

