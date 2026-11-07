# Graph Report - Trash-Central-Agent  (2026-11-07)

## Corpus Check
- 155 files · ~109,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 993 nodes · 2374 edges · 46 communities (43 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6cce5f4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- planner-view.tsx
- reports/route.ts
- use-report-flow.ts
- explain.ts
- weekly.ts
- classify.ts
- schemas.ts
- schedule-view.tsx
- schedule/index.ts
- vrp.ts
- package.json
- compilerOptions
- ClassificationStatus.tsx
- memory.ts
- seed-supabase.mjs
- dependencies
- dashboard-view.tsx
- Report
- components.json
- devDependencies
- Proposal Teknis — Central Trash Agent
- README.md
- Central Trash Agent — Sistem Pengelolaan & Pengangkutan Sampah Terpadu Kota Denpasar
- supabase.ts
- Arsitektur Teknis — Central Trash Agent
- denpasar-map.tsx
- 2. Skenario Demonstrasi Langkah demi Langkah
- scripts
- Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar
- use-planner.ts
- 3. Enum Domain Utama
- cn
- react
- tailwindcss
- report-flow.tsx
- weekly.test.ts
- MaterialIcon
- Button
- fail
- vercel.json
- Panduan Deployment ke Vercel — Central Trash Agent
- schemas.test.ts
- ui-dashboard-filter.test.ts
- Fasilitas Pengelolaan Sampah Denpasar (`facilities.json`) — Provenans & Aturan Penggunaan

## God Nodes (most connected - your core abstractions)
1. `vitest` - 33 edges
2. `useReportFlow()` - 26 edges
3. `Button()` - 25 edges
4. `ReportFlow()` - 24 edges
5. `PlannerView()` - 23 edges
6. `jsonErr()` - 23 edges
7. `Report` - 23 edges
8. `MaterialIcon()` - 22 edges
9. `jsonOk()` - 21 edges
10. `react` - 21 edges

## Surprising Connections (you probably didn't know these)
- ``POST /api/plans`` --references--> `Plan`  [INFERRED]
  docs/API-CONTRACT.md → lib/schemas.ts
- `1. Amplop Respons & Kode Status HTTP` --references--> `demo()`  [INFERRED]
  docs/API-CONTRACT.md → tests/classify-demo.test.ts
- `2. Prinsip Desain Utama` --references--> `demo()`  [INFERRED]
  docs/ARCHITECTURE.md → tests/classify-demo.test.ts
- `1. Persiapan & Menjalankan Aplikasi` --references--> `demo()`  [INFERRED]
  docs/DEMO-GUIDE.md → tests/classify-demo.test.ts
- `4.1 Arsitektur Pembagian Tugas Model (*Task-Split Models*) & Failover Multi-Kunci` --references--> `demo()`  [INFERRED]
  docs/PROPOSAL.md → tests/classify-demo.test.ts

## Import Cycles
- None detected.

## Communities (46 total, 3 thin omitted)

### Community 0 - "planner-view.tsx"
Cohesion: 0.21
Nodes (15): PlannerPage(), explanationFieldLine(), explanationHeading(), readStoredExplanation(), templateTextLabel(), PlannerView(), STEPS, movableStopIds() (+7 more)

### Community 1 - "reports/route.ts"
Cohesion: 0.05
Nodes (79): dynamic, GET(), maxDuration, runtime, dynamic, maxDuration, POST(), runtime (+71 more)

### Community 2 - "use-report-flow.ts"
Cohesion: 0.06
Nodes (53): ACCEPTED, blobToBase64(), compressPhoto(), renderJpeg(), flagsForConfirmation(), HazardWarningState, initialHazardWarning(), nextHazardWarning() (+45 more)

### Community 3 - "explain.ts"
Cohesion: 0.08
Nodes (38): explainModelId(), abortError(), applicableInterpretations(), applicableRisks(), callModel(), defaultNote(), demoExplain(), depotSentence() (+30 more)

### Community 4 - "weekly.ts"
Cohesion: 0.10
Nodes (27): addDays(), assumptions(), compareMoment(), fromUnits(), LIMITATIONS, nextFor(), Normalized, pickSpread() (+19 more)

### Community 5 - "classify.ts"
Cohesion: 0.07
Nodes (49): abortError(), callModel(), CLASSIFY_MODEL_ID, CLASSIFY_PROMPT, CLASSIFY_REPAIR_PROMPT, CLASSIFY_TIMEOUT_MS, ClassifyError, ClassifyErrorCode (+41 more)

### Community 6 - "schemas.ts"
Cohesion: 0.05
Nodes (43): API_MODES, apiModeSchema, CLASSIFICATION_SOURCES, classificationFlagSchema, classificationSourceSchema, classifyOutcomeSchema, ClassifyRequest, classifyRequestSchema (+35 more)

### Community 7 - "schedule-view.tsx"
Cohesion: 0.06
Nodes (65): GET(), POST(), metadata, RootLayout(), SOURCE_EXAMPLES_ID, SOURCE_ICONS, STREAM_BADGE_COLORS, SchedulePage() (+57 more)

### Community 8 - "schedule/index.ts"
Cohesion: 0.16
Nodes (17): WeeklyAvailability, addDays(), Cell, cellKey(), demoCheckedAvailability(), entryFor(), POLICY_DAYS, policyWindow() (+9 more)

### Community 9 - "vrp.ts"
Cohesion: 0.09
Nodes (35): assertCoordinate(), assertPlanInput(), clockMinutes(), distanceOf(), durationOf(), evaluateRoutes(), haversineKm(), indexStops() (+27 more)

### Community 10 - "package.json"
Cohesion: 0.10
Nodes (19): engines, node, license, name, packageManager, private, version, @ai-sdk/google (+11 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+14 more)

### Community 12 - "ClassificationStatus.tsx"
Cohesion: 0.50
Nodes (3): ClassificationStatus(), MISSING_TEXT, InsufficientMissing

### Community 13 - "memory.ts"
Cohesion: 0.20
Nodes (12): isHazardousClassification(), trashTypeSchema, volumeLabelFor(), accountTypeForSeed(), mapSeedFacility(), mapSeedReport(), normalizeShares(), SeedFacility (+4 more)

### Community 14 - "seed-supabase.mjs"
Cohesion: 0.06
Nodes (29): 1. Amplop Respons & Kode Status HTTP, 2. Pembagian Model AI Berdasarkan Tugas & Rotasi Multi-Kunci, 4. Spesifikasi Unggahan Gambar, 5. Struktur Klasifikasi & Aturan Peninjauan Deterministik (`needsReview`), 6. Spesifikasi Endpoint REST, Central Trash Agent — Spesifikasi Kontrak API & Domain (v1), `GET /api/dashboard`, `GET /api/plans/:id` (+21 more)

### Community 15 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, ai, @ai-sdk/google, class-variance-authority, clsx, @fontsource/inter, leaflet, next (+9 more)

### Community 16 - "dashboard-view.tsx"
Cohesion: 0.13
Nodes (20): DashboardPage(), DashboardView(), ReportList(), EMPTY_FILTERS, filterDashboard(), filtersAreActive(), ReportListFilters, reportMatchesFilters() (+12 more)

### Community 17 - "Report"
Cohesion: 0.24
Nodes (5): Facility, Plan, Report, ReportQuery, Store

### Community 18 - "components.json"
Cohesion: 0.14
Nodes (13): aliases, components, ui, utils, rsc, $schema, style, tailwind (+5 more)

### Community 19 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, @playwright/test, postcss, tailwindcss (+6 more)

### Community 20 - "Proposal Teknis — Central Trash Agent"
Cohesion: 0.12
Nodes (16): 10. Referensi, 1. Latar Belakang & Rumusan Masalah, 2. Pengguna Sasaran, 3. Solusi yang Diimplementasikan, 4.1 Arsitektur Pembagian Tugas Model (*Task-Split Models*) & Failover Multi-Kunci, 4.2 Penentuan `needsReview` Deterministik & Audit Koreksi B3, 4.3 Penanganan Konservatif Limbah B3 pada Solver Rute, 4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia (+8 more)

### Community 21 - "README.md"
Cohesion: 0.33
Nodes (3): Aturan Kontrak yang Diterapkan, Data Laporan Awal (`reports.json`) — Catatan Provenans & Penggunaan, Provenans & Kejujuran Data

### Community 22 - "Central Trash Agent — Sistem Pengelolaan & Pengangkutan Sampah Terpadu Kota Denpasar"
Cohesion: 0.25
Nodes (8): 1. Warga (Rumah Tangga & Tempat Usaha), 2. Petugas Pengelola Pengangkutan (DLHK), Cara Menjalankan di Perangkat Lokal, Central Trash Agent — Sistem Pengelolaan & Pengangkutan Sampah Terpadu Kota Denpasar, Dokumentasi Lengkap, Kapabilitas Utama untuk Kedua Aktor, Pembagian Model AI & Rotasi Multi-Kunci, Pengujian Kualitas

### Community 23 - "supabase.ts"
Cohesion: 0.20
Nodes (7): facilitySchema, reportSchema, assertServiceRole(), createSupabaseStore(), PlanRow, ReportRow, server-only

### Community 24 - "Arsitektur Teknis — Central Trash Agent"
Cohesion: 0.18
Nodes (10): 1. Diagram Arsitektur & Alur Pengguna, 2. Prinsip Desain Utama, 3. Struktur Direktori Repositori, 4. Strategi Model AI & Ketahanan Kuota (*Task-Splitting & Multi-Key Rotation*), 5. Penyelesai Rute Deterministik (VRP) & Jadwal Mingguan, Alur Pengguna (*User Flow*) Warga & Petugas, Arsitektur Logis Sistem, Arsitektur Teknis — Central Trash Agent (+2 more)

### Community 25 - "denpasar-map.tsx"
Cohesion: 0.29
Nodes (7): DenpasarMap(), DenpasarMapProps, MapMarker, MapRoute, PickHandler(), leaflet, react-leaflet

### Community 26 - "2. Skenario Demonstrasi Langkah demi Langkah"
Cohesion: 0.22
Nodes (8): 1. Persiapan & Menjalankan Aplikasi, 2. Skenario Demonstrasi Langkah demi Langkah, Langkah 1 — Beranda & Panduan Pemilahan Sumber (`/`), Langkah 2 — Simulasi Jadwal Pengangkutan Mingguan (`/schedule`), Langkah 3 — Pelaporan Warga & Kendali Manusia (`/report`), Langkah 4 — Dasbor Pemantauan Petugas (`/dashboard`), Langkah 5 — Perencana Rute VRP & Audit Keputusan (`/planner`), Panduan Demonstrasi & Skenario Uji — Central Trash Agent

### Community 27 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, lint, seed:supabase, start, test (+1 more)

### Community 28 - "Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar"
Cohesion: 0.25
Nodes (8): 1. Landasan Regulasi Pemilahan Sampah dari Sumber, 2. Geografi Administratif Kota Denpasar, 3. Konteks Timbulan & Komposisi Sampah, 4. Provenans Data Fasilitas & Laporan Awal, Pemetaan 5 Jenis Sumber ke 4 Aliran Pengangkutan Operasional, Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber, Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar, Regulasi Pendukung Lainnya

### Community 29 - "use-planner.ts"
Cohesion: 0.14
Nodes (18): useDashboard(), load(), canApprovePlan(), withExpectedVersion(), ExplanationMeta, explanationMetaFrom(), DEFAULT_TRUCKS, TruckDraft (+10 more)

### Community 30 - "3. Enum Domain Utama"
Cohesion: 0.40
Nodes (5): 3. Enum Domain Utama, PlanStatus, ReportStatus, TrashType, VolumeLabel

### Community 31 - "cn"
Cohesion: 0.14
Nodes (13): DemoBadge(), CONTAINER_CHIPS, CURATED_CONDITIONS, DescriptionField(), SpeechRecognitionInstance, Badge(), Card(), MaterialIconProps (+5 more)

### Community 32 - "react"
Cohesion: 0.20
Nodes (12): ClassificationEditor(), adjustBags(), applyDirectLiters(), InputMode, TYPE_META, CoordinateInputs(), LocationPicker(), Input() (+4 more)

### Community 36 - "report-flow.tsx"
Cohesion: 0.25
Nodes (11): ReportPage(), ConfidenceAlert(), HazardWarning(), ReportFlow(), STEPS, classifierHeading(), DEMO_MOCK_LABEL, demoMockLabel() (+3 more)

### Community 37 - "weekly.test.ts"
Cohesion: 0.15
Nodes (13): B3, COMPANY, earliestNext(), HOUSEHOLD, weeklyGuidance, base(), slots(), WEEKLY_POLICY_DEFAULTS (+5 more)

### Community 38 - "MaterialIcon"
Cohesion: 0.20
Nodes (7): AkunPage(), HomePage(), AccountView(), useAccount(), NAV_ITEMS, SiteHeader(), MaterialIcon()

### Community 39 - "Button"
Cohesion: 0.20
Nodes (11): Action, ActionBar(), PhotoUploader(), captureFrame(), closeLiveCamera(), stopStream(), Button(), ButtonProps (+3 more)

### Community 40 - "fail"
Cohesion: 0.32
Nodes (14): assertLabel(), clockMinutes(), dayOffset(), fail(), isDateOnly(), normalize(), parseAsOf(), parseDateParts() (+6 more)

### Community 41 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, maxDuration, maxDuration, framework, functions, app/api/plans/[id]/explain/route.ts, app/api/plans/route.ts, app/api/reports/classify/route.ts (+2 more)

### Community 42 - "Panduan Deployment ke Vercel — Central Trash Agent"
Cohesion: 0.25
Nodes (7): 1. File Konfigurasi yang Sudah Disiapkan, 2. Langkah 1 — Push Kode ke Repositori GitHub Anda, 3. Langkah 2 — Hubungkan Proyek di Dasbor Vercel, 4. Langkah 3 — Atur Environment Variables di Vercel, 5. Alternatif: Deploy Langsung dari Terminal menggunakan Vercel CLI, Catatan Penting tentang Penyimpanan Data (`In-Memory` vs `Supabase`):, Panduan Deployment ke Vercel — Central Trash Agent

### Community 43 - "schemas.test.ts"
Cohesion: 0.25
Nodes (7): classificationSchema, createReportSchema, decisionRequestSchema, explainRequestSchema, isTwoDecimalPlaces(), planRequestSchema, baseClassification

### Community 44 - "ui-dashboard-filter.test.ts"
Cohesion: 0.29
Nodes (5): facilities, hazardousReview, ordinaryQuiet, ordinaryReview, reports

### Community 45 - "Fasilitas Pengelolaan Sampah Denpasar (`facilities.json`) — Provenans & Aturan Penggunaan"
Cohesion: 0.50
Nodes (3): Arti `verified` dan `coordinatesVerified`, Aturan Perencanaan Rute & Peta UI, Fasilitas Pengelolaan Sampah Denpasar (`facilities.json`) — Provenans & Aturan Penggunaan

## Knowledge Gaps
- **330 isolated node(s):** `runtime`, `dynamic`, `maxDuration`, `runtime`, `dynamic` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 381 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `reports/route.ts` to `planner-view.tsx`, `use-report-flow.ts`, `explain.ts`, `report-flow.tsx`, `weekly.test.ts`, `classify.ts`, `schedule-view.tsx`, `vrp.ts`, `package.json`, `schemas.test.ts`, `ui-dashboard-filter.test.ts`, `memory.ts`, `seed-supabase.mjs`, `use-planner.ts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `demo()` connect `reports/route.ts` to `Arsitektur Teknis — Central Trash Agent`, `2. Skenario Demonstrasi Langkah demi Langkah`, `Proposal Teknis — Central Trash Agent`, `seed-supabase.mjs`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `Report` connect `Report` to `reports/route.ts`, `use-report-flow.ts`, `schemas.ts`, `schedule/index.ts`, `ui-dashboard-filter.test.ts`, `memory.ts`, `dashboard-view.tsx`, `README.md`, `supabase.ts`, `use-planner.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useReportFlow()` (e.g. with `EMPTY_PERCENTS()` and `classify()`) actually correct?**
  _`useReportFlow()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `runtime`, `dynamic`, `maxDuration` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reports/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053728661275831084 - nodes in this community are weakly interconnected._
- **Should `use-report-flow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._