# Central Trash Agent — Spesifikasi Kontrak API & Domain (v1)

Sumber kebenaran skema validasi berada di [`lib/schemas.ts`](../lib/schemas.ts) (Zod) dan jadwal mingguan di [`lib/schedule/index.ts`](../lib/schedule/index.ts). Seluruh endpoint REST API berada di bawah `app/api/` serta menerima dan mengembalikan format amplop JSON standar.

---

## 1. Amplop Respons & Kode Status HTTP

- **Respons Sukses:**
  ```json
  {
    "data": {},
    "meta": {
      "mode": "live | demo",
      "requestId": "req_...",
      "model": "gemini-2.5-flash | gemini-2.5-flash-lite | demo-mock | demo-template",
      "latencyMs": 42
    }
  }
  ```
- **Respons Kesalahan:**
  ```json
  {
    "error": {
      "code": "VALIDATION | TIMEOUT | UPSTREAM | RATE_LIMIT | NOT_FOUND | CONFLICT | PAYLOAD_TOO_LARGE | INTERNAL",
      "message": "Pesan penjelasan kesalahan",
      "fields": {
        "namaField": ["Detail kesalahan"]
      }
    },
    "meta": {
      "requestId": "req_..."
    }
  }
  ```
- **Pemetaan Kode Status HTTP:**
  - `400 Bad Request` → `VALIDATION`
  - `404 Not Found` → `NOT_FOUND`
  - `409 Conflict` → `CONFLICT` (ketidakcocokan versi rencana, rute tidak layak saat persetujuan, atau penjelasan kedaluwarsa)
  - `413 Payload Too Large` → `PAYLOAD_TOO_LARGE`
  - `429 Too Many Requests` → `RATE_LIMIT`
  - `502 Bad Gateway` → `UPSTREAM`
  - `504 Gateway Timeout` → `TIMEOUT`
  - `500 Internal Server Error` → `INTERNAL`
- Header `x-request-id` selalu disertakan pada setiap respons.
- **Kejujuran Mode (`live` vs `demo`):** Mode `demo` hanya aktif apabila tidak ada kunci `GEMINI_API_KEY` yang dikonfigurasi. Saat kunci API aktif (`live`), kegagalan panggil model setelah mencoba seluruh kunci cadangan akan mengembalikan error HTTP (`429`/`502`/`504`) secara jujur dan **tidak pernah** diam-diam beralih ke keluaran *mock*.

---

## 2. Pembagian Model AI Berdasarkan Tugas & Rotasi Multi-Kunci

Konfigurasi kunci dan model dikelola di [`lib/ai/keys.ts`](../lib/ai/keys.ts):

| Tugas | Endpoint | Model Bawaan | Variabel Lingkungan Pengubah |
|---|---|---|---|
| Klasifikasi Laporan (Multimodal/Teks) | `POST /api/reports/classify` | `gemini-2.5-flash` | `GEMINI_CLASSIFY_MODEL` |
| Penjelasan Rencana Rute VRP | `POST /api/plans`, `POST /api/plans/:id/explain` | `gemini-2.5-flash-lite` | `GEMINI_EXPLAIN_MODEL` |

