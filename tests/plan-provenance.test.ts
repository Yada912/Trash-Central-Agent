import { describe, expect, it } from 'vitest'
import { jsonOk } from '@/lib/api/respond'
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
