import { guardImage, parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, mapModuleError, requestIdFrom } from '@/lib/api/respond'
import { classifyReport } from '@/lib/ai/classify'
import { estimateHouseholdReport, outcomeFromHouseholdEstimate } from '@/lib/ai/quantity'
import { classifyModelId, hasGeminiApiKey } from '@/lib/ai/keys'
import { stampClassification } from '@/lib/review'
import { clientIpFromRequest, inspectPromptInput } from '@/lib/security/guard'
import { durableRateLimit } from '@/lib/security/shared-limit'
import {
  classifyRequestSchema,
  volumeLabelFor,
  type ClassificationFlag,
  type ClassifyOutcome,
  type TrashType,
} from '@/lib/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

function geminiConfigured(): boolean {
  return hasGeminiApiKey()
}

const MATERIAL_PATTERNS: Array<{ type: TrashType; pattern: RegExp }> = [
  { type: 'hazardous', pattern: /\b(baterai|battery|aki|oli|medis|obat|kimia|hazardous|b3|pesticide|pestisida)\b/ },
  { type: 'plastic', pattern: /\b(plastik|plastic|botol|bottle)\b/ },
  { type: 'organic', pattern: /\b(organik|organic|daun|makanan|food|peel|sayur)\b/ },
  { type: 'paper', pattern: /\b(kertas|paper|kardus|cardboard)\b/ },
  { type: 'metal', pattern: /\b(logam|metal|kaleng|besi)\b/ },
]

function namedMaterials(text: string): TrashType[] {
  return MATERIAL_PATTERNS.filter((entry) => entry.pattern.test(text)).map((entry) => entry.type)
}

function demoInsufficient(reason: string, missing: Array<'type' | 'volume'>): ClassifyOutcome {
  return { kind: 'insufficient', reason, missing }
}

/**
 * Labelled demo owned by the API. classifyReport does not invent this.
 * A long or unfamiliar sentence is not evidence of residual waste.
 * One named material can keep the keyword mock. Vague notes, unknown
 * wrappers, and contradictory materials abstain.
 */
function demoClassify(input: { text: string; image?: { base64: string; mimeType: string } }): ClassifyOutcome {
  const text = input.text.trim().toLowerCase()
  if (!text && input.image) {
    return demoInsufficient(
      'Demo output: this note does not support a trash type or volume without guessing.',
      ['type', 'volume'],
    )
  }
  if (text.length < 10 && !input.image) {
    return demoInsufficient(
      'Demo output: this note is too short to estimate the waste type or volume without guessing.',
      ['type', 'volume'],
    )
  }
  if (
    /\b(bukan sampah|bukan limbah|not trash|not waste)\b/.test(text) ||
    (!/\b(sampah|limbah|trash|waste)\b/.test(text) && /\b(kucing|anjing|sepeda|cat|dog|bicycle)\b/.test(text))
  ) {
    return {
      kind: 'not_trash',
      reason: 'Demo output: the description does not look like waste.',
      confidence: 0.7,
    }
  }
  const household = estimateHouseholdReport(input.text)
  if (household) {
    return outcomeFromHouseholdEstimate(input.text, household, {
      hasImage: Boolean(input.image),
      source: 'mock',
      demoLabel: true,
    })
  }
  const materials = namedMaterials(text)
  const statedLiters = /(\d+)\s*(liter|litre|l)\b/.exec(text)
  const contradicts = materials.length >= 2 && /\b(no|not|without|only|tanpa|bukan|tidak|hanya)\b/.test(text)
  const unknownWrapper =
    /\b(wrapper|wrappers|kemasan|bungkus)\b/.test(text) &&
    /\b(unknown|unsure|not sure|tidak jelas|tidak tahu|ambiguous)\b/.test(text)
  if (unknownWrapper || contradicts || materials.length !== 1) {
    const missing: Array<'type' | 'volume'> = ['type']
    if (!statedLiters) missing.push('volume')
    const reason = contradicts
      ? 'Demo output: the note contradicts itself, so no trash type or volume is estimated.'
      : 'Demo output: this note does not support a trash type or volume without guessing.'
    return demoInsufficient(reason, missing)
  }
  const type = materials[0]
  const liters = statedLiters ? Math.max(1, Number(statedLiters[1])) : 80
  const flags: ClassificationFlag[] = []
  if (!input.image) flags.push('no_image')
  if (type === 'hazardous') flags.push('hazardous_present')
  if (input.image && /\b(gelap|blur|buram)\b/.test(text)) flags.push('low_image_quality')
  return {
    kind: 'trash',
    classification: stampClassification(
      {
        types: [{ type, share: 1 }],
        volume: { liters, label: volumeLabelFor(liters) },
        urgency: /\b(darurat|gawat|bahaya|urgent)\b/.test(text) ? 'high' : /\b(sedikit|kecil|small)\b/.test(text) ? 'low' : 'medium',
        confidence: 0.66,
        rationale: 'Demo output: keyword placeholder because GEMINI_API_KEY is unset.',
        flags,
      },
      { text: input.text, hasImage: Boolean(input.image), source: 'mock' },
    ),
  }
}

function stampOutcome(outcome: ClassifyOutcome, text: string, hasImage: boolean): ClassifyOutcome {
  if (outcome.kind !== 'trash') return outcome
  return {
    kind: 'trash',
    classification: stampClassification(outcome.classification, {
      text,
      hasImage,
      source: geminiConfigured() ? 'gemini' : 'mock',
    }),
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  const started = Date.now()
  try {
    const ip = clientIpFromRequest(request)
    const rate = await durableRateLimit(`api_classify:${ip}`, 30, 60_000)
    if (!rate.allowed) {
      return jsonErr(requestId, 429, 'RATE_LIMIT', `Terlalu banyak permintaan klasifikasi. Coba lagi dalam ${rate.retryAfterSec} detik.`)
    }
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(classifyRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const imageError = guardImage(parsed.data.image, requestId)
    if (imageError) return imageError
    const rawText = parsed.data.text ?? ''
    if (!rawText && !parsed.data.image) {
      return jsonErr(requestId, 400, 'empty_report', 'Send a photo or a description.')
    }
    const securityCheck = inspectPromptInput(rawText)
    if (securityCheck.blocked) {
      return jsonErr(requestId, 400, 'VALIDATION', securityCheck.reason ?? 'Disallowed prompt input.')
    }
    const text = securityCheck.sanitizedText
    const hasImage = Boolean(parsed.data.image)
    const requestInput = { text, ...(parsed.data.image ? { image: parsed.data.image } : {}) }
    const outcome = geminiConfigured()
      ? stampOutcome(await classifyReport(requestInput), text, hasImage)
      : stampOutcome(demoClassify(requestInput), text, hasImage)
    return jsonOk(requestId, outcome, {
      model: geminiConfigured() ? classifyModelId() : 'demo-mock',
      latencyMs: Date.now() - started,
    })
  } catch (error) {
    const mapped = mapModuleError(error)
    return jsonErr(requestId, mapped.status, mapped.code, mapped.message)
  }
}
