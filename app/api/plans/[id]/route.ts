import { jsonErr, jsonOk, requestIdFrom } from '@/lib/api/respond'
import { getStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request)
  try {
    const { id } = await context.params
    const plan = await getStore().getPlan(id)
    if (!plan) return jsonErr(requestId, 404, 'NOT_FOUND', 'Plan not found.')
    return jsonOk(requestId, plan)
  } catch (error) {
    console.error(error)
    return jsonErr(requestId, 500, 'INTERNAL', 'Something went wrong.')
  }
}
