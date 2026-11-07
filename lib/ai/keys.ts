export const MAX_GEMINI_API_KEYS = 4

export const CLASSIFY_DEFAULT_MODEL_ID = 'gemini-2.5-flash'
export const EXPLAIN_DEFAULT_MODEL_ID = 'gemini-2.5-flash-lite'

const KEY_ENV_NAMES = [
  'GEMINI_API_KEY',
  'GEMINI_API_KEY_2',
  'GEMINI_API_KEY_3',
  'GEMINI_API_KEY_4',
  'GEMINI_API_KEYS',
] as const

/**
 * Returns up to 4 deduplicated, non-empty Gemini API keys in priority order.
 * Supports GEMINI_API_KEY..GEMINI_API_KEY_4 and comma-separated lists.
 */
export function geminiApiKeys(): string[] {
  const seen = new Set<string>()
  const keys: string[] = []
  for (const name of KEY_ENV_NAMES) {
    const raw = process.env[name]
    if (!raw) continue
    for (const part of raw.split(',')) {
      const trimmed = part.trim()
      if (!trimmed || seen.has(trimmed)) continue
      seen.add(trimmed)
      keys.push(trimmed)
      if (keys.length >= MAX_GEMINI_API_KEYS) return keys
    }
  }
  return keys
}

export function hasGeminiApiKey(): boolean {
  return geminiApiKeys().length > 0
}

export function classifyModelId(): string {
  return process.env.GEMINI_CLASSIFY_MODEL?.trim() || CLASSIFY_DEFAULT_MODEL_ID
}

export function explainModelId(): string {
  return process.env.GEMINI_EXPLAIN_MODEL?.trim() || EXPLAIN_DEFAULT_MODEL_ID
}

