import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIX = 'scrypt$'
const KEY_LENGTH = 32

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('base64url')
  return `${PREFIX}${salt}$${hash}`
}

export function isPasswordHash(stored: string): boolean {
  return stored.startsWith(PREFIX)
}

function constantTimeTextMatch(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Verifies a scrypt hash or a legacy plaintext row. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) return false
  if (!stored.startsWith(PREFIX)) return constantTimeTextMatch(password, stored)
  const [, salt, encoded] = stored.split('$')
  if (!salt || !encoded) return false
  const expected = Buffer.from(encoded, 'base64url')
  const actual = scryptSync(password, salt, KEY_LENGTH)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(actual, expected)
}
