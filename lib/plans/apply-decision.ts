import { evaluateRoutes } from '@/lib/planner/vrp'
import type { DecisionRequest, ErrorCode, Plan, SolvePlanInput } from '@/lib/schemas'

export type DecisionContext = {
  now: string
  solveInput: SolvePlanInput
}

export type DecisionOutcome =
  | { ok: true; plan: Plan; plannedReportIds: string[]; releasedReportIds: string[] }
  | {
      ok: false
      httpStatus: 400 | 409
      code: Extract<ErrorCode, 'VALIDATION' | 'CONFLICT'>
      message: string
      fields?: Record<string, string[]>
    }

function violationLines(routes: Plan['result']['routes']): string[] {
  return routes.flatMap((route) =>
    route.feasible ? [] : route.violations.length > 0 ? route.violations.map((violation) => `${route.truckId}: ${violation}`) : [`${route.truckId}: infeasible`],
  )
}

export function applyDecision(plan: Plan, body: DecisionRequest, ctx: DecisionContext): DecisionOutcome {
  if (body.action === 'approve' || body.action === 'reject') {
    if (plan.status !== 'proposed' && plan.status !== 'edited_pending') {
      return {
        ok: false,
        httpStatus: 409,
        code: 'CONFLICT',
        message: 'This plan can no longer be approved or rejected.',
      }
    }
  }

  if (body.action === 'reject') {
    const nextVersion = plan.version + 1
    return {
      ok: true,
      plannedReportIds: [],
      releasedReportIds: [],
      plan: {
        ...plan,
        status: 'rejected',
        version: nextVersion,
        decisions: [...plan.decisions, { action: 'reject', note: body.note, at: ctx.now, version: nextVersion }],
      },
    }
  }

  if (body.action === 'approve') {
    const lines = violationLines(plan.result.routes)
    if (lines.length > 0 || plan.result.routes.some((route) => !route.feasible)) {
      return {
        ok: false,
        httpStatus: 409,
        code: 'CONFLICT',
        message: 'Approve is blocked until every route is feasible.',
        fields: { violations: lines.length > 0 ? lines : ['A route is infeasible.'] },
      }
    }
    const nextVersion = plan.version + 1
    const plannedReportIds = [...new Set(plan.result.routes.flatMap((route) => route.stopIds))]
    return {
      ok: true,
      plannedReportIds,
      releasedReportIds: [],
      plan: {
        ...plan,
        status: 'approved',
        version: nextVersion,
        decisions: [
          ...plan.decisions,
          { action: 'approve', ...(body.note ? { note: body.note } : {}), at: ctx.now, version: nextVersion },
        ],
      },
    }
  }

  if (plan.status === 'rejected') {
    return { ok: false, httpStatus: 409, code: 'CONFLICT', message: 'A rejected plan cannot be edited. Run a new plan.' }
  }
  const { stopId, toTruckId } = body.edits.moveStop
  const stop = ctx.solveInput.stops.find((item) => item.id === stopId)
  if (!stop) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'VALIDATION',
      message: 'That stop is not part of this plan.',
      fields: { 'edits.moveStop.stopId': ['Unknown stop.'] },
    }
  }
  if (stop.hazardous) {
    return {
      ok: false,
      httpStatus: 409,
      code: 'CONFLICT',
      message: 'Hazardous stops stay off ordinary trucks.',
      fields: { violations: ['hazardous_separate'] },
    }
  }
  const fromIndex = plan.result.routes.findIndex((route) => route.stopIds.includes(stopId))
  const onUnassigned = plan.result.unassigned.some((item) => item.id === stopId)
  if (fromIndex < 0 && !onUnassigned) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'VALIDATION',
      message: 'That stop is not on a route or the unassigned list.',
      fields: { 'edits.moveStop.stopId': ['Unknown stop.'] },
    }
  }
  const toIndex = plan.result.routes.findIndex((route) => route.truckId === toTruckId)
  if (toIndex < 0) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'VALIDATION',
      message: 'That truck is not on this plan.',
      fields: { 'edits.moveStop.toTruckId': ['Unknown truck.'] },
    }
  }
  if (fromIndex === toIndex) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'VALIDATION',
      message: 'The stop is already on that truck.',
      fields: { 'edits.moveStop.toTruckId': ['Choose a different truck.'] },
    }
  }
  const drafts = plan.result.routes.map((route) => ({
    truckId: route.truckId,
    stopIds: route.stopIds.filter((id) => id !== stopId),
    capacityLiters: route.capacityLiters,
  }))
  drafts[toIndex].stopIds = [...drafts[toIndex].stopIds, stopId]
  const routes = evaluateRoutes(drafts, ctx.solveInput)
  const nextVersion = plan.version + 1
  const releasedReportIds =
    plan.status === 'approved' ? [...new Set(plan.result.routes.flatMap((route) => route.stopIds))] : []
  return {
    ok: true,
    plannedReportIds: [],
    releasedReportIds,
    plan: {
      ...plan,
      status: 'edited_pending',
      version: nextVersion,
      result: {
        routes,
        unassigned: plan.result.unassigned.filter((item) => item.id !== stopId),
        totals: {
          distanceKm: Math.round(routes.reduce((total, route) => total + route.distanceKm, 0) * 1000) / 1000,
          liters: routes.reduce((total, route) => total + route.loadLiters, 0),
          stops: routes.reduce((total, route) => total + route.stopIds.length, 0),
        },
      },
      explanation: { ...plan.explanation, stale: true },
      decisions: [
        ...plan.decisions,
        { action: 'edit', ...(body.note ? { note: body.note } : {}), at: ctx.now, version: nextVersion },
      ],
    },
  }
}
