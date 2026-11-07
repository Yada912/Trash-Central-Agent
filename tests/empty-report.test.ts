import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { POST as classify } from '@/app/api/reports/classify/route'
import { POST as createReport } from '@/app/api/reports/route'
import type { Report } from '@/lib/schemas'
import { resetMemoryStoreForTests } from '@/lib/store/memory'

afterEach(() => {
  resetMemoryStoreForTests()
  delete process.env.GEMINI_API_KEY
})

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')

const classification = {
  types: [{ type: 'plastic' as const, share: 1 }],
  volume: { liters: 40, label: 'small' as const },
  urgency: 'medium' as const,
  confidence: 0.9,
  rationale: 'Checked by the resident.',
  flags: [] as const,
  needsReview: false,
  reviewReasons: [] as const,
  source: 'manual' as const,
}

function reportBody(text: string, image?: { base64: string; mimeType: string }) {
  return {
    text,
    lat: -8.65,
    lng: 115.22,
    classification,
    ...(image ? { image } : {}),
  }
}

describe('photo or text', () => {
  it('accepts a photo without text and does not invent a description', async () => {
    const response = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reportBody('', { base64: jpeg, mimeType: 'image/jpeg' })),
      }),
    )
    expect(response.status).toBe(201)
    const body = (await response.json()) as { data: Report }
    expect(body.data.description).toBe('')
    expect(body.data.photoUrl?.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(body.data.description).not.toMatch(/photo|image|pile/i)
  })

  it('accepts text without a photo', async () => {
    const response = await createReport(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reportBody('A pile of plastic bottles beside the lane')),
      }),
    )
    expect(response.status).toBe(201)
    const body = (await response.json()) as { data: Report }
    expect(body.data.description).toBe('A pile of plastic bottles beside the lane')
    expect(body.data.photoUrl).toBeUndefined()
  })

  it('rejects an empty report and whitespace with no photo', async () => {
    for (const text of ['', '   \n\t']) {
      const created = await createReport(
        new Request('http://localhost/api/reports', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(reportBody(text)),
        }),
      )
      expect(created.status).toBe(400)
      const createdBody = (await created.json()) as { error: { code: string } }
      expect(createdBody.error.code).toBe('empty_report')

      const classified = await classify(
        new Request('http://localhost/api/reports/classify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        }),
      )
      expect(classified.status).toBe(400)
      const classifiedBody = (await classified.json()) as { error: { code: string } }
      expect(classifiedBody.error.code).toBe('empty_report')
    }
  })
})
