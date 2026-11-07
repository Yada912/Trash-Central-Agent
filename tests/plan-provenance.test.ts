import { describe, expect, it } from 'vitest'
import { jsonOk } from '@/lib/api/respond'
import { buildSchedule } from '@/lib/schedule'
import { getMemoryStore, resetMemoryStoreForTests } from '@/lib/store/memory'
import type { Plan } from '@/lib/schemas'

const plan: Plan = {
  id: 'plan_reload',
  status: 'proposed',
  version: 1,
  input: {
    trucks: [{ id: 'truck-1', capacityLiters: 1000 }],
    crews: 1,
    shift: { start: '06:00', end: '16:00' },
    reportIds: [],
  },
  result: { routes: [], unassigned: [], totals: { distanceKm: 0, liters: 0, stops: 0 } },
  explanation: {
    summary: 'Demo output: stored',
    perRoute: [],
    risks: [],
    stale: false,
    provenance: { source: 'template', model: 'demo-template' },
  },
  decisions: [],
}

describe('plan explanation provenance', () => {
  it('keeps source and model on the stored plan', async () => {
    resetMemoryStoreForTests()
    const store = getMemoryStore()
    await store.savePlan(plan)
    const loaded = await store.getPlan(plan.id)
    expect(loaded?.explanation.provenance).toEqual({ source: 'template', model: 'demo-template' })
  })

  it('keeps decisions and route assignments beside the reports the schedule reads', async () => {
    resetMemoryStoreForTests()
    const store = getMemoryStore()
    const assigned: Plan = {
      ...plan,
      id: 'plan_assigned',
      result: {
        routes: [
          {
            truckId: 'truck-1',
            stopIds: ['demo-001'],
            loadLiters: 10,
            capacityLiters: 1000,
            distanceKm: 1,
            durationMin: 10,
            feasible: true,
            violations: [],
            polyline: [[-8.67, 115.21]],
          },
        ],
        unassigned: [],
        totals: { distanceKm: 1, liters: 10, stops: 1 },
      },
      decisions: [
        {
          action: 'approve',
          at: '2026-11-07T14:00:00+08:00',
          version: 1,
          actor: 'demo-officer',
          fromStatus: 'proposed',
          toStatus: 'approved',
          fromVersion: 1,
          toVersion: 1,
        },
      ],
    }
    await store.savePlan(assigned)
    const loaded = await store.getPlan(assigned.id)
    expect(loaded?.decisions).toEqual(assigned.decisions)
    expect(loaded?.result.routes[0]?.stopIds).toEqual(['demo-001'])
    const schedule = buildSchedule(await store.listReports())
    expect(schedule.length).toBeGreaterThan(0)
    expect(schedule.every((entry) => entry.source === 'simulated')).toBe(true)
  })

  it('puts mode and the stored model on a plan response', async () => {
    const previous = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    const response = jsonOk('req-plan-1', plan, { model: plan.explanation.provenance.model })
    const body = (await response.json()) as { meta: { mode: string; model: string; requestId: string } }
    expect(body.meta.mode).toBe('demo')
    expect(body.meta.model).toBe('demo-template')
    expect(body.meta.requestId).toBe('req-plan-1')
    if (previous === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = previous
  })
})
