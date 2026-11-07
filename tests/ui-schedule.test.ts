import { describe, expect, it } from 'vitest'
import {
  formatScheduleDaysId,
  formatStreamLabelId,
  groupScheduleByStream,
  sourceSortingCards,
} from '@/components/schedule/schedule-helpers'
import type { ScheduleEntry } from '@/lib/schemas'

const sampleEntries: ScheduleEntry[] = [
  {
    kecamatan: 'Denpasar Selatan',
    stream: 'organik',
    accountType: 'household',
    days: ['mon', 'wed', 'fri'],
    window: { start: '06:00', end: '09:00' },
    mode: 'routine',
    basis: { reports: 4, liters: 120 },
    source: 'simulated',
    feasibility: 'unverified_template',
    note: 'policy days, capacity not verified',
  },
  {
    kecamatan: 'Denpasar Selatan',
    stream: 'B3',
    accountType: 'household',
    days: [],
    window: null,
    mode: 'on_request',
    basis: { reports: 1, liters: 15 },
    source: 'simulated',
    feasibility: 'unverified_template',
    note: 'policy days, capacity not verified',
  },
]

describe('schedule UI helpers (R01, R02, O05)', () => {
  it('formats weekday codes into Indonesian day names', () => {
    expect(formatScheduleDaysId(['mon', 'wed', 'fri'])).toBe('Senin, Rabu, Jumat')
    expect(formatScheduleDaysId([])).toBe('Sesuai permintaan (Penanganan khusus DLH)')
  })

  it('formats stream codes into Indonesian display labels', () => {
    expect(formatStreamLabelId('organik')).toContain('Organik')
    expect(formatStreamLabelId('anorganik')).toContain('Anorganik')
    expect(formatStreamLabelId('residu')).toContain('Residu')
    expect(formatStreamLabelId('B3')).toContain('B3')
  })

  it('groups schedule entries across all 4 streams for Resident R02 cards', () => {
    const grouped = groupScheduleByStream(sampleEntries)
    expect(grouped.map((g) => g.stream)).toEqual(['organik', 'anorganik', 'residu', 'B3'])
    expect(grouped.find((g) => g.stream === 'organik')?.totalLiters).toBe(120)
    expect(grouped.find((g) => g.stream === 'anorganik')?.totalLiters).toBe(0)
    expect(grouped.find((g) => g.stream === 'B3')?.mode).toBe('on_request')
  })

  it('builds the 5-to-4 Pergub Bali 47/2019 source sorting cards for R01 Home', () => {
    const cards = sourceSortingCards()
    expect(cards).toHaveLength(5)
    expect(cards.map((c) => c.stream)).toEqual(['organik', 'anorganik', 'anorganik', 'B3', 'residu'])
    expect(cards.every((c) => c.citation === 'Pergub Bali 47/2019 Pasal 6(2)')).toBe(true)
  })
})

