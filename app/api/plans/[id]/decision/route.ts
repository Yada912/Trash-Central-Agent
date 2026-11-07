import { parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { applyDecision } from '@/lib/plans/apply-decision'
import { buildSolveInput, PlanInputError } from '@/lib/plans/build-input'
import { decisionRequestSchema, planSchema } from '@/lib/schemas'
import { getStore } from '@/lib/store'
import { nowWita } from '@/lib/time'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request)
  try {
    const { id } = await context.params
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(decisionRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const store = getStore()
    const plan = await store.getPlan(id)
    if (!plan) return jsonErr(requestId, 404, 'NOT_FOUND', 'Plan not found.')
    const solveInput = await buildSolveInput(store, plan.input)
    const outcome = applyDecision(plan, parsed.data, { now: nowWita(), solveInput })
    if (!outcome.ok) {
      return jsonErr(requestId, outcome.httpStatus, outcome.code, outcome.message, outcome.fields)
    }
    const saved = planSchema.parse(outcome.plan)
    await store.savePlan(saved)
    if (outcome.releasedReportIds.length > 0) {
      for (const reportId of outcome.releasedReportIds) {
        const report = await store.getReport(reportId)
        if (report?.status === 'planned') await store.updateReport(reportId, { status: 'new' })
      }
    }
    for (const reportId of outcome.plannedReportIds) {
      const report = await store.getReport(reportId)
      if (report && report.status !== 'collected') await store.updateReport(reportId, { status: 'planned' })
    }
    return jsonOk(requestId, saved, { model: saved.explanation.provenance.model })
  } catch (error) {
    if (error instanceof PlanInputError) {
      return jsonErr(requestId, 400, 'VALIDATION', error.message, error.reportId ? { reportIds: [error.reportId] } : undefined)
    }
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
