import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { GET as getDashboard } from '@/app/api/dashboard/route'
import { POST as createPlan } from '@/app/api/plans/route'
import { POST as createReport } from '@/app/api/reports/route'
import { isHazardousClassification, type Classification, type Dashboard, type Plan, type Report } from '@/lib/schemas'
import { resetMemoryStoreForTests } from '@/lib/store/memory'

afterEach(() => {
  resetMemoryStoreForTests()
  delete process.env.GEMINI_API_KEY
})

function classification(overrides: Partial<Classification>): Classification {
  return {
    types: [{ type: 'plastic', share: 1 }],
    volume: { liters: 40, label: 'small' },
    urgency: 'medium',
    confidence: 0.9,
    rationale: 'Checked by the resident.',
    flags: [],
    needsReview: false,
    reviewReasons: [],
    source: 'manual',
    ...overrides,
  }
}

const aiClassification = classification({
  types: [
    { type: 'residual', share: 0.6 },
    { type: 'hazardous', share: 0.4 },
  ],
  urgency: 'high',
  confidence: 0.8,
  rationale: 'Model output: batteries in the pile.',
  flags: ['hazardous_present'],
  needsReview: true,
  reviewReasons: ['hazardous'],
  source: 'mock',
})

describe('POST /api/reports hazard cleared by the resident', () => {
  it('keeps the AI classification, marks review, and routes the report', async () => {
    resetMemoryStoreForTests()
    delete process.env.GEMINI_API_KEY
    const before = await getDashboard(new Request('http://localhost/api/dashboard'))
    const beforeBody = (await before.json()) as { data: Dashboard }
    const response = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'hazard-cleared-1' },
        body: JSON.stringify({
          text: 'A pile of plastic bottles beside the lane',
          lat: -8.65,
          lng: 115.22,
          clientRequestId: 'hazard-cleared-1',
          classification: classification({}),
          aiClassification,
        }),
      }),
    )
    expect(response.status).toBe(201)
    const body = (await response.json()) as { data: Report }
    const saved = body.data
    expect(saved.classification.reviewReasons).toContain('hazard_cleared_by_resident')
    expect(saved.classification.needsReview).toBe(true)
    expect(saved.classification.flags).not.toContain('hazardous_present')
    expect(isHazardousClassification(saved.classification)).toBe(false)
    expect(saved.aiClassification).toEqual(aiClassification)
    expect(saved.edited).toBe(true)

    const dashboard = await getDashboard(new Request('http://localhost/api/dashboard'))
    const dashboardBody = (await dashboard.json()) as { data: Dashboard }
    expect(dashboardBody.data.zones.some((zone) => zone.reportIds.includes(saved.id))).toBe(true)
    expect(dashboardBody.data.totals.byType.plastic).toBeGreaterThan(beforeBody.data.totals.byType.plastic)

    const planResponse = await createPlan(
      new Request('http://localhost/api/plans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trucks: [{ id: 'truck-1', capacityLiters: 1000 }],
          crews: 1,
          shift: { start: '06:00', end: '16:00' },
          reportIds: [saved.id],
        }),
      }),
    )
    expect(planResponse.status).toBe(201)
    const planBody = (await planResponse.json()) as { data: Plan }
    expect(planBody.data.result.routes.some((route) => route.stopIds.includes(saved.id))).toBe(true)
    expect(planBody.data.result.unassigned.some((item) => item.id === saved.id)).toBe(false)
  })
})
