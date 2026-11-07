import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { SCHEDULE_DISCLAIMER, buildSchedule } from '@/lib/schedule'
import { accountTypeSchema, kecamatanSchema, wasteStreamSchema } from '@/lib/schemas'
import { getStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

function readFilter<T>(value: string | null, schema: { safeParse: (input: string) => { success: true; data: T } | { success: false } }, field: string): { ok: true; value?: T } | { ok: false; fields: Record<string, string[]> } {
  if (!value) return { ok: true }
  const parsed = schema.safeParse(value)
  if (!parsed.success) return { ok: false, fields: { [field]: [`Unknown ${field}.`] } }
  return { ok: true, value: parsed.data }
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request)
  try {
    const url = new URL(request.url)
    const kecamatan = readFilter(url.searchParams.get('kecamatan'), kecamatanSchema, 'kecamatan')
    if (!kecamatan.ok) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown kecamatan.', kecamatan.fields)
    const stream = readFilter(url.searchParams.get('stream'), wasteStreamSchema, 'stream')
    if (!stream.ok) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown stream.', stream.fields)
    const accountType = readFilter(url.searchParams.get('accountType'), accountTypeSchema, 'accountType')
    if (!accountType.ok) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown accountType.', accountType.fields)
    const reports = await getStore().listReports()
    // Schedule rows are derived from stored reports. Decisions and route assignments stay on the plan record in the same store.
    const entries = buildSchedule(reports, {
      ...(kecamatan.value ? { kecamatan: kecamatan.value } : {}),
      ...(stream.value ? { stream: stream.value } : {}),
      ...(accountType.value ? { accountType: accountType.value } : {}),
    })
    return jsonOk(requestId, {
      entries,
      generatedFrom: 'seed+reports',
      disclaimer: SCHEDULE_DISCLAIMER,
    })
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
