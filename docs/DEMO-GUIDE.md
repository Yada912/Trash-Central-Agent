# Panduan Demonstrasi & Skenario Uji — Central Trash Agent Bali

Panduan ini menjelaskan langkah demi langkah untuk mendemonstrasikan seluruh kapabilitas **Central Trash Agent Bali** dari sisi **Warga** maupun **Petugas Pengelola Pengangkutan**.

---

## 1. Persiapan & Menjalankan Aplikasi

1. **Instalasi dependensi:**
   ```bash
   pnpm install
   ```
2. **Konfigurasi variabel lingkungan (`.env`):**
   Salin `.env.example` ke `.env`. Anda dapat mengisi 1 hingga 4 kunci API Gemini:
   ```env
   GEMINI_API_KEY=kunci_utama_anda
   GEMINI_API_KEY_2=kunci_cadangan_2
   GEMINI_API_KEY_3=kunci_cadangan_3
   GEMINI_API_KEY_4=kunci_cadangan_4
   GEMINI_CLASSIFY_MODEL=gemini-2.5-flash
   GEMINI_EXPLAIN_MODEL=gemini-2.5-flash-lite
   ```
   > **Catatan Mode Demo:** Apabila seluruh `GEMINI_API_KEY` dikosongkan, aplikasi secara otomatis berjalan dalam **Mode Demo** menggunakan pengklasifikasi kata kunci deterministik dan penjelas templat, dengan lencana status `demo` yang jujur di bagian atas layar.
3. **Menjalankan server pengembangan:**
   ```bash
   pnpm dev
   ```
   Buka `http://localhost:3000` di peramban.

---

## 2. Skenario Demonstrasi Langkah demi Langkah

### Langkah 1 — Beranda & Panduan Pemilahan Sumber (`/`)
1. Buka halaman utama `http://localhost:3000`.
2. Tunjukkan empat kartu navigasi utama (**Laporkan tumpukan**, **Jadwal pengangkutan**, **Lihat dasbor**, **Susun rencana penjemputan**).
3. Gulir ke bagian **Panduan pemilahan sampah dari sumber** untuk menunjukkan bagaimana 5 kategori wajib pada **Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2)** (*Sampah mudah terurai*, *Sampah yang dapat digunakan kembali*, *Sampah yang dapat didaur ulang*, *Sampah B3*, dan *Sampah residu*) dipetakan ke 4 aliran operasional aplikasi (`organik`, `anorganik`, `residu`, `B3`).

### Langkah 2 — Simulasi Jadwal Pengangkutan Mingguan (`/schedule`)
1. Klik **Jadwal** pada bilah navigasi atas (`/schedule`).
2. Gunakan filter **Kecamatan** (mis. `Denpasar Selatan`), **Aliran sampah** (mis. `organik` atau `B3`), dan **Jenis akun** (`Rumah tangga` / `Badan usaha`).
3. Perhatikan bagaimana aliran `organik`, `anorganik`, dan `residu` menampilkan hari pengangkutan rutin beserta rentang jam WITA dan volume dasar liter dari laporan terkonfirmasi, sedangkan aliran `B3` selalu ditandai **Berdasarkan permintaan** (*on request*) untuk penanganan khusus DLH.

### Langkah 3 — Pelaporan Warga & Kendali Manusia (`/report`)
1. Klik **Lapor** pada bilah navigasi atas (`/report`).
2. **Uji Masukan Terlalu Pendek:** Ketik `plastik` pada kolom *Apa yang Anda lihat?* lalu klik **Klasifikasi**. Sistem akan menolak menebak secara sembarangan dan meminta tambahan foto atau rincian deskripsi.
3. **Uji Klasifikasi Sampah Biasa:** Ketik `Ada tumpukan sampah plastik dan sisa makanan di pinggir jalan dekat pasar` (atau unggah foto tumpukan sampah), lalu klik **Klasifikasi**.
   - Tunjukkan hasil estimasi komposisi jenis sampah (`%`), volume (liter), tingkat urgensi, serta skor keyakinan.
4. **Uji Koreksi Limbah B3 oleh Warga (`hazard_cleared_by_resident`):**
   - Ketik `Ada baterai bocor dan kaleng cat di dekat jalur pejalan kaki` lalu klik **Klasifikasi**.
   - Perhatikan munculnya peringatan limbah berbahaya (`hazardous_present`).
   - Ubah nilai `hazardous %` menjadi `0` dan `plastic %` menjadi `100`. Perhatikan bendera `hazardous_present` otomatis tidak tercentang dan sistem menampilkan alasan peninjauan **Hazard cleared by resident, needs check** (klasifikasi AI awal tetap disimpan untuk audit petugas).
5. Pilih titik lokasi di dalam Kota Denpasar pada peta (atau isi Lintang `-8.650000` dan Bujur `115.220000`), centang **Saya telah memeriksa data ini**, lalu klik **Kirim laporan**.

### Langkah 4 — Dasbor Pemantauan Petugas (`/dashboard`)
1. Klik **Dasbor** (`/dashboard`).
2. Tunjukkan kartu metrik **Volume terlapor**, **Volume per jenis**, **Per kecamatan**, dan **Per urgensi**.
3. Centang filter **Perlu tinjauan** (*Needs review*) atau pilih salah satu **Kecamatan**. Perhatikan bahwa angka total, klaster peta, dan daftar laporan langsung diperbarui secara sinkron.
4. Tunjukkan bagian **Laporan B3** yang dipisahkan secara visual dengan bingkai peringatan dari daftar laporan biasa.

### Langkah 5 — Perencana Rute VRP & Audit Keputusan (`/planner`)
1. Klik **Perencana** (`/planner`).
2. Atur parameter armada (mis. 2 truk, 2 kru, sif `06:00`–`18:00`) lalu klik **Jalankan rencana**.
3. Tunjukkan **Fakta rute** (jumlah pemberhentian biasa, beban liter per kapasitas, jarak km, durasi menit, dan status kelayakan) serta **Peta rute** dari depo simulasi **TPA Suwung**.
4. Tunjukkan bagian **Belum terjadwal** (*Unassigned*) di mana seluruh laporan B3 ditahan dengan alasan penanganan khusus DLH.
5. **Uji Pemindahan Pemberhentian & Pemblokiran Persetujuan:**
   - Pada bagian *Ubah penugasan*, pindahkan satu pemberhentian ke truk lain lalu klik **Simpan perubahan**.
   - Status rencana berubah menjadi `edited_pending` (versi bertambah) dan penjelasan ditandai **kedaluwarsa** (*stale*). Tombol **Setujui** otomatis dikunci hingga petugas menekan **Jelaskan ulang** dan seluruh rute berstatus layak (*feasible*).
6. Klik **Jelaskan ulang** untuk memperbarui penjelasan rute, lalu klik **Setujui** (atau isi catatan penolakan dan klik **Tolak**).
7. Muat ulang halaman (`F5`) untuk membuktikan bahwa status rencana dan **Log audit** berstempel waktu WITA (`+08:00`) tersimpan secara persisten.

