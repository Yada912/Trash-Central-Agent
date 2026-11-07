import { parseSchema, readJson } from '@/lib/api/body'
import { isModuleFailure, jsonErr, jsonOk, mapModuleError, requestIdFrom } from '@/lib/api/respond'
import { explainPlan } from '@/lib/planner/explain'
import { buildSolveInput, PlanInputError } from '@/lib/plans/build-input'
import { explainRequestSchema, planSchema } from '@/lib/schemas'
import { getStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request)
  const started = Date.now()
  try {
    const { id } = await context.params
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(explainRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const store = getStore()
    const plan = await store.getPlan(id)
    if (!plan) return jsonErr(requestId, 404, 'NOT_FOUND', 'Plan not found.')
    const solveInput = await buildSolveInput(store, plan.input)
    const explanation = await explainPlan(plan.result, solveInput)
    const updated = planSchema.parse({
      ...plan,
      explanation: { ...explanation, stale: false },
    })
    await store.savePlan(updated)
    return jsonOk(requestId, updated, {
      model: process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'demo-mock',
      latencyMs: Date.now() - started,
    })
  } catch (error) {
    if (error instanceof PlanInputError) {
      return jsonErr(requestId, 500, 'INTERNAL', error.message)
    }
    if (isModuleFailure(error)) {
      const mapped = mapModuleError(error)
      return jsonErr(requestId, mapped.status, mapped.code, mapped.message)
    }
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
