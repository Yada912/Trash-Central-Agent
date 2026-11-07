// PLACEHOLDER: the team's AI engineer will replace this file wholesale.
// Keep these exports stable. Callers depend only on them and on lib/schemas.ts.
//
//   EXPLAIN_PROMPT: string
//   explainPlan(plan: PlanResult, input: SolvePlanInput): Promise<Explanation>
//
// The model may only cite numbers that already appear in the plan or the input.
// When GEMINI_API_KEY is unset, return a clearly labelled mock built from those numbers.
// When the key is set, a failed call throws. Never substitute a mock after a live failure.

import { generateObject, NoObjectGeneratedError } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import type { Explanation, PlanResult, SolvePlanInput } from '@/lib/schemas'

export const EXPLAIN_PROMPT = `You explain a waste-collection plan to an officer in Denpasar.
Use only numbers that appear in the JSON payload. Do not invent, round, or convert figures.
Say that the depot is a simulated depot (operational status unverified).
Do not say a route was dispatched, that a crew was notified, or that DLH received anything.
Write short plain sentences. summary is one paragraph. perRoute has one sentence per route, in route order. risks lists operational cautions.`

const MODEL_ID = 'gemini-2.5-flash'
const BUDGET_MS = 15_000

const modelExplanationSchema = z.object({
  summary: z.string().min(1),
  perRoute: z.array(z.string()),
  risks: z.array(z.string()),
})

function fail(code: 'TIMEOUT' | 'UPSTREAM' | 'RATE_LIMIT', message: string): Error {
  const error = new Error(message)
  ;(error as Error & { code: string }).code = code
  return error
}

function collectNumbers(value: unknown, into: number[]): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    into.push(value)
    return
  }
  if (typeof value === 'string') {
    for (const match of value.matchAll(/-?\d+(?:\.\d+)?/g)) into.push(Number(match[0]))
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNumbers(item, into)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectNumbers(item, into)
  }
}

function citedNumbers(text: string): number[] {
  return [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
}

function numbersAreAllowed(text: string, allowed: number[]): boolean {
  return citedNumbers(text).every((cited) => allowed.some((candidate) => Math.abs(candidate - cited) < 1e-6))
}

function demoExplain(plan: PlanResult, input: SolvePlanInput): Explanation {
  const perRoute = plan.routes.map((route) => {
    return `Demo output: Truck ${route.truckId} carries ${route.loadLiters} liters of ${route.capacityLiters} liters across ${route.distanceKm} km in ${route.durationMin} minutes with ${route.stopIds.length} stops.`
  })
  const risks =
    plan.unassigned.length === 0
      ? ['Demo output: No unassigned stops.']
      : [`Demo output: Unassigned stops: ${plan.unassigned.map((item) => `${item.id} ${item.reason}`).join(', ')}.`]
  return {
    summary: `Demo output: ${input.depot.name} is a ${input.depot.label}. The plan covers ${plan.totals.liters} liters, ${plan.totals.stops} stops, and ${plan.totals.distanceKm} km.`,
    perRoute,
    risks,
    stale: false,
  }
}

function ensureDepotSentence(text: string, input: SolvePlanInput): string {
  if (text.includes(input.depot.label)) return text
  return `${text} ${input.depot.name} is a ${input.depot.label}.`
}

export async function explainPlan(plan: PlanResult, input: SolvePlanInput): Promise<Explanation> {
  if (!process.env.GEMINI_API_KEY) return demoExplain(plan, input)
  const allowed: number[] = []
  collectNumbers(plan, allowed)
  collectNumbers(input, allowed)
  const payload = JSON.stringify({ plan, input })
  const deadline = Date.now() + BUDGET_MS
  let repairNote = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw fail('TIMEOUT', 'The model did not respond within 15 seconds.')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), remaining)
    try {
      const { object } = await generateObject({
        model: google(MODEL_ID),
        schema: modelExplanationSchema,
        system: EXPLAIN_PROMPT,
        prompt: `${payload}${repairNote}`,
        abortSignal: controller.signal,
        maxRetries: 0,
      })
      const parsed = modelExplanationSchema.safeParse(object)
      if (!parsed.success) {
        repairNote = '\n\nYour last answer failed schema validation. Use only numbers from the JSON.'
        continue
      }
      const summary = ensureDepotSentence(parsed.data.summary, input)
      const combined = [summary, ...parsed.data.perRoute, ...parsed.data.risks].join('\n')
      if (!numbersAreAllowed(combined, allowed) || !summary.includes(input.depot.label)) {
        repairNote = '\n\nYour last answer cited a number that is not in the JSON, or omitted the depot label. Rewrite using only the given numbers.'
        continue
      }
      return { summary, perRoute: parsed.data.perRoute, risks: parsed.data.risks, stale: false }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        throw fail('TIMEOUT', 'The model did not respond within 15 seconds.')
      }
      const status =
        typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : undefined
      if (status === 429) throw fail('RATE_LIMIT', 'The model provider rate-limited the request.')
      if (attempt === 0 && (NoObjectGeneratedError.isInstance(error) || (error instanceof Error && /schema|zod/i.test(error.name)))) {
        repairNote = '\n\nYour last answer was not valid JSON for the schema.'
        continue
      }
      throw fail('UPSTREAM', 'The model request failed.')
    } finally {
      clearTimeout(timer)
    }
  }
  throw fail('UPSTREAM', 'The explanation cited numbers that are not in the plan.')
}
