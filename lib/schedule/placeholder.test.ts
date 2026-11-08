import { describe, expect, it, vi } from 'vitest'
import reportsJson from '@/data/reports.json'
import { buildSchedule, demoCheckedAvailability, scheduleDemand } from '@/lib/schedule'
import { streamOf, type Report } from '@/lib/schemas'
import { mapSeedReport, type SeedReport } from '@/lib/store/map-seed'

function cents(rows: Array<{ liters: number }>): number {
  return rows.reduce((sum, row) => sum + Math.round(row.liters * 100), 0)
}

function report(overrides: Partial<Report> & Pick<Report, 'id'>): Report {
  return {
    isDemo: true,
    createdAt: '2026-11-07T14:00:00+08:00',
    lat: -8.65,
    lng: 115.22,
    kecamatan: 'Denpasar Selatan',
    description: 'A pile of plastic bottles beside the lane',
    classification: {
      types: [{ type: 'plastic', share: 1 }],
      volume: { liters: 100, label: 'medium' },
      urgency: 'medium',
      confidence: 0.8,
      rationale: 'Fixture.',
      flags: [],
      needsReview: false,
      reviewReasons: [],
      source: 'manual',
    },
    edited: false,
    accountType: 'household',
    status: 'new',
    ...overrides,
  }
}

describe('streamOf', () => {
  it('maps each trash type onto one stream', () => {
    expect(streamOf('organic')).toBe('organik')
    expect(streamOf('plastic')).toBe('anorganik')
    expect(streamOf('paper')).toBe('anorganik')
    expect(streamOf('metal')).toBe('anorganik')
    expect(streamOf('residual')).toBe('residu')
    expect(streamOf('hazardous')).toBe('B3')
  })
})

describe('scheduleDemand', () => {
  it('sends every litre of a hazardous report to B3', () => {
    const mixed = report({
      id: 'haz-share',
      classification: {
        types: [
          { type: 'organic', share: 0.99 },
          { type: 'hazardous', share: 0.01 },
        ],
        volume: { liters: 80, label: 'medium' },
        urgency: 'high',
        confidence: 0.8,
        rationale: 'Batteries in the pile.',
        flags: ['hazardous_present'],
        needsReview: true,
        reviewReasons: ['hazardous'],
        source: 'manual',
      },
    })
    const flagged = report({
      id: 'haz-flag',
      accountType: 'company',
      classification: {
        ...mixed.classification,
        types: [{ type: 'plastic', share: 1 }],
        volume: { liters: 40, label: 'small' },
        flags: ['hazardous_present'],
      },
    })
    const demand = scheduleDemand([mixed, flagged])
    expect(demand.every((cell) => cell.stream === 'B3')).toBe(true)
    expect(demand.find((cell) => cell.accountType === 'household')?.liters).toBe(80)
    expect(demand.find((cell) => cell.accountType === 'company')?.liters).toBe(40)
    expect(demand.reduce((total, cell) => total + cell.liters, 0)).toBe(120)
  })

  it('splits a non-hazardous report by share and conserves litres', () => {
    const ordinary = report({
      id: 'split',
      classification: {
        types: [
          { type: 'organic', share: 0.5 },
          { type: 'plastic', share: 0.3 },
          { type: 'residual', share: 0.2 },
        ],
        volume: { liters: 100, label: 'medium' },
        urgency: 'low',
        confidence: 0.8,
        rationale: 'Mixed household waste.',
        flags: [],
        needsReview: false,
        reviewReasons: [],
        source: 'manual',
      },
    })
    const company = report({
      id: 'company-plastic',
      accountType: 'company',
      kecamatan: 'Denpasar Barat',
      classification: {
        ...ordinary.classification,
        types: [{ type: 'paper', share: 1 }],
        volume: { liters: 25, label: 'small' },
      },
    })
    const hazardous = report({
      id: 'b3',
      classification: {
        ...ordinary.classification,
        types: [
          { type: 'residual', share: 0.6 },
          { type: 'hazardous', share: 0.4 },
        ],
        volume: { liters: 50, label: 'medium' },
        flags: ['hazardous_present'],
        needsReview: true,
        reviewReasons: ['hazardous'],
      },
    })
    const reports = [ordinary, company, hazardous]
    const demand = scheduleDemand(reports)
    expect(demand.find((cell) => cell.stream === 'organik')?.liters).toBe(50)
    expect(demand.find((cell) => cell.stream === 'anorganik' && cell.accountType === 'household')?.liters).toBe(30)
    expect(demand.find((cell) => cell.stream === 'residu')?.liters).toBe(20)
    expect(demand.find((cell) => cell.stream === 'B3')?.liters).toBe(50)
    expect(demand.find((cell) => cell.accountType === 'company')?.liters).toBe(25)
    const total = reports.reduce((sum, item) => sum + item.classification.volume.liters, 0)
    expect(cents(demand)).toBe(Math.round(total * 100))
  })

  it('conserves litres across the seeded reports', () => {
    const reports = (reportsJson as SeedReport[]).map((item) => mapSeedReport(item))
    const pending = reports.filter((item) => item.status !== 'collected')
    const total = Math.round(pending.reduce((sum, item) => sum + item.classification.volume.liters, 0) * 100)
    expect(cents(scheduleDemand(reports))).toBe(total)
    expect(cents(buildSchedule(reports).map((entry) => entry.basis))).toBe(total)
  })
})

