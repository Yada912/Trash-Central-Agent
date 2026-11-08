import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { GET as getSchedule } from '@/app/api/schedule/route'
import { POST as createReport } from '@/app/api/reports/route'
import { SCHEDULE_DISCLAIMER, SCHEDULE_GENERATED_FROM } from '@/lib/schedule'
import type { Report, ScheduleResponse } from '@/lib/schemas'
import { resetMemoryStoreForTests } from '@/lib/store/memory'

afterEach(() => {
  resetMemoryStoreForTests()
})

const classification = {
  types: [{ type: 'plastic' as const, share: 1 }],
  volume: { liters: 40, label: 'small' as const },
  urgency: 'medium' as const,
  confidence: 0.9,
  rationale: 'Checked by the resident.',
  flags: [] as const,
  needsReview: false,
  reviewReasons: [] as const,
  source: 'manual' as const,
}

describe('GET /api/schedule', () => {
  it('returns the simulated schedule envelope and rejects an unknown filter', async () => {
    resetMemoryStoreForTests()
    const response = await getSchedule(new Request('http://localhost/api/schedule'))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: ScheduleResponse; meta: { mode: string; requestId: string } }
    expect(body.meta.mode).toBe('demo')
    expect(body.meta.requestId).toBeTruthy()
    expect(body.data.generatedFrom).toBe(SCHEDULE_GENERATED_FROM)
    expect(body.data.generatedFrom).toContain('not a forecast')
    expect(body.data.disclaimer).toBe(SCHEDULE_DISCLAIMER)
    expect(body.data.disclaimer).toBe('Simulated demo schedule derived from reports; not an official DLH Denpasar schedule.')
    expect(body.data.entries.length).toBeGreaterThan(0)
    expect(body.data.entries.every((entry) => entry.feasibility === 'unverified_template' && entry.source === 'simulated')).toBe(true)

    const filtered = await getSchedule(new Request('http://localhost/api/schedule?kecamatan=Denpasar+Selatan&stream=B3&accountType=household'))
    const filteredBody = (await filtered.json()) as { data: ScheduleResponse }
    expect(filteredBody.data.entries.every((entry) => entry.kecamatan === 'Denpasar Selatan' && entry.stream === 'B3' && entry.accountType === 'household')).toBe(true)

    const unknown = await getSchedule(new Request('http://localhost/api/schedule?stream=glass'))
    expect(unknown.status).toBe(400)
    const error = (await unknown.json()) as { error: { code: string; fields?: Record<string, string[]> } }
    expect(error.error.code).toBe('VALIDATION')
    expect(error.error.fields?.stream?.[0]).toMatch(/Unknown stream/)
  })

  it('does not treat Monday 08:00 as now when the checked week is already underway', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T14:40:00.000Z'))
    try {
      const response = await getSchedule(
        new Request('http://localhost/api/schedule?availability=checked&weekStart=2026-11-02'),
      )
      expect(response.status).toBe(200)
      const body = (await response.json()) as { data: ScheduleResponse }
      expect(body.data.entries.some((entry) => entry.nextPickup === '2026-11-02')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stores an optional accountType and defaults the rest to household', async () => {
    resetMemoryStoreForTests()
    const company = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'A pile of plastic bottles beside the lane',
          lat: -8.65,
          lng: 115.22,
          classification,
          accountType: 'company',
        }),
      }),
    )
    expect(company.status).toBe(201)
    const companyBody = (await company.json()) as { data: Report }
    expect(companyBody.data.accountType).toBe('company')
    expect(companyBody.data.isDemo).toBe(true)

    const household = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'A pile of plastic bottles beside the lane',
          lat: -8.65,
          lng: 115.22,
          classification,
        }),
      }),
    )
    const householdBody = (await household.json()) as { data: Report }
    expect(householdBody.data.accountType).toBe('household')

    const invalid = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: 'A pile of plastic bottles beside the lane',
          lat: -8.65,
          lng: 115.22,
          classification,
          accountType: 'office',
        }),
      }),
    )
    expect(invalid.status).toBe(400)
  })
})
