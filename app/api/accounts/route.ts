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
      address: string
      accountType: AccountType
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
    const updated = updateAccountProfile(body.accountId, body.profilePatch)
    if (!updated) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Akun tidak ditemukan.' } }, { status: 404 })
    }
  } else if (body.action === 'create_account' && body.newAccount) {
    const { name, email, password, role, kecamatan, desa, address, accountType } = body.newAccount
    if (!name?.trim() || !email?.trim() || !KECAMATAN.includes(kecamatan)) {
      return NextResponse.json({ error: { code: 'VALIDATION', message: 'Nama, email, dan kecamatan wajib diisi.' } }, { status: 400 })
    }
    createAccount({ name, email, password, role, kecamatan, desa, address, accountType })
  } else if (body.action === 'update_timetable' && body.timetablePatch?.slotId) {
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
