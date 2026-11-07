import { guardImage, parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, mapModuleError, requestIdFrom } from '@/lib/api/respond'
import { classifyReport } from '@/lib/ai/classify'
import { stampClassification } from '@/lib/review'
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
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

/** Labelled demo owned by the API. classifyReport does not invent this. */
function demoClassify(input: { text: string; image?: { base64: string; mimeType: string } }): ClassifyOutcome {
  const text = input.text.trim().toLowerCase()
  if (text.length < 10 && !input.image) {
    return {
      kind: 'insufficient',
      reason: 'Demo output: this note is too short to estimate the waste type or volume without guessing.',
      missing: ['type', 'volume'],
    }
  }
  const wasteWord =
    /\b(sampah|limbah|trash|waste|plastik|plastic|organik|organic|kertas|paper|kardus|logam|metal|kaleng|baterai|battery|oli|medis|hazardous)\b/
  if (
    /\b(bukan sampah|bukan limbah|not trash|not waste)\b/.test(text) ||
    (!wasteWord.test(text) && /\b(kucing|anjing|sepeda|cat|dog|bicycle)\b/.test(text))
  ) {
    return {
      kind: 'not_trash',
      reason: 'Demo output: the description does not look like waste.',
      confidence: 0.7,
    }
  }
  let type: TrashType = 'residual'
  if (/\b(baterai|battery|aki|oli|medis|obat|kimia|hazardous|b3)\b/.test(text)) type = 'hazardous'
  else if (/\b(plastik|plastic|botol)\b/.test(text)) type = 'plastic'
  else if (/\b(organik|organic|daun|makanan|food)\b/.test(text)) type = 'organic'
  else if (/\b(kertas|paper|kardus|cardboard)\b/.test(text)) type = 'paper'
  else if (/\b(logam|metal|kaleng|besi)\b/.test(text)) type = 'metal'
  const parsedLiters = /(\d+)\s*(liter|litre|l)\b/.exec(text)
  const liters = parsedLiters ? Math.max(1, Number(parsedLiters[1])) : type === 'residual' ? 50 : 80
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
        confidence: type === 'residual' ? 0.42 : 0.66,
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
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(classifyRequestSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const imageError = guardImage(parsed.data.image, requestId)
    if (imageError) return imageError
    const hasImage = Boolean(parsed.data.image)
    const outcome = geminiConfigured()
      ? stampOutcome(await classifyReport(parsed.data), parsed.data.text, hasImage)
      : stampOutcome(demoClassify(parsed.data), parsed.data.text, hasImage)
    return jsonOk(requestId, outcome, {
      model: geminiConfigured() ? 'gemini-2.5-flash' : 'demo-mock',
      latencyMs: Date.now() - started,
    })
  } catch (error) {
    const mapped = mapModuleError(error)
    return jsonErr(requestId, mapped.status, mapped.code, mapped.message)
  }
}
