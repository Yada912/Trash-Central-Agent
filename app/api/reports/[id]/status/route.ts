import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { requireOfficer } from '@/lib/auth/officer'
import { reportStatusSchema, type Report } from '@/lib/schemas'
import { getStore } from '@/lib/store'
import { nowWita } from '@/lib/time'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request)
  try {
    const officer = await requireOfficer(request)
    if (!officer.ok) return jsonErr(requestId, officer.status, officer.code, officer.message)
    const { id } = await context.params
    if (!id || id.length > 80) return jsonErr(requestId, 400, 'VALIDATION', 'Unknown report.')
    let body: { status?: unknown }
    try {
      body = (await request.json()) as { status?: unknown }
    } catch {
      return jsonErr(requestId, 400, 'VALIDATION', 'Body JSON tidak valid.')
    }
    const status = reportStatusSchema.safeParse(body.status)
    if (!status.success || status.data !== 'collected') {
      return jsonErr(requestId, 400, 'VALIDATION', 'Status must be collected.')
    }
    const store = getStore()
    const current = await store.getReport(id)
    if (!current) return jsonErr(requestId, 404, 'NOT_FOUND', 'Report not found.')
    const audit = [
      ...(current.collectionAudit ?? []),
      { at: nowWita(), actor: officer.actor.name, fromStatus: current.status, toStatus: 'collected' as const },
    ].slice(-20)
    const saved = await store.updateReport(id, { status: 'collected', collectionAudit: audit })
    if (!saved) return jsonErr(requestId, 404, 'NOT_FOUND', 'Report not found.')
    return jsonOk(requestId, saved satisfies Report)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
