import { afterEach, describe, expect, it } from 'vitest'
import { EXPLAIN_PROMPT, explainPlan } from '@/lib/planner/explain'
import type { PlanResult, SolvePlanInput } from '@/lib/schemas'

const previous = process.env.GEMINI_API_KEY

afterEach(() => {
  if (previous === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previous
})

function collect(value: unknown, into: number[]): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    into.push(value)
    return
  }
  if (typeof value === 'string') {
    for (const match of value.matchAll(/-?\d+(?:\.\d+)?/g)) into.push(Number(match[0]))
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, into)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collect(item, into)
  }
}

describe('placeholder explanation', () => {
  it('uses a labelled mock whose numbers already appear in the plan', async () => {
    delete process.env.GEMINI_API_KEY
    const input: SolvePlanInput = {
      depot: {
        lat: -8.7,
        lng: 115.22,
        name: 'TPA Suwung',
        label: 'simulated depot (operational status unverified)',
      },
      trucks: [{ id: 'truck-1', capacityLiters: 100 }],
      crews: 1,
      shift: { start: '06:00', end: '16:00' },
      stops: [{ id: 'demo-001', lat: -8.69, lng: 115.21, liters: 40, urgency: 'high', hazardous: false }],
    }
    const plan: PlanResult = {
      routes: [
        {
          truckId: 'truck-1',
          stopIds: ['demo-001'],
          loadLiters: 40,
          capacityLiters: 100,
          distanceKm: 1.5,
          durationMin: 12,
          feasible: true,
          violations: [],
          polyline: [
            [-8.7, 115.22],
            [-8.69, 115.21],
          ],
        },
      ],
      unassigned: [],
      totals: { distanceKm: 1.5, liters: 40, stops: 1 },
    }
    const explanation = await explainPlan(plan, input)
    const text = [explanation.summary, ...explanation.perRoute, ...explanation.risks].join('\n')
    const allowed: number[] = []
    collect(plan, allowed)
    collect(input, allowed)
    const cited = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
    expect(explanation.summary.startsWith('Demo output:')).toBe(true)
    expect(explanation.summary).toContain('simulated depot (operational status unverified)')
    expect(explanation.stale).toBe(false)
    expect(EXPLAIN_PROMPT.length).toBeGreaterThan(20)
    for (const number of cited) {
      expect(allowed.some((candidate) => Math.abs(candidate - number) < 1e-6)).toBe(true)
    }
  })
})
