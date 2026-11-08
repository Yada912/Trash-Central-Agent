import { guardImage, parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { nearestKecamatan } from '@/lib/geo'
import { classificationWasEdited } from '@/lib/reports/compare'
import { savedReportIsDemo } from '@/lib/reports/demo-mode'
import { canonicalReportBodyHash, idempotencyKeyFrom } from '@/lib/reports/idempotency'
import { stampClassification } from '@/lib/review'
import { readSessionFromRequest } from '@/lib/auth/session'
import { checkRateLimit, clientIpFromRequest, inspectPromptInput, redactPiiFromText } from '@/lib/security/guard'
import { createReportSchema, kecamatanSchema, reportStatusSchema, type Kecamatan, type Report } from '@/lib/schemas'
import { getStore } from '@/lib/store'
import { nowWita } from '@/lib/time'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(request: Request) {
  const requestId = requestIdFrom(request)
  try {
    const url = new URL(request.url)
    const kecamatanRaw = url.searchParams.get('kecamatan')
    const statusRaw = url.searchParams.get('status')
    const since = url.searchParams.get('since')
    let kecamatan: Kecamatan | undefined
    if (kecamatanRaw) {
      const parsed = kecamatanSchema.safeParse(kecamatanRaw)
      if (!parsed.success) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown kecamatan.', { kecamatan: ['Use a Denpasar kecamatan.'] })
      kecamatan = parsed.data
    }
    let status: Report['status'] | undefined
    if (statusRaw) {
      const parsed = reportStatusSchema.safeParse(statusRaw)
      if (!parsed.success) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown status.', { status: ['Use new, planned, or collected.'] })
      status = parsed.data
    }
    if (since && Number.isNaN(Date.parse(since))) {
      return jsonErr(requestId, 400, 'VALIDATION', 'since must be an ISO timestamp.', { since: ['Use an ISO timestamp.'] })
    }
    const mine = url.searchParams.get('mine') === '1'
    const session = mine ? readSessionFromRequest(request) : null
    if (mine && !session) return jsonErr(requestId, 401, 'UNAUTHORIZED', 'Sign in to see your reports.')
    const reports = (await getStore().listReports({
      ...(kecamatan ? { kecamatan } : {}),
      ...(status ? { status } : {}),
      ...(since ? { since } : {}),
    })).filter((report) => !mine || report.accountId === session?.accountId)
    return jsonOk(requestId, reports)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  try {
    const rate = checkRateLimit(`api_reports:${clientIpFromRequest(request)}`, 20, 60_000)
    if (!rate.allowed) {
      return jsonErr(requestId, 429, 'RATE_LIMIT', `Too many report submissions. Retry in ${rate.retryAfterSec} seconds.`)
    }
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(createReportSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const imageError = guardImage(parsed.data.image, requestId)
    if (imageError) return imageError
    const rawText = parsed.data.text ?? ''
    if (!rawText && !parsed.data.image) {
      return jsonErr(requestId, 400, 'empty_report', 'Send a photo or a description.')
    }
    const securityCheck = inspectPromptInput(rawText)
    if (securityCheck.blocked) {
      return jsonErr(requestId, 400, 'VALIDATION', securityCheck.reason ?? 'Disallowed input in description.')
    }
    const text = redactPiiFromText(rawText)
    const ownerId = readSessionFromRequest(request)?.accountId
    const store = getStore()
    const idempotencyKey = idempotencyKeyFrom(request.headers.get('idempotency-key'), parsed.data.clientRequestId)
    const hasImage = Boolean(parsed.data.image)
    const classification = stampClassification(parsed.data.classification, {
      text,
      hasImage,
      source: parsed.data.aiClassification ? (process.env.GEMINI_API_KEY?.trim() ? 'gemini' : 'mock') : 'manual',
      aiClassification: parsed.data.aiClassification,
    })
    const bodyHash = canonicalReportBodyHash({
      text,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      image: parsed.data.image,
      classification: parsed.data.classification,
      accountType: parsed.data.accountType ?? 'household',
    })
    const existing = await store.listReports()
    const kecamatan = nearestKecamatan(parsed.data.lat, parsed.data.lng, existing)
    if (!kecamatan || !kecamatanSchema.safeParse(kecamatan).success) {
      return jsonErr(requestId, 500, 'INTERNAL', 'Could not assign a kecamatan.')
    }
    const report: Report = {
      id: `rpt_${crypto.randomUUID()}`,
      isDemo: savedReportIsDemo(),
      createdAt: nowWita(),
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      kecamatan,
      description: text,
      ...(parsed.data.image
        ? { photoUrl: `data:${parsed.data.image.mimeType};base64,${parsed.data.image.base64}` }
        : {}),
      classification,
      ...(parsed.data.aiClassification ? { aiClassification: parsed.data.aiClassification } : {}),
      edited: classificationWasEdited(parsed.data.classification, parsed.data.aiClassification),
      accountType: parsed.data.accountType ?? 'household',
      status: 'new',
      ...(ownerId ? { accountId: ownerId } : {}),
    }
    const saved = await store.createReport(report, idempotencyKey ? { key: idempotencyKey, bodyHash } : undefined)
    if (saved.status === 'conflict') {
      return jsonErr(requestId, 409, 'CONFLICT', 'Idempotency key was already used with a different body.')
    }
    return jsonOk(requestId, saved.report, undefined, saved.status === 'created' ? 201 : 200)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
