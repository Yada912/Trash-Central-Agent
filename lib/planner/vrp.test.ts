import fs from 'node:fs'
import os from 'node:os'
import { describe, expect, it } from 'vitest'
import { DEPOT_LABEL } from '@/lib/copy'
import {
  evaluateRoutes,
  haversineKm,
  PLANNER_DEFAULTS,
  PlanError,
  shiftWindowMinutes,
  solvePlan,
} from '@/lib/planner/vrp'
import { isHazardousClassification, type SolvePlanInput, type SolveStop } from '@/lib/schemas'

const depot = {
  lat: -8.67,
  lng: 115.21,
  name: 'TPA Suwung',
  label: DEPOT_LABEL,
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

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function pathKm(points: Array<{ lat: number; lng: number }>, origin = { lat: 0, lng: 0 }): number {
  if (points.length === 0) return 0
  let km = haversineKm(origin, points[0])
  for (let index = 1; index < points.length; index += 1) km += haversineKm(points[index - 1], points[index])
  km += haversineKm(points[points.length - 1], origin)
  return km
}

describe('solvePlan', () => {
  it('is deterministic and prefers high urgency, then leaves the rest for capacity or hazardous handling', () => {
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
    expect(first.routes[0]?.stopIds).toEqual(['high'])
    expect(first.routes[0]?.loadLiters).toBeLessThanOrEqual(first.routes[0]?.capacityLiters ?? 0)
    expect(first.routes[0]?.feasible).toBe(true)
    expect(first.unassigned).toContainEqual({ id: 'low', reason: 'over_capacity' })
    expect(first.unassigned).toContainEqual({ id: 'haz', reason: 'hazardous_separate' })
    expect(first.routes.some((route) => route.stopIds.includes('haz'))).toBe(false)
    expect(first.routes[0]?.polyline[0]).toEqual([depot.lat, depot.lng])
    expect(first.routes[0]?.polyline.at(-1)).toEqual([depot.lat, depot.lng])
  })

  it('serves a farther high-urgency stop before a nearer low-urgency stop', () => {
    const scenario = input({
      trucks: [{ id: 't1', capacityLiters: 60 }],
      stops: [
        { id: 'near-low', lat: depot.lat + 0.01, lng: depot.lng, liters: 60, urgency: 'low', hazardous: false },
        { id: 'far-high', lat: depot.lat + 0.2, lng: depot.lng, liters: 60, urgency: 'high', hazardous: false },
      ],
    })
    const result = solvePlan(scenario)
    expect(result.routes[0]?.stopIds).toEqual(['far-high'])
    expect(result.unassigned).toContainEqual({ id: 'near-low', reason: 'over_capacity' })
  })

  it('reports an exact straight-line round trip and includes service time', () => {
    const origin = { lat: 0, lng: 0, name: 'TPA Suwung', label: DEPOT_LABEL }
    const stop = { id: 's', lat: 1, lng: 0, liters: 10, urgency: 'low' as const, hazardous: false }
    const result = solvePlan(
      input({
        depot: origin,
        trucks: [{ id: 't', capacityLiters: 100 }],
        shift: { start: '00:00', end: '23:00' },
        stops: [stop],
      }),
    )
    const oneWay = haversineKm(origin, stop)
    expect(oneWay).toBeCloseTo(PLANNER_DEFAULTS.earthRadiusKm * (Math.PI / 180), 6)
    const distanceKm = round3(oneWay * 2)
    const durationMin = Math.ceil(
      (oneWay * 2 / PLANNER_DEFAULTS.avgSpeedKmh) * 60 + PLANNER_DEFAULTS.serviceMinutesPerStop,
    )
    expect(result.routes[0]).toMatchObject({
      stopIds: ['s'],
      distanceKm,
      durationMin,
      feasible: true,
      violations: [],
      polyline: [
        [0, 0],
        [1, 0],
        [0, 0],
      ],
    })
    expect(solvePlan(result.routes.length ? input({
      depot: origin,
      trucks: [{ id: 't', capacityLiters: 100 }],
      shift: { start: '00:00', end: '23:00' },
      stops: [stop],
    }) : input())).toEqual(result)
  })

  it('counts the return to the depot and rejects a one-way trip that misses the shift', () => {
    const origin = { lat: 0, lng: 0, name: 'TPA Suwung', label: DEPOT_LABEL }
    const degree = haversineKm(origin, { lat: 1, lng: 0 })
    const farLat = 20 / degree
    const nearLat = 2 / degree
    const far = solvePlan(
      input({
        depot: origin,
        shift: { start: '08:00', end: '09:00' },
        trucks: [{ id: 't', capacityLiters: 100 }],
        stops: [{ id: 'far', lat: farLat, lng: 0, liters: 10, urgency: 'high', hazardous: false }],
      }),
    )
    const near = solvePlan(
      input({
        depot: origin,
        shift: { start: '08:00', end: '09:00' },
        trucks: [{ id: 't', capacityLiters: 100 }],
        stops: [{ id: 'near', lat: nearLat, lng: 0, liters: 10, urgency: 'low', hazardous: false }],
      }),
    )
    expect(far.unassigned).toEqual([{ id: 'far', reason: 'shift_exceeded' }])
    expect(far.routes[0]?.stopIds).toEqual([])
    expect(near.routes[0]?.stopIds).toEqual(['near'])
    expect(near.routes[0]?.feasible).toBe(true)
  })

  it('treats an overnight shift as the wrap past midnight and a zero window as invalid', () => {
    expect(shiftWindowMinutes({ start: '22:00', end: '06:00' })).toBe(8 * 60)
    expect(shiftWindowMinutes({ start: '08:00', end: '08:00' })).toBeNull()
    const origin = { lat: 0, lng: 0, name: 'TPA Suwung', label: DEPOT_LABEL }
    const overnight = solvePlan(
      input({
        depot: origin,
        shift: { start: '22:00', end: '06:00' },
        trucks: [{ id: 't', capacityLiters: 100 }],
        stops: [{ id: 'near', lat: 0.01, lng: 0, liters: 10, urgency: 'medium', hazardous: false }],
      }),
    )
    expect(overnight.routes[0]?.stopIds).toEqual(['near'])
    const emptyWindow = solvePlan(
      input({
        depot: origin,
        shift: { start: '08:00', end: '08:00' },
        stops: [{ id: 'near', lat: 0.01, lng: 0, liters: 10, urgency: 'medium', hazardous: false }],
      }),
    )
    expect(emptyWindow.unassigned).toEqual([{ id: 'near', reason: 'shift_exceeded' }])
    expect(emptyWindow.routes[0]?.violations).toContain('invalid_shift')
    expect(emptyWindow.routes[0]?.feasible).toBe(false)
  })

  it('keeps 2-opt from making a route longer and preserves every stop', () => {
    const origin = { lat: 0, lng: 0, name: 'TPA Suwung', label: DEPOT_LABEL }
    const stops: SolveStop[] = [
      { id: 'a', lat: 0, lng: 0.02, liters: 1, urgency: 'medium', hazardous: false },
      { id: 'b', lat: 0, lng: 0.01, liters: 1, urgency: 'medium', hazardous: false },
      { id: 'c', lat: 0.01, lng: 0.02, liters: 1, urgency: 'medium', hazardous: false },
      { id: 'd', lat: -0.01, lng: 0.02, liters: 1, urgency: 'medium', hazardous: false },
    ]
    const result = solvePlan(
      input({
        depot: origin,
        trucks: [{ id: 't', capacityLiters: 100 }],
        shift: { start: '00:00', end: '23:00' },
        stops,
      }),
    )
    const inserted = pathKm(stops, origin)
    expect(result.unassigned).toEqual([])
    expect(result.routes[0]?.stopIds.slice().sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(result.routes[0]?.distanceKm ?? 0).toBeLessThan(round3(inserted))
    expect(result.routes[0]?.feasible).toBe(true)
    expect(solvePlan(input({
      depot: origin,
      trucks: [{ id: 't', capacityLiters: 100 }],
      shift: { start: '00:00', end: '23:00' },
      stops,
    }))).toEqual(result)
  })

  it('rejects degenerate input', () => {
    expect(() =>
      solvePlan(
        input({
          stops: [
            { id: 'a', lat: 0, lng: 0, liters: 1, urgency: 'low', hazardous: false },
            { id: 'a', lat: 0, lng: 0, liters: 1, urgency: 'low', hazardous: false },
          ],
        }),
      ),
    ).toThrow(PlanError)
    expect(() => solvePlan(input({ shift: { start: '8:00', end: '09:00' } }))).toThrow(PlanError)
    expect(() =>
      solvePlan(
        input({
          stops: [{ id: 'a', lat: Number.NaN, lng: 0, liters: 1, urgency: 'low', hazardous: false }],
        }),
      ),
    ).toThrow(PlanError)
  })

  it('plans 150 fixture stops in under 2 seconds', () => {
    const reports = JSON.parse(fs.readFileSync('data/reports.json', 'utf8')) as Array<{
      id: string
      lat: number
      lng: number
      volumeLiters: number
      urgency: SolveStop['urgency']
      types: Array<{ type: string; share: number }>
    }>
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8')) as Array<{
      id: string
      name: string
      lat: number
      lng: number
    }>
    const suwung = facilities.find((facility) => facility.id === 'dps-tpa-suwung')
    if (!suwung) throw new Error('missing depot fixture')
    const stops: SolveStop[] = reports.map((report) => ({
      id: report.id,
      lat: report.lat,
      lng: report.lng,
      liters: report.volumeLiters,
      urgency: report.urgency,
      hazardous: isHazardousClassification({ types: report.types, flags: [] }),
    }))
    const scenario = input({
      depot: { lat: suwung.lat, lng: suwung.lng, name: suwung.name, label: DEPOT_LABEL },
      trucks: [
        { id: 'truck-a', capacityLiters: 80_000 },
        { id: 'truck-b', capacityLiters: 80_000 },
        { id: 'truck-c', capacityLiters: 80_000 },
        { id: 'truck-d', capacityLiters: 80_000 },
      ],
      crews: 4,
      shift: { start: '05:00', end: '21:00' },
      stops,
    })
    const started = performance.now()
    const result = solvePlan(scenario)
    const ms = performance.now() - started
    const again = solvePlan(scenario)
    expect(again).toEqual(result)
    expect(ms).toBeLessThan(2000)
    const seen = new Set<string>()
    for (const route of result.routes) {
      expect(route.feasible).toBe(true)
      for (const id of route.stopIds) {
        expect(seen.has(id)).toBe(false)
        seen.add(id)
        expect(stops.find((stop) => stop.id === id)?.hazardous).not.toBe(true)
      }
    }
    for (const item of result.unassigned) {
      expect(seen.has(item.id)).toBe(false)
      seen.add(item.id)
    }
    expect(seen.size).toBe(150)
    const record = {
      ms,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpu: os.cpus()[0]?.model ?? 'unknown',
      routed: result.totals.stops,
      unassigned: result.unassigned.length,
      distanceKm: result.totals.distanceKm,
    }
    console.log(`BENCHMARK solvePlan 150 stops ${JSON.stringify(record)}`)
    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true })
    fs.writeFileSync('/opt/cursor/artifacts/benchmark.json', `${JSON.stringify(record, null, 2)}\n`)
  })
})

