import { describe, expect, it } from 'vitest'
import { classifierHeading, reasonSentence, storedRecordLabel } from '@/components/report/report-labels'

describe('stored record labels', () => {
  it('does not call a demo-mode save "Not demo data"', () => {
    const label = storedRecordLabel({ isDemo: true, source: 'mock', mode: 'demo' })
    expect(label).toContain('Demo data')
    expect(label).toContain('classification source mock')
    expect(label).toContain('response mode demo')
    expect(label).not.toContain('Not demo data')
  })

  it('separates a live resident row from a seeded row and does not invent a mode', () => {
    expect(storedRecordLabel({ isDemo: true, source: 'mock' })).toContain('Demo data')
    expect(storedRecordLabel({ isDemo: false, source: 'manual' })).toBe('Stored resident report · classification source manual')
    expect(storedRecordLabel({ isDemo: false, source: 'gemini', mode: 'live' })).toContain('response mode live')
    expect(storedRecordLabel({ isDemo: false, source: 'mock', mode: 'demo' })).not.toContain('Not demo data')
  })
})

describe('classifier heading', () => {
  it('names the demo template from the model field', () => {
    expect(classifierHeading('demo', 'demo-mock')).toBe('Demo template result · model demo-mock')
  })

  it('names a live model only when the response includes one', () => {
    expect(classifierHeading('live', 'gemini-2.5-flash')).toBe('AI classification · model gemini-2.5-flash')
    expect(classifierHeading('live', null)).not.toContain('AI classification')
  })

  it('does not call demo-mock live AI when the mode field says live', () => {
    expect(classifierHeading('live', 'demo-mock')).toContain('Demo template')
  })
})

describe('review reason sentences', () => {
  it('does not claim a photo is hard to read when none is attached', () => {
    expect(reasonSentence('low_image_quality', { textLength: 40, hasImage: false })).not.toContain('photo is hard to read')
  })

  it('uses the short-description sentence only when the text is short and there is no photo', () => {
    expect(reasonSentence('insufficient_text', { textLength: 9, hasImage: false })).toContain('very short')
    expect(reasonSentence('insufficient_text', { textLength: 40, hasImage: false })).not.toContain('very short')
  })

  it('labels a cleared hazard and keeps an unknown reason readable', () => {
    expect(reasonSentence('hazard_cleared_by_resident', { textLength: 40, hasImage: false })).toBe(
      'Hazard cleared by resident, needs check',
    )
    expect(reasonSentence('future_reason_code', { textLength: 40, hasImage: true })).toBe('future_reason_code')
  })
})
