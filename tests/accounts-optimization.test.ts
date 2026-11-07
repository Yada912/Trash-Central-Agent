import { describe, expect, it } from 'vitest'
import {
  computeResidentOptimization,
  createAccount,
  getActiveAccount,
  listAccounts,
  listTimetableSlots,
  updateAccountProfile,
  updateTimetableSlot,
} from '@/lib/accounts/store'

describe('accounts, resident waste profile, and petugas timetable leeway optimizer', () => {
  it('provides seeded warga and petugas accounts and computes optimization against timetable leeway', () => {
    const accounts = listAccounts()
    expect(accounts.some((a) => a.role === 'warga')).toBe(true)
    expect(accounts.some((a) => a.role === 'petugas')).toBe(true)

    const warga = getActiveAccount('usr_warga_01')
    expect(warga.role).toBe('warga')
    const timetable = listTimetableSlots()
    const summary = computeResidentOptimization(warga, timetable)
    expect(summary).not.toBeNull()
    expect(summary?.baseWeeklyLiters).toBeGreaterThan(0)
    expect(summary?.totalWeeklyLiters).toBe(
      (summary?.baseWeeklyLiters ?? 0) + (summary?.eventExtraLiters ?? 0),
    )
    expect(summary?.streams).toHaveLength(4)
  })

  it('recomputes leeway status when resident weekly output or petugas surge tolerance changes', () => {
    const created = createAccount({
      name: 'I Ketut Test',
      email: 'ketut@test.id',
      role: 'warga',
      kecamatan: 'Denpasar Timur',
      desa: 'Kesiman',
      address: 'Jl. WR Supratman No. 10',
      accountType: 'household',
    })
    expect(created.id).toMatch(/^usr_warga_/)

    // Update profile to have high organic surge
    const updated = updateAccountProfile(created.id, {
      wasteProfile: {
        currentCondition: 'pasca_upacara',
        conditionNote: 'Banyak sisa janur odalan',
        weeklyRegularLiters: 150,
        containerPreset: 'kantong_15l',
        householdMembers: 6,
        sortingReadiness: 'sebagian',
        compositionPct: {
          organic: 80,
          plastic: 10,
          paper: 5,
          metal: 0,
          residual: 5,
          hazardous: 0,
        },
        specialEvents: [
          {
            id: 'evt_test_odalan',
            name: 'Odalan Keluarga',
            frequency: '6 bulan sekali',
            extraLiters: 180,
            dominantStream: 'organik',
            activeThisWeek: true,
            notes: 'Janur dan banten',
          },
        ],
      },
    })
    expect(updated).not.toBeNull()

    const slots = listTimetableSlots('Denpasar Timur')
    const organikSlot = slots.find((s) => s.stream === 'organik')
    expect(organikSlot).toBeDefined()

    if (organikSlot) {
      updateTimetableSlot(organikSlot.id, { maxLitersPerPickup: 60, surgeTolerancePct: 20 })
    }

    const summary = computeResidentOptimization(updated!, listTimetableSlots())
    const organikAdvice = summary?.streams.find((s) => s.stream === 'organik')
    expect(organikAdvice?.status).toBe('needs_extra_pickup')
  })
})

