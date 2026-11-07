import { guardImage, parseSchema, readJson } from '@/lib/api/body'
import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { nearestKecamatan } from '@/lib/geo'
import { classificationWasEdited } from '@/lib/reports/compare'
import { savedReportIsDemo } from '@/lib/reports/demo-mode'
import { canonicalReportBodyHash, idempotencyKeyFrom } from '@/lib/reports/idempotency'
import { stampClassification } from '@/lib/review'
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
    const reports = await getStore().listReports({
      ...(kecamatan ? { kecamatan } : {}),
      ...(status ? { status } : {}),
      ...(since ? { since } : {}),
    })
    return jsonOk(requestId, reports)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request)
  try {
    const body = await readJson(request, requestId)
    if (!body.ok) return body.response
    const parsed = parseSchema(createReportSchema, body.value, requestId)
    if (!parsed.ok) return parsed.response
    const imageError = guardImage(parsed.data.image, requestId)
    if (imageError) return imageError
    const store = getStore()
    const idempotencyKey = idempotencyKeyFrom(request.headers.get('idempotency-key'), parsed.data.clientRequestId)
    const hasImage = Boolean(parsed.data.image)
    const classification = stampClassification(parsed.data.classification, {
      text: parsed.data.text,
      hasImage,
      source: parsed.data.aiClassification ? (process.env.GEMINI_API_KEY?.trim() ? 'gemini' : 'mock') : 'manual',
      aiClassification: parsed.data.aiClassification,
    })
    const bodyHash = canonicalReportBodyHash({
      text: parsed.data.text,
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
      description: parsed.data.text,
      ...(parsed.data.image
        ? { photoUrl: `data:${parsed.data.image.mimeType};base64,${parsed.data.image.base64}` }
        : {}),
      classification,
      ...(parsed.data.aiClassification ? { aiClassification: parsed.data.aiClassification } : {}),
      edited: classificationWasEdited(parsed.data.classification, parsed.data.aiClassification),
      accountType: parsed.data.accountType ?? 'household',
      status: 'new',
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
