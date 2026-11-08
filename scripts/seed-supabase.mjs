import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

// Auto-load .env if variables are not in process.env
if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = join(root, '.env')
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const idx = trimmed.indexOf('=')
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim()
          const v = trimmed.slice(idx + 1).trim()
          if (!process.env[k]) process.env[k] = v
        }
      }
    } catch {}
  }
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env. No values were found.')
  process.exit(1)
}

if (key.startsWith('sb_publishable_')) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is a publishable (anon) key, not a service_role secret key. Refusing to seed.')
  process.exit(1)
}

const segment = key.split('.')[1]
if (segment) {
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
    if (payload.role && payload.role !== 'service_role') {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not a service_role key. Refusing to seed.')
      process.exit(1)
    }
  } catch {
    console.error('Could not read the key role. Refusing to seed.')
    process.exit(1)
  }
}

function labelFor(liters) {
  if (liters < 50) return 'small'
  if (liters <= 300) return 'medium'
  return 'large'
}

function reviewReasons(raw, flags) {
  const reasons = []
  if (raw.confidence < 0.5) reasons.push('low_confidence')
  const hazardousShare = raw.types.find((entry) => entry.type === 'hazardous')?.share ?? 0
  if (hazardousShare > 0 || flags.includes('hazardous_present')) reasons.push('hazardous')
  if (flags.includes('insufficient_text') || String(raw.description).trim().length < 10) reasons.push('insufficient_text')
  if (flags.includes('contradictory')) reasons.push('contradictory')
  if (flags.includes('low_image_quality')) reasons.push('low_image_quality')
  return reasons
}

function mapReport(raw) {
  const liters = Math.max(1, Math.round(raw.volumeLiters))
  const flags = ['no_image']
  if (raw.types.some((entry) => entry.type === 'hazardous' && entry.share > 0)) flags.unshift('hazardous_present')
  const reasons = reviewReasons(raw, flags)
  return {
    id: raw.id,
    is_demo: true,
    created_at: raw.createdAt,
    lat: raw.lat,
    lng: raw.lng,
    kecamatan: raw.kecamatan,
    desa: raw.desa ?? null,
    description: raw.description,
    description_en: raw.descriptionEn ?? null,
    photo_url: null,
    classification: {
      types: [...raw.types].sort(
        (left, right) => Number(right.share) - Number(left.share) || String(left.type).localeCompare(String(right.type)),
      ),
      volume: { liters, label: labelFor(liters) },
      urgency: raw.urgency,
      confidence: raw.confidence,
      rationale: 'Synthetic demo fixture. Not a model classification.',
      flags,
      needsReview: reasons.length > 0,
      reviewReasons: reasons,
      source: 'mock',
    },
    edited: false,
    status: raw.status,
    provenance: raw.provenance ?? null,
    estimated_weight_kg: raw.estimatedWeightKg ?? null,
  }
}

const reports = JSON.parse(readFileSync(join(root, 'data/reports.json'), 'utf8')).map(mapReport)
const facilities = JSON.parse(readFileSync(join(root, 'data/facilities.json'), 'utf8')).map((facility) => ({
  id: facility.id,
  name: facility.name,
  kind: facility.kind,
  lat: facility.lat,
  lng: facility.lng,
  address: facility.address ?? null,
  source_url: facility.sourceUrl ?? null,
  verified: facility.verified,
}))

const accounts = JSON.parse(readFileSync(join(root, 'data/accounts.json'), 'utf8')).map((acc) => ({
  id: acc.id,
  name: acc.name,
  email: acc.email,
  password: acc.password,
  role: acc.role,
  badge_id: acc.badgeId ?? null,
  kecamatan: acc.kecamatan,
  desa: acc.desa,
  banjar_name: acc.banjarName ?? null,
  tps3r_node: acc.tps3rNode ?? null,
  birth_date: acc.birthDate ?? null,
  address: acc.address,
  lat: acc.lat ?? -8.6562,
  lng: acc.lng ?? 115.2124,
  account_type: acc.accountType ?? 'household',
  waste_profile: acc.wasteProfile ?? null,
}))

const timetableSlots = JSON.parse(readFileSync(join(root, 'data/timetable.json'), 'utf8')).map((slot) => ({
  id: slot.id,
  kecamatan: slot.kecamatan,
  stream: slot.stream,
  days: slot.days,
  window_start: slot.windowStart,
  window_end: slot.windowEnd,
  leeway_minutes: slot.leewayMinutes,
  surge_tolerance_pct: slot.surgeTolerancePct,
  max_liters_per_pickup: slot.maxLitersPerPickup,
  notes: slot.notes ?? null,
}))

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const facilityResult = await client.from('facilities').upsert(facilities)
if (facilityResult.error) {
  console.error(`Facility seed failed: ${facilityResult.error.message}`)
  process.exit(1)
}

const reportResult = await client.from('reports').upsert(reports)
if (reportResult.error) {
  console.error(`Report seed failed: ${reportResult.error.message}`)
  process.exit(1)
}

const accountResult = await client.from('accounts').upsert(accounts)
if (accountResult.error) {
  console.warn(`Account seed note (migration 0006): ${accountResult.error.message}`)
}

const timetableResult = await client.from('timetable_slots').upsert(timetableSlots)
if (timetableResult.error) {
  console.warn(`Timetable seed note (migration 0006): ${timetableResult.error.message}`)
}

console.log(`Seeded ${facilities.length} facilities, ${reports.length} reports, ${accounts.length} accounts, and ${timetableSlots.length} timetable slots.`)
