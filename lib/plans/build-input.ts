import { DEPOT_FACILITY_ID, DEPOT_LABEL } from '@/lib/copy'
import { isHazardousClassification, type PlanRequest, type SolvePlanInput } from '@/lib/schemas'
import type { Store } from '@/lib/store/types'

export class PlanInputError extends Error {
  readonly code: 'DEPOT' | 'REPORT'
  readonly reportId?: string

  constructor(code: 'DEPOT' | 'REPORT', message: string, reportId?: string) {
    super(message)
    this.code = code
    this.reportId = reportId
  }
}

export async function buildSolveInput(store: Store, request: PlanRequest): Promise<SolvePlanInput> {
  const facilities = await store.listFacilities()
  const depot = facilities.find((facility) => facility.id === DEPOT_FACILITY_ID) ?? facilities.find((facility) => facility.kind === 'TPA')
  if (!depot || depot.lat === null || depot.lng === null) {
    throw new PlanInputError('DEPOT', 'The planner depot is missing.')
  }
  const stops = []
  for (const id of request.reportIds ?? []) {
    const report = await store.getReport(id)
    if (!report) throw new PlanInputError('REPORT', 'A report in this plan was not found.', id)
    stops.push({
      id: report.id,
      lat: report.lat,
      lng: report.lng,
      liters: report.classification.volume.liters,
      urgency: report.classification.urgency,
      hazardous: isHazardousClassification(report.classification),
    })
  }
  return {
    depot: { lat: depot.lat, lng: depot.lng, name: depot.name, label: DEPOT_LABEL },
    trucks: request.trucks,
    crews: request.crews,
    shift: request.shift,
    stops,
  }
}
