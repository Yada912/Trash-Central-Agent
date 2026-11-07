import 'server-only'
import { createSupabaseStore } from '@/lib/store/supabase'
import { getMemoryStore } from '@/lib/store/memory'
import type { Store } from '@/lib/store/types'

export type { ReportQuery, Store } from '@/lib/store/types'

export function getStore(): Store {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return createSupabaseStore(url, key)
  return getMemoryStore()
}
