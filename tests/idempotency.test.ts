import { afterEach, describe, expect, it } from 'vitest'
import { idempotencyKeyFrom } from '@/lib/reports/idempotency'
import { getMemoryStore, resetMemoryStoreForTests } from '@/lib/store/memory'
import type { Report } from '@/lib/schemas'

afterEach(() => {
  resetMemoryStoreForTests()
})

function report(id: string): Report {
  return {
    id,
    isDemo: true,
    createdAt: '2026-11-07T14:00:00+08:00',
    lat: -8.65,
    lng: 115.22,
    kecamatan: 'Denpasar Selatan',
    description: 'A pile of plastic bottles beside the lane',
    classification: {
      types: [{ type: 'plastic', share: 1 }],
      volume: { liters: 80, label: 'medium' },
      urgency: 'medium',
      confidence: 0.66,
      rationale: 'Demo output.',
      flags: [],
      needsReview: false,
      reviewReasons: [],
      source: 'mock',
    },
    edited: false,
    status: 'new',
  }
}

describe('report idempotency', () => {
  it('prefers the header and otherwise uses clientRequestId', () => {
    expect(idempotencyKeyFrom(' header-key ', 'body-key')).toBe('header-key')
    expect(idempotencyKeyFrom(null, ' body-key ')).toBe('body-key')
    expect(idempotencyKeyFrom('  ', undefined)).toBeNull()
  })

  it('returns the same report id for a repeated key', async () => {
    const store = getMemoryStore()
    const first = await store.createReport(report('rpt_first'), 'same-key')
    const second = await store.createReport(report('rpt_second'), 'same-key')
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.report.id).toBe('rpt_first')
    const listed = await store.listReports()
    expect(listed.filter((item) => item.id === 'rpt_first' || item.id === 'rpt_second')).toHaveLength(1)
  })
})
