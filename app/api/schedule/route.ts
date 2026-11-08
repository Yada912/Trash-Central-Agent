import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { SCHEDULE_DISCLAIMER, SCHEDULE_GENERATED_FROM, buildSchedule, demoCheckedAvailability } from '@/lib/schedule'
import { WeeklyInputError } from '@/lib/planner/weekly'
import { accountTypeSchema, kecamatanSchema, wasteStreamSchema } from '@/lib/schemas'
import { getStore } from '@/lib/store'
import { nowWita } from '@/lib/time'

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
    const availabilityFlag = url.searchParams.get('availability')
    let availability: ReturnType<typeof demoCheckedAvailability> | undefined
    let weekStart: string | undefined
    let asOf: string | undefined
    if (availabilityFlag) {
      if (availabilityFlag !== 'checked') {
        return jsonErr(requestId, 400, 'VALIDATION', 'Unknown availability.', { availability: ['Use checked, or omit it.'] })
      }
      const suppliedWeek = url.searchParams.get('weekStart')
      if (!suppliedWeek || !/^\d{4}-\d{2}-\d{2}$/.test(suppliedWeek)) {
        return jsonErr(requestId, 400, 'VALIDATION', 'weekStart must be YYYY-MM-DD when availability is checked.', {
          weekStart: ['Use a Monday date YYYY-MM-DD.'],
        })
      }
      weekStart = suppliedWeek
      asOf = url.searchParams.get('asOf') ?? nowWita()
      availability = demoCheckedAvailability(suppliedWeek)
    }
    const reports = await getStore().listReports()
    // Schedule rows are derived from stored reports. Decisions and route assignments stay on the plan record in the same store.
    const entries = buildSchedule(reports, {
      ...(kecamatan.value ? { kecamatan: kecamatan.value } : {}),
      ...(stream.value ? { stream: stream.value } : {}),
      ...(accountType.value ? { accountType: accountType.value } : {}),
      ...(availability && weekStart ? { availability, weekStart, ...(asOf ? { asOf } : {}) } : {}),
    })
    return jsonOk(requestId, {
      entries,
      generatedFrom: SCHEDULE_GENERATED_FROM,
      disclaimer: SCHEDULE_DISCLAIMER,
    })
  } catch (error) {
    if (error instanceof WeeklyInputError) {
      return jsonErr(requestId, 400, 'VALIDATION', error.message)
    }
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
