# Graph Report - Trash-Central-Agent  (2026-11-07)

## Corpus Check
- 146 files · ~99,184 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 906 nodes · 2135 edges · 36 communities (32 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79de0a91`
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
- review.ts
- memory.ts
- seed-supabase.mjs
- dependencies
- filter-reports.ts
- Report
- components.json
- devDependencies
- Proposal Teknis — Central Trash Agent
- README.md
- Central Trash Agent (Agen Sampah Terpusat) — Denpasar
- supabase.ts
- Arsitektur Teknis — Central Trash Agent
- denpasar-map.tsx
- 2. Skenario Demonstrasi Langkah demi Langkah
- scripts
- Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar
- demo-flow.spec.ts
- 3. Enum Domain Utama
- Central Trash Agent — Spesifikasi Kontrak API & Domain (v1)
- 4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia
- tailwindcss

## God Nodes (most connected - your core abstractions)
1. `vitest` - 32 edges
2. `useReportFlow()` - 26 edges
3. `jsonErr()` - 23 edges
4. `Report` - 23 edges
5. `PlannerView()` - 22 edges
6. `ReportFlow()` - 21 edges
7. `jsonOk()` - 21 edges
8. `compilerOptions` - 20 edges
9. `POST()` - 18 edges
10. `requestIdFrom()` - 18 edges

## Surprising Connections (you probably didn't know these)
- ``POST /api/plans`` --references--> `Plan`  [INFERRED]
  docs/API-CONTRACT.md → lib/schemas.ts
- `1. Amplop Respons & Kode Status HTTP` --references--> `demo()`  [INFERRED]
  docs/API-CONTRACT.md → tests/classify-demo.test.ts
- `1. Persiapan & Menjalankan Aplikasi` --references--> `demo()`  [INFERRED]
  docs/DEMO-GUIDE.md → tests/classify-demo.test.ts
- `4.1 Arsitektur Pembagian Tugas Model (*Task-Split Models*) & Failover Multi-Kunci` --references--> `demo()`  [INFERRED]
  docs/PROPOSAL.md → tests/classify-demo.test.ts
- `3. Enum Domain Utama` --references--> `SourceType`  [INFERRED]
  docs/API-CONTRACT.md → lib/schedule/sourceTypes.ts

## Import Cycles
- None detected.

## Communities (36 total, 4 thin omitted)

### Community 0 - "planner-view.tsx"
Cohesion: 0.07
Nodes (57): DashboardPage(), PlannerPage(), ReportPage(), DashboardView(), ReportList(), filtersAreActive(), CityMap(), DenpasarMap (+49 more)

### Community 1 - "reports/route.ts"
Cohesion: 0.06
Nodes (65): dynamic, GET(), maxDuration, runtime, dynamic, maxDuration, POST(), runtime (+57 more)

### Community 2 - "use-report-flow.ts"
Cohesion: 0.07
Nodes (48): useDashboard(), load(), canApprovePlan(), withExpectedVersion(), ExplanationMeta, explanationMetaFrom(), DEFAULT_TRUCKS, TruckDraft (+40 more)

### Community 3 - "explain.ts"
Cohesion: 0.07
Nodes (50): CLASSIFY_DEFAULT_MODEL_ID, classifyModelId(), EXPLAIN_DEFAULT_MODEL_ID, explainModelId(), geminiApiKeys(), hasGeminiApiKey(), KEY_ENV_NAMES, MAX_GEMINI_API_KEYS (+42 more)

### Community 4 - "weekly.ts"
Cohesion: 0.07
Nodes (54): addDays(), assertLabel(), assumptions(), clockMinutes(), compareMoment(), dayOffset(), fail(), fromUnits() (+46 more)

### Community 5 - "classify.ts"
Cohesion: 0.07
Nodes (49): abortError(), callModel(), CLASSIFY_MODEL_ID, CLASSIFY_PROMPT, CLASSIFY_REPAIR_PROMPT, CLASSIFY_TIMEOUT_MS, ClassifyError, ClassifyErrorCode (+41 more)

### Community 6 - "schemas.ts"
Cohesion: 0.04
Nodes (50): API_MODES, apiModeSchema, CLASSIFICATION_SOURCES, classificationFlagSchema, classificationSchema, classificationSourceSchema, classifyOutcomeSchema, ClassifyRequest (+42 more)

### Community 7 - "schedule-view.tsx"
Cohesion: 0.09
Nodes (34): metadata, RootLayout(), HomePage(), LINKS, SchedulePage(), ModeBadge(), DAY_LABELS_ID, formatScheduleDaysId() (+26 more)

### Community 8 - "schedule/index.ts"
Cohesion: 0.07
Nodes (41): dynamic, GET(), maxDuration, readFilter(), runtime, 6. Spesifikasi Endpoint REST, `GET /api/dashboard`, `GET /api/plans/:id` (+33 more)

### Community 9 - "vrp.ts"
Cohesion: 0.09
Nodes (35): assertCoordinate(), assertPlanInput(), clockMinutes(), distanceOf(), durationOf(), evaluateRoutes(), haversineKm(), indexStops() (+27 more)

### Community 10 - "package.json"
Cohesion: 0.08
Nodes (24): engines, node, license, name, packageManager, private, version, @ai-sdk/google (+16 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+14 more)

### Community 12 - "review.ts"
Cohesion: 0.14
Nodes (13): MISSING_TEXT, canonical(), classificationWasEdited(), normalizeClassificationFlags(), ReviewInput, reviewReasonsFor(), stampClassification(), Classification (+5 more)

### Community 13 - "memory.ts"
Cohesion: 0.21
Nodes (11): isHazardousClassification(), volumeLabelFor(), accountTypeForSeed(), mapSeedFacility(), mapSeedReport(), normalizeShares(), SeedFacility, SeedReport (+3 more)

### Community 14 - "seed-supabase.mjs"
Cohesion: 0.14
Nodes (12): 5. Struktur Klasifikasi & Aturan Peninjauan Deterministik (`needsReview`), compat, eslintConfig, @eslint/eslintrc, @supabase/supabase-js, client, facilities, labelFor() (+4 more)

### Community 15 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, ai, @ai-sdk/google, class-variance-authority, clsx, @fontsource/inter, leaflet, next (+9 more)

### Community 16 - "filter-reports.ts"
Cohesion: 0.17
Nodes (12): EMPTY_FILTERS, filterDashboard(), ReportListFilters, reportMatchesFilters(), aggregateDashboard(), round1(), Dashboard, facilities (+4 more)

### Community 17 - "Report"
Cohesion: 0.20
Nodes (7): Facility, Kecamatan, Plan, Report, ReportStatus, ReportQuery, Store

### Community 18 - "components.json"
Cohesion: 0.14
Nodes (13): aliases, components, ui, utils, rsc, $schema, style, tailwind (+5 more)

### Community 19 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, @playwright/test, postcss, tailwindcss (+6 more)

### Community 20 - "Proposal Teknis — Central Trash Agent"
Cohesion: 0.15
Nodes (12): 10. Referensi, 1. Latar Belakang & Rumusan Masalah, 2. Pengguna Sasaran, 3. Solusi yang Diimplementasikan, 5. Fitur Utama & Status Implementasi, 6. Arsitektur Teknis, 7. Inovasi & Diferensiasi, 8. Rencana Evaluasi & Potensi Pengembangan (+4 more)

### Community 21 - "README.md"
Cohesion: 0.24
Nodes (6): Aturan Kontrak yang Diterapkan, Data Laporan Awal (`reports.json`) — Catatan Provenans & Penggunaan, Arti `verified` dan `coordinatesVerified`, Aturan Perencanaan Rute & Peta UI, Fasilitas Pengelolaan Sampah Denpasar (`facilities.json`) — Provenans & Aturan Penggunaan, Provenans & Kejujuran Data

### Community 22 - "Central Trash Agent (Agen Sampah Terpusat) — Denpasar"
Cohesion: 0.20
Nodes (10): 2. Prinsip Desain Utama, Batasan & Kejujuran Data, Cara Menjalankan, Central Trash Agent (Agen Sampah Terpusat) — Denpasar, Dokumentasi Lengkap, Fitur Utama, Pembagian Model AI & Rotasi Multi-Kunci, Pengujian Kualitas (+2 more)

### Community 23 - "supabase.ts"
Cohesion: 0.20
Nodes (7): facilitySchema, reportSchema, assertServiceRole(), createSupabaseStore(), PlanRow, ReportRow, server-only

### Community 24 - "Arsitektur Teknis — Central Trash Agent"
Cohesion: 0.20
Nodes (9): 1. Diagram Arsitektur & Alur Pengguna, 3. Struktur Direktori Repositori, 4. Strategi Model AI & Ketahanan Kuota (*Task-Splitting & Multi-Key Rotation*), 5. Penyelesai Rute Deterministik (VRP) & Jadwal Mingguan, Alur Pengguna (*User Flow*) Warga & Petugas, Arsitektur Logis Sistem, Arsitektur Teknis — Central Trash Agent, Solver Jadwal Mingguan ([`lib/planner/weekly.ts`](../lib/planner/weekly.ts) & [`lib/schedule/index.ts`](../lib/schedule/index.ts)) (+1 more)

### Community 25 - "denpasar-map.tsx"
Cohesion: 0.25
Nodes (8): DenpasarMap(), DenpasarMapProps, MapMarker, MapRoute, PickHandler(), DENPASAR_CENTER, leaflet, react-leaflet

### Community 26 - "2. Skenario Demonstrasi Langkah demi Langkah"
Cohesion: 0.22
Nodes (8): 1. Persiapan & Menjalankan Aplikasi, 2. Skenario Demonstrasi Langkah demi Langkah, Langkah 1 — Beranda & Panduan Pemilahan Sumber (`/`), Langkah 2 — Simulasi Jadwal Pengangkutan Mingguan (`/schedule`), Langkah 3 — Pelaporan Warga & Kendali Manusia (`/report`), Langkah 4 — Dasbor Pemantauan Petugas (`/dashboard`), Langkah 5 — Perencana Rute VRP & Audit Keputusan (`/planner`), Panduan Demonstrasi & Skenario Uji — Central Trash Agent

### Community 27 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, lint, seed:supabase, start, test (+1 more)

### Community 28 - "Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar"
Cohesion: 0.29
Nodes (7): 1. Landasan Regulasi Pemilahan Sampah dari Sumber, 2. Geografi Administratif Kota Denpasar, 3. Konteks Timbulan & Komposisi Sampah, 4. Provenans Data Fasilitas & Laporan Awal, Peraturan Gubernur Bali Nomor 47 Tahun 2019 tentang Pengelolaan Sampah Berbasis Sumber, Referensi Regulasi & Provenans Data Pengelolaan Sampah Bali / Denpasar, Regulasi Pendukung Lainnya

### Community 30 - "3. Enum Domain Utama"
Cohesion: 0.33
Nodes (6): 3. Enum Domain Utama, AccountType, PlanStatus, TrashType, Urgency, VolumeLabel

### Community 31 - "Central Trash Agent — Spesifikasi Kontrak API & Domain (v1)"
Cohesion: 0.50
Nodes (4): 1. Amplop Respons & Kode Status HTTP, 2. Pembagian Model AI Berdasarkan Tugas & Rotasi Multi-Kunci, 4. Spesifikasi Unggahan Gambar, Central Trash Agent — Spesifikasi Kontrak API & Domain (v1)

### Community 32 - "4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia"
Cohesion: 0.50
Nodes (4): 4.1 Arsitektur Pembagian Tugas Model (*Task-Split Models*) & Failover Multi-Kunci, 4.2 Penentuan `needsReview` Deterministik & Audit Koreksi B3, 4.3 Penanganan Konservatif Limbah B3 pada Solver Rute, 4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia

## Knowledge Gaps
- **299 isolated node(s):** `runtime`, `dynamic`, `maxDuration`, `runtime`, `dynamic` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `explain.ts` to `planner-view.tsx`, `reports/route.ts`, `use-report-flow.ts`, `weekly.ts`, `classify.ts`, `schemas.ts`, `schedule-view.tsx`, `schedule/index.ts`, `vrp.ts`, `package.json`, `review.ts`, `memory.ts`, `seed-supabase.mjs`, `filter-reports.ts`, `Central Trash Agent (Agen Sampah Terpusat) — Denpasar`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `demo()` connect `Central Trash Agent (Agen Sampah Terpusat) — Denpasar` to `4. Implementasi Kecerdasan Buatan (AI) & Kendali Manusia`, `2. Skenario Demonstrasi Langkah demi Langkah`, `Central Trash Agent — Spesifikasi Kontrak API & Domain (v1)`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Report` connect `Report` to `planner-view.tsx`, `reports/route.ts`, `use-report-flow.ts`, `schemas.ts`, `schedule/index.ts`, `memory.ts`, `filter-reports.ts`, `README.md`, `supabase.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useReportFlow()` (e.g. with `EMPTY_PERCENTS()` and `classify()`) actually correct?**
  _`useReportFlow()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `runtime`, `dynamic`, `maxDuration` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planner-view.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06708742402992052 - nodes in this community are weakly interconnected._
- **Should `reports/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06292134831460675 - nodes in this community are weakly interconnected._