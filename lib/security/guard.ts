// Central Security Guardrails: Prompt Injection Defense, PII Redaction,
// Output Leak Prevention, and Sliding-Window Rate Limiting.

export type PromptSecurityCheck = {
  blocked: boolean
  reason?: string
  sanitizedText: string
}

// Patterns attempting to hijack the LLM, extract system prompts, or exfiltrate secrets/data
const PROMPT_INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'system_prompt_extraction',
    pattern:
      /\b(ignore\s+(all\s+)?(previous|prior|above)\s+instructions|abaikan\s+(semua\s+)?instruksi\s+sebelumnya|reveal\s+(your\s+)?(system\s+prompt|instructions)|tampilkan\s+system\s+prompt|print\s+system\s+prompt|repeat\s+the\s+text\s+above)\b/i,
  },
  {
    name: 'secret_or_key_exfiltration',
    pattern:
      /\b(GEMINI_API_KEY|GEMINI_API_KEYS|process\.env|api[_-\s]?key|secret[_-\s]?key|bocor(kan)?\s+kunci\s+api)\b/i,
  },
  {
    name: 'data_exfiltration_or_dump',
    pattern:
      /\b(dump\s+(all\s+)?(users|accounts|database|passwords)|tampilkan\s+(semua\s+)?(password|kata\s+sandi|data\s+pengguna)|select\s+\*\s+from)\b/i,
  },
  {
    name: 'xss_or_script_payload',
    pattern: /<\s*script\b|javascript\s*:|onerror\s*=|onload\s*=/i,
  },
]

// Patterns that must NEVER appear in AI-generated prose/rationale returned to clients
const OUTPUT_LEAK_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z\-_]{20,}/, // Google / Gemini API key format
  /\b(GEMINI_API_KEY|CLASSIFY_PROMPT|CLASSIFY_REPAIR_PROMPT|EXPLAIN_PROMPT)\b/i,
  /!\[[^\]]*\]\(\s*https?:\/\//i, // Markdown image exfiltration beacon
  /<\s*script\b|javascript\s*:/i, // HTML/JS injection in model output
  /<\/?resident_text>/i, // Prompt delimiter leakage
]

// PII patterns in user-submitted text (Indonesian NIK 16 digits, phone numbers, email addresses, API keys)
const EMAIL_PII_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE_PII_REGEX = /(?:\+62|62|0)8[1-9][0-9]{6,10}\b/g
const NIK_PII_REGEX = /\b[0-9]{16}\b/g
const API_KEY_REGEX = /AIza[0-9A-Za-z\-_]{20,}/g

/**
 * Redacts personal identifiable information (emails, Indonesian phone numbers,
 * 16-digit NIK, and accidental API keys) before text is sent to an external LLM
 * or stored in public report feeds.
 */
export function redactPiiFromText(text: string): string {
  return text
    .replace(API_KEY_REGEX, '[API-KEY-REDACTED]')
    .replace(EMAIL_PII_REGEX, '[EMAIL-REDACTED]')
    .replace(NIK_PII_REGEX, '[NIK-REDACTED]')
    .replace(PHONE_PII_REGEX, '[TELEPON-REDACTED]')
}

/**
 * Strips XML delimiter breakout tags (e.g. `</resident_text>`) and control chars
 * so untrusted user input cannot escape its sandboxed prompt block.
 */
export function sanitizeUntrustedForPrompt(text: string): string {
  const withoutControl = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  const withoutTags = withoutControl
    .replace(/<\/?resident_text\b[^>]*>/gi, '[tag-removed]')
    .replace(/<\/?system\b[^>]*>/gi, '[tag-removed]')
  return redactPiiFromText(withoutTags)
}

/**
 * Checks whether an untrusted user text is attempting prompt injection,
 * secret extraction, or XSS, and returns sanitized text.
 */
export function inspectPromptInput(text: string): PromptSecurityCheck {
  const sanitizedText = sanitizeUntrustedForPrompt(text)
  for (const rule of PROMPT_INJECTION_PATTERNS) {
    if (rule.pattern.test(text)) {
      return {
        blocked: true,
        reason: `Permintaan ditolak oleh sistem keamanan (${rule.name}): terdeteksi upaya manipulasi instruksi AI atau akses data terlarang.`,
        sanitizedText,
      }
    }
  }
  return { blocked: false, sanitizedText }
}

/**
 * Verifies that AI model prose does not leak secrets, system prompt internals,
 * markdown exfiltration links, or PII.
 */
export function containsSensitiveModelLeak(prose: string): boolean {
  for (const pattern of OUTPUT_LEAK_PATTERNS) {
    if (pattern.test(prose)) return true
  }
  return false
}

/**
 * Sanitizes single-line calendar fields to prevent CRLF property injection in .ics files.
 */
export function sanitizeIcsField(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/[;\\]/g, ' ').trim()
}

type RateBucket = {
  timestamps: number[]
}

const globalForRateLimit = globalThis as unknown as {
  __ctaRateLimitMap?: Map<string, RateBucket>
}

function getRateMap(): Map<string, RateBucket> {
  if (!globalForRateLimit.__ctaRateLimitMap) {
    globalForRateLimit.__ctaRateLimitMap = new Map<string, RateBucket>()
  }
  return globalForRateLimit.__ctaRateLimitMap
}

export function clientIpFromRequest(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'local-client'
}

export function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const map = getRateMap()
  const existing = map.get(bucketKey) ?? { timestamps: [] }
  const cutoff = now - windowMs
  const active = existing.timestamps.filter((t) => t > cutoff)

  if (active.length >= limit) {
    const oldest = active[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    map.set(bucketKey, { timestamps: active })
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  active.push(now)
  map.set(bucketKey, { timestamps: active })
  return {
    allowed: true,
    remaining: Math.max(0, limit - active.length),
    retryAfterSec: 0,
  }
}

export function resetRateLimitsForTest(): void {
  getRateMap().clear()
}

