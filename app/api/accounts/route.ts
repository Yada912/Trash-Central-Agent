import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth/password'
import { readSessionFromRequest, sameOriginRequest, sessionSecret, signSession, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/auth/session'
import { authenticateAccount } from '@/lib/accounts/authenticate'
import { hydrateAccountState } from '@/lib/accounts/hydrate'
import {
  computeResidentOptimization,
  createAccount,
  getAccountById,
  getRawAccount,
  listAccounts,
  removeAccount,
  listTimetableSlots,
  updateAccountProfile,
  updateTimetableSlot,
  type ResidentWasteProfile,
  type UserAccount,
} from '@/lib/accounts/store'
import { syncAccountToSupabase, syncTimetableToSupabase } from '@/lib/accounts/supabase-sync'
import { checkRateLimit, clientIpFromRequest, redactPiiFromText } from '@/lib/security/guard'
import { durableRateLimit } from '@/lib/security/shared-limit'
import { KECAMATAN, type AccountType, type Kecamatan } from '@/lib/schemas'

const LOGIN_WINDOW_MS = 5 * 60_000
const LOGIN_EMAIL_LIMIT = 12
const LOGIN_IP_LIMIT = 200

function loginEmailKey(email: unknown): string {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase().slice(0, 200)
}

type AccountBody = {
  action?: 'login' | 'logout' | 'switch' | 'update_profile' | 'create_account' | 'update_timetable'
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
    role?: string
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

function accountResponse(account: UserAccount | null, status = 200): NextResponse {
  const timetable = listTimetableSlots()
  const response = NextResponse.json(
    {
      data: {
        activeAccount: account,
        accounts: account ? [account] : [],
        timetable,
        optimization: account ? computeResidentOptimization(account, timetable) : null,
      },
    },
    { status },
  )
  response.headers.set('cache-control', 'private, no-store')
  return response
}

function errorResponse(status: number, code: string, message: string): NextResponse {
  const response = NextResponse.json({ error: { code, message } }, { status })
  response.headers.set('cache-control', 'private, no-store')
  return response
}

/** Secure only on HTTPS. `next start` in CI is production mode on http://127.0.0.1. */
function cookieSecure(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwarded) return forwarded === 'https'
  return new URL(request.url).protocol === 'https:'
}

function applySessionCookie(response: NextResponse, token: string, request: Request): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(request),
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

function clearSessionCookie(response: NextResponse, request: Request): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(request),
    path: '/',
    maxAge: 0,
  })
}

function sessionAccount(request: Request): UserAccount | null {
  const session = readSessionFromRequest(request)
  if (!session) return null
  return getAccountById(session.accountId)
}

