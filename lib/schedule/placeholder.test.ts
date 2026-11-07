import { describe, expect, it } from 'vitest'
import reportsJson from '@/data/reports.json'
import { buildSchedule, scheduleDemand } from '@/lib/schedule'
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
    const total = Math.round(reports.reduce((sum, item) => sum + item.classification.volume.liters, 0) * 100)
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
      note: 'Capacity feasibility was not checked.',
    })
    expect(firm?.window).toEqual({ start: '14:00', end: '17:00' })
    expect(special).toMatchObject({ days: [], window: null, mode: 'on_request', feasibility: 'unverified_template' })
    expect(entries.every((entry) => entry.nextPickup === undefined && entry.unassigned === undefined)).toBe(true)
    expect(buildSchedule([report({ id: 'home' })], { stream: 'organik' })).toEqual([])
  })
})
