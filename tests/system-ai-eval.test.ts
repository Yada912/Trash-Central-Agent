import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { authenticateAccount } from '@/lib/accounts/authenticate'
import {
  computeResidentOptimization,
  listAccounts,
  listTimetableSlots,
  updateAccountProfile,
} from '@/lib/accounts/store'
import {
  BALINESE_CALENDAR_EVENTS_2026,
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildMonthCalendarGrid,
} from '@/lib/calendar/balinese-calendar'
import { GET as getEval } from '@/app/api/eval/route'

describe('Authentication, Balinese Calendar, and System/AI Evaluation Suite', () => {
  it('authenticates Warga and Petugas accounts with strict role separation and rejects invalid credentials', () => {
    const wargaLogin = authenticateAccount('made.adi@warga.denpasar.id', process.env.DEMO_WARGA_PASSWORD)
    expect(wargaLogin).not.toBeNull()
    expect(wargaLogin?.role).toBe('warga')
    expect(wargaLogin?.wasteProfile?.pickupHistory?.length).toBeGreaterThan(0)

    const petugasLogin = authenticateAccount('surya.wirawan@dlhk.denpasar.id', process.env.DEMO_PETUGAS_PASSWORD)
    expect(petugasLogin).not.toBeNull()
    expect(petugasLogin?.role).toBe('petugas')

    const wrongPass = authenticateAccount('made.adi@warga.denpasar.id', 'incorrect')
    expect(wrongPass).toBeNull()
  })

  it('computes Balinese calendar month grid, surge predictions, and Google Calendar / .ics exports', () => {
    const accounts = listAccounts()
    const timetable = listTimetableSlots()
    const warga = accounts.find((a) => a.role === 'warga')!

    const cells = buildMonthCalendarGrid({
      year: 2026,
      month: 11,
      todayDate: '2026-11-07',
      kecamatan: warga.kecamatan,
      timetable,
      weeklyRegularLiters: warga.wasteProfile?.weeklyRegularLiters ?? 105,
      selectedBalineseEventIds: ['bali_galungan', 'bali_kuningan'],
    })

    expect(cells).toHaveLength(35)

    // Galungan is 2026-11-04
    const galunganCell = cells.find((c) => c.date === '2026-11-04')
    expect(galunganCell).toBeDefined()
    expect(galunganCell?.balineseEvents.some((e) => e.id === 'bali_galungan' && e.isSelectedByUser)).toBe(true)
    expect(galunganCell?.predictedExtraLiters).toBeGreaterThanOrEqual(60)
    expect(galunganCell?.pickups.length).toBeGreaterThan(0)

    // Verify Google Calendar URL and .ics RFC 5545 format
    const eventInput = {
      title: 'Angkut Sampah Organik (Denpasar Barat)',
      date: '2026-11-09',
      startTime: '06:00',
      endTime: '09:00',
      description: 'Jadwal angkut sampah organik rutin',
      location: 'Denpasar Barat, Bali',
    }
    const gcalUrl = buildGoogleCalendarUrl(eventInput)
    expect(gcalUrl).toContain('https://calendar.google.com/calendar/render?')
    expect(gcalUrl).toContain('Angkut+Sampah+Organik')

    const ics = buildIcsContent(eventInput)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('SUMMARY:Angkut Sampah Organik (Denpasar Barat)')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('updates resident selected Balinese events and recalculates surge leeway optimization', () => {
    const warga = listAccounts().find((a) => a.id === 'usr_warga_01')!
    const updated = updateAccountProfile('usr_warga_01', {
      wasteProfile: {
        ...warga.wasteProfile!,
        selectedBalineseEventIds: ['bali_galungan', 'bali_kuningan', 'bali_pegat_uwakan'],
      },
    })
    expect(updated).not.toBeNull()
    expect(updated?.wasteProfile?.selectedBalineseEventIds).toContain('bali_pegat_uwakan')

    const timetable = listTimetableSlots()
    const opt = computeResidentOptimization(updated!, timetable)
    expect(opt).not.toBeNull()
    expect(opt!.baseWeeklyLiters).toBeGreaterThan(0)
    expect(opt!.totalWeeklyLiters).toBeGreaterThan(opt!.baseWeeklyLiters)
    expect(BALINESE_CALENDAR_EVENTS_2026.length).toBeGreaterThanOrEqual(10)
  })

  it('runs /api/eval system and AI benchmark suite and achieves 100% score on deterministic checks', async () => {
    const req = new Request('http://localhost:3000/api/eval')
    const res = await getEval(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      ok: boolean
      data: {
        summary: { overallScorePct: number; passedChecks: number; totalChecks: number }
        checks: Array<{ id: string; passed: boolean }>
      }
    }
    expect(body.ok).toBe(true)
    expect(body.data.summary.overallScorePct).toBe(100)
    expect(body.data.summary.passedChecks).toBe(body.data.summary.totalChecks)
    expect(body.data.checks.some((c) => c.id === 'eval_b3_isolation' && c.passed)).toBe(true)
    expect(body.data.checks.some((c) => c.id === 'eval_vrp_capacity' && c.passed)).toBe(true)
    expect(body.data.checks.some((c) => c.id === 'eval_bali_calendar_surge' && c.passed)).toBe(true)
    expect(body.data.checks.some((c) => c.id === 'eval_short_note_guardrail' && c.passed)).toBe(true)
  })
})
