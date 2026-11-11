import { describe, expect, it } from 'vitest'
import {
  BALINESE_CALENDAR_EVENTS_2026,
  buildMonthCalendarGrid,
  computeUserOtonanFromBirthDate,
} from '@/lib/calendar/balinese-calendar'
import { getOfficerRoutes } from '@/lib/planner/officer-routes'
import { formatDayDateId, getMonthNameId, getTodayWita } from '@/lib/time'
import { listTimetableSlots } from '@/lib/accounts/store'

describe('Live WITA Calendar Navigation and Dynamic Scheduling', () => {
  it('correctly provides live WITA today string and formatting', () => {
    const today = getTodayWita()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const formatted = formatDayDateId(today)
    expect(formatted).toMatch(/^(Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu), \d{1,2} [A-Z][a-z]+ \d{4}$/)

    expect(getMonthNameId(1)).toBe('Januari')
    expect(getMonthNameId(11)).toBe('November')
    expect(getMonthNameId(12)).toBe('Desember')
  })

  it('builds month calendar grid dynamically for current month, next month, and past month', () => {
    const timetable = listTimetableSlots()

    // Test November 2026
    const novCells = buildMonthCalendarGrid({
      year: 2026,
      month: 11,
      todayDate: '2026-11-11',
      kecamatan: 'Denpasar Barat',
      timetable,
      weeklyRegularLiters: 105,
      selectedBalineseEventIds: ['bali_galungan', 'bali_kuningan'],
    })

    // Nov 2026 starts with 6 lead days + 30 days = 36 days -> needs 42 cells to avoid cutting off Nov 30
    expect(novCells.length).toBe(42)
    const todayCell = novCells.find((c) => c.date === '2026-11-11')
    expect(todayCell).toBeDefined()
    expect(todayCell?.isToday).toBe(true)

    // Test December 2026 navigation
    const decCells = buildMonthCalendarGrid({
      year: 2026,
      month: 12,
      todayDate: '2026-11-11',
      kecamatan: 'Denpasar Barat',
      timetable,
      weeklyRegularLiters: 105,
      selectedBalineseEventIds: ['bali_tilem_kanem', 'bali_purnama_kapitu'],
    })
    expect(decCells.length).toBeGreaterThanOrEqual(35)
    const tilemKanem = decCells.find((c) => c.date === '2026-12-09')
    expect(tilemKanem).toBeDefined()
    expect(tilemKanem?.balineseEvents.some((e) => e.id === 'bali_tilem_kanem')).toBe(true)

    // Test March 2027 (Nyepi & Tawur Kesanga)
    const marCells = buildMonthCalendarGrid({
      year: 2027,
      month: 3,
      todayDate: '2026-11-11',
      kecamatan: 'Denpasar Selatan',
      timetable,
      weeklyRegularLiters: 120,
      selectedBalineseEventIds: ['bali_tawur_kesanga_ogoh', 'bali_nyepi_1949'],
    })
    const nyepiCell = marCells.find((c) => c.date === '2027-03-09')
    expect(nyepiCell).toBeDefined()
    expect(nyepiCell?.balineseEvents.some((e) => e.id === 'bali_nyepi_1949')).toBe(true)
  })

  it('calculates authentic 210-day Pawukon Otonan dynamically for any birth date and reference date', () => {
    // Birth date on Galungan 2026 (2026-11-04 is Buda Kliwon Dungulan)
    const otonan = computeUserOtonanFromBirthDate('2026-11-04', '2026-11-05')
    expect(otonan).not.toBeNull()
    expect(otonan?.wukuName).toBe('Dungulan')
    expect(otonan?.saptawaraName).toBe('Buda (Rabu)')
    expect(otonan?.pancawaraName).toBe('Kliwon')
    // Next Otonan must be exactly 210 days after 2026-11-04 -> 2027-06-02
    expect(otonan?.nextOtonanDate).toBe('2027-06-02')
    expect(otonan?.daysUntilNextOtonan).toBe(209)
  })

  it('generates officer routes dynamically aligned to live today and upcoming days', () => {
    const liveToday = '2026-11-11'
    const routes = getOfficerRoutes(liveToday)
    expect(routes).toHaveLength(3)

    // Route 1 is today
    expect(routes[0].date).toBe('2026-11-11')
    expect(routes[0].isToday).toBe(true)
    expect(routes[0].dayLabel).toContain('11 November 2026')
    expect(routes[0].dayLabel).toContain('(Hari Ini)')

    // Route 2 is today + 2 days
    expect(routes[1].date).toBe('2026-11-13')
    expect(routes[1].isToday).toBe(false)
    expect(routes[1].dayLabel).toContain('13 November 2026')
    expect(routes[1].dayLabel).toContain('(Mendatang)')

    // Route 3 is today + 3 days
    expect(routes[2].date).toBe('2026-11-14')
    expect(routes[2].isToday).toBe(false)
    expect(routes[2].dayLabel).toContain('14 November 2026')
    expect(routes[2].dayLabel).toContain('(Mendatang)')
  })

  it('includes authentic ceremonies across 2026 and 2027 in the database', () => {
    const eventIds = BALINESE_CALENDAR_EVENTS_2026.map((e) => e.id)
    expect(eventIds).toContain('bali_galungan')
    expect(eventIds).toContain('bali_kuningan')
    expect(eventIds).toContain('bali_tilem_kanem')
    expect(eventIds).toContain('bali_siwaratri_tilem_kapitu')
    expect(eventIds).toContain('bali_tawur_kesanga_ogoh')
    expect(eventIds).toContain('bali_nyepi_1949')
    expect(eventIds).toContain('bali_saraswati')
    expect(eventIds).toContain('bali_pagerwesi')
    expect(eventIds).toContain('bali_galungan_2027')
  })
})
