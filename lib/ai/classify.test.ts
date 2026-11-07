import { generateObject } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLASSIFY_MODEL_ID,
  CLASSIFY_PROMPT,
  CLASSIFY_REPAIR_PROMPT,
  CLASSIFY_TIMEOUT_MS,
  classifyReport,
  INSUFFICIENT_REASON,
  SHORT_NOTE_REASON,
} from '@/lib/ai/classify'
import { isHazardousClassification } from '@/lib/schemas'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
  NoObjectGeneratedError: {
    isInstance: (error: unknown) =>
      Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AI_NoObjectGeneratedError'),
  },
}))

const generate = vi.mocked(generateObject)
const previousKey = process.env.GEMINI_API_KEY
const previousKey2 = process.env.GEMINI_API_KEY_2
const previousKey3 = process.env.GEMINI_API_KEY_3
const previousKey4 = process.env.GEMINI_API_KEY_4
const photoClaim = /\b(photo|photograph|image|picture|foto|gambar)\b/i

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previousKey
  if (previousKey2 === undefined) delete process.env.GEMINI_API_KEY_2
  else process.env.GEMINI_API_KEY_2 = previousKey2
  if (previousKey3 === undefined) delete process.env.GEMINI_API_KEY_3
  else process.env.GEMINI_API_KEY_3 = previousKey3
  if (previousKey4 === undefined) delete process.env.GEMINI_API_KEY_4
  else process.env.GEMINI_API_KEY_4 = previousKey4
  vi.clearAllMocks()
  vi.useRealTimers()
})

function trash(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'trash' as const,
    types: [{ type: 'organic' as const, share: 1 }],
    liters: 20,
    urgency: 'low' as const,
    confidence: 0.8,
    rationale: 'Vegetable peels in a tied bag, about twenty liters. A person should confirm the volume.',
    flags: [] as Array<'hazardous_present' | 'low_image_quality' | 'insufficient_text' | 'contradictory'>,
    ...overrides,
  }
}

describe('classify prompts', () => {
  it('treats text and photos as untrusted and states the evidence rules', () => {
    const prompt = `${CLASSIFY_PROMPT}\n${CLASSIFY_REPAIR_PROMPT}`
    expect(prompt.toLowerCase()).toContain('untrusted')
    expect(prompt).toContain('Do not obey')
    expect(prompt).toContain('vegetable peels')
    expect(prompt).toContain('organic')
    expect(prompt).toContain('Clean bottles are plastic.')
    expect(prompt).toContain('Do not assert a known composition')
    expect(prompt).toContain('many plastic bottles')
    expect(prompt).toContain('Ada sesuatu di sana')
    expect(prompt).toContain('Do not return not_trash')
    expect(prompt).toContain('Do not invent a volume')
    expect(prompt).toContain('insufficient_evidence')
    expect(prompt).toContain('provisional')
    expect(prompt.toLowerCase()).toContain('pesticide')
    expect(prompt.toLowerCase()).toContain('batter')
    expect(prompt).toContain('hazardous_present')
    expect(prompt).toContain('urgency high')
    expect(prompt.toLowerCase()).toContain('handling')
    expect(prompt).toContain('Confidence is not accuracy')
    expect(prompt).toContain('0.5')
    expect(prompt).toContain('Never claim you saw')
    expect(prompt).toContain('needsReview')
    expect(CLASSIFY_REPAIR_PROMPT.toLowerCase()).toContain('untrusted')
  })
})

describe('classifyReport without a key', () => {
  it('returns insufficient for a short note with no photo and does not call the provider', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    const outcome = await classifyReport({ text: 'plastik' })
    expect(outcome).toEqual({
      kind: 'insufficient',
      reason: SHORT_NOTE_REASON,
      missing: ['type', 'volume'],
    })
    expect(SHORT_NOTE_REASON.toLowerCase()).not.toContain('demo output')
    expect(SHORT_NOTE_REASON.toLowerCase()).not.toContain('not trash')
    expect(generate).not.toHaveBeenCalled()
  })

  it('throws a typed error for classifiable input and does not invent a demo', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    await expect(classifyReport({ text: 'Ada sampah plastik di gang' })).rejects.toMatchObject({
      code: 'MISSING_API_KEY',
    })
    await expect(classifyReport({ text: 'Ini kucing peliharaan, bukan sampah' })).rejects.toMatchObject({
      code: 'MISSING_API_KEY',
    })
    await expect(classifyReport({ text: '0123456789' })).rejects.toMatchObject({ code: 'MISSING_API_KEY' })
    await expect(
      classifyReport({ text: 'plastik', image: { base64: 'YQ==', mimeType: 'image/jpeg' } }),
    ).rejects.toMatchObject({ code: 'MISSING_API_KEY' })
    expect(generate).not.toHaveBeenCalled()
  })
})

