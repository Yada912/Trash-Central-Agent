import { describe, expect, it } from 'vitest'
import { authenticateAccount, createAccount, listAccounts } from '@/lib/accounts/store'

describe('guest state, demo judge credentials, and registration flow', () => {
  it('allows Dewan Juri to authenticate using the sample citizen credentials (I Made Adi Wijaya)', () => {
    const warga = authenticateAccount('made.adi@warga.denpasar.id', 'warga123')
    expect(warga).not.toBeNull()
    expect(warga?.id).toBe('usr_warga_01')
    expect(warga?.name).toBe('I Made Adi Wijaya')
    expect(warga?.role).toBe('warga')
    expect(warga?.banjarName).toBe('Banjar Pekambingan')
    // Ensure sensitive password hash / plain text is never exposed
    expect((warga as unknown as Record<string, unknown>).password).toBeUndefined()
  })

  it('allows Dewan Juri to authenticate using the sample DLHK officer credentials (Surya Wirawan)', () => {
    const petugas = authenticateAccount('surya.wirawan@dlhk.denpasar.id', 'petugas123')
    expect(petugas).not.toBeNull()
    expect(petugas?.id).toBe('usr_petugas_01')
    expect(petugas?.name).toBe('I Wayan Gde Surya Wirawan')
    expect(petugas?.role).toBe('petugas')
    expect((petugas as unknown as Record<string, unknown>).password).toBeUndefined()
  })

  it('rejects incorrect passwords or unregistered emails cleanly without crashing', () => {
    expect(authenticateAccount('made.adi@warga.denpasar.id', 'wrongpassword')).toBeNull()
    expect(authenticateAccount('hacker@unknown.org', 'warga123')).toBeNull()
    expect(authenticateAccount('', '')).toBeNull()
  })

  it('allows new citizens to register their own account without overwriting the demo account', () => {
    const newCitizen = createAccount({
      name: 'Ni Wayan Sari Dewi',
      email: 'sari.dewi@denpasar.id',
      password: 'passwordRahasia123',
      role: 'warga',
      kecamatan: 'Denpasar Selatan',
      desa: 'Sanur Kauh',
      address: 'Jl. Danau Tamblingan No. 45',
      banjarName: 'Banjar Betngandang',
      birthDate: '1998-09-20',
      accountType: 'household',
    })

    expect(newCitizen.id).toMatch(/^usr_warga_/)
    expect(newCitizen.name).toBe('Ni Wayan Sari Dewi')

    // Verify the new user can authenticate with their registered password
    const authResult = authenticateAccount('sari.dewi@denpasar.id', 'passwordRahasia123')
    expect(authResult).not.toBeNull()
    expect(authResult?.id).toBe(newCitizen.id)

    // Verify sample judge account is still intact
    const all = listAccounts()
    const sample = all.find((acc) => acc.id === 'usr_warga_01')
    expect(sample).toBeDefined()
    expect(sample?.name).toBe('I Made Adi Wijaya')
  })
})