describe('buildSchedule placeholder', () => {
  it('uses the fixed template and leaves nextPickup unset', () => {
    const entries = buildSchedule([
      report({ id: 'home' }),
      report({ id: 'firm', accountType: 'company', kecamatan: 'Denpasar Selatan' }),
      report({
        id: 'b3',
        classification: {
          types: [{ type: 'hazardous', share: 1 }],
          volume: { liters: 10, label: 'small' },
          urgency: 'high',
          confidence: 0.9,
          rationale: 'Batteries.',
          flags: ['hazardous_present'],
          needsReview: true,
          reviewReasons: ['hazardous'],
          source: 'manual',
        },
      }),
    ])
    const home = entries.find((entry) => entry.accountType === 'household' && entry.stream === 'anorganik')
    const firm = entries.find((entry) => entry.accountType === 'company' && entry.stream === 'anorganik')
    const special = entries.find((entry) => entry.stream === 'B3')
    expect(home).toMatchObject({
      days: ['tue', 'sat'],
      window: { start: '06:00', end: '09:00' },
      mode: 'routine',
      source: 'simulated',
      feasibility: 'unverified_template',
      note: 'policy days, capacity not verified',
    })
    expect(firm?.window).toEqual({ start: '14:00', end: '17:00' })
    expect(special).toMatchObject({ days: [], window: null, mode: 'on_request', feasibility: 'unverified_template' })
    expect(entries.every((entry) => entry.nextPickup === undefined && entry.unassigned === undefined)).toBe(true)
    expect(buildSchedule([report({ id: 'home' })], { stream: 'organik' })).toEqual([])
  })

  it('keeps the policy template when no availability is supplied', () => {
    const entries = buildSchedule([report({ id: 'home' })])
    expect(entries).toHaveLength(1)
    expect(entries[0]?.feasibility).toBe('unverified_template')
    expect(entries[0]?.days).toEqual(['tue', 'sat'])
    expect(entries[0]?.nextPickup).toBeUndefined()
    expect(entries[0]?.note).toBe('policy days, capacity not verified')
    expect(entries[0]?.window).toEqual({ start: '06:00', end: '09:00' })
  })

  it('uses dated solver runs only when availability is supplied', () => {
    const weekStart = '2026-11-02'
    const ordinary = report({
      id: 'organik',
      kecamatan: 'Denpasar Barat',
      classification: {
        types: [{ type: 'organic', share: 1 }],
        volume: { liters: 90, label: 'medium' },
        urgency: 'low',
        confidence: 0.8,
        rationale: 'Food scraps.',
        flags: [],
        needsReview: false,
        reviewReasons: [],
        source: 'manual',
      },
    })
    const hazardous = report({
      id: 'b3',
      kecamatan: 'Denpasar Barat',
      classification: {
        types: [{ type: 'hazardous', share: 1 }],
        volume: { liters: 10, label: 'small' },
        urgency: 'high',
        confidence: 0.9,
        rationale: 'Batteries.',
        flags: ['hazardous_present'],
        needsReview: true,
        reviewReasons: ['hazardous'],
        source: 'manual',
      },
    })
    const slots = [0, 1, 2, 3, 4, 5].map((day) => {
      const date = new Date(Date.UTC(2026, 10, 2 + day)).toISOString().slice(0, 10)
      return { truckId: 't1', date, dayIndex: day, start: '06:00', end: '09:00', accountType: 'household' as const }
    })
    const entries = buildSchedule([ordinary, hazardous], {
      availability: { trucks: [{ id: 't1', capacityLiters: 1000 }], slots },
      weekStart,
      asOf: '2026-11-05T12:00+08:00',
    })
    const organik = entries.find((entry) => entry.stream === 'organik')
    const special = entries.find((entry) => entry.stream === 'B3')
    expect(organik).toMatchObject({
      feasibility: 'solver_checked',
      mode: 'routine',
      days: ['mon', 'wed', 'fri'],
      window: { start: '06:00', end: '09:00' },
      nextPickup: '2026-11-06',
      basis: { reports: 1, liters: 90 },
    })
    expect(organik?.unassigned).toBeUndefined()
    expect(special).toMatchObject({
      feasibility: 'solver_checked',
      mode: 'on_request',
      days: [],
      window: null,
      unassigned: { liters: 10, reason: 'b3_separate_dlh_demo' },
    })
    expect(special?.nextPickup).toBeUndefined()
    expect(entries.reduce((sum, entry) => sum + entry.basis.liters, 0)).toBe(100)
  })

  it('keeps an in-progress window and drops one that has already ended', () => {
    const ordinary = report({
      id: 'organik',
      kecamatan: 'Denpasar Barat',
      classification: {
        types: [{ type: 'organic', share: 1 }],
        volume: { liters: 90, label: 'medium' },
        urgency: 'low',
        confidence: 0.8,
        rationale: 'Food scraps.',
        flags: [],
        needsReview: false,
        reviewReasons: [],
        source: 'manual',
      },
    })
    const availability = {
      trucks: [{ id: 't1', capacityLiters: 1000 }],
      slots: [
        { truckId: 't1', date: '2026-11-02', start: '06:00', end: '09:00', accountType: 'household' as const },
        { truckId: 't1', date: '2026-11-04', start: '06:00', end: '09:00', accountType: 'household' as const },
        { truckId: 't1', date: '2026-11-06', start: '06:00', end: '09:00', accountType: 'household' as const },
      ],
    }
    const during = buildSchedule([ordinary], {
      availability,
      weekStart: '2026-11-02',
      asOf: '2026-11-02T08:00:00+08:00',
    })
    const after = buildSchedule([ordinary], {
      availability,
      weekStart: '2026-11-02',
      asOf: '2026-11-02T09:00:00+08:00',
    })
    expect(during[0]?.nextPickup).toBe('2026-11-02')
    expect(during[0]?.basis.liters).toBe(90)
    expect(after[0]?.nextPickup).toBe('2026-11-04')
  })

  it('uses the current WITA time for next pickup and keeps Monday as the week anchor', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T02:00:00.000Z'))
    try {
      const ordinary = report({
        id: 'organik-now',
        kecamatan: 'Denpasar Barat',
        classification: {
          types: [{ type: 'organic', share: 1 }],
          volume: { liters: 90, label: 'medium' },
          urgency: 'low',
          confidence: 0.8,
          rationale: 'Food scraps.',
          flags: [],
          needsReview: false,
          reviewReasons: [],
          source: 'manual',
        },
      })
      const entries = buildSchedule([ordinary], {
        availability: demoCheckedAvailability('2026-11-02'),
        weekStart: '2026-11-02',
      })
      expect(entries.find((entry) => entry.stream === 'organik')?.nextPickup).toBe('2026-11-06')
    } finally {
      vi.useRealTimers()
    }
  })
})
