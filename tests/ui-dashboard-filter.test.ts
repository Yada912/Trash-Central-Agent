import { describe, expect, it } from 'vitest'
import { filterDashboard } from '@/components/dashboard/filter-reports'
import type { Facility, Report } from '@/lib/schemas'

function report(overrides: Partial<Report> & Pick<Report, 'id' | 'lat' | 'lng' | 'kecamatan'>): Report {
  return {
    isDemo: true,
    createdAt: '2026-11-01T08:00:00+08:00',
    description: 'Fixture pile',
    classification: {
      types: [{ type: 'plastic', share: 1 }],
      volume: { liters: 100, label: 'medium' },
      urgency: 'medium',
      confidence: 0.8,
      rationale: 'Fixture',
      flags: ['no_image'],
      needsReview: false,
      reviewReasons: [],
      source: 'mock',
    },
    edited: false,
    accountType: 'household',
    status: 'new',
    ...overrides,
  }
}

const facilities: Facility[] = []

const ordinaryQuiet = report({ id: 'quiet', lat: -8.651, lng: 115.22, kecamatan: 'Denpasar Barat' })
const ordinaryReview = report({
  id: 'review',
  lat: -8.652,
  lng: 115.221,
  kecamatan: 'Denpasar Barat',
  classification: {
    types: [{ type: 'organic', share: 1 }],
    volume: { liters: 40, label: 'small' },
    urgency: 'low',
    confidence: 0.42,
    rationale: 'Fixture',
    flags: ['no_image'],
    needsReview: true,
    reviewReasons: ['low_confidence'],
    source: 'mock',
  },
})
const hazardousReview = report({
  id: 'hazard',
  lat: -8.6,
  lng: 115.25,
  kecamatan: 'Denpasar Timur',
  classification: {
    types: [{ type: 'plastic', share: 1 }],
    volume: { liters: 10, label: 'small' },
    urgency: 'high',
    confidence: 0.9,
    rationale: 'Fixture',
    flags: ['hazardous_present'],
    needsReview: true,
    reviewReasons: ['hazardous'],
    source: 'mock',
  },
})

const reports = [ordinaryQuiet, ordinaryReview, hazardousReview]

describe('dashboard filters', () => {
  it('counts every loaded report when no filter is set', () => {
    const view = filterDashboard(reports, facilities, { kecamatan: '', status: '', since: '', needsReviewOnly: false })
    expect(view.reportedLiters).toBe(150)
    expect(view.ordinary.map((item) => item.id)).toEqual(['quiet', 'review'])
    expect(view.hazardous.map((item) => item.id)).toEqual(['hazard'])
    expect(view.aggregate.totals.byType.plastic).toBe(110)
    expect(view.aggregate.totals.byType.organic).toBe(40)
    expect(view.aggregate.zones.some((zone) => zone.reportIds.includes('quiet') && zone.reportIds.includes('review'))).toBe(true)
    expect(view.aggregate.zones.some((zone) => zone.reportIds.includes('hazard'))).toBe(false)
  })

  it('applies needs-review to lists, litres, kecamatan totals, and map clusters together', () => {
    const unfiltered = filterDashboard(reports, facilities, { kecamatan: '', status: '', since: '', needsReviewOnly: false })
    const view = filterDashboard(reports, facilities, { kecamatan: '', status: '', since: '', needsReviewOnly: true })
    expect(view.reportedLiters).toBe(50)
    expect(view.ordinary.map((item) => item.id)).toEqual(['review'])
    expect(view.hazardous.map((item) => item.id)).toEqual(['hazard'])
    expect(view.aggregate.totals.byType.plastic).toBe(10)
    expect(view.aggregate.totals.byType.organic).toBe(40)
    expect(view.aggregate.totals.byKecamatan['Denpasar Barat']).toEqual({ reports: 1, liters: 40 })
    expect(view.aggregate.totals.byKecamatan['Denpasar Barat']).not.toEqual(unfiltered.aggregate.totals.byKecamatan['Denpasar Barat'])
    expect(view.aggregate.totals.byUrgency).toEqual({ low: 1, medium: 0, high: 1 })
    expect(view.aggregate.zones.flatMap((zone) => zone.reportIds)).toEqual(['review'])
    expect(view.aggregate.zones).not.toEqual(unfiltered.aggregate.zones)
    expect(view.aggregate.zones[0]?.liters).toBe(40)
  })

  it('applies kecamatan to hazardous rows and totals, not only the ordinary list', () => {
    const view = filterDashboard(reports, facilities, {
      kecamatan: 'Denpasar Timur',
      status: '',
      since: '',
      needsReviewOnly: false,
    })
    expect(view.ordinary).toEqual([])
    expect(view.hazardous.map((item) => item.id)).toEqual(['hazard'])
    expect(view.reportedLiters).toBe(10)
    expect(view.aggregate.zones).toEqual([])
    expect(view.aggregate.totals.byKecamatan['Denpasar Barat'].reports).toBe(0)
  })

  it('applies status and since to the same set', () => {
    const planned = report({
      id: 'planned',
      lat: -8.67,
      lng: 115.2,
      kecamatan: 'Denpasar Selatan',
      status: 'planned',
      createdAt: '2026-11-06T08:00:00+08:00',
    })
    const view = filterDashboard([ordinaryQuiet, planned], facilities, {
      kecamatan: '',
      status: 'planned',
      since: '2026-11-05',
      needsReviewOnly: false,
    })
    expect(view.visible.map((item) => item.id)).toEqual(['planned'])
    expect(view.reportedLiters).toBe(100)
  })

  it('keeps a 0.01 hazardous share out of ordinary clusters and lists', () => {
    const trace = report({
      id: 'trace',
      lat: -8.651,
      lng: 115.22,
      kecamatan: 'Denpasar Barat',
      classification: {
        types: [
          { type: 'plastic', share: 0.99 },
          { type: 'hazardous', share: 0.01 },
        ],
        volume: { liters: 100, label: 'medium' },
        urgency: 'low',
        confidence: 0.9,
        rationale: 'Fixture',
        flags: ['no_image'],
        needsReview: false,
        reviewReasons: [],
        source: 'mock',
      },
    })
    const view = filterDashboard([ordinaryQuiet, trace], facilities, { kecamatan: '', status: '', since: '', needsReviewOnly: false })
    expect(view.hazardous.map((item) => item.id)).toEqual(['trace'])
    expect(view.ordinary.map((item) => item.id)).toEqual(['quiet'])
    expect(view.aggregate.zones.flatMap((zone) => zone.reportIds)).not.toContain('trace')
    expect(view.aggregate.zones.flatMap((zone) => zone.reportIds)).toContain('quiet')
  })
})
