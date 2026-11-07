import { afterEach, describe, expect, it } from 'vitest'
import { savedReportIsDemo } from '@/lib/reports/demo-mode'

const previous = process.env.GEMINI_API_KEY

afterEach(() => {
  if (previous === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = previous
})

describe('savedReportIsDemo', () => {
  it('is true only when the Gemini key is unset', () => {
    delete process.env.GEMINI_API_KEY
    expect(savedReportIsDemo()).toBe(true)
    process.env.GEMINI_API_KEY = 'test-key'
    expect(savedReportIsDemo()).toBe(false)
  })
})
