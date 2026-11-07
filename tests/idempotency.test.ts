import { afterEach, describe, expect, it } from 'vitest'
import { canonicalReportBodyHash, idempotencyKeyFrom } from '@/lib/reports/idempotency'
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
    accountType: 'household',
    status: 'new',
  }
}

describe('report idempotency', () => {
  it('prefers the header and otherwise uses clientRequestId', () => {
    expect(idempotencyKeyFrom(' header-key ', 'body-key')).toBe('header-key')
    expect(idempotencyKeyFrom(null, ' body-key ')).toBe('body-key')
    expect(idempotencyKeyFrom('  ', undefined)).toBeNull()
  })

  it('returns the same report id for an identical repeated key', async () => {
    const store = getMemoryStore()
    const first = await store.createReport(report('rpt_first'), { key: 'same-key', bodyHash: 'hash-a' })
    const second = await store.createReport(report('rpt_second'), { key: 'same-key', bodyHash: 'hash-a' })
    expect(first.status).toBe('created')
    expect(second.status).toBe('replay')
    if (second.status !== 'replay') return
    expect(second.report.id).toBe('rpt_first')
    const listed = await store.listReports()
    expect(listed.filter((item) => item.id === 'rpt_first' || item.id === 'rpt_second')).toHaveLength(1)
  })

  it('returns a conflict when the same key is reused with a different body', async () => {
    const store = getMemoryStore()
    const first = await store.createReport(report('rpt_first'), { key: 'same-key', bodyHash: 'hash-a' })
    const second = await store.createReport(report('rpt_second'), { key: 'same-key', bodyHash: 'hash-b' })
    expect(first.status).toBe('created')
    expect(second).toEqual({ status: 'conflict' })
    const listed = await store.listReports()
    expect(listed.some((item) => item.id === 'rpt_second')).toBe(false)
  })

  it('hashes the submitted body and ignores review fields and key order', () => {
    const shared = {
      text: 'A pile of plastic bottles beside the lane',
      lat: -8.65,
      lng: 115.22,
      classification: {
        types: [
          { type: 'organic', share: 0.4 },
          { type: 'plastic', share: 0.6 },
        ],
        volume: { liters: 80, label: 'medium' as const },
        urgency: 'medium' as const,
        confidence: 0.66,
        rationale: 'Demo output.',
        flags: ['no_image', 'contradictory'] as const,
      },
    }
    const reordered = {
      ...shared,
      classification: {
        ...shared.classification,
        types: [...shared.classification.types].reverse(),
        flags: ['contradictory', 'no_image'] as const,
      },
    }
    expect(canonicalReportBodyHash(shared)).toBe(canonicalReportBodyHash(reordered))
    expect(canonicalReportBodyHash({ ...shared, text: 'A different note about the same lane' })).not.toBe(
      canonicalReportBodyHash(shared),
    )
  })
})
