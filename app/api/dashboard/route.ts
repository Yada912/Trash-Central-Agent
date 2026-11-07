import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { aggregateDashboard } from '@/lib/dashboard/aggregate'
import { dashboardSchema } from '@/lib/schemas'
import { getStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(request: Request) {
  const requestId = requestIdFrom(request)
  try {
    const store = getStore()
    const [reports, facilities] = await Promise.all([store.listReports(), store.listFacilities()])
    const dashboard = dashboardSchema.parse(aggregateDashboard(reports, facilities))
    return jsonOk(requestId, dashboard)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
