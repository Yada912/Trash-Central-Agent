# SYNTHETIC DEMO ONLY — Denpasar report fixtures

Canonical integration artifact: `reports.json` (JSON array, exactly 150). Read `reports.metadata.json` alongside it. No real reports, people, photos, facility pins, observed conditions, or environmental statistics are included. Every description starts `[DEMO]`.

## Contract and data dictionary
No API/schema file was present among the standalone project brief files inspected. This follows the later supplied Hensen integration contract (camelCase), not the original fallback snake_case contract. Extra additive fields are `provenance`, `descriptionEn`, and `estimatedWeightKg`; strip these only if a strict downstream parser requires it, preserving demo labeling.

| Field | Type / meaning |
|---|---|
| id | String, unique `demo-001` through `demo-150` |
| isDemo | Boolean, always true |
| provenance | String, always `synthetic` |
| createdAt | ISO 8601 timestamp with explicit +08:00 (WITA), invented within previous 14 days |
| lat, lng | Decimal degrees, approximate invented neighborhood points, not verified/geocoded |
| kecamatan | Denpasar Barat / Denpasar Timur / Denpasar Selatan / Denpasar Utara |
| desa | Approximate desa/kelurahan neighborhood label; assignment not boundary-verified |
| description | Short synthetic resident-style Indonesian text, with demo disclaimer |
| descriptionEn | English equivalent, also explicitly demo |
| types | Array of `{type, share}`; share is volume fraction, positive and totals 1 |
| types[].type | organic / plastic / paper / metal / residual / hazardous |
| volumeLiters | Positive bulk volume in liters; divide by 1000 for m³ |
| estimatedWeightKg | Positive illustrative modeled mass in kg, not measured |
| urgency | low / medium / high, invented triage label |
| confidence | 0–1 invented UI fixture, not AI calibration |
| status | new / planned / collected, fictional lifecycle state |

## Generation and quality
Run `python3 /workspace/digifest/seed/generate-reports.py` to deterministically regenerate canonical JSON, metadata, validation summary and byte-identical compatibility copies in `../data/`. Standard library only; RNG seed 20261107. Fixed scenario cutoff: 7 November 2026 13:53 WITA (UTC+08:00), not execution time. Generator overwrites these generated files only; it does not touch facilities files.

150 records across 28 approximate neighborhoods: Barat 40, Utara 40, Timur 35, Selatan 35. Status mix: new 105, planned 28, collected 17. Report times span 24 October 2026 15:32 through 7 November 2026 12:14 WITA. Composition includes single-type and mixed-type loads; shares are by volume, not mass. Liters × weighted illustrative density / 1000 gives kg (rounded to 2 decimals). Assumed kg/m³: organic 280, plastic 55, paper 90, metal 180, residual 160, hazardous 200. These are synthetic planning parameters, not sourced waste statistics. Hazardous examples are small separate loads with high urgency; do not schedule on ordinary collection vehicles without a separate handling rule.

Coordinates use manually selected inland neighborhood anchors and +/-0.0015° jitter (roughly at most 235 m diagonal). Conservative overall bounds (-8.72 to -8.59 latitude, 115.18 to 115.27 longitude) plus per-anchor limits reduce coastal risk. No official boundary/coastline, road routing, geocoding, or parcel verification occurred. Points may fall inside buildings, on private property, or across a local administrative boundary. They are NOT real TPS/TPS3R/bank sampah locations and must never be used for dispatch. Equalized district coverage and repetitive profile patterns are intentional demo design, not geographic prevalence estimates.

Validation assertions cover exact count, IDs, enum values, positive units, fractions, formula consistency, hazardous separation, timestamp timezone/range, approximate inland bounds/anchor proximity, district coverage and bilingual demo flags. See `validation-summary.json`: PASS. Land checks establish plausibility only, not authoritative on-land or administrative membership. Keep a conspicuous UI-level “DEMO — synthetic reports” banner and exclude this dataset from real operational analytics. No prediction accuracy, observed waste prevalence, or real emergency is implied.

## Sample
```json
{
  "id": "demo-001",
  "isDemo": true,
  "provenance": "synthetic",
  "createdAt": "2026-10-28T11:46:00+08:00",
  "lat": -8.654077,
  "lng": 115.18395,
  "kecamatan": "Denpasar Barat",
  "desa": "Padangsambian",
  "description": "[DEMO] Ada sisa organik dekat gang permukiman rekaan, sekitar Padangsambian; kira-kira 1064.3 liter. Bukan kejadian nyata.",
  "descriptionEn": "[DEMO] There is organic scraps near an invented residential lane, around Padangsambian; about 1064.3 liters. Not a real incident.",
  "types": [
    {
      "type": "organic",
      "share": 1
    }
  ],
  "volumeLiters": 1064.3,
  "estimatedWeightKg": 298.0,
  "urgency": "medium",
  "confidence": 0.73,
  "status": "new"
}
```

## Real facility sources
`facilities.json` contains three sourced geographic points, separate from the fictional resident reports. Read `README-facilities.md` and `../data/facilities-sourced.json` for coordinate and official identity sources. `verified` refers to a sourced location only, never current operations or truck access. TPA Suwung is a simulated depot reference, not a confirmed operational destination. Eight bank sampah address records are available in `../data/bank-sampah-sourced.json`, with no invented coordinates. Waste-statistics citations and coverage caveats are in `../data/waste-evidence.md`.
