// Deterministic straight-line pickup planner.
//
// solvePlan(input: SolvePlanInput): PlanResult
// evaluateRoutes(routes, input): RouteResult[]
//
// Distances are haversine estimates, not road routes. There is no network,
// clock, or randomness. Tie breaks use stop and truck ids.
//
// Defaults, used for every plan because SolvePlanInput has no speed or
// service fields: 25 km/h and 8 minutes service per stop. Both include the
// return to the depot in the shift check.
//
// Shift window:
// - end > start: same-day minutes (end - start)
// - end < start: overnight minutes (1440 - start + end). 22:00–06:00 is 8 hours.
//   Feasibility compares route duration with that window. It does not anchor
//   the route to a calendar timestamp.
// - end === start, or a clock that is not HH:MM: invalid_shift
// The HTTP plan schema still rejects an overnight shift before this module
// sees it. Direct solvePlan calls accept an overnight window.
//
// Hazardous stops are those with hazardous === true. The API sets that boolean
// with isHazardousClassification: any hazardous share above 0, or an explicit
// hazardous_present flag. stampClassification forces the flag when the share
// is above 0, and it leaves an explicit flag in place when the share is 0.
// This solver trusts the confirmed boolean and does not recompute it.
//
// Active trucks are the first min(trucks.length, crews) trucks in input order.
// High urgency is considered before medium, then low. Within an urgency, lower
// stop ids are considered first. Each stop is appended to the feasible truck
// whose route grows by the least distance. A 2-opt pass then runs per route
// and is kept only when it does not increase distance or break the shift.
//
// evaluateRoutes recomputes load, distance, duration, feasibility, violations,
// and polyline from stop ids. It does not drop or reorder submitted stop ids.
// Repeated stop ids are measured once. Global duplicates mark every affected
// route infeasible so approval cannot pass.

import type { PlanResult, RouteResult, SolvePlanInput, SolveStop, Urgency } from '@/lib/schemas'

export const PLANNER_DEFAULTS = {
  avgSpeedKmh: 25,
  serviceMinutesPerStop: 8,
  earthRadiusKm: 6371,
} as const

const URGENCY_RANK: Record<Urgency, number> = { high: 0, medium: 1, low: 2 }
const VIOLATION_ORDER = [
  'duplicate_truck',
  'unknown_truck',
  'duplicate_stop',
  'unknown_stop',
  'hazardous_separate',
  'over_capacity',
  'shift_exceeded',
  'invalid_shift',
] as const

export class PlanError extends Error {
  readonly code = 'INVALID_INPUT' as const
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'PlanError'
    this.field = field
  }
}

export type RouteEdit = {
  truckId: string
  stopIds: readonly string[]
  capacityLiters: number
}

type LatLng = { lat: number; lng: number }

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLng = (b.lng - a.lng) * toRad
  const lat1 = a.lat * toRad
  const lat2 = b.lat * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * PLANNER_DEFAULTS.earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)))
}

function clockMinutes(value: string, field: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) throw new PlanError(`${field} must be HH:MM.`, field)
  return Number(match[1]) * 60 + Number(match[2])
}

/** Minutes the shift covers. Null when the window is zero minutes. */
export function shiftWindowMinutes(shift: { start: string; end: string }): number | null {
  const start = clockMinutes(shift.start, 'shift.start')
  const end = clockMinutes(shift.end, 'shift.end')
  if (end > start) return end - start
  if (end < start) return 24 * 60 - start + end
  return null
}

function assertCoordinate(value: number, field: string, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new PlanError(`${field} is out of range.`, field)
  }
}

function assertPlanInput(input: SolvePlanInput): void {
  if (!input?.depot || !input.shift || !Array.isArray(input.trucks) || !Array.isArray(input.stops)) {
    throw new PlanError('Plan input is incomplete.', 'input')
  }
  assertCoordinate(input.depot.lat, 'depot.lat', -90, 90)
  assertCoordinate(input.depot.lng, 'depot.lng', -180, 180)
  if (!Number.isInteger(input.crews) || input.crews < 0) {
    throw new PlanError('crews must be a non-negative integer.', 'crews')
  }
  const truckIds = new Set<string>()
  for (const truck of input.trucks) {
    if (typeof truck.id !== 'string' || truck.id.trim() === '') throw new PlanError('Truck id is empty.', 'trucks.id')
    if (truckIds.has(truck.id)) throw new PlanError(`Duplicate truck id ${truck.id}.`, 'trucks.id')
    truckIds.add(truck.id)
    if (!Number.isFinite(truck.capacityLiters) || truck.capacityLiters <= 0) {
      throw new PlanError(`Truck ${truck.id} capacity must be positive.`, 'trucks.capacityLiters')
    }
  }
  const stopIds = new Set<string>()
  for (const stop of input.stops) {
    if (typeof stop.id !== 'string' || stop.id.trim() === '') throw new PlanError('Stop id is empty.', 'stops.id')
    if (stopIds.has(stop.id)) throw new PlanError(`Duplicate stop id ${stop.id}.`, 'stops.id')
    stopIds.add(stop.id)
    assertCoordinate(stop.lat, `stops.${stop.id}.lat`, -90, 90)
    assertCoordinate(stop.lng, `stops.${stop.id}.lng`, -180, 180)
    if (!Number.isFinite(stop.liters) || stop.liters < 0) {
      throw new PlanError(`Stop ${stop.id} liters must be non-negative.`, 'stops.liters')
    }
    if (stop.urgency !== 'low' && stop.urgency !== 'medium' && stop.urgency !== 'high') {
      throw new PlanError(`Stop ${stop.id} urgency is invalid.`, 'stops.urgency')
    }
    if (typeof stop.hazardous !== 'boolean') {
      throw new PlanError(`Stop ${stop.id} hazardous must be boolean.`, 'stops.hazardous')
    }
  }
  shiftWindowMinutes(input.shift)
}

