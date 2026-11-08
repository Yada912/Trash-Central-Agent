import { afterEach, describe, expect, it } from 'vitest'
import {
  CLASSIFY_DEFAULT_MODEL_ID,
  EXPLAIN_DEFAULT_MODEL_ID,
  MAX_GEMINI_API_KEYS,
  classifyModelId,
  explainModelChain,
  explainModelId,
  geminiApiKeys,
  hasGeminiApiKey,
} from '@/lib/ai/keys'

const ENV_KEYS = [
  'GEMINI_API_KEY',
  'GEMINI_API_KEY_2',
  'GEMINI_API_KEY_3',
  'GEMINI_API_KEY_4',
  'GEMINI_API_KEYS',
  'GEMINI_CLASSIFY_MODEL',
  'GEMINI_EXPLAIN_MODEL',
] as const

const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}
for (const key of ENV_KEYS) {
  savedEnv[key] = process.env[key]
}

function clearKeyEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key]
  }
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const prev = savedEnv[key]
    if (prev === undefined) delete process.env[key]
    else process.env[key] = prev
  }
})

describe('geminiApiKeys and task model splitting', () => {
  it('returns empty array and false when no keys are configured', () => {
    clearKeyEnv()
    expect(geminiApiKeys()).toEqual([])
    expect(hasGeminiApiKey()).toBe(false)
  })

  it('collects up to 4 distinct keys from numbered env vars and comma-separated values', () => {
    clearKeyEnv()
    process.env.GEMINI_API_KEY = ' key-1 '
    process.env.GEMINI_API_KEY_2 = 'key-2'
    process.env.GEMINI_API_KEY_3 = 'key-3'
    process.env.GEMINI_API_KEY_4 = 'key-4'
    expect(MAX_GEMINI_API_KEYS).toBe(4)
    expect(geminiApiKeys()).toEqual(['key-1', 'key-2', 'key-3', 'key-4'])
    expect(hasGeminiApiKey()).toBe(true)
  })

  it('deduplicates keys and caps at 4 keys when comma-separated list has more', () => {
    clearKeyEnv()
    process.env.GEMINI_API_KEY = 'k1, k2, k1'
    process.env.GEMINI_API_KEY_2 = 'k3'
    process.env.GEMINI_API_KEY_3 = 'k4'
    process.env.GEMINI_API_KEY_4 = 'k5'
    expect(geminiApiKeys()).toEqual(['k1', 'k2', 'k3', 'k4'])
  })

  it('splits default models by task (gemini-2.5-flash for classify, gemini-2.5-flash-lite for explain)', () => {
    clearKeyEnv()
    expect(CLASSIFY_DEFAULT_MODEL_ID).toBe('gemini-2.5-flash')
    expect(EXPLAIN_DEFAULT_MODEL_ID).toBe('gemini-2.5-flash-lite')
    expect(classifyModelId()).toBe('gemini-2.5-flash')
    expect(explainModelId()).toBe('gemini-2.5-flash-lite')
    expect(classifyModelId()).not.toBe(explainModelId())
  })

  it('allows overriding task models via environment variables', () => {
    clearKeyEnv()
    process.env.GEMINI_CLASSIFY_MODEL = 'gemini-2.5-pro'
    process.env.GEMINI_EXPLAIN_MODEL = 'gemini-2.5-flash'
    expect(classifyModelId()).toBe('gemini-2.5-pro')
    expect(explainModelId()).toBe('gemini-2.5-flash')
  })

  it('tries the configured explain model, then the classify model, then known fallbacks', () => {
    clearKeyEnv()
    process.env.GEMINI_EXPLAIN_MODEL = 'gemini-3.5-flash-lite'
    process.env.GEMINI_CLASSIFY_MODEL = 'gemini-3.5-flash'
    expect(explainModelChain()).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
    ])
  })
})