export async function GET(request: Request) {
  try {
    await hydrateAccountState()
    return accountResponse(sessionAccount(request))
  } catch (error) {
    console.error(error)
    return errorResponse(500, 'INTERNAL', 'Something went wrong.')
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOriginRequest(request)) {
      return errorResponse(403, 'FORBIDDEN', 'Permintaan lintas situs ditolak.')
    }
    let body: AccountBody
    try {
      body = (await request.json()) as AccountBody
    } catch {
      return errorResponse(400, 'VALIDATION', 'Body JSON tidak valid.')
    }
    if (!body || typeof body !== 'object' || !body.action) {
      return errorResponse(400, 'VALIDATION', 'Tindakan akun tidak valid.')
    }

    const ip = clientIpFromRequest(request)
    await hydrateAccountState()

    if (body.action === 'logout') {
      const response = accountResponse(null)
      clearSessionCookie(response, request)
      return response
    }

    if (body.action === 'switch') {
      return errorResponse(401, 'UNAUTHORIZED', 'Ganti akun memerlukan masuk dengan kata sandi.')
    }

    if (body.action === 'login') {
      if (!sessionSecret()) return errorResponse(503, 'INTERNAL', 'Sesi server belum dikonfigurasi.')
      const emailKey = loginEmailKey(body.login?.email)
      const ipRate = await durableRateLimit(`auth_login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS)
      const emailRate = emailKey
        ? await durableRateLimit(`auth_login:email:${emailKey}`, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS)
        : null
      if (!ipRate.allowed || emailRate?.allowed === false) {
        const retryAfterSec = Math.max(ipRate.retryAfterSec, emailRate?.retryAfterSec ?? 0)
        return errorResponse(429, 'RATE_LIMITED', `Terlalu banyak percobaan masuk. Coba lagi dalam ${retryAfterSec} detik.`)
      }
      if (!body.login?.email) return errorResponse(400, 'VALIDATION', 'Email dan kata sandi wajib diisi.')
      const authed = authenticateAccount(body.login.email, body.login.password)
      if (!authed) return errorResponse(401, 'VALIDATION', 'Email atau kata sandi tidak cocok.')
      const token = signSession({ accountId: authed.id, role: authed.role })
      if (!token || !sessionSecret()) {
        return errorResponse(503, 'INTERNAL', 'Sesi server belum dikonfigurasi.')
      }
      const raw = getRawAccount(authed.id)
      if (raw) {
        const synced = await syncAccountToSupabase(raw, 'update')
        if (synced === 'missing') {
          removeAccount(authed.id)
          return errorResponse(401, 'VALIDATION', 'Email atau kata sandi tidak cocok.')
        }
      }
      const response = accountResponse(authed)
      applySessionCookie(response, token, request)
      return response
    }

    if (body.action === 'create_account' || body.action === 'update_profile' || body.action === 'update_timetable') {
      const rate = checkRateLimit(`auth_write:${ip}`, 20, 5 * 60_000)
      if (!rate.allowed) {
        return errorResponse(429, 'RATE_LIMITED', `Terlalu banyak perubahan akun. Coba lagi dalam ${rate.retryAfterSec} detik.`)
      }
    }

    if (body.action === 'create_account' && body.newAccount) {
      if (!sessionSecret()) return errorResponse(503, 'INTERNAL', 'Sesi server belum dikonfigurasi.')
      const { name, email, password, kecamatan, desa, banjarName, tps3rNode, birthDate, address, accountType } =
        body.newAccount
      const trimmedEmail = email?.trim().toLowerCase() ?? ''
      if (!name?.trim() || !trimmedEmail.includes('@') || !KECAMATAN.includes(kecamatan)) {
        return errorResponse(400, 'VALIDATION', 'Nama, email yang valid, dan kecamatan wajib diisi.')
      }
      if (!password || password.trim().length < 6) {
        return errorResponse(400, 'VALIDATION', 'Kata sandi minimal 6 karakter.')
      }
      const duplicate = listAccounts().some((account) => account.email.toLowerCase() === trimmedEmail)
      if (duplicate) return errorResponse(409, 'CONFLICT', 'Email tersebut sudah terdaftar.')
      const created = createAccount({
        name,
        email: trimmedEmail,
        password: hashPassword(password.trim()),
        role: 'warga',
        kecamatan,
        desa,
        banjarName,
        tps3rNode,
        birthDate,
        address,
        accountType,
        wasteProfile: body.newAccount.wasteProfile,
      })
      const token = signSession({ accountId: created.id, role: 'warga' })
      if (!token) return errorResponse(503, 'INTERNAL', 'Sesi server belum dikonfigurasi.')
      const raw = getRawAccount(created.id)
      if (raw) await syncAccountToSupabase(raw, 'insert')
      const response = accountResponse(created)
      applySessionCookie(response, token, request)
      return response
    }

    const actor = sessionAccount(request)
    if (!actor) return errorResponse(401, 'UNAUTHORIZED', 'Masuk diperlukan.')

    if (body.action === 'update_profile' && body.profilePatch) {
      if (body.accountId && body.accountId !== actor.id) {
        return errorResponse(403, 'FORBIDDEN', 'Anda hanya dapat mengubah akun yang sedang masuk.')
      }
      const patch = { ...body.profilePatch }
      if (patch.wasteProfile?.conditionNote) {
        patch.wasteProfile = {
          ...patch.wasteProfile,
          conditionNote: redactPiiFromText(patch.wasteProfile.conditionNote).slice(0, 500),
        }
      }
      const updated = updateAccountProfile(actor.id, patch)
      if (!updated) return errorResponse(404, 'NOT_FOUND', 'Akun tidak ditemukan.')
      const raw = getRawAccount(actor.id)
      if (raw) {
        const synced = await syncAccountToSupabase(raw, 'update')
        if (synced === 'missing') {
          removeAccount(actor.id)
          return errorResponse(404, 'NOT_FOUND', 'Akun tidak ditemukan.')
        }
      }
      return accountResponse(updated)
    }

    if (body.action === 'update_timetable' && body.timetablePatch?.slotId) {
      if (actor.role !== 'petugas') {
        return errorResponse(403, 'FORBIDDEN', 'Hanya akun petugas yang berwenang mengubah jadwal dan leeway armada.')
      }
      const { slotId, ...rest } = body.timetablePatch
      const updatedSlot = updateTimetableSlot(slotId, rest)
      if (!updatedSlot) return errorResponse(404, 'NOT_FOUND', 'Slot jadwal tidak ditemukan.')
      await syncTimetableToSupabase(updatedSlot)
      return accountResponse(actor)
    }

    return errorResponse(400, 'VALIDATION', 'Tindakan akun tidak valid.')
  } catch (error) {
    console.error(error)
    return errorResponse(500, 'INTERNAL', 'Something went wrong.')
  }
}