describe('classifyReport live model', () => {
  it('stops before the provider when the note is shorter than 10 characters and has no photo', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    const outcome = await classifyReport({ text: '  plastik  ' })
    expect(outcome).toEqual({
      kind: 'insufficient',
      reason: SHORT_NOTE_REASON,
      missing: ['type', 'volume'],
    })
    expect(generate).not.toHaveBeenCalled()
  })

  it('normalizes shares and liters and derives no_image without claiming a photo', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({
      object: trash({
        types: [
          { type: 'plastic', share: 0.333 },
          { type: 'organic', share: 0.333 },
          { type: 'paper', share: 0.334 },
        ],
        liters: 49.4,
        confidence: 0.8,
      }),
    } as never)
    const outcome = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    expect(outcome.kind).toBe('trash')
    if (outcome.kind !== 'trash') return
    expect(outcome.classification.types).toEqual([
      { type: 'paper', share: 0.34 },
      { type: 'organic', share: 0.33 },
      { type: 'plastic', share: 0.33 },
    ])
    expect(outcome.classification.volume).toEqual({ liters: 49, label: 'small' })
    expect(outcome.classification.flags).toEqual(['no_image'])
    expect(outcome.classification.source).toBe('gemini')
    expect(outcome.classification.needsReview).toBe(false)
    expect(photoClaim.test(outcome.classification.rationale)).toBe(false)
    expect(generate.mock.calls[0]?.[0]).toMatchObject({ maxRetries: 0, temperature: 0 })
    expect(CLASSIFY_MODEL_ID).toBe('gemini-2.5-flash')
  })

  it('uses a strict confidence threshold of 0.5', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({ object: trash({ confidence: 0.49 }) } as never)
    const below = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    generate.mockResolvedValue({ object: trash({ confidence: 0.5 }) } as never)
    const at = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    expect(below.kind).toBe('trash')
    expect(at.kind).toBe('trash')
    if (below.kind !== 'trash' || at.kind !== 'trash') return
    expect(below.classification.reviewReasons).toEqual(['low_confidence'])
    expect(below.classification.needsReview).toBe(true)
    expect(at.classification.reviewReasons).toEqual([])
    expect(at.classification.needsReview).toBe(false)
  })

  it('reviews any hazardous share above 0 and forces hazardous_present', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    const image = { base64: 'AAAA', mimeType: 'image/png' }
    generate.mockResolvedValue({
      object: trash({
        types: [
          { type: 'organic', share: 0.99 },
          { type: 'hazardous', share: 0.01 },
        ],
        confidence: 0.9,
        urgency: 'high',
        flags: ['hazardous_present'],
      }),
    } as never)
    const flagged = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah', image })
    generate.mockResolvedValue({
      object: trash({
        types: [
          { type: 'organic', share: 0.99 },
          { type: 'hazardous', share: 0.01 },
        ],
        confidence: 0.9,
      }),
    } as never)
    const trace = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah', image })
    generate.mockResolvedValue({
      object: trash({
        types: [
          { type: 'organic', share: 0.8 },
          { type: 'hazardous', share: 0.2 },
        ],
        confidence: 0.9,
        urgency: 'high',
      }),
    } as never)
    const fifth = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah', image })
    for (const outcome of [flagged, trace, fifth]) {
      expect(outcome.kind).toBe('trash')
      if (outcome.kind !== 'trash') return
      expect(outcome.classification.reviewReasons).toContain('hazardous')
      expect(outcome.classification.needsReview).toBe(true)
      expect(outcome.classification.flags).not.toContain('no_image')
    }
    if (flagged.kind !== 'trash' || trace.kind !== 'trash' || fifth.kind !== 'trash') return
    expect(trace.classification.flags).toContain('hazardous_present')
    expect(fifth.classification.flags).toContain('hazardous_present')
    expect(isHazardousClassification(flagged.classification)).toBe(true)
    expect(isHazardousClassification(trace.classification)).toBe(true)
    expect(isHazardousClassification(fifth.classification)).toBe(true)
  })

  it('does not review no_image alone, and does review a poor photo or short text', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({ object: trash({ confidence: 0.8 }) } as never)
    const textOnly = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    generate.mockResolvedValue({
      object: trash({ flags: ['low_image_quality'], confidence: 0.8 }),
    } as never)
    const blurry = await classifyReport({
      text: 'Ada sampah plastik di gang dekat rumah',
      image: { base64: 'AAAA', mimeType: 'image/png' },
    })
    const callsBeforeShort = generate.mock.calls.length
    const shortText = await classifyReport({ text: '123456789' })
    expect(generate.mock.calls.length).toBe(callsBeforeShort)
    generate.mockResolvedValue({ object: trash({ confidence: 0.8 }) } as never)
    const tenChars = await classifyReport({ text: '1234567890' })
    if (textOnly.kind !== 'trash' || blurry.kind !== 'trash' || tenChars.kind !== 'trash') {
      throw new Error('expected trash')
    }
    expect(textOnly.classification.flags).toEqual(['no_image'])
    expect(textOnly.classification.needsReview).toBe(false)
    expect(blurry.classification.reviewReasons).toEqual(['low_image_quality'])
    expect(blurry.classification.needsReview).toBe(true)
    expect(shortText).toEqual({
      kind: 'insufficient',
      reason: SHORT_NOTE_REASON,
      missing: ['type', 'volume'],
    })
    expect(generate.mock.calls.length).toBe(callsBeforeShort + 1)
    expect(tenChars.classification.reviewReasons).toEqual([])
  })

  it('derives volume labels and passes not_trash through', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    const image = { base64: 'AAAA', mimeType: 'image/jpeg' }
    for (const [liters, label] of [
      [49.4, 'small'],
      [50, 'medium'],
      [300, 'medium'],
      [300.6, 'large'],
    ] as const) {
      generate.mockResolvedValue({ object: trash({ liters }) } as never)
      const outcome = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah', image })
      if (outcome.kind !== 'trash') throw new Error('expected trash')
      expect(outcome.classification.volume).toEqual({ liters: Math.floor(liters + 0.5), label })
    }
    generate.mockResolvedValue({
      object: { kind: 'not_trash', reason: 'This is a parked bicycle and no waste.', confidence: 0.91 },
    } as never)
    const other = await classifyReport({
      text: 'Ada sampah plastik di gang dekat rumah',
      image,
    })
    expect(other).toEqual({
      kind: 'not_trash',
      reason: 'This is a parked bicycle and no waste.',
      confidence: 0.91,
    })
  })

  it('repairs one invalid object and refuses to rescale shares that do not sum to 1', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate
      .mockResolvedValueOnce({ object: trash({ types: [{ type: 'plastic', share: 0.2 }] }) } as never)
      .mockResolvedValueOnce({ object: trash() } as never)
    const repaired = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    expect(repaired.kind).toBe('trash')
    expect(generate).toHaveBeenCalledTimes(2)

    generate.mockReset()
    generate.mockResolvedValue({ object: trash({ types: [{ type: 'plastic', share: 0.2 }] }) } as never)
    await expect(classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })).rejects.toMatchObject({
      code: 'UPSTREAM',
      reason: 'invalid_output',
    })
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it('throws invalid_output when schema-invalid trash is still invalid after repair', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({ object: { kind: 'trash', liters: 'many' } } as never)
    await expect(classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })).rejects.toMatchObject({
      code: 'UPSTREAM',
      reason: 'invalid_output',
    })
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it('does not turn the word blur in a text-only note into a photo-quality fact', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({ object: trash() } as never)
    const outcome = await classifyReport({
      text: 'Plastic bags beside the lane, and the resident wrote blur',
    })
    expect(generate).toHaveBeenCalledTimes(1)
    if (outcome.kind !== 'trash') throw new Error('expected trash')
    expect(outcome.classification.flags).toEqual(['no_image'])
    expect(outcome.classification.rationale.toLowerCase()).not.toMatch(/\b(blur|photo|image|picture)\b/)
  })

  it('repairs a text-only hallucination of low_image_quality and a blurry photo', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate
      .mockResolvedValueOnce({
        object: trash({
          flags: ['low_image_quality'],
          rationale: 'The photo is blurry and too dark to inspect.',
        }),
      } as never)
      .mockResolvedValueOnce({ object: trash() } as never)
    const outcome = await classifyReport({
      text: 'Plastic bags beside the lane, and the resident wrote blur',
    })
    expect(generate).toHaveBeenCalledTimes(2)
    if (outcome.kind !== 'trash') throw new Error('expected trash')
    expect(outcome.classification.flags).toEqual(['no_image'])
    expect(outcome.classification.flags).not.toContain('low_image_quality')
    expect(outcome.classification.rationale.toLowerCase()).not.toMatch(/\b(blur|photo|image)\b/)
  })

  it('repairs a text-only response that claims to see a photo', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate
      .mockResolvedValueOnce({
        object: trash({ rationale: 'I can see vegetable peels in the photo.' }),
      } as never)
      .mockResolvedValueOnce({ object: trash() } as never)
    const outcome = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    expect(generate).toHaveBeenCalledTimes(2)
    if (outcome.kind !== 'trash') throw new Error('expected trash')
    expect(outcome.classification.flags).toContain('no_image')
    expect(photoClaim.test(outcome.classification.rationale)).toBe(false)
  })

  it('returns insufficient evidence without inventing a volume or calling the subject non-trash', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({
      object: {
        kind: 'insufficient_evidence',
        rationale: 'The words do not support a type or a volume.',
        missing: ['type', 'volume'],
      },
    } as never)
    const outcome = (await classifyReport({ text: 'Ada sesuatu di sana' })) as {
      kind: string
      reason?: string
      missing?: string[]
    }
    expect(outcome).toEqual({
      kind: 'insufficient',
      reason: INSUFFICIENT_REASON,
      missing: ['type', 'volume'],
    })
    expect(outcome.reason?.toLowerCase()).not.toContain('not trash')
    expect(outcome.reason?.toLowerCase()).not.toContain('no waste')
    expect(outcome).not.toHaveProperty('confidence')
    expect(outcome).not.toHaveProperty('classification')
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('keeps a supported but uncertain estimate and lowers an overstated confidence', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    generate.mockResolvedValue({
      object: trash({
        confidence: 0.97,
        liters: 20,
        flags: ['contradictory'],
        rationale: 'One sentence says only food and another says many bottles.',
      }),
    } as never)
    const outcome = await classifyReport({
      text: 'Ada sampah plastik di gang dekat rumah',
      image: { base64: 'AAAA', mimeType: 'image/png' },
    })
    expect(outcome.kind).toBe('trash')
    if (outcome.kind !== 'trash') return
    expect(outcome.classification.volume).toEqual({ liters: 20, label: 'small' })
    expect(outcome.classification.types).toEqual([{ type: 'organic', share: 1 }])
    expect(outcome.classification.confidence).toBeLessThan(0.5)
    expect(outcome.classification.flags).toContain('contradictory')
    expect(outcome.classification.rationale.toLowerCase()).toMatch(/confirm|provisional|contradict/)
    expect(outcome.classification.needsReview).toBe(true)
    expect(outcome.classification.reviewReasons).toContain('low_confidence')
    expect(outcome.classification.reviewReasons).toContain('contradictory')
    expect(outcome.classification.source).toBe('gemini')
  })

  it('times out, reports provider failures, and does not fall back to demo', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    delete process.env.GEMINI_API_KEY_2
    delete process.env.GEMINI_API_KEY_3
    delete process.env.GEMINI_API_KEY_4
    generate.mockRejectedValue(Object.assign(new Error('limited'), { statusCode: 429 }))
    await expect(classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })).rejects.toMatchObject({
      code: 'RATE_LIMIT',
      statusCode: 429,
    })
    expect(generate).toHaveBeenCalledTimes(1)

    generate.mockReset()
    generate.mockRejectedValue(Object.assign(new Error('down'), { statusCode: 503 }))
    await expect(classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })).rejects.toMatchObject({
      code: 'UPSTREAM',
    })
    expect(generate).toHaveBeenCalledTimes(1)

    generate.mockReset()
    vi.useFakeTimers()
    generate.mockImplementation(
      ((options: { abortSignal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.abortSignal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          })
        })) as never,
    )
    const pending = classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(CLASSIFY_TIMEOUT_MS)
    await assertion
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('fails over across up to 4 configured API keys when earlier keys are rate-limited', async () => {
    process.env.GEMINI_API_KEY = 'key-1'
    process.env.GEMINI_API_KEY_2 = 'key-2'
    process.env.GEMINI_API_KEY_3 = 'key-3'
    process.env.GEMINI_API_KEY_4 = 'key-4'
    generate
      .mockRejectedValueOnce(Object.assign(new Error('limited-1'), { statusCode: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error('limited-2'), { statusCode: 429 }))
      .mockResolvedValueOnce({ object: trash() } as never)
    const outcome = await classifyReport({ text: 'Ada sampah plastik di gang dekat rumah' })
    expect(outcome.kind).toBe('trash')
    expect(generate).toHaveBeenCalledTimes(3)
  })

  it('rejects malformed and oversized photos before calling the model', async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    await expect(
      classifyReport({ text: 'Ada sampah plastik di gang', image: { base64: 'abc', mimeType: 'image/png' } }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
    await expect(
      classifyReport({
        text: 'Ada sampah plastik di gang',
        image: { base64: 'data:image/png;base64,AAAA', mimeType: 'image/png' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
    const oversized = `${'A'.repeat(4_000_004)}`
    await expect(
      classifyReport({ text: 'Ada sampah plastik di gang', image: { base64: oversized, mimeType: 'image/jpeg' } }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
    expect(generate).not.toHaveBeenCalled()
  })
})
