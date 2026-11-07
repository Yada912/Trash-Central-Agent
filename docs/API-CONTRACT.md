# Central Trash Agent — API contract v1 (owner: Hensen)
Source of truth until the repo exists; then it lives in `lib/schemas.ts` (Zod) and this file mirrors it.
All endpoints: JSON in/out. Success `{ data, meta: { mode: 'live'|'demo', requestId, model?, latencyMs } }`.
Error `{ error: { code: 'VALIDATION'|'TIMEOUT'|'UPSTREAM'|'RATE_LIMIT'|'NOT_FOUND'|'CONFLICT'|'PAYLOAD_TOO_LARGE'|'INTERNAL', message, fields?: Record<string,string[]> }, meta: { requestId } }`
Statuses 400/413/504/502/429/404/409/500. Header `x-request-id` always. No streaming. Demo mode only when GEMINI_API_KEY unset; live failure => error, never mock.

## Enums
TrashType = organic | plastic | paper | metal | residual | hazardous
Urgency = low | medium | high
VolumeLabel = small (<50 L) | medium (50–300 L) | large (>300 L)
ReportStatus = new | planned | collected
PlanStatus = proposed | edited_pending | approved | rejected
Kecamatan = Denpasar Barat | Denpasar Timur | Denpasar Selatan | Denpasar Utara

## Image upload
MIME: image/jpeg, image/png, image/webp. Max 3,000,000 bytes decoded (~4.0 MB as base64; Vercel body limit 4.5 MB). Client compresses to longest side 1280 px, JPEG q≈0.8, and recompresses (lower q / 1024 px) or rejects if still over. Server guard: whole JSON body > 4,200,000 bytes => 413 PAYLOAD_TOO_LARGE; decoded image > 3,000,000 bytes => 400 VALIDATION fields.image. Max 1 image per report. base64 without data: prefix.

## Classification
{
  types: Array<{ type: TrashType; share: number /*0–1, 2 dp, sum = 1 ±0.01, 1–6 entries, sorted desc*/ }>,
  volume: { liters: number /*int ≥1*/; label: VolumeLabel },
  urgency: Urgency,
  confidence: number /*0–1*/,
  rationale: string /*≤280 chars*/,
  flags: Array<'hazardous_present'|'low_image_quality'|'no_image'|'insufficient_text'|'contradictory'>,
  needsReview: boolean,
  reviewReasons: Array<'low_confidence'|'hazardous'|'insufficient_text'|'contradictory'|'low_image_quality'>,
  source: 'gemini'|'mock'|'manual'
}
needsReview is computed on the server (lib/review.ts), never inside lib/ai. It is true exactly when reviewReasons is non-empty.
low_confidence: confidence < 0.5 (0.50 is not low). hazardous: hazardous share > 0 or flag hazardous_present.
insufficient_text: flag set, or text under 10 characters and no image. contradictory: flag set.
low_image_quality: flag set. no_image alone does not trigger review.
source is gemini in live mode, mock in demo mode, and manual for manual entry. needsReview never blocks submit.
REVIEW_CONFIDENCE_THRESHOLD = 0.5.
Defaults when the resident skips editing: use AI values as-is. Manual entry (no AI) default: types [{residual,1}], volume {50,'medium'}, urgency 'medium', confidence 0, flags ['no_image'] if none.
UI must show confidence; < 0.5 => prompt resident to check.

## Endpoints
POST /api/reports/classify  { text: string(1–1000), image?: { base64, mimeType } } -> ClassifyOutcome   (budget 15 s)
   ClassifyOutcome = { kind: 'trash', classification: Classification } | { kind: 'not_trash', reason: string /*≤280*/, confidence: number }
   not_trash is a normal 200 result (no fabricated trash). UI tells the resident and offers manual entry; POST /api/reports always requires a full Classification.
   Module: classifyReport() returns ClassifyOutcome; it throws only for real failures (timeout/upstream/invalid model output).
POST /api/reports           { text, lat, lng, image?, classification: Classification, aiClassification?: Classification } -> Report
   lat/lng must be inside the Denpasar bbox (-8.75..-8.57, 115.16..115.28) else VALIDATION.
GET  /api/reports?kecamatan=&status=&since=ISO -> Report[]
   Report = { id, isDemo, createdAt, lat, lng, kecamatan, desa?, description, photoUrl?, classification, edited: boolean, status }
GET  /api/dashboard -> { totals: { byType: Record<TrashType, liters>, byKecamatan: Record<Kecamatan,{reports,liters}>, byUrgency: Record<Urgency,number> }, zones: Array<{ id, centroid:[lat,lng], reportIds, liters, dominantType }>, facilities: Facility[] }
POST /api/plans  { trucks: Array<{ id, capacityLiters }>, crews: number, shift: { start:'HH:MM', end:'HH:MM' }, reportIds?: string[] } -> Plan
POST /api/plans/:id/decision  { action: 'approve'|'reject'|'edit', note?: string, edits?: { moveStop?: { stopId, toTruckId } } } -> Plan
GET  /api/plans/:id -> Plan
POST /api/plans/:id/explain  {} -> Plan
   Re-runs explainPlan on the plan's current version and sets explanation.stale=false.
   Never changes status, version, or decisions, and never approves.
   Demo mode (GEMINI_API_KEY unset) returns a labelled mock explanation. A live failure is an error, never a silent mock.

Plan = { id, status: PlanStatus, version: number, input, result: { routes: Array<{ truckId, stopIds, loadLiters, capacityLiters, distanceKm, durationMin, feasible: boolean, violations: string[], polyline: [lat,lng][] }>, unassigned: Array<{ id, reason }>, totals: { distanceKm, liters, stops } }, explanation: { summary, perRoute, risks, stale: boolean }, decisions: Array<{ action, note?, at, version }> }

## Decision rules (human in the loop)
- edit: server recomputes loads, distance, duration, feasibility for affected routes; status -> 'edited_pending'; version+1; explanation.stale = true (re-explained async or on request). Never keeps a prior approval.
- approve: allowed only from proposed | edited_pending AND all routes feasible, else 409 CONFLICT with violations. Sets reports in plan to status 'planned'.
- reject: from proposed | edited_pending; note required.
- Every action is appended to decisions with timestamp (+08:00).

## Hazardous handling
Reports whose classification has a hazardous share >= 0.2 or flag 'hazardous_present' are excluded from ordinary truck routes and returned in result.unassigned with reason 'hazardous_separate' (needs specialised pickup). Dashboard shows them separately.

## Seed data
/workspace/digifest/seed/reports.json (Hormuz, 150 demo records, isDemo:true). Extra fields provenance, descriptionEn, estimatedWeightKg are passed through. Coordinates are approximate demo fixtures, not dispatch-ready; UI must label as demo.

## Facilities
/workspace/digifest/seed/facilities.json (Hormuz): TPA Suwung, TPS3R Cemara, TPS3R Sesetan. verified:true = source-published point only, not operations/entrance. TPA Suwung is the planner depot and must be labelled "simulated depot (operational status unverified)" in UI and explanation. Bank sampah records with null coordinates are never routed or mapped.
