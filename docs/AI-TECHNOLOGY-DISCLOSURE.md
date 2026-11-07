# Formulir Pengungkapan Teknologi & Kecerdasan Buatan (AI Technology Disclosure)
### Panduan AI Web Innovation Challenge Bali DigiFest 2026 — Lampiran C

Berikut adalah daftar pengungkapan seluruh teknologi, pustaka, model kecerdasan buatan, serta sumber daya yang digunakan dalam pembangunan produk **Central Trash Agent Bali**:

| Komponen / Kategori | Keterangan & Rincian Penggunaan |
| :--- | :--- |
| **Nama Produk** | Central Trash Agent Bali |
| **Framework / Frontend** | Next.js 15.5.29 (App Router), React 19.3.1, TypeScript 5.9.3, Tailwind CSS 3.4.19, Radix UI (Label, Slot), Leaflet 1.9.4 & React-Leaflet 5.0.0 (Peta interaktif berbasis OpenStreetMap tiles, lisensi ODbL). |
| **Backend / Runtime** | Node.js (>=22) runtime pada Vercel Serverless Functions (`sin1` Singapore region), Next.js App Router API Routes (`/api/reports`, `/api/reports/classify`, `/api/dashboard`, `/api/plans`, `/api/agent/chat`, `/api/accounts`, `/api/schedule`). |
| **Database / Storage** | Supabase (PostgreSQL managed cloud database dengan Row Level Security) jika variabel lingkungan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dikonfigurasi; fallback otomatis ke in-memory store server-side (`lib/store/memory.ts` & `lib/accounts/store.ts`) yang memuat data awal tersimpan. Sesi antarmuka disimpan di `localStorage` peramban klien. |
| **Hosting / Deployment** | Vercel (Edge Network & Serverless Infrastructure, region `sin1` Singapore). |
| **AI Model / API / Method** | Vercel AI SDK (`ai` v7.0.164, `@ai-sdk/google` v4.0.113) terintegrasi dengan Google Gemini API. Pada lingkungan produksi, konfigurasi lingkungan menggunakan `GEMINI_CLASSIFY_MODEL=gemini-3.5-flash` (untuk klasifikasi multimodal citra/teks laporan sampah serta percakapan agen personal Kresna) dan `GEMINI_EXPLAIN_MODEL=gemini-3.5-flash-lite` (untuk penjelasan rasional naratif rute armada VRP). Kode memiliki mekanisme rotasi otomatis hingga 4 API keys serta fallback otomatis ke model `gemini-2.5-flash` / `gemini-2.5-flash-lite` jika variabel kosong, atau aturan kata kunci deterministik jika kunci API tidak terpasang. |
| **Peran AI dalam Produk** | 1. **Klasifikasi Sampah Multimodal**: Membaca foto tumpukan dan deskripsi teks warga untuk memprediksi komposisi 4 aliran (organik, anorganik, residu, B3), estimasi volume liter, tingkat urgensi, serta deteksi bendera bahaya (*hazardous_present*).<br>2. **Asisten Personalisasi Warga (Agen Kresna)**: Memproses keluhan dan situasi sampah warga dalam bahasa sehari-hari, mengingat konteks ritual adat/rahinan, serta memperbarui model timbulan profil secara otomatis.<br>3. **Penjelasan Transparan Rute Operasional**: Menjelaskan mengapa suatu urutan rute dipilih kepada mandor/petugas DLHK dalam bahasa Indonesia natural. |
| **Dataset / Data Source** | 150 data titik laporan sintetis Kota Denpasar (`isDemo: true`) yang mencakup 4 kecamatan (Denpasar Barat, Timur, Selatan, Utara), serta data 5 fasilitas pengolahan sampah/TPS3R dari sumber publik Kota Denpasar (TPA Suwung sebagai simulated depot dan TPS3R percontohan). |
| **Open-source Libraries** | Zod 3.25.76 (validasi skema data runtime), clsx & tailwind-merge (manajemen kelas Tailwind CSS), class-variance-authority (desain komponen taktil), @fontsource/inter (tipografi). |
| **Template / Boilerplate** | Tidak menggunakan template pihak ketiga. Kode dibangun dari awal (*custom-built scratch scaffold*) menggunakan Next.js App Router dengan arsitektur modular buatan tim. |
| **AI Coding Assistant** | Cursor (Cursor Agent) dan Google Antigravity (Gemini); Claude untuk riset referensi dan perumusan proposal konsep desentralisasi berbasis sumber. |
| **Pre-existing Components** | Tidak ada (*none* — seluruh repositori dan basis kode dibuat baru sejak 7 November 2026). |
| **Third-party Assets / Credits** | Font Inter (SIL Open Font License 1.1), Google Material Symbols (Apache-2.0 License), OpenStreetMap map tiles (Open Data Commons Open Database License / ODbL). |

---

Kami menyatakan bahwa informasi di atas benar dan lengkap. Kami bertanggung jawab atas penggunaan teknologi, source code, data, library, API, model AI, dan aset yang digunakan pada produk.

