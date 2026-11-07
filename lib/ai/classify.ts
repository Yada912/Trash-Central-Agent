// PLACEHOLDER: the team's AI engineer will replace this file wholesale.
// Keep these exports stable. Callers depend only on them and on lib/schemas.ts.
//
//   CLASSIFY_PROMPT: string
//   classifyReport(input: { text: string; image?: { base64: string; mimeType: string } }): Promise<ClassifyOutcome>
//
// When GEMINI_API_KEY is unset, return a clearly labelled mock. When it is set, call Gemini.
// Budget 15 seconds, including one repair retry if the model output fails Zod.
// Throw on timeout, rate limit, or upstream failure. Never substitute a mock after a live failure.

import { generateObject, NoObjectGeneratedError } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import {
  classificationFlagSchema,
  classificationSchema,
  trashTypeSchema,
  urgencySchema,
  volumeLabelFor,
  volumeLabelSchema,
  type ClassificationFlag,
  type ClassifyOutcome,
  type TrashType,
} from '@/lib/schemas'

const modelOutcomeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('trash'),
    classification: z.object({
      types: z.array(z.object({ type: trashTypeSchema, share: z.number().min(0).max(1) })).min(1).max(6),
      volume: z.object({ liters: z.number().int().min(1), label: volumeLabelSchema }),
      urgency: urgencySchema,
      confidence: z.number().min(0).max(1),
      rationale: z.string().max(280),
      flags: z.array(classificationFlagSchema),
    }),
  }),
  z.object({
    kind: z.literal('not_trash'),
    reason: z.string().min(1).max(280),
    confidence: z.number().min(0).max(1),
  }),
])

export const CLASSIFY_PROMPT = `You classify a resident's waste report in Denpasar.
Return either kind "trash" with a classification, or kind "not_trash" when the text and photo are not waste.
Do not invent a trash type for something that is not waste.
Shares are volume fractions from 0 to 1, at most 2 decimal places, sorted descending, summing to 1 within 0.01.
Volume litres is an integer of at least 1. Label is small below 50 L, medium from 50 to 300 L, and large above 300 L.
Set flag hazardous_present when hazardous material is visible or described.
Set flag no_image when no photo is attached. Set flag low_image_quality when the photo is too dark or blurry to judge.
Set flag insufficient_text when the words are too thin to classify. Set flag contradictory when the text and photo disagree.
Do not set needsReview, reviewReasons, or source; the server fills those.
Rationale is at most 280 characters. Confidence is from 0 to 1.`

const MODEL_ID = 'gemini-2.5-flash'
const BUDGET_MS = 15_000

type ClassifyInput = {
  text: string
  image?: { base64: string; mimeType: string }
}

function fail(code: 'TIMEOUT' | 'UPSTREAM' | 'RATE_LIMIT', message: string): Error {
  const error = new Error(message)
  ;(error as Error & { code: string }).code = code
  return error
}

function mockClassify(input: ClassifyInput): ClassifyOutcome {
  const text = input.text.toLowerCase()
  const wasteWord =
    /\b(sampah|limbah|trash|waste|plastik|plastic|organik|organic|kertas|paper|kardus|logam|metal|kaleng|baterai|battery|oli|medis|hazardous)\b/
  if (/\b(bukan sampah|bukan limbah|not trash|not waste)\b/.test(text) || (!wasteWord.test(text) && /\b(kucing|anjing|sepeda|cat|dog|bicycle)\b/.test(text))) {
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
  if (/\b(gelap|blur|buram)\b/.test(text)) flags.push('low_image_quality')
  return {
    kind: 'trash',
    classification: {
      types: [{ type, share: 1 }],
      volume: { liters, label: volumeLabelFor(liters) },
      urgency: /\b(darurat|gawat|bahaya|urgent)\b/.test(text) ? 'high' : /\b(sedikit|kecil|small)\b/.test(text) ? 'low' : 'medium',
      confidence: type === 'residual' ? 0.42 : 0.66,
      rationale: 'Demo output: keyword placeholder because GEMINI_API_KEY is unset.',
      flags,
      source: 'mock',
      needsReview: false,
      reviewReasons: [],
    },
  }
}

function isSchemaFailure(error: unknown): boolean {
  return NoObjectGeneratedError.isInstance(error) || (error instanceof Error && /schema|zod/i.test(error.name))
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

async function callModel(input: ClassifyInput, signal: AbortSignal, repairNote?: string): Promise<unknown> {
  const imagePart = input.image
    ? [{ type: 'image' as const, image: input.image.base64, mediaType: input.image.mimeType }]
    : []
  const note = repairNote ? `\n\nThe previous output failed validation: ${repairNote}\nReturn only a valid object.` : ''
  const { object } = await generateObject({
    model: google(MODEL_ID),
    schema: modelOutcomeSchema,
    system: CLASSIFY_PROMPT,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: `${input.text}${note}` }, ...imagePart],
      },
    ],
    abortSignal: signal,
    maxRetries: 0,
  })
  return object
}

export async function classifyReport(input: ClassifyInput): Promise<ClassifyOutcome> {
  if (!process.env.GEMINI_API_KEY) return mockClassify(input)
  const deadline = Date.now() + BUDGET_MS
  let repairNote: string | undefined
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw fail('TIMEOUT', 'The model did not respond within 15 seconds.')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), remaining)
    try {
      const object = await callModel(input, controller.signal, repairNote)
      const parsed = modelOutcomeSchema.safeParse(object)
      if (!parsed.success) {
        repairNote = parsed.error.issues.map((issue) => issue.message).join('; ').slice(0, 500)
        continue
      }
      if (parsed.data.kind === 'not_trash') return parsed.data
      const full = classificationSchema.safeParse({
        ...parsed.data.classification,
        source: 'gemini',
        needsReview: false,
        reviewReasons: [],
      })
      if (!full.success) {
        repairNote = full.error.issues.map((issue) => issue.message).join('; ').slice(0, 500)
        continue
      }
      return { kind: 'trash', classification: full.data }
    } catch (error) {
      if (isAbort(error)) throw fail('TIMEOUT', 'The model did not respond within 15 seconds.')
      const status =
        typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : undefined
      if (status === 429) throw fail('RATE_LIMIT', 'The model provider rate-limited the request.')
      if (attempt === 0 && isSchemaFailure(error)) {
        repairNote = error instanceof Error ? error.message.slice(0, 500) : 'schema mismatch'
        continue
      }
      throw fail('UPSTREAM', 'The model request failed.')
    } finally {
      clearTimeout(timer)
    }
  }
  throw fail('UPSTREAM', 'The model output did not match the schema.')
}
