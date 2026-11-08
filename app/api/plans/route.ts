import { parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { requireOfficer } from '@/lib/auth/officer'
import { explainPlan } from '@/lib/planner/explain'
import { solvePlan } from '@/lib/planner/vrp'
import { buildSolveInput, PlanInputError } from '@/lib/plans/build-input'
import { planRequestSchema, planSchema, type Plan } from '@/lib/schemas'
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/guard'
import { getStore } from '@/lib/store'
import { nowWita } from '@/lib/time'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  const started = Date.now()
  try {
    const rate = checkRateLimit(`api_plans:${clientIpFromRequest(request)}`, 8, 60_000)
    if (!rate.allowed) {
      return jsonErr(requestId, 429, 'RATE_LIMIT', `Too many plan requests. Retry in ${rate.retryAfterSec} seconds.`)
    }
    const officer = await requireOfficer(request)
    if (!officer.ok) return jsonErr(requestId, officer.status, officer.code, officer.message)
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(planRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const store = getStore()
    const reportIds = parsed.data.reportIds ?? (await store.listReports({ status: 'new' })).map((report) => report.id)
    const input = {
      trucks: parsed.data.trucks,
      crews: parsed.data.crews,
      shift: parsed.data.shift,
      ...(parsed.data.reportIds ? { reportIds: parsed.data.reportIds } : { reportIds }),
    }
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
    let explanation
    try {
      explanation = parsed.data.skipExplanation ? await explainPlan(result, solveInput, { defer: true }) : await explainPlan(result, solveInput)
    } catch (error) {
      console.error(error)
      explanation = await explainPlan(result, solveInput, { defer: true })
    }
    const plan = planSchema.parse({
      id: `plan_${crypto.randomUUID()}`,
      status: 'proposed',
      version: 1,
      input,
      result,
      explanation: { ...explanation, stale: false, generatedAt: nowWita() },
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
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
