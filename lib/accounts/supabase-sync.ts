import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { UserAccount, PetugasTimetableSlot } from '@/lib/accounts/store'

function getClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function isSupabaseConfigured(): boolean {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function fetchAccountsFromSupabase(): Promise<UserAccount[] | null> {
  const client = getClient()
  if (!client) return null
  try {
    const { data, error } = await client.from('accounts').select('*').order('created_at', { ascending: true })
    if (error || !data || data.length === 0) return null
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password ?? undefined,
      role: row.role as 'warga' | 'petugas',
      badgeId: row.badge_id ?? undefined,
      kecamatan: row.kecamatan,
      desa: row.desa,
      banjarName: row.banjar_name ?? undefined,
      tps3rNode: row.tps3r_node ?? undefined,
      birthDate: row.birth_date ?? undefined,
      address: row.address,
      lat: row.lat ?? -8.6562,
      lng: row.lng ?? 115.2124,
      accountType: row.account_type ?? 'household',
      wasteProfile: row.waste_profile ?? undefined,
    }))
  } catch {
    return null
  }
}

export async function fetchTimetableFromSupabase(): Promise<PetugasTimetableSlot[] | null> {
  const client = getClient()
  if (!client) return null
  try {
    const { data, error } = await client.from('timetable_slots').select('*').order('id', { ascending: true })
    if (error || !data || data.length === 0) return null
    return data.map((row) => ({
      id: row.id,
      kecamatan: row.kecamatan,
      stream: row.stream,
      days: Array.isArray(row.days) ? row.days : [],
      windowStart: row.window_start,
      windowEnd: row.window_end,
      leewayMinutes: row.leeway_minutes,
      surgeTolerancePct: row.surge_tolerance_pct,
      maxLitersPerPickup: row.max_liters_per_pickup,
      notes: row.notes ?? '',
    }))
  } catch {
    return null
  }
}

export async function syncAccountToSupabase(account: UserAccount): Promise<void> {
  const client = getClient()
  if (!client) return
  try {
    await client.from('accounts').upsert({
      id: account.id,
      name: account.name,
      email: account.email,
      password: account.password ?? null,
      role: account.role,
      badge_id: account.badgeId ?? null,
      kecamatan: account.kecamatan,
      desa: account.desa,
      banjar_name: account.banjarName ?? null,
      tps3r_node: account.tps3rNode ?? null,
      birth_date: account.birthDate ?? null,
      address: account.address,
      lat: account.lat,
      lng: account.lng,
      account_type: account.accountType,
      waste_profile: account.wasteProfile ?? null,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Supabase account sync failed:', err)
  }
}

export async function syncTimetableToSupabase(slot: PetugasTimetableSlot): Promise<void> {
  const client = getClient()
  if (!client) return
  try {
    await client.from('timetable_slots').upsert({
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
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Supabase timetable sync failed:', err)
  }
}
