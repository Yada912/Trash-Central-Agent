import { NextResponse } from 'next/server'
import { readSessionFromRequest, sameOriginRequest } from '@/lib/auth/session'
import { computeResidentOptimization, getAccountById, getRawAccount, listTimetableSlots, removeAccount, updateAccountProfile } from '@/lib/accounts/store'
import { hydrateAccountState } from '@/lib/accounts/hydrate'
import { syncAccountToSupabase } from '@/lib/accounts/supabase-sync'
import { processResidentAgentChat } from '@/lib/ai/agent-chat'
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/guard'

function errorResponse(status: number, code: string, message: string) {
  const response = NextResponse.json({ error: { code, message } }, { status })
  response.headers.set('cache-control', 'private, no-store')
  return response
}

export async function POST(request: Request) {
  try {
    if (!sameOriginRequest(request)) {
      return errorResponse(403, 'FORBIDDEN', 'Permintaan lintas situs ditolak.')
    }
    const ip = clientIpFromRequest(request)
    const rateLimit = checkRateLimit(`agent_chat:${ip}`, 25, 60_000)
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'RATE_LIMITED',
        'Terlalu banyak permintaan ke asisten sampah. Silakan tunggu beberapa detik.',
      )
    }

    let body: { message?: string; accountId?: string }
    try {
      body = (await request.json()) as { message?: string; accountId?: string }
    } catch {
      return errorResponse(400, 'VALIDATION', 'Body JSON tidak valid.')
    }

    const rawMessage = typeof body.message === 'string' ? body.message.trim() : ''
    if (!rawMessage) return errorResponse(400, 'BAD_REQUEST', 'Pesan untuk asisten Kresna tidak boleh kosong.')
    if (rawMessage.length > 2000) return errorResponse(400, 'BAD_REQUEST', 'Pesan terlalu panjang.')

    const session = readSessionFromRequest(request)
    if (!session) return errorResponse(401, 'UNAUTHORIZED', 'Masuk diperlukan untuk berbicara dengan Kresna.')

    await hydrateAccountState()
    const active = getAccountById(session.accountId)
    if (!active) return errorResponse(404, 'NOT_FOUND', 'Akun sesi tidak ditemukan.')

    const timetable = listTimetableSlots()
    const chatResult = await processResidentAgentChat({
      message: rawMessage,
      account: active,
      timetable,
      conversationHistory: active.wasteProfile?.chatMessages ?? [],
    })

    const updatedAccount =
      updateAccountProfile(active.id, {
        wasteProfile: chatResult.updatedProfile,
      }) ?? active

    const raw = getRawAccount(active.id)
    if (raw) {
      const synced = await syncAccountToSupabase(raw, 'update')
      if (synced === 'missing') {
        removeAccount(active.id)
        return errorResponse(404, 'NOT_FOUND', 'Akun sesi tidak ditemukan.')
      }
    }

    const response = NextResponse.json({
      data: {
        reply: chatResult.reply,
        source: chatResult.source,
        modelUpdateSummary: chatResult.modelUpdateSummary,
        updatedAccount,
        optimization: computeResidentOptimization(updatedAccount, timetable),
        newMemoryItem: chatResult.newMemoryItem,
      },
    })
    response.headers.set('cache-control', 'private, no-store')
    return response
  } catch (error) {
    console.error(error)
    return errorResponse(500, 'INTERNAL', 'Something went wrong.')
  }
}