function distanceOf(depot: LatLng, ordered: readonly LatLng[]): number {
  if (ordered.length === 0) return 0
  let km = haversineKm(depot, ordered[0])
  for (let index = 1; index < ordered.length; index += 1) {
    km += haversineKm(ordered[index - 1], ordered[index])
  }
  km += haversineKm(ordered[ordered.length - 1], depot)
  return km
}

function durationOf(km: number, stopCount: number): number {
  if (stopCount === 0) return 0
  return Math.ceil((km / PLANNER_DEFAULTS.avgSpeedKmh) * 60 + stopCount * PLANNER_DEFAULTS.serviceMinutesPerStop)
}

function indexStops(stops: readonly SolveStop[]): Map<string, SolveStop> {
  const byId = new Map<string, SolveStop>()
  for (const stop of stops) byId.set(stop.id, stop)
  return byId
}

function twoOptDelta(depot: LatLng, points: readonly LatLng[], start: number, end: number): number {
  const previous = start === 0 ? depot : points[start - 1]
  const next = end === points.length - 1 ? depot : points[end + 1]
  const first = points[start]
  const last = points[end]
  const before = haversineKm(previous, first) + haversineKm(last, next)
  const after = haversineKm(previous, last) + haversineKm(first, next)
  return after - before
}

function twoOpt(ids: readonly string[], depot: LatLng, byId: Map<string, SolveStop>): string[] {
  if (ids.length < 2) return ids.slice()
  let route = ids.slice()
  const pointsOf = (sequence: readonly string[]) =>
    sequence.map((id) => byId.get(id)).filter((stop): stop is SolveStop => Boolean(stop))
  const passes = route.length
  for (let pass = 0; pass < passes; pass += 1) {
    const points = pointsOf(route)
    let bestDelta = 0
    let bestI = -1
    let bestK = -1
    for (let start = 0; start < points.length - 1; start += 1) {
      for (let end = start + 1; end < points.length; end += 1) {
        const delta = twoOptDelta(depot, points, start, end)
        if (delta < bestDelta - 1e-9) {
          bestDelta = delta
          bestI = start
          bestK = end
        }
      }
    }
    if (bestI < 0) break
    route = route.slice(0, bestI).concat(route.slice(bestI, bestK + 1).reverse(), route.slice(bestK + 1))
  }
  const before = distanceOf(depot, pointsOf(ids))
  const after = distanceOf(depot, pointsOf(route))
  if (after > before + 1e-6) return ids.slice()
  return route
}

function orderedViolations(flags: ReadonlySet<string>): string[] {
  return VIOLATION_ORDER.filter((code) => flags.has(code))
}

