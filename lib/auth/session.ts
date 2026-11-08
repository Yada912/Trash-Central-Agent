import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'cta_session'
export const SESSION_MAX_AGE_SEC = 60 * 60 * 12

export type SessionRole = 'warga' | 'petugas'

export type SessionActor = {
  accountId: string
  role: SessionRole
  exp: number
}

/**
 * SESSION_SECRET must be set and at least 16 characters.
 * Missing or short secrets fail closed: no cookie is issued and none is accepted.
 */
export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim() ?? ''
  if (secret.length < 16) return null
  return secret
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function signSession(actor: { accountId: string; role: SessionRole }): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  if (!actor.accountId || (actor.role !== 'warga' && actor.role !== 'petugas')) return null
  const body: SessionActor = {
    accountId: actor.accountId,
    role: actor.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  }
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
  return `${payload}.${signPayload(payload, secret)}`
}

export function readSessionToken(token: string | null | undefined): SessionActor | null {
  if (!token) return null
  const secret = sessionSecret()
  if (!secret) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!payload || !signature) return null
  const expected = signPayload(payload, secret)
  const actualBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<SessionActor>
    if (typeof parsed.accountId !== 'string' || parsed.accountId.length < 1 || parsed.accountId.length > 80) return null
    if (parsed.role !== 'warga' && parsed.role !== 'petugas') return null
    if (typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) return null
    return { accountId: parsed.accountId, role: parsed.role, exp: parsed.exp }
  } catch {
    return null
  }
}

export function readSessionFromRequest(request: Request): SessionActor | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  const parts = header.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(`${SESSION_COOKIE}=`)) continue
    const raw = trimmed.slice(SESSION_COOKIE.length + 1)
    try {
      return readSessionToken(decodeURIComponent(raw))
    } catch {
      return null
    }
  }
  return null
}

/** Rejects a browser Origin that names a different host. Missing Origin is allowed. */
export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwarded || request.headers.get('host')
  if (!host) return true
  return originHost === host
}
