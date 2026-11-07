import { describe, expect, it } from 'vitest'
import { applyDecision } from '@/lib/plans/apply-decision'
import type { Plan, SolvePlanInput } from '@/lib/schemas'

const NOW = '2026-11-07T14:05:00+08:00'

const input: SolvePlanInput = {
  depot: {
    lat: -8.67,
    lng: 115.21,
    name: 'TPA Suwung',
    label: 'simulated depot (operational status unverified)',
  },
  trucks: [
    { id: 't1', capacityLiters: 1000 },
    { id: 't2', capacityLiters: 1000 },
  ],
  crews: 2,
  shift: { start: '06:00', end: '18:00' },
  stops: [
    { id: 'a', lat: -8.67, lng: 115.21, liters: 10, urgency: 'high', hazardous: false },
    { id: 'b', lat: -8.671, lng: 115.211, liters: 12, urgency: 'low', hazardous: false },
    { id: 'haz', lat: -8.672, lng: 115.212, liters: 8, urgency: 'high', hazardous: true },
  ],
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan_test',
    status: 'proposed',
    version: 1,
    input: {
      trucks: input.trucks,
      crews: input.crews,
      shift: input.shift,
      reportIds: ['a', 'b', 'haz'],
    },
    result: {
      routes: [
        {
          truckId: 't1',
          stopIds: ['a', 'b'],
          loadLiters: 22,
          capacityLiters: 1000,
          distanceKm: 1,
          durationMin: 20,
          feasible: true,
          violations: [],
          polyline: [[-8.67, 115.21]],
        },
        {
          truckId: 't2',
          stopIds: [],
          loadLiters: 0,
          capacityLiters: 1000,
          distanceKm: 0,
          durationMin: 0,
          feasible: true,
          violations: [],
          polyline: [[-8.67, 115.21]],
        },
      ],
      unassigned: [{ id: 'haz', reason: 'hazardous_separate' }],
      totals: { distanceKm: 1, liters: 22, stops: 2 },
    },
    explanation: { summary: 'Demo output: existing', perRoute: [], risks: [], stale: false },
    decisions: [],
    ...overrides,
  }
}

describe('plan decisions', () => {
  it('blocks approval when a route is infeasible and returns the violations', () => {
    const current = plan()
    current.result.routes[0].feasible = false
    current.result.routes[0].violations = ['over_capacity']
    const outcome = applyDecision(current, { action: 'approve' }, { now: NOW, solveInput: input })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.httpStatus).toBe(409)
      expect(outcome.code).toBe('CONFLICT')
      expect(outcome.fields?.violations).toContain('t1: over_capacity')
    }
  })

  it('requires a note to reject and logs the decision in WITA', () => {
    const rejected = applyDecision(plan(), { action: 'reject', note: 'Crew is unavailable.' }, { now: NOW, solveInput: input })
    expect(rejected.ok).toBe(true)
    if (rejected.ok) {
      expect(rejected.plan.status).toBe('rejected')
      expect(rejected.plan.decisions[0]).toMatchObject({ action: 'reject', note: 'Crew is unavailable.', at: NOW, version: 2 })
      expect(rejected.plan.decisions[0].at.endsWith('+08:00')).toBe(true)
    }
  })

  it('resets approval when a stop is moved', () => {
    const approved = plan({ status: 'approved', version: 2 })
    const edited = applyDecision(
      approved,
      { action: 'edit', edits: { moveStop: { stopId: 'b', toTruckId: 't2' } } },
      { now: NOW, solveInput: input },
    )
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.plan.status).toBe('edited_pending')
    expect(edited.plan.version).toBe(3)
    expect(edited.plan.explanation.stale).toBe(true)
    expect(edited.plan.result.routes.find((route) => route.truckId === 't1')?.stopIds).not.toContain('b')
    expect(edited.plan.result.routes.find((route) => route.truckId === 't2')?.stopIds).toContain('b')
    expect(edited.releasedReportIds).toEqual(['a', 'b'])
    expect(edited.plan.decisions.at(-1)).toMatchObject({ action: 'edit', at: NOW, version: 3 })
    const approvedAgain = applyDecision(edited.plan, { action: 'approve' }, { now: NOW, solveInput: input })
    expect(approvedAgain.ok).toBe(true)
    if (approvedAgain.ok) expect(approvedAgain.plan.status).toBe('approved')
  })

  it('does not place a hazardous stop on an ordinary truck', () => {
    const outcome = applyDecision(
      plan(),
      { action: 'edit', edits: { moveStop: { stopId: 'haz', toTruckId: 't2' } } },
      { now: NOW, solveInput: input },
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.fields?.violations).toContain('hazardous_separate')
  })

  it('refuses approval of a rejected plan', () => {
    const outcome = applyDecision(plan({ status: 'rejected' }), { action: 'approve' }, { now: NOW, solveInput: input })
    expect(outcome.ok).toBe(false)
  })
})