export function evaluateRoutes(routes: readonly RouteEdit[], input: SolvePlanInput): RouteResult[] {
  assertPlanInput(input)
  const byId = indexStops(input.stops)
  const shift = shiftWindowMinutes(input.shift)
  const knownTrucks = new Set(input.trucks.map((truck) => truck.id))
  const stopUses = new Map<string, number>()
  const truckUses = new Map<string, number>()
  for (const route of routes) {
    if (typeof route.truckId !== 'string' || route.truckId.trim() === '') {
      throw new PlanError('Route truck id is empty.', 'routes.truckId')
    }
    if (!Array.isArray(route.stopIds)) throw new PlanError('Route stopIds must be an array.', 'routes.stopIds')
    truckUses.set(route.truckId, (truckUses.get(route.truckId) ?? 0) + 1)
    for (const id of route.stopIds) {
      if (typeof id !== 'string' || id.trim() === '') throw new PlanError('Route stop id is empty.', 'routes.stopIds')
      stopUses.set(id, (stopUses.get(id) ?? 0) + 1)
    }
  }
  return routes.map((route) => {
    const violations = new Set<string>()
    if ((truckUses.get(route.truckId) ?? 0) > 1) violations.add('duplicate_truck')
    if (!knownTrucks.has(route.truckId)) violations.add('unknown_truck')
    const stops: SolveStop[] = []
    const seen = new Set<string>()
    let duplicate = false
    let unknown = false
    for (const id of route.stopIds) {
      const stop = byId.get(id)
      if (!stop) {
        unknown = true
        continue
      }
      if (seen.has(id) || (stopUses.get(id) ?? 0) > 1) duplicate = true
      if (seen.has(id)) continue
      seen.add(id)
      stops.push(stop)
      if (stop.hazardous) violations.add('hazardous_separate')
    }
    if (unknown) violations.add('unknown_stop')
    if (duplicate) violations.add('duplicate_stop')
    const loadLiters = stops.reduce((total, stop) => total + stop.liters, 0)
    if (!Number.isFinite(route.capacityLiters) || loadLiters > route.capacityLiters + 1e-9) {
      violations.add('over_capacity')
    }
    const distance = distanceOf(input.depot, stops)
    const durationMin = durationOf(distance, stops.length)
    if (shift === null) violations.add('invalid_shift')
    else if (durationMin > shift) violations.add('shift_exceeded')
    const uniqueViolations = orderedViolations(violations)
    const polyline: [number, number][] =
      stops.length === 0
        ? [[input.depot.lat, input.depot.lng]]
        : [
            [input.depot.lat, input.depot.lng],
            ...stops.map((stop) => [stop.lat, stop.lng] as [number, number]),
            [input.depot.lat, input.depot.lng],
          ]
    return {
      truckId: route.truckId,
      stopIds: route.stopIds.slice(),
      loadLiters,
      capacityLiters: route.capacityLiters,
      distanceKm: round3(distance),
      durationMin,
      feasible: uniqueViolations.length === 0,
      violations: uniqueViolations,
      polyline,
    }
  })
}

function totalsOf(routes: readonly RouteResult[]): PlanResult['totals'] {
  return {
    distanceKm: round3(routes.reduce((total, route) => total + route.distanceKm, 0)),
    liters: routes.reduce((total, route) => total + route.loadLiters, 0),
    stops: routes.reduce((total, route) => total + route.stopIds.length, 0),
  }
}

export function solvePlan(input: SolvePlanInput): PlanResult {
  assertPlanInput(input)
  const unassigned: PlanResult['unassigned'] = []
  const waiting: SolveStop[] = []
  for (const stop of input.stops) {
    if (stop.hazardous) unassigned.push({ id: stop.id, reason: 'hazardous_separate' })
    else waiting.push(stop)
  }
  waiting.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const activeCount = Math.min(input.trucks.length, Math.max(0, input.crews))
  const drafts: RouteEdit[] = input.trucks.slice(0, activeCount).map((truck) => ({
    truckId: truck.id,
    stopIds: [],
    capacityLiters: truck.capacityLiters,
  }))
  const byId = indexStops(input.stops)
  const shift = shiftWindowMinutes(input.shift)
  const mutable = drafts.map((draft) => ({ ...draft, stopIds: draft.stopIds.slice() }))

  const loadOf = (ids: readonly string[]) => ids.reduce((total, id) => total + (byId.get(id)?.liters ?? 0), 0)
  const metrics = (ids: readonly string[]) => {
    const stops = ids.map((id) => byId.get(id)).filter((stop): stop is SolveStop => Boolean(stop))
    const km = distanceOf(input.depot, stops)
    return { km, duration: durationOf(km, stops.length) }
  }

  if (shift === null) {
    for (const stop of waiting) unassigned.push({ id: stop.id, reason: 'shift_exceeded' })
  } else {
    for (const stop of waiting) {
      if (mutable.length === 0 || !mutable.some((draft) => stop.liters <= draft.capacityLiters + 1e-9)) {
        unassigned.push({ id: stop.id, reason: 'over_capacity' })
        continue
      }
      let best: { index: number; added: number } | null = null
      let sawTimeBlock = false
      for (let index = 0; index < mutable.length; index += 1) {
        const draft = mutable[index]
        if (loadOf(draft.stopIds) + stop.liters > draft.capacityLiters + 1e-9) continue
        const before = metrics(draft.stopIds)
        const after = metrics([...draft.stopIds, stop.id])
        if (after.duration > shift) {
          sawTimeBlock = true
          continue
        }
        const added = after.km - before.km
        if (!best || added < best.added - 1e-9 || (Math.abs(added - best.added) <= 1e-9 && index < best.index)) {
          best = { index, added }
        }
      }
      if (!best) {
        unassigned.push({ id: stop.id, reason: sawTimeBlock ? 'shift_exceeded' : 'over_capacity' })
        continue
      }
      mutable[best.index].stopIds.push(stop.id)
    }
  }

  for (const draft of mutable) {
    const optimized = twoOpt(draft.stopIds, input.depot, byId)
    const before = metrics(draft.stopIds)
    const after = metrics(optimized)
    if (after.km <= before.km + 1e-6 && (shift === null || after.duration <= shift || before.duration > shift)) {
      draft.stopIds = optimized
    }
  }

  const routes = evaluateRoutes(mutable, input)
  return { routes, unassigned, totals: totalsOf(routes) }
}
