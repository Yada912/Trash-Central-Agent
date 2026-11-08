import { loadExternalAccounts, loadExternalTimetable } from '@/lib/accounts/store'
import { fetchAccountsFromSupabase, fetchTimetableFromSupabase } from '@/lib/accounts/supabase-sync'

/** Loads the durable account and timetable rows into this instance before a read or write. */
export async function hydrateAccountState(): Promise<void> {
  const [accounts, timetable] = await Promise.all([fetchAccountsFromSupabase(), fetchTimetableFromSupabase()])
  if (accounts && accounts.length > 0) loadExternalAccounts(accounts)
  if (timetable && timetable.length > 0) loadExternalTimetable(timetable)
}
