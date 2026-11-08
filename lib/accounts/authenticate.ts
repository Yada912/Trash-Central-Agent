import { hashPassword, isPasswordHash, verifyPassword } from '@/lib/auth/password'
import {
  getAccountById,
  getRawAccountByEmail,
  setAccountPassword,
  type UserAccount,
} from '@/lib/accounts/store'

/**
 * Checks the stored secret, then replaces a legacy plaintext password with scrypt.
 * The returned account never includes the password.
 */
export function authenticateAccount(email: string, password?: string): UserAccount | null {
  if (!email || typeof password !== 'string' || password.length === 0) return null
  const found = getRawAccountByEmail(email)
  if (!found?.password) return null
  if (!verifyPassword(password, found.password)) return null
  if (!isPasswordHash(found.password)) {
    setAccountPassword(found.id, hashPassword(password))
  }
  return getAccountById(found.id)
}
