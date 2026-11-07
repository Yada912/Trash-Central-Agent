import { describe, expect, it } from 'vitest'
import { explanationFieldLine, explanationHeading, templateTextLabel } from '@/components/planner/explanation-label'

describe('explanation heading', () => {
  it('labels demo-mock as a demo template from the response fields', () => {
    expect(explanationHeading({ mode: 'demo', model: 'demo-mock', modelFieldPresent: true })).toBe(
      'Demo template explanation · model demo-mock',
    )
  })

  it('labels a live model only when mode and model were both returned', () => {
    expect(explanationHeading({ mode: 'live', model: 'gemini-2.5-flash', modelFieldPresent: true })).toBe(
      'AI explanation · model gemini-2.5-flash',
    )
  })

  it('does not infer a live AI explanation when the response omitted model', () => {
    const heading = explanationHeading({ mode: 'live', modelFieldPresent: false })
    expect(heading).toBe('Saved explanation · mode live · model not included')
    expect(heading).not.toContain('AI')
  })

  it('does not infer a template from a missing model just because the API mode is demo', () => {
    const heading = explanationHeading({ mode: 'demo', modelFieldPresent: false })
    expect(heading).toBe('Saved explanation · mode demo · model not included')
    expect(heading).not.toContain('template')
    expect(heading).not.toContain('AI')
  })

  it('does not treat demo-mock as AI when mode is live', () => {
    expect(explanationHeading({ mode: 'live', model: 'demo-mock', modelFieldPresent: true })).toContain('Demo template')
  })

  it('quotes the fields that were actually present', () => {
    expect(explanationFieldLine({ mode: 'demo', model: 'demo-mock', modelFieldPresent: true })).toBe(
      'Response fields: mode demo, model demo-mock. explanation.provenance.source not included.',
    )
    expect(explanationFieldLine({ mode: 'live', modelFieldPresent: false })).toContain('model not included')
    expect(explanationFieldLine({ mode: 'live', modelFieldPresent: false })).toContain('explanation.provenance.source not included')
  })

  it('uses persisted provenance and never heads a template as AI-generated', () => {
    const live = { mode: 'live' as const, model: 'gemini-2.5-flash', modelFieldPresent: true }
    const stored = { provenance: { source: 'template', model: 'demo-template' }, summary: 'Demo output: depot' }
    const heading = explanationHeading(live, stored)
    expect(heading).toBe('Template explanation · source template · model demo-template')
    expect(heading).not.toContain('AI-generated')
    expect(explanationHeading(live, { provenance: { source: 'gemini', model: 'gemini-2.5-flash' } })).toBe(
      'AI explanation · source gemini · model gemini-2.5-flash',
    )
    expect(explanationHeading(live, { provenance: { source: 'gemini', model: 'gemini-2.5-flash' } })).not.toContain('AI-generated')
    expect(explanationFieldLine(live, stored)).toContain('explanation.provenance.source template')
    expect(templateTextLabel(stored)).toBe('Template text')
    expect(templateTextLabel({ provenance: { source: 'gemini', model: 'gemini-2.5-flash' } })).toBeNull()
  })

  it('never heads a template or demo explanation as AI-generated', () => {
    const demo = { mode: 'demo' as const, model: 'demo-mock', modelFieldPresent: true }
    const live = { mode: 'live' as const, model: 'gemini-2.5-flash', modelFieldPresent: true }
    const headings = [
      explanationHeading(demo),
      explanationHeading(demo, { summary: 'Demo output: depot', source: 'template' }),
      explanationHeading(live, { source: 'template', model: 'demo-mock' }),
      explanationHeading({ mode: 'demo', modelFieldPresent: false }),
      explanationHeading(null, { source: 'template' }),
    ]
    for (const heading of headings) expect(heading).not.toContain('AI-generated')
    expect(explanationHeading(live, { source: 'template' })).toBe('Template explanation · source template')
    expect(explanationHeading(demo, { source: 'gemini', model: 'gemini-2.5-flash' })).toBe(
      'AI explanation · source gemini · model gemini-2.5-flash',
    )
    expect(explanationHeading(demo, { source: 'gemini' })).not.toContain('AI-generated')
  })
})