describe('evaluateRoutes', () => {
  const scenario = input({
    trucks: [{ id: 't1', capacityLiters: 50 }],
    stops: [
      { id: 'a', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'high', hazardous: false },
      { id: 'b', lat: depot.lat, lng: depot.lng, liters: 30, urgency: 'low', hazardous: false },
      { id: 'far', lat: 0, lng: 115.21, liters: 10, urgency: 'low', hazardous: false },
      { id: 'haz', lat: depot.lat, lng: depot.lng, liters: 10, urgency: 'high', hazardous: true },
    ],
  })

  it('recomputes capacity, hazardous, and shift checks without dropping submitted stops', () => {
    const over = evaluateRoutes([{ truckId: 't1', stopIds: ['a', 'b'], capacityLiters: 50 }], scenario)
    expect(over[0]?.stopIds).toEqual(['a', 'b'])
    expect(over[0]?.loadLiters).toBe(60)
    expect(over[0]?.feasible).toBe(false)
    expect(over[0]?.violations).toContain('over_capacity')

    const hazardous = evaluateRoutes([{ truckId: 't1', stopIds: ['haz'], capacityLiters: 500 }], scenario)
    expect(hazardous[0]?.feasible).toBe(false)
    expect(hazardous[0]?.violations).toContain('hazardous_separate')

    const late = evaluateRoutes([{ truckId: 't1', stopIds: ['far'], capacityLiters: 500 }], {
      ...scenario,
      shift: { start: '00:00', end: '00:01' },
    })
    expect(late[0]?.feasible).toBe(false)
    expect(late[0]?.violations).toContain('shift_exceeded')

    const fine = evaluateRoutes([{ truckId: 't1', stopIds: ['a'], capacityLiters: 50 }], scenario)
    expect(fine[0]?.feasible).toBe(true)
    expect(fine[0]?.violations).toEqual([])
    expect(fine[0]?.distanceKm).toBe(0)
  })

  it('invalidates duplicate stops and unknown ids without double-counting load', () => {
    const doubled = evaluateRoutes([{ truckId: 't1', stopIds: ['a', 'a'], capacityLiters: 100 }], scenario)
    expect(doubled[0]?.stopIds).toEqual(['a', 'a'])
    expect(doubled[0]?.loadLiters).toBe(30)
    expect(doubled[0]?.feasible).toBe(false)
    expect(doubled[0]?.violations).toContain('duplicate_stop')

    const shared = evaluateRoutes(
      [
        { truckId: 't1', stopIds: ['a'], capacityLiters: 100 },
        { truckId: 't2', stopIds: ['a'], capacityLiters: 100 },
      ],
      input({
        trucks: [
          { id: 't1', capacityLiters: 100 },
          { id: 't2', capacityLiters: 100 },
        ],
        crews: 2,
        stops: scenario.stops,
      }),
    )
    expect(shared.every((route) => route.feasible === false)).toBe(true)
    expect(shared.every((route) => route.violations.includes('duplicate_stop'))).toBe(true)

    const unknown = evaluateRoutes([{ truckId: 't1', stopIds: ['a', 'missing'], capacityLiters: 100 }], scenario)
    expect(unknown[0]?.stopIds).toEqual(['a', 'missing'])
    expect(unknown[0]?.loadLiters).toBe(30)
    expect(unknown[0]?.violations).toContain('unknown_stop')
    expect(unknown[0]?.feasible).toBe(false)

    const unknownTruck = evaluateRoutes([{ truckId: 'missing-truck', stopIds: ['a'], capacityLiters: 100 }], scenario)
    expect(unknownTruck[0]?.feasible).toBe(false)
    expect(unknownTruck[0]?.violations).toContain('unknown_truck')
    expect(unknownTruck[0]?.loadLiters).toBe(30)

    const duplicateTruck = evaluateRoutes(
      [
        { truckId: 't1', stopIds: ['a'], capacityLiters: 100 },
        { truckId: 't1', stopIds: ['b'], capacityLiters: 100 },
      ],
      input({ trucks: [{ id: 't1', capacityLiters: 100 }], stops: scenario.stops }),
    )
    expect(duplicateTruck.every((route) => route.feasible === false)).toBe(true)
    expect(duplicateTruck.every((route) => route.violations.includes('duplicate_truck'))).toBe(true)
  })
})
