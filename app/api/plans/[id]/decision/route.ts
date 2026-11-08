import { parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { readSessionFromRequest, sameOriginRequest } from '@/lib/auth/session'
import { getRawAccount } from '@/lib/accounts/store'
import { hydrateAccountState } from '@/lib/accounts/hydrate'
import { applyDecision } from '@/lib/plans/apply-decision'
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/guard'
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
    if (!sameOriginRequest(request)) return jsonErr(requestId, 403, 'FORBIDDEN', 'Cross-site request rejected.')
    const rate = checkRateLimit(`api_decision:${clientIpFromRequest(request)}`, 20, 60_000)
    if (!rate.allowed) {
      return jsonErr(requestId, 429, 'RATE_LIMIT', `Too many plan decisions. Retry in ${rate.retryAfterSec} seconds.`)
    }
    const session = readSessionFromRequest(request)
    if (!session) return jsonErr(requestId, 401, 'UNAUTHORIZED', 'Officer sign-in is required.')
    await hydrateAccountState()
    const actor = getRawAccount(session.accountId)
    if (!actor || actor.role !== 'petugas') {
      return jsonErr(requestId, 403, 'FORBIDDEN', 'Only an officer session can decide a plan.')
    }
    const { id } = await context.params
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(decisionRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const store = getStore()
    const plan = await store.getPlan(id)
    if (!plan) return jsonErr(requestId, 404, 'NOT_FOUND', 'Plan not found.')
    const solveInput = await buildSolveInput(store, plan.input)
    const outcome = applyDecision(plan, { ...parsed.data, actor: actor.name }, { now: nowWita(), solveInput })
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
