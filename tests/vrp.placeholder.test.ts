import { describe, expect, it } from 'vitest'
import { evaluateRoutes, solvePlan } from '@/lib/planner/vrp'
import type { SolvePlanInput } from '@/lib/schemas'

const depot = {
  lat: -8.67,
  lng: 115.21,
  name: 'TPA Suwung',
  label: 'simulated depot (operational status unverified)',
}

function input(overrides: Partial<SolvePlanInput> = {}): SolvePlanInput {
  return {
    depot,
    trucks: [{ id: 't1', capacityLiters: 50 }],
    crews: 1,
    shift: { start: '06:00', end: '18:00' },
    stops: [],
    ...overrides,
  }
}

describe('placeholder solver', () => {
  it('is deterministic and respects capacity, urgency, and hazardous separation', () => {
    const scenario = input({
      stops: [
        { id: 'low', lat: depot.lat, lng: depot.lng, liters: 40, urgency: 'low', hazardous: false },
        { id: 'high', lat: depot.lat, lng: depot.lng, liters: 40, urgency: 'high', hazardous: false },
        { id: 'haz', lat: depot.lat, lng: depot.lng, liters: 5, urgency: 'high', hazardous: true },
      ],
    })
    const first = solvePlan(scenario)
    const second = solvePlan(scenario)
    expect(second).toEqual(first)
    expect(first.routes[0].stopIds).toEqual(['high'])
    expect(first.routes[0].loadLiters).toBeLessThanOrEqual(first.routes[0].capacityLiters)
    expect(first.unassigned).toContainEqual({ id: 'low', reason: 'over_capacity' })
    expect(first.unassigned).toContainEqual({ id: 'haz', reason: 'hazardous_separate' })
    expect(first.routes.some((route) => route.stopIds.includes('haz'))).toBe(false)
  })

  it('leaves an over-capacity stop unassigned when several stops share one truck', () => {
    const result = solvePlan(
      input({
        stops: [
          { id: 'a', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'medium', hazardous: false },
          { id: 'b', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'medium', hazardous: false },
          { id: 'c', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'low', hazardous: false },
        ],
      }),
    )
    for (const route of result.routes) {
      expect(route.loadLiters).toBeLessThanOrEqual(route.capacityLiters)
      expect(route.feasible).toBe(true)
    }
    expect(result.unassigned.some((item) => item.reason === 'over_capacity')).toBe(true)
  })

  it('recomputes feasibility without changing stop membership', () => {
    const scenario = input({
      trucks: [{ id: 't1', capacityLiters: 50 }],
      stops: [
        { id: 'a', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'high', hazardous: false },
        { id: 'b', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'low', hazardous: false },
        { id: 'far', lat: 0, lng: 115.21, liters: 10, urgency: 'low', hazardous: false },
        { id: 'haz', lat: depot.lat, lng: depot.lng, liters: 10, urgency: 'high', hazardous: true },
      ],
    })
    const over = evaluateRoutes([{ truckId: 't1', stopIds: ['a', 'b'], capacityLiters: 50 }], scenario)
    expect(over[0].stopIds).toEqual(['a', 'b'])
    expect(over[0].loadLiters).toBe(60)
    expect(over[0].feasible).toBe(false)
    expect(over[0].violations).toContain('over_capacity')

    const hazardous = evaluateRoutes([{ truckId: 't1', stopIds: ['haz'], capacityLiters: 500 }], scenario)
    expect(hazardous[0].feasible).toBe(false)
    expect(hazardous[0].violations).toContain('hazardous_separate')

    const late = evaluateRoutes([{ truckId: 't1', stopIds: ['far'], capacityLiters: 500 }], {
      ...scenario,
      shift: { start: '00:00', end: '00:01' },
    })
    expect(late[0].feasible).toBe(false)
    expect(late[0].violations).toContain('shift_exceeded')

    const fine = evaluateRoutes([{ truckId: 't1', stopIds: ['a'], capacityLiters: 50 }], scenario)
    expect(fine[0].feasible).toBe(true)
    expect(fine[0].violations).toEqual([])
  })
})
