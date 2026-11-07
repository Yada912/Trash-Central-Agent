import { NextResponse } from 'next/server'
import {
  computeResidentOptimization,
  getActiveAccount,
  getRawAccount,
  listTimetableSlots,
  updateAccountProfile,
} from '@/lib/accounts/store'
import { syncAccountToSupabase } from '@/lib/accounts/supabase-sync'
import { processResidentAgentChat } from '@/lib/ai/agent-chat'
import { checkRateLimit, clientIpFromRequest } from '@/lib/security/guard'

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request)
  const rateLimit = checkRateLimit(`agent_chat:${ip}`, 25, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Terlalu banyak permintaan ke asisten sampah. Silakan tunggu beberapa detik.',
          retryAfterSec: rateLimit.retryAfterSec,
        },
      },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: string
    accountId?: string
  }

  const rawMessage = typeof body.message === 'string' ? body.message.trim() : ''
  if (!rawMessage) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Pesan untuk asisten Kresna tidak boleh kosong.',
        },
      },
      { status: 400 },
    )
  }

  const active = getActiveAccount(body.accountId)
  const timetable = listTimetableSlots()

  const chatResult = await processResidentAgentChat({
    message: rawMessage,
    account: active,
    timetable,
    conversationHistory: active.wasteProfile?.chatMessages ?? [],
  })

  // Persist the updated waste profile directly onto the user's account
  const updatedAccount =
    updateAccountProfile(active.id, {
      wasteProfile: chatResult.updatedProfile,
    }) ?? active

  const raw = getRawAccount(active.id)
  if (raw) void syncAccountToSupabase(raw)

  const updatedOptimization = computeResidentOptimization(updatedAccount, timetable)

  return NextResponse.json({
    data: {
      reply: chatResult.reply,
      modelUpdateSummary: chatResult.modelUpdateSummary,
      updatedAccount,
      optimization: updatedOptimization,
      newMemoryItem: chatResult.newMemoryItem,
    },
  })
}