- **Rotasi & Failover Kunci API:** Mendukung hingga 4 kunci API (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4`, atau daftar dipisahkan koma di `GEMINI_API_KEYS`). Apabila kunci pertama mengembalikan `429 RATE_LIMIT` atau kesalahan sementara (`503`), pemanggil otomatis beralih (*failover*) ke kunci berikutnya sebelum mengembalikan kegagalan.

---

## 3. Enum Domain Utama

- `TrashType`: `'organic' | 'plastic' | 'paper' | 'metal' | 'residual' | 'hazardous'`
- `Urgency`: `'low' | 'medium' | 'high'`
- `VolumeLabel`: `'small'` (< 50 L) | `'medium'` (50–300 L) | `'large'` (> 300 L)
- `ReportStatus`: `'new' | 'planned' | 'collected'`
- `PlanStatus`: `'proposed' | 'edited_pending' | 'approved' | 'rejected'`
- `Kecamatan`: `'Denpasar Barat' | 'Denpasar Timur' | 'Denpasar Selatan' | 'Denpasar Utara'`
- `AccountType`: `'household' | 'company'`
- `WasteStream`: `'organik' | 'anorganik' | 'residu' | 'B3'`
- `SourceType`: `'mudah_terurai' | 'guna_ulang' | 'daur_ulang' | 'b3' | 'residu'` (5 kategori pemilahan sumber sesuai Pergub Bali No. 47 Tahun 2019 Pasal 6 ayat (2))

---

## 4. Spesifikasi Unggahan Gambar

- **Tipe MIME yang diizinkan:** `image/jpeg`, `image/png`, `image/webp`.
- **Batas ukuran:** Maksimum `3.000.000` byte setelah dekode (~4,0 MB dalam base64; di bawah batas payload fungsi serverless 4,5 MB).
- **Kompresi sisi klien:** Klien mengubah ukuran sisi terpanjang ke maksimum `1280 px` (JPEG kualitas ~0,82) sebelum pengiriman.
- **Pelindung sisi server:**
  - Keseluruhan JSON body > `4.200.000` byte → `413 PAYLOAD_TOO_LARGE`.
  - Byte terdekode > `3.000.000` byte → `400 VALIDATION` pada `fields.image`.
  - Validasi *magic bytes* (header biner JPEG/PNG/WebP) wajib cocok dengan `mimeType`.

---

## 5. Struktur Klasifikasi & Aturan Peninjauan Deterministik (`needsReview`)

```ts
type Classification = {
  types: Array<{
    type: TrashType
    share: number // 0..1, maksimal 2 desimal, jumlah total = 1 ± 0.01, 1–6 entri, urut menurun
  }>
  volume: {
    liters: number // bilangan bulat >= 1
    label: VolumeLabel
  }
  urgency: Urgency
  confidence: number // 0..1
  rationale: string // <= 280 karakter
  flags: Array<
    | 'hazardous_present'
    | 'low_image_quality'
    | 'no_image'
    | 'insufficient_text'
    | 'contradictory'
  >
  needsReview: boolean
  reviewReasons: Array<
    | 'low_confidence'
    | 'hazardous'
    | 'low_image_quality'
    | 'insufficient_text'
    | 'contradictory'
    | 'hazard_cleared_by_resident'
  >
  source: 'gemini' | 'mock' | 'manual'
}
```

`needsReview` dan `reviewReasons` dihitung secara deterministik oleh server melalui [`computeReview`](../lib/review.ts):
1. `low_confidence`: nilai `confidence < 0.5` (`REVIEW_CONFIDENCE_THRESHOLD`).
2. `hazardous`: proporsi `hazardous > 0` atau terdapat bendera `hazardous_present`.
3. `low_image_quality`: terdapat bendera `low_image_quality` (`no_image` saja **tidak** memicu `needsReview`).
4. `insufficient_text`: terdapat bendera `insufficient_text` (termasuk deskripsi sangat pendek < 10 karakter tanpa foto).
5. `contradictory`: terdapat bendera `contradictory`.
6. `hazard_cleared_by_resident`: klasifikasi awal AI (`aiClassification`) mendeteksi kandungan B3, namun klasifikasi yang dikonfirmasi warga menghapus kandungan B3 tersebut. Rekaman `aiClassification` asli tetap disimpan untuk keperluan audit petugas.

---

## 6. Spesifikasi Endpoint REST

### `POST /api/reports/classify`
Mengklasifikasikan deskripsi teks dan/atau foto tumpukan sampah (batas waktu 15 detik).
- **Body Permintaan:** `{ text?: string (1..1000), image?: { base64: string, mimeType: ImageMime } }` (minimal salah satu dari `text` non-kosong atau `image` wajib ada).
- **Data Respons (`ClassifyOutcome`):**
  - `{ kind: 'trash', classification: Classification }`
  - `{ kind: 'not_trash', reason: string, confidence: number }`
  - `{ kind: 'insufficient', reason: string, missing: Array<'type' | 'volume' | 'location_context'> }`

### `POST /api/reports`
Menyimpan laporan warga yang telah ditinjau dan dikonfirmasi.
- **Header Opsional:** `Idempotency-Key` (mencegah duplikasi pengiriman).
- **Body Permintaan:** `{ text?: string, lat: number, lng: number, accountType?: 'household' | 'company', image?: ImageInput, classification: Classification, aiClassification?: Classification, clientRequestId?: string }`.
- **Validasi Geografis:** `lat` wajib berada pada rentang `-8.75 .. -8.57` dan `lng` pada `115.16 .. 115.28` (kotak batas daratan Kota Denpasar). Kecamatan ditentukan secara otomatis berdasarkan kedekatan sentroid wilayah.

### `GET /api/reports`
Mengambil daftar laporan tersimpan (urut terbaru).
- **Parameter Kueri Opsional:** `kecamatan`, `status` (`new | planned | collected`), `since` (stempel waktu ISO 8601).

### `GET /api/dashboard`
Mengambil ringkasan metrik dasbor petugas, pengelompokan zona, dan daftar fasilitas referensi.
- **Data Respons:** `{ totals: { byType, byKecamatan, byUrgency }, zones: Zone[], facilities: Facility[] }`.

### `POST /api/plans`
Menjalankan penyelesai rute deterministik (*Capacitated Vehicle Routing Problem*) pada laporan berstatus `new` dan menghasilkan penjelasan rute.
- **Body Permintaan:** `{ trucks: Array<{ id: string, capacityLiters: number }>, crews: number, shift: { start: 'HH:MM', end: 'HH:MM' }, reportIds?: string[] }`.
- **Data Respons:** Objek `Plan` dengan `status: 'proposed'` dan `version: 1`.

### `GET /api/plans/:id`
Mengambil detail rencana rute beserta riwayat keputusan audit (`decisions`).

### `POST /api/plans/:id/decision`
Mencatat tindakan petugas pada rencana rute dengan pengendalian konkurensi optimistik (`expectedVersion`).
- **Body Permintaan:**
  ```json
  {
    "action": "approve | reject | edit",
    "expectedVersion": 1,
    "actor": "officer-demo",
    "note": "Wajib diisi untuk tindakan reject",
    "edits": {
      "moveStop": {
        "stopId": "rpt_...",
        "toTruckId": "truck-2"
      }
    }
  }
  ```
- **Aturan Transisi Status:**
  - `edit`: Memindahkan pemberhentian non-B3 antar truk, menghitung ulang beban/jarak/durasi/kelayakan secara deterministik, mengubah `status` menjadi `'edited_pending'`, menaikkan `version + 1`, dan menandai `explanation.stale = true`. Memindahkan laporan B3 ke rute truk biasa ditolak dengan `409 CONFLICT`.
  - `approve`: Hanya diizinkan apabila `status` adalah `'proposed'` atau `'edited_pending'`, seluruh rute layak (`feasible === true`), dan `explanation.stale === false`. Jika tidak memenuhi syarat, server mengembalikan `409 CONFLICT`. Saat disetujui, status laporan yang termasuk dalam rute berubah menjadi `'planned'`.
  - `reject`: Diizinkan dari `'proposed'` atau `'edited_pending'` dengan `note` tidak kosong; mengubah status menjadi `'rejected'`.

### `POST /api/plans/:id/explain`
Menghasilkan ulang penjelasan naratif untuk versi rencana saat ini dan menyetel `explanation.stale = false` tanpa menyetujui rencana secara otomatis.

### `GET /api/schedule`
Menghasilkan simulasi jadwal pengangkutan mingguan berdasarkan kecamatan, aliran sampah, dan jenis akun.
- **Parameter Kueri Opsional:** `kecamatan`, `stream` (`organik | anorganik | residu | B3`), `accountType` (`household | company`), `weekStart` (`YYYY-MM-DD`, Senin WITA), `asOf`, `trucks`, `crews`, `shiftStart`, `shiftEnd`.
- **Data Respons (`ScheduleResponse`):** `{ entries: ScheduleEntry[], generatedFrom: 'seed+reports', disclaimer: string }`.
