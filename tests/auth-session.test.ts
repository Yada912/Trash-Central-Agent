import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { POST as postChat } from '@/app/api/agent/chat/route'
import { GET as getAccounts, POST as postAccounts } from '@/app/api/accounts/route'
import { authenticateAccount } from '@/lib/accounts/authenticate'
import { getRawAccount } from '@/lib/accounts/store'
import { isPasswordHash } from '@/lib/auth/password'
import { readSessionToken, signSession } from '@/lib/auth/session'
import { resetRateLimitsForTest } from '@/lib/security/guard'

describe('signed session and account privacy', () => {
  beforeEach(() => {
    resetRateLimitsForTest()
    process.env.SESSION_SECRET = 'vitest-session-secret-32'
  })

  it('rejects a missing secret, a bad signature, and an expired token', () => {
    const token = signSession({ accountId: 'usr_warga_01', role: 'warga' })
    expect(token).toBeTruthy()
    expect(readSessionToken(token)?.accountId).toBe('usr_warga_01')
    expect(readSessionToken(`${token}x`)).toBeNull()

    const [payload, signature] = (token ?? '').split('.')
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number }
    body.exp = Math.floor(Date.now() / 1000) - 10
    const expired = `${Buffer.from(JSON.stringify(body)).toString('base64url')}.${signature}`
    expect(readSessionToken(expired)).toBeNull()

    delete process.env.SESSION_SECRET
    expect(signSession({ accountId: 'usr_warga_01', role: 'warga' })).toBeNull()
    expect(readSessionToken(token)).toBeNull()
  })

  it('does not publish the account directory without a session', async () => {
    const response = await getAccounts(new Request('http://localhost/api/accounts'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('private')
    const body = await response.text()
    expect(body).not.toContain('made.adi@warga.denpasar.id')
    expect(body).not.toContain('surya.wirawan@dlhk.denpasar.id')
    expect(body).not.toContain(process.env.DEMO_WARGA_PASSWORD ?? 'missing-warga-secret')
    expect(body).not.toContain(process.env.DEMO_PETUGAS_PASSWORD ?? 'missing-petugas-secret')
    expect(body).not.toContain('Jl. Hasanuddin')
    expect(body).not.toContain('"password"')
  })

  it('returns only the signed-in account and keeps the existing demo passwords', async () => {
    const login = await postAccounts(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          login: { email: 'made.adi@warga.denpasar.id', password: process.env.DEMO_WARGA_PASSWORD },
        }),
      }),
    )
    expect(login.status).toBe(200)
    const setCookie = login.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('cta_session=')
    expect(setCookie.toLowerCase()).toContain('httponly')
    const token = /cta_session=([^;]+)/.exec(setCookie)?.[1]
    const listed = await login.json()
    expect(listed.data.accounts).toHaveLength(1)
    expect(listed.data.accounts[0].email).toBe('made.adi@warga.denpasar.id')
    expect(JSON.stringify(listed)).not.toContain('surya.wirawan@')

    const own = await getAccounts(
      new Request('http://localhost/api/accounts', { headers: { cookie: `cta_session=${token}` } }),
    )
    const ownBody = await own.json()
    expect(ownBody.data.activeAccount.id).toBe('usr_warga_01')
    expect(ownBody.data.accounts).toHaveLength(1)

    const stored = getRawAccount('usr_warga_01')
    expect(stored?.password && isPasswordHash(stored.password)).toBe(true)
    expect(authenticateAccount('made.adi@warga.denpasar.id', process.env.DEMO_WARGA_PASSWORD)?.id).toBe('usr_warga_01')
  })

  it('forces public signup to warga and refuses passwordless switching', async () => {
    const created = await postAccounts(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create_account',
          newAccount: {
            name: 'Ni Wayan Uji',
            email: `uji.${Date.now()}@example.invalid`,
            password: `signup-${Date.now().toString(36)}`,
            role: 'petugas',
            kecamatan: 'Denpasar Selatan',
            desa: 'Sanur',
            address: 'Alamat uji',
            accountType: 'household',
          },
        }),
      }),
    )
    expect(created.status).toBe(200)
    const body = await created.json()
    expect(body.data.activeAccount.role).toBe('warga')
    expect(body.data.activeAccount.id.startsWith('usr_warga_')).toBe(true)
    expect(body.data.accounts).toHaveLength(1)

    const switched = await postAccounts(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'switch', accountId: 'usr_petugas_01' }),
      }),
    )
    expect(switched.status).toBe(401)
  })

  it('refuses a profile edit and a chat write aimed at another account', async () => {
    const token = signSession({ accountId: 'usr_warga_01', role: 'warga' })
    const edit = await postAccounts(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: `cta_session=${token}` },
        body: JSON.stringify({
          action: 'update_profile',
          accountId: 'usr_petugas_01',
          profilePatch: { name: 'Bukan petugas' },
        }),
      }),
    )
    expect(edit.status).toBe(403)

    const chat = await postChat(
      new Request('http://localhost/api/agent/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: `cta_session=${token}` },
        body: JSON.stringify({ message: 'Ada odalan minggu ini', accountId: 'usr_petugas_01' }),
      }),
    )
    expect(chat.status).toBe(200)
    const payload = await chat.json()
    expect(payload.data.updatedAccount.id).toBe('usr_warga_01')
    expect(payload.data.source).toBe('template')
  })
})
