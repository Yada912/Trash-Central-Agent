import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/security/guard'

/**
 * Shared counter when the api_rate_limits table exists.
 * Any database miss or error uses the in-memory limiter and does not throw.
 */
export async function durableRateLimit(bucket: string, limit: number, windowMs: number) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return checkRateLimit(bucket, limit, windowMs)
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const now = Date.now()
    const read = await client.from('api_rate_limits').select('hits, window_started_at').eq('bucket', bucket).maybeSingle()
    if (read.error) return checkRateLimit(bucket, limit, windowMs)
    const row = read.data as { hits: number; window_started_at: string } | null
    const started = row ? Date.parse(row.window_started_at) : 0
    const fresh = !row || !Number.isFinite(started) || now - started >= windowMs
    const previous = row && !fresh ? Number(row.hits) : 0
    if (!fresh && previous >= limit) {
      return { allowed: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((started + windowMs - now) / 1000)) }
    }
    const hits = previous + 1
    const write = await client.from('api_rate_limits').upsert({
      bucket,
      hits,
      window_started_at: fresh ? new Date(now).toISOString() : row?.window_started_at,
    })
    if (write.error) return checkRateLimit(bucket, limit, windowMs)
    return { allowed: true, remaining: Math.max(0, limit - hits), retryAfterSec: 0 }
  } catch {
    return checkRateLimit(bucket, limit, windowMs)
  }
}
