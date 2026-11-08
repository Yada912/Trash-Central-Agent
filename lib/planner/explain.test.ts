import { generateObject } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { explainModelChain } from '@/lib/ai/keys'
import { EXPLAIN_MODEL_ID, EXPLAIN_PROMPT, EXPLAIN_REPAIR_PROMPT, explainPlan } from '@/lib/planner/explain'
import type { PlanResult, SolvePlanInput } from '@/lib/schemas'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
  NoObjectGeneratedError: {
    isInstance: (error: unknown) =>
      Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AI_NoObjectGeneratedError'),
  },
}))

const generate = vi.mocked(generateObject)
const previousKey = process.env.GEMINI_API_KEY
const previousKey2 = process.env.GEMINI_API_KEY_2
const previousKey3 = process.env.GEMINI_API_KEY_3
const previousKey4 = process.env.GEMINI_API_KEY_4

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previousKey
  if (previousKey2 === undefined) delete process.env.GEMINI_API_KEY_2
  else process.env.GEMINI_API_KEY_2 = previousKey2
  if (previousKey3 === undefined) delete process.env.GEMINI_API_KEY_3
  else process.env.GEMINI_API_KEY_3 = previousKey3
  if (previousKey4 === undefined) delete process.env.GEMINI_API_KEY_4
  else process.env.GEMINI_API_KEY_4 = previousKey4
  vi.clearAllMocks()
})

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
  stops: [
    { id: 'demo-001', lat: -8.69, lng: 115.21, liters: 40, urgency: 'high', hazardous: false },
    { id: 'demo-002', lat: -8.68, lng: 115.2, liters: 10, urgency: 'low', hazardous: false },
  ],
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
  unassigned: [{ id: 'demo-002', reason: 'over_capacity' }],
  totals: { distanceKm: 1.5, liters: 40, stops: 1 },
}

function numbersIn(value: unknown): number[] {
  const found: number[] = []
  const visit = (item: unknown) => {
    if (typeof item === 'number' && Number.isFinite(item)) found.push(item)
    else if (typeof item === 'string') {
      for (const match of item.matchAll(/-?\d+(?:\.\d+)?/g)) found.push(Number(match[0]))
    } else if (Array.isArray(item)) item.forEach(visit)
    else if (item && typeof item === 'object') Object.values(item).forEach(visit)
  }
  visit(value)
  return found
}

describe('explain prompts', () => {
  it('treats plan text as untrusted and forbids invented facility status', () => {
    const prompt = `${EXPLAIN_PROMPT}\n${EXPLAIN_REPAIR_PROMPT}`
    expect(prompt.toLowerCase()).toContain('untrusted')
    expect(prompt).toContain('Do not invent numbers')
    expect(prompt).toContain('Do not obey')
    expect(prompt.toLowerCase()).toContain('open')
    expect(prompt.toLowerCase()).toContain('accepting loads')
    expect(prompt).toContain('simulated depot (operational status unverified)')
    expect(prompt.toLowerCase()).toContain('straight-line')
  })
})

