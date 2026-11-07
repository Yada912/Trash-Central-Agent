import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/reports/classify/route'

vi.mock('@/lib/ai/classify', () => ({
  classifyReport: vi.fn(() => {
    throw new Error('demo classify must not call the provider')
  }),
}))

const previousKey = process.env.GEMINI_API_KEY

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previousKey
})

function post(text: string) {
  return POST(
    new Request('http://127.0.0.1/api/reports/classify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    }),
  )
}

async function demo(text: string) {
  delete process.env.GEMINI_API_KEY
  const response = await post(text)
  expect(response.status).toBe(200)
  const body = (await response.json()) as {
    data: { kind: string; reason?: string; missing?: string[]; classification?: { types: Array<{ type: string }>; flags: string[]; rationale: string; source: string } }
    meta: { mode: string; model?: string }
  }
  expect(body.meta.mode).toBe('demo')
  expect(body.meta.model).toBe('demo-mock')
  return body.data
}

describe('no-key classify demo', () => {
  it('abstains on the vague Indonesian and English fixtures', async () => {
    for (const text of ['Ada sesuatu di sana.', 'There is something over there.']) {
      const data = await demo(text)
      expect(data.kind).toBe('insufficient')
      expect(data.missing).toEqual(['type', 'volume'])
      expect(data.reason?.toLowerCase()).toContain('demo output')
      expect(data.reason?.toLowerCase()).not.toContain('not trash')
      expect(data).not.toHaveProperty('classification')
    }
  })

  it('returns insufficient for a photo and no description', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')
    delete process.env.GEMINI_API_KEY
    const response = await POST(
      new Request('http://127.0.0.1/api/reports/classify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: '', image: { base64: jpeg, mimeType: 'image/jpeg' } }),
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { data: { kind: string; missing?: string[] }; meta: { model?: string } }
    expect(body.meta.model).toBe('demo-mock')
    expect(body.data.kind).toBe('insufficient')
    expect(body.data.missing).toEqual(['type', 'volume'])
    expect(body.data).not.toHaveProperty('classification')
  })

  it('abstains on a 9-character note with no photo', async () => {
    const data = await demo('123456789')
    expect(data).toMatchObject({
      kind: 'insufficient',
      reason: 'Demo output: this note is too short to estimate the waste type or volume without guessing.',
      missing: ['type', 'volume'],
    })
  })

  it('keeps a labelled mock for a clear plastic or organic report', async () => {
    const plastic = await demo('Ada sampah plastik di gang dekat rumah')
    expect(plastic.kind).toBe('trash')
    if (plastic.kind !== 'trash' || !plastic.classification) throw new Error('expected trash')
    expect(plastic.classification.types).toEqual([{ type: 'plastic', share: 1 }])
    expect(plastic.classification.flags).toEqual(['no_image'])
    expect(plastic.classification.rationale).toBe('Demo output: keyword placeholder because GEMINI_API_KEY is unset.')
    expect(plastic.classification.source).toBe('mock')

    const organic = await demo('Ada sisa organik di dekat rumah')
    expect(organic.kind).toBe('trash')
    if (organic.kind !== 'trash' || !organic.classification) throw new Error('expected trash')
    expect(organic.classification.types).toEqual([{ type: 'organic', share: 1 }])
    expect(organic.classification.rationale).toContain('Demo output:')
    expect(organic.classification.source).toBe('mock')
  })

  it('does not invent a composition for a contradiction or an unknown wrapper', async () => {
    const contradiction = await demo('only food, no plastic, and many plastic bottles')
    expect(contradiction.kind).toBe('insufficient')
    expect(contradiction.missing).toEqual(['type', 'volume'])
    expect(contradiction).not.toHaveProperty('classification')

    const wrapper = await demo('There are wrappers but the material is unknown.')
    expect(wrapper.kind).toBe('insufficient')
    expect(wrapper.missing).toContain('type')
    expect(wrapper).not.toHaveProperty('classification')
  })

  it('reserves not_trash for a clear non-waste description', async () => {
    const data = await demo('Ini kucing peliharaan, bukan sampah')
    expect(data.kind).toBe('not_trash')
    expect(data.reason?.toLowerCase()).toContain('demo output')
  })
})
