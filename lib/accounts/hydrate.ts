import { loadExternalAccounts, loadExternalTimetable } from '@/lib/accounts/store'
import { fetchAccountsFromSupabase, fetchTimetableFromSupabase } from '@/lib/accounts/supabase-sync'

/**
 * A successful account fetch replaces memory, even when the table is empty.
 * A failed fetch leaves the previous memory in place.
 */
export async function hydrateAccountState(): Promise<void> {
  const [accounts, timetable] = await Promise.all([fetchAccountsFromSupabase(), fetchTimetableFromSupabase()])
  if (accounts.ok) loadExternalAccounts(accounts.rows)
  if (timetable && timetable.length > 0) loadExternalTimetable(timetable)
}
