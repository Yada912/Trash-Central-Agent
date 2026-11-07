// PLACEHOLDER: the team's AI engineer will replace this file wholesale.
// Keep these exports stable. Callers depend only on them and on lib/schemas.ts.
//
//   solvePlan(input: SolvePlanInput): PlanResult
//   evaluateRoutes(
//     routes: Array<{ truckId: string; stopIds: string[]; capacityLiters: number }>,
//     input: SolvePlanInput,
//   ): RouteResult[]
//
// Both are pure and deterministic. evaluateRoutes must not change which stops
// are on a route. It only recomputes load, distance, duration, feasibility,
// violations, and polyline.
// Violations use these codes when they apply: over_capacity, shift_exceeded,
// hazardous_separate, unknown_stop, invalid_shift. feasible is false when
// violations is not empty.
// Hazardous stops are left in unassigned with reason "hazardous_separate".
// A stop that fits no truck capacity is unassigned with reason "over_capacity".

import type { PlanResult, RouteResult, SolvePlanInput, SolveStop, Urgency } from '@/lib/schemas'

const SPEED_KMH = 25
const SERVICE_MIN = 8
const MAX_TWO_OPT_PASSES = 8

const URGENCY_RANK: Record<Urgency, number> = { high: 0, medium: 1, low: 2 }

type RouteDraft = { truckId: string; stopIds: string[]; capacityLiters: number }

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLng = (b.lng - a.lng) * toRad
  const lat1 = a.lat * toRad
  const lat2 = b.lat * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function shiftMinutes(shift: { start: string; end: string }): number | null {
  const match = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  const start = match(shift.start)
  const end = match(shift.end)
  if (!start || !end) return null
  const startMin = Number(start[1]) * 60 + Number(start[2])
  const endMin = Number(end[1]) * 60 + Number(end[2])
  if (endMin <= startMin) return null
  return endMin - startMin
}

function distanceOf(depot: { lat: number; lng: number }, ordered: SolveStop[]): number {
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
  return Math.ceil((km / SPEED_KMH) * 60 + stopCount * SERVICE_MIN)
}

function indexStops(stops: readonly SolveStop[]): Map<string, SolveStop> {
  const byId = new Map<string, SolveStop>()
  for (const stop of stops) {
    if (!byId.has(stop.id)) byId.set(stop.id, stop)
  }
  return byId
}

function twoOpt(ids: string[], depot: { lat: number; lng: number }, byId: Map<string, SolveStop>): string[] {
  if (ids.length < 2) return ids.slice()
  let route = ids.slice()
  const ordered = (sequence: string[]) =>
    sequence.map((id) => byId.get(id)).filter((stop): stop is SolveStop => Boolean(stop))
  for (let pass = 0; pass < MAX_TWO_OPT_PASSES; pass += 1) {
    const base = distanceOf(depot, ordered(route))
    let bestDelta = 0
    let best: string[] | null = null
    for (let i = 0; i < route.length - 1; i += 1) {
      for (let k = i + 1; k < route.length; k += 1) {
        const next = route.slice(0, i).concat(route.slice(i, k + 1).reverse(), route.slice(k + 1))
        const delta = base - distanceOf(depot, ordered(next))
        if (delta > bestDelta + 1e-9) {
          bestDelta = delta
          best = next
        }
      }
    }
    if (!best) break
    route = best
  }
  return route
}

export function evaluateRoutes(routes: RouteDraft[], input: SolvePlanInput): RouteResult[] {
  const byId = indexStops(input.stops)
  const shift = shiftMinutes(input.shift)
  return routes.map((route) => {
    const violations: string[] = []
    const stops: SolveStop[] = []
    for (const id of route.stopIds) {
      const stop = byId.get(id)
      if (!stop) {
        violations.push('unknown_stop')
        continue
      }
      stops.push(stop)
      if (stop.hazardous) violations.push('hazardous_separate')
    }
    const loadLiters = stops.reduce((total, stop) => total + stop.liters, 0)
    if (loadLiters > route.capacityLiters + 1e-9) violations.push('over_capacity')
    const distance = distanceOf(input.depot, stops)
    const durationMin = durationOf(distance, stops.length)
    if (shift === null) violations.push('invalid_shift')
    else if (durationMin > shift) violations.push('shift_exceeded')
    const uniqueViolations = [...new Set(violations)]
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

function totalsOf(routes: RouteResult[]): PlanResult['totals'] {
  return {
    distanceKm: round3(routes.reduce((total, route) => total + route.distanceKm, 0)),
    liters: routes.reduce((total, route) => total + route.loadLiters, 0),
    stops: routes.reduce((total, route) => total + route.stopIds.length, 0),
  }
}

export function solvePlan(input: SolvePlanInput): PlanResult {
  const unassigned: PlanResult['unassigned'] = []
  const waiting: SolveStop[] = []
  for (const stop of input.stops) {
    if (stop.hazardous) unassigned.push({ id: stop.id, reason: 'hazardous_separate' })
    else waiting.push(stop)
  }
  waiting.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const activeCount = Math.min(input.trucks.length, Math.max(0, input.crews))
  const drafts: RouteDraft[] = input.trucks.slice(0, activeCount).map((truck) => ({
    truckId: truck.id,
    stopIds: [],
    capacityLiters: truck.capacityLiters,
  }))
  const byId = indexStops(input.stops)
  const shift = shiftMinutes(input.shift)

  const loadOf = (ids: string[]) => ids.reduce((total, id) => total + (byId.get(id)?.liters ?? 0), 0)
  const metrics = (ids: string[]) => {
    const stops = ids.map((id) => byId.get(id)).filter((stop): stop is SolveStop => Boolean(stop))
    const km = distanceOf(input.depot, stops)
    return { km, duration: durationOf(km, stops.length) }
  }

  for (const stop of waiting) {
    if (drafts.length === 0) {
      unassigned.push({ id: stop.id, reason: 'over_capacity' })
      continue
    }
    const fitsSomeCapacity = drafts.some((draft) => stop.liters <= draft.capacityLiters)
    if (!fitsSomeCapacity) {
      unassigned.push({ id: stop.id, reason: 'over_capacity' })
      continue
    }
    let best: { index: number; added: number } | null = null
    let sawTimeBlock = false
    for (let index = 0; index < drafts.length; index += 1) {
      const draft = drafts[index]
      if (loadOf(draft.stopIds) + stop.liters > draft.capacityLiters + 1e-9) continue
      const before = metrics(draft.stopIds)
      const after = metrics([...draft.stopIds, stop.id])
      if (shift !== null && after.duration > shift) {
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
    drafts[best.index].stopIds.push(stop.id)
  }

  for (const draft of drafts) {
    draft.stopIds = twoOpt(draft.stopIds, input.depot, byId)
  }
  const routes = evaluateRoutes(drafts, input)
  return { routes, unassigned, totals: totalsOf(routes) }
}
