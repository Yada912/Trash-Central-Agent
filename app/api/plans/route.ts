import { parseSchema, readJson } from '@/lib/api/body'
import { isModuleFailure, jsonErr, jsonOk, mapModuleError, requestIdFrom } from '@/lib/api/respond'
import { explainPlan } from '@/lib/planner/explain'
import { solvePlan } from '@/lib/planner/vrp'
import { buildSolveInput, PlanInputError } from '@/lib/plans/build-input'
import { planRequestSchema, planSchema, type Plan } from '@/lib/schemas'
import { getStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  const started = Date.now()
  try {
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(planRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const store = getStore()
    const reportIds = parsed.data.reportIds ?? (await store.listReports({ status: 'new' })).map((report) => report.id)
    const input = { ...parsed.data, reportIds }
    let solveInput
    try {
      solveInput = await buildSolveInput(store, input)
    } catch (error) {
      if (error instanceof PlanInputError && error.code === 'REPORT') {
        return jsonErr(requestId, 400, 'VALIDATION', error.message, {
          reportIds: [error.reportId ? `Unknown report ${error.reportId}.` : 'Unknown report.'],
        })
      }
      throw error
    }
    const result = solvePlan(solveInput)
    const explanation = await explainPlan(result, solveInput)
    const plan = planSchema.parse({
      id: `plan_${crypto.randomUUID()}`,
      status: 'proposed',
      version: 1,
      input,
      result,
      explanation: { ...explanation, stale: false },
      decisions: [],
    } satisfies Plan)
    await store.savePlan(plan)
    return jsonOk(
      requestId,
      plan,
      { model: plan.explanation.provenance.model, latencyMs: Date.now() - started },
      201,
    )
  } catch (error) {
    if (error instanceof PlanInputError) {
      return jsonErr(requestId, 500, 'INTERNAL', error.message)
    }
    if (!isModuleFailure(error)) {
      console.error(error)
      return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
    }
    const mapped = mapModuleError(error)
    return jsonErr(requestId, mapped.status, mapped.code, mapped.message)
  }
}
