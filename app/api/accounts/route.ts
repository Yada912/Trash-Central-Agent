import { NextResponse } from 'next/server'
import {
  authenticateAccount,
  computeResidentOptimization,
  createAccount,
  getActiveAccount,
  listAccounts,
  listTimetableSlots,
  setActiveAccountId,
  updateAccountProfile,
  updateTimetableSlot,
  type ResidentWasteProfile,
  type UserRole,
} from '@/lib/accounts/store'
import { checkRateLimit, clientIpFromRequest, redactPiiFromText } from '@/lib/security/guard'
import { KECAMATAN, type AccountType, type Kecamatan } from '@/lib/schemas'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const accountId = url.searchParams.get('accountId')
  const accounts = listAccounts()
  const active = getActiveAccount(accountId)
  const timetable = listTimetableSlots()
  const optimization = computeResidentOptimization(active, timetable)

  return NextResponse.json({
    data: {
      activeAccount: active,
      accounts,
      timetable,
      optimization,
    },
  })
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request)
  const body = (await request.json().catch(() => ({}))) as {
    action?: 'login' | 'switch' | 'update_profile' | 'create_account' | 'update_timetable'
    accountId?: string
    login?: {
      email: string
      password?: string
    }
    profilePatch?: {
      name?: string
      kecamatan?: Kecamatan
      desa?: string
      banjarName?: string
      tps3rNode?: string
      birthDate?: string
      address?: string
      lat?: number
      lng?: number
      accountType?: AccountType
      wasteProfile?: ResidentWasteProfile
    }
    newAccount?: {
      name: string
      email: string
      password?: string
      role: UserRole
      kecamatan: Kecamatan
      desa: string
      banjarName?: string
      tps3rNode?: string
      birthDate?: string
      address: string
      accountType: AccountType
      wasteProfile?: Partial<ResidentWasteProfile>
    }
    timetablePatch?: {
      slotId: string
      days?: string[]
      windowStart?: string
      windowEnd?: string
      leewayMinutes?: number
      surgeTolerancePct?: number
      maxLitersPerPickup?: number
      notes?: string
    }
  }

  if (body.action === 'login' && body.login?.email) {
    const rate = checkRateLimit(`auth_login:${ip}`, 12, 5 * 60_000)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${rate.retryAfterSec} detik.`,
          },
        },
        { status: 429 },
      )
    }
    const authed = authenticateAccount(body.login.email, body.login.password)
    if (!authed) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Email atau kata sandi tidak cocok.' } },
        { status: 401 },
      )
    }
  } else if (body.action === 'switch' && body.accountId) {
    const switched = setActiveAccountId(body.accountId)
    if (!switched) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Akun tidak ditemukan.' } }, { status: 404 })
    }
  } else if (body.action === 'update_profile' && body.accountId && body.profilePatch) {
    const patch = { ...body.profilePatch }
    if (patch.wasteProfile?.conditionNote) {
      patch.wasteProfile = {
        ...patch.wasteProfile,
        conditionNote: redactPiiFromText(patch.wasteProfile.conditionNote).slice(0, 500),
      }
    }
    const updated = updateAccountProfile(body.accountId, patch)
    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Akun tidak ditemukan.' } }, { status: 404 })
    }
  } else if (body.action === 'create_account' && body.newAccount) {
    const { name, email, password, role, kecamatan, desa, banjarName, tps3rNode, birthDate, address, accountType } =
      body.newAccount
    const trimmedEmail = email?.trim().toLowerCase() ?? ''
    if (!name?.trim() || !trimmedEmail.includes('@') || !KECAMATAN.includes(kecamatan)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Nama, email yang valid, dan kecamatan wajib diisi.' } },
        { status: 400 },
      )
    }
    if (password !== undefined && password.trim().length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Kata sandi minimal 6 karakter.' } },
        { status: 400 },
      )
    }
    const duplicate = listAccounts().some((a) => a.email.toLowerCase() === trimmedEmail)
    if (duplicate) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Email tersebut sudah terdaftar.' } },
        { status: 409 },
      )
    }
    createAccount({
      name,
      email: trimmedEmail,
      password,
      role,
      kecamatan,
      desa,
      banjarName,
      tps3rNode,
      birthDate,
      address,
      accountType,
      wasteProfile: body.newAccount?.wasteProfile,
    })
  } else if (body.action === 'update_timetable' && body.timetablePatch?.slotId) {
    const currentActor = getActiveAccount(body.accountId)
    if (currentActor.role !== 'petugas') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Hanya akun Petugas DLHK yang berwenang mengubah jadwal & leeway armada.' } },
        { status: 403 },
      )
    }
    const { slotId, ...rest } = body.timetablePatch
    const updatedSlot = updateTimetableSlot(slotId, rest)
    if (!updatedSlot) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Slot jadwal tidak ditemukan.' } }, { status: 404 })
    }
  } else {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Tindakan akun tidak valid.' } }, { status: 400 })
  }

  const accounts = listAccounts()
  const active = getActiveAccount()
  const timetable = listTimetableSlots()
  const optimization = computeResidentOptimization(active, timetable)

  return NextResponse.json({
    data: {
      activeAccount: active,
      accounts,
      timetable,
      optimization,
    },
  })
}
