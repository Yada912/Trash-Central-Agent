import { guardImage, parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, mapModuleError, requestIdFrom } from '@/lib/api/respond'
import { classifyReport } from '@/lib/ai/classify'
import { stampClassification } from '@/lib/review'
import { classifyRequestSchema, type ClassifyOutcome } from '@/lib/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

function stampOutcome(outcome: ClassifyOutcome, text: string, hasImage: boolean): ClassifyOutcome {
  if (outcome.kind !== 'trash') return outcome
  return {
    kind: 'trash',
    classification: stampClassification(outcome.classification, {
      text,
      hasImage,
      source: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
    }),
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  const started = Date.now()
  try {
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(classifyRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const imageError = guardImage(parsed.data.image, requestId)
    if (imageError) return imageError
    const outcome = stampOutcome(await classifyReport(parsed.data), parsed.data.text, Boolean(parsed.data.image))
    return jsonOk(requestId, outcome, {
      model: process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'demo-mock',
      latencyMs: Date.now() - started,
    })
  } catch (error) {
    const mapped = mapModuleError(error)
    return jsonErr(requestId, mapped.status, mapped.code, mapped.message)
  }
}
