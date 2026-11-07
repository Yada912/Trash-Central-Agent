import { afterEach, describe, expect, it } from 'vitest'
import { CLASSIFY_PROMPT, classifyReport } from '@/lib/ai/classify'

const previous = process.env.GEMINI_API_KEY

afterEach(() => {
  if (previous === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previous
})

describe('placeholder classifier', () => {
  it('returns a labelled, deterministic demo classification without a key', async () => {
    delete process.env.GEMINI_API_KEY
    const first = await classifyReport({ text: 'Ada sampah plastik di gang' })
    const second = await classifyReport({ text: 'Ada sampah plastik di gang' })
    expect(second).toEqual(first)
    expect(first.kind).toBe('trash')
    if (first.kind === 'trash') {
      expect(first.classification.rationale.toLowerCase()).toContain('demo output')
      expect(first.classification.flags).toContain('no_image')
      expect(first.classification.types[0]?.type).toBe('plastic')
    }
    expect(CLASSIFY_PROMPT.length).toBeGreaterThan(20)
  })

  it('returns not_trash instead of inventing a waste type', async () => {
    delete process.env.GEMINI_API_KEY
    const outcome = await classifyReport({ text: 'Ini kucing peliharaan, bukan sampah' })
    expect(outcome.kind).toBe('not_trash')
    if (outcome.kind === 'not_trash') expect(outcome.reason.toLowerCase()).toContain('demo output')
  })
})
