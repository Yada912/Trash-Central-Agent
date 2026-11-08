import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const updates: Array<{ id: string; payload: Record<string, unknown> }> = []
const inserts: Array<Record<string, unknown>> = []
let updateRows: Array<{ id: string }> = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table !== 'accounts') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          order: async () => ({ data: [], error: null }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: (column: string, id: string) => ({
            select: async () => {
              if (column !== 'id') throw new Error(column)
              updates.push({ id, payload })
              return { data: updateRows, error: null }
            },
          }),
        }),
        insert: async (payload: Record<string, unknown>) => {
          inserts.push(payload)
          return { error: null }
        },
      }
    },
  }),
}))

import { loadExternalAccounts, listAccounts, removeAccount } from '@/lib/accounts/store'
import { syncAccountToSupabase } from '@/lib/accounts/supabase-sync'

const ghost = {
  id: 'usr_deleted',
  name: 'Deleted',
  email: 'deleted@example.invalid',
  password: undefined,
  role: 'warga' as const,
  kecamatan: 'Denpasar Barat' as const,
  desa: 'Pemecutan',
  address: 'Alamat uji',
  lat: -8.65,
  lng: 115.21,
  accountType: 'household' as const,
}

describe('account hydration snapshot', () => {
  beforeEach(() => {
    updates.length = 0
    inserts.length = 0
    updateRows = []
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    loadExternalAccounts([ghost, { ...ghost, id: 'usr_keep', email: 'keep@example.invalid' }])
  })

  it('replaces memory with the snapshot and drops ids the database no longer has', () => {
    loadExternalAccounts([{ ...ghost, id: 'usr_keep', email: 'keep@example.invalid' }])
    expect(listAccounts().map((account) => account.id)).toEqual(['usr_keep'])
  })

  it('clears memory when the successful snapshot is empty', () => {
    loadExternalAccounts([])
    expect(listAccounts()).toEqual([])
  })

  it('does not insert a deleted account on update, and does insert a new signup', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test'
    updateRows = []
    const missing = await syncAccountToSupabase(ghost, 'update')
    expect(missing).toBe('missing')
    expect(inserts).toEqual([])
    expect(updates).toHaveLength(1)
    removeAccount(ghost.id)

    const created = await syncAccountToSupabase({ ...ghost, id: 'usr_new' }, 'insert')
    expect(created).toBe('wrote')
    expect(inserts.map((row) => row.id)).toEqual(['usr_new'])
    expect(updates).toHaveLength(1)
  })
})
