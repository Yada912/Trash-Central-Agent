import { hydrateAccountState } from '@/lib/accounts/hydrate'
import { getRawAccount, type UserAccount } from '@/lib/accounts/store'
import { readSessionFromRequest, sameOriginRequest } from '@/lib/auth/session'

export type OfficerGate =
  | { ok: true; actor: UserAccount }
  | { ok: false; status: 401 | 403; code: 'UNAUTHORIZED' | 'FORBIDDEN'; message: string }

export async function requireOfficer(request: Request): Promise<OfficerGate> {
  if (!sameOriginRequest(request)) {
    return { ok: false, status: 403, code: 'FORBIDDEN', message: 'Cross-site request rejected.' }
  }
  const session = readSessionFromRequest(request)
  if (!session) return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Officer sign-in is required.' }
  await hydrateAccountState()
  const actor = getRawAccount(session.accountId)
  if (!actor || actor.role !== 'petugas') {
    return { ok: false, status: 403, code: 'FORBIDDEN', message: 'Only an officer session can do that.' }
  }
  return { ok: true, actor }
}