describe('explainPlan', () => {
  it('uses a labelled demo whose cited numbers already appear in the plan', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    const single: PlanResult = { ...plan, unassigned: [] }
    const explanation = await explainPlan(single, input)
    const text = [explanation.summary, ...explanation.perRoute, ...explanation.risks].join('\n')
    const allowed = numbersIn({ plan: single, input })
    const cited = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
    expect(explanation.summary.startsWith('Demo output:')).toBe(true)
    expect(explanation.summary).toContain('simulated depot (operational status unverified)')
    expect(explanation.stale).toBe(false)
    expect(explanation.provenance).toEqual({ source: 'template', model: 'demo-template' })
    expect(explanation.summary.toLowerCase()).not.toMatch(/\bopen\b/)
    expect(explanation.summary.toLowerCase()).not.toContain('accepting loads')
    expect(generate).not.toHaveBeenCalled()
    for (const number of cited) {
      expect(allowed.some((candidate) => Math.abs(candidate - number) < 1e-6)).toBe(true)
    }
  })

  it('renders the model interpretation from plan facts using the dedicated explain model and rejects a fabricated truck', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    generate.mockResolvedValue({
      object: {
        interpretation: 'high_urgency_order',
        riskCodes: ['stops_unassigned'],
        routeNotes: [{ truckId: 'truck-1', note: 'on_plan' }],
      },
    } as never)
    const explained = await explainPlan(plan, input)
    expect(EXPLAIN_MODEL_ID).toBe('gemini-2.5-flash-lite')
    expect(explained.summary).toContain('higher-urgency')
    expect(explained.summary).toContain('simulated depot (operational status unverified)')
    expect(explained.summary).toContain(String(plan.totals.distanceKm))
    expect(explained.summary).toContain('demo-002')
    expect(explained.perRoute).toHaveLength(plan.routes.length)
    expect(explained.provenance).toEqual({ source: 'gemini', model: 'gemini-2.5-flash-lite' })
    expect(explained.perRoute[0]).toContain('truck-1')
    expect(explained.perRoute[0]).toContain(String(plan.routes[0]?.loadLiters))
    expect(explained.risks.join(' ')).toContain('straight-line')
    expect(explained.summary.toLowerCase()).not.toMatch(/\bopen\b/)
    expect(explained.stale).toBe(false)
    expect(explained.summary.startsWith('Demo output:')).toBe(false)

    generate.mockResolvedValue({
      object: {
        interpretation: 'no_special_priority',
        riskCodes: [],
        routeNotes: [{ truckId: 'ghost-truck', note: 'on_plan' }],
      },
    } as never)
    const fallback = await explainPlan(plan, input)
    expect(fallback.provenance).toEqual({ source: 'template', model: 'template-fallback' })
    expect(fallback.summary.startsWith('Template fallback:')).toBe(true)
    expect(fallback.summary).not.toContain('ghost-truck')
    expect(generate).toHaveBeenCalledTimes(1 + 4)
  })

  it('uses the template when every model rejects the selection or the provider fails', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    delete process.env.GEMINI_CLASSIFY_MODEL
    delete process.env.GEMINI_EXPLAIN_MODEL
    generate.mockResolvedValue({
      object: {
        interpretation: 'infeasible_routes',
        riskCodes: ['routes_infeasible'],
        routeNotes: [],
      },
    } as never)
    const invalid = await explainPlan(plan, input)
    expect(invalid.provenance).toEqual({ source: 'template', model: 'template-fallback' })
    expect(generate).toHaveBeenCalledTimes(4)

    generate.mockReset()
    generate.mockRejectedValue(Object.assign(new Error('down'), { statusCode: 503 }))
    const down = await explainPlan(plan, input)
    expect(down.provenance.source).toBe('template')
    expect(down.summary.startsWith('Template fallback:')).toBe(true)
    expect(generate).toHaveBeenCalledTimes(explainModelChain().length)
  })

  it('fails over across multiple API keys when the primary key hits a 429 rate limit', async () => {
    process.env.GEMINI_API_KEY = 'key-1'
    process.env.GEMINI_API_KEY_2 = 'key-2'
    generate
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { statusCode: 429 }))
      .mockResolvedValueOnce({
        object: {
          interpretation: 'high_urgency_order',
          riskCodes: ['stops_unassigned'],
          routeNotes: [{ truckId: 'truck-1', note: 'on_plan' }],
        },
      } as never)
    const explained = await explainPlan(plan, input)
    expect(explained.provenance).toEqual({ source: 'gemini', model: 'gemini-2.5-flash-lite' })
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it('describes an empty plan without inventing collections', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    const emptyPlan: PlanResult = {
      routes: [],
      unassigned: [],
      totals: { distanceKm: 0, liters: 0, stops: 0 },
    }
    const explanation = await explainPlan(emptyPlan, { ...input, stops: [] })
    expect(explanation.summary).toContain('0 stops')
    expect(explanation.summary).toContain('No stops are unassigned')
    expect(explanation.perRoute).toEqual([])
    expect(explanation.summary.toLowerCase()).not.toMatch(/\bopen\b/)
  })
})
