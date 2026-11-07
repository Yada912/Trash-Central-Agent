import { describe, expect, it } from 'vitest'
import { classificationWasEdited } from '@/lib/reports/compare'
import { stampClassification } from '@/lib/review'
import { evaluateRoutes, solvePlan } from '@/lib/planner/vrp'
import { isHazardousClassification, type Classification } from '@/lib/schemas'

const text = 'A pile of plastic bottles beside the lane'

function draft(share: number, flags: Classification['flags']): Omit<Classification, 'needsReview' | 'reviewReasons' | 'source'> {
  const types =
    share > 0
      ? [
          { type: 'hazardous' as const, share },
          { type: 'residual' as const, share: Number((1 - share).toFixed(2)) },
        ]
      : [{ type: 'residual' as const, share: 1 }]
  return {
    types,
    volume: { liters: 40, label: 'small' },
    urgency: 'medium',
    confidence: 0.9,
    rationale: 'Entered by the resident.',
    flags,
  }
}

describe('isHazardousClassification', () => {
  it('is false at share 0 with no flag, and true for a flag or any share above 0', () => {
    expect(isHazardousClassification(draft(0, []))).toBe(false)
    expect(isHazardousClassification(draft(0, ['hazardous_present']))).toBe(true)
    expect(isHazardousClassification(draft(0.01, []))).toBe(true)
    expect(isHazardousClassification(draft(0.2, []))).toBe(true)
  })

  it('forces the flag when the share is above 0 and keeps an explicit flag at share 0', () => {
    const trace = stampClassification(draft(0.01, []), { text, hasImage: true, source: 'manual' })
    const fifth = stampClassification(draft(0.2, []), { text, hasImage: true, source: 'manual' })
    const flagged = stampClassification(draft(0, ['hazardous_present']), { text, hasImage: true, source: 'manual' })
    const ordinary = stampClassification(draft(0, []), { text, hasImage: true, source: 'manual' })
    expect(trace.flags).toContain('hazardous_present')
    expect(fifth.flags).toContain('hazardous_present')
    expect(flagged.flags).toContain('hazardous_present')
    expect(ordinary.flags).not.toContain('hazardous_present')
    for (const saved of [trace, fifth, flagged]) {
      expect(saved.needsReview).toBe(true)
      expect(saved.reviewReasons).toContain('hazardous')
      expect(isHazardousClassification(saved)).toBe(true)
    }
    expect(isHazardousClassification(ordinary)).toBe(false)
    expect(ordinary.needsReview).toBe(false)
  })

  it('clears a forced flag when the share is set to 0 and hazardous is unchecked', () => {
    const ai = stampClassification(draft(0.4, []), { text, hasImage: true, source: 'mock' })
    expect(ai.flags).toContain('hazardous_present')
    const corrected = stampClassification(draft(0, []), { text, hasImage: true, source: 'manual' })
    expect(corrected.flags).not.toContain('hazardous_present')
    expect(isHazardousClassification(corrected)).toBe(false)
    expect(ai.flags).toContain('hazardous_present')
    expect(classificationWasEdited(draft(0, []) as Classification, ai)).toBe(true)
    const stillChecked = stampClassification(draft(0, ['hazardous_present']), { text, hasImage: true, source: 'manual' })
    expect(stillChecked.flags).toContain('hazardous_present')
    expect(isHazardousClassification(stillChecked)).toBe(true)
  })
})

describe('hazardous stops stay off ordinary routes', () => {
  const depot = { lat: -8.67, lng: 115.21, name: 'TPA Suwung', label: 'simulated depot (operational status unverified)' }

  function stop(id: string, hazardous: boolean) {
    return { id, lat: -8.66, lng: 115.22, liters: 10, urgency: 'low' as const, hazardous }
  }

  it('routes a share of 0 with no flag and excludes 0.01', () => {
    const ordinary = solvePlan({
      depot,
      trucks: [{ id: 't1', capacityLiters: 1000 }],
      crews: 1,
      shift: { start: '06:00', end: '18:00' },
      stops: [stop('plain', isHazardousClassification(draft(0, [])))],
    })
    expect(ordinary.routes[0]?.stopIds).toEqual(['plain'])
    expect(ordinary.unassigned).toEqual([])

    const trace = solvePlan({
      depot,
      trucks: [{ id: 't1', capacityLiters: 1000 }],
      crews: 1,
      shift: { start: '06:00', end: '18:00' },
      stops: [stop('trace', isHazardousClassification(draft(0.01, [])))],
    })
    expect(trace.routes[0]?.stopIds).toEqual([])
    expect(trace.unassigned).toEqual([{ id: 'trace', reason: 'hazardous_separate' }])
  })

  it('marks a hazardous stop forced onto a route as infeasible', () => {
    const hazardous = isHazardousClassification(draft(0.01, []))
    const scenario = {
      depot,
      trucks: [{ id: 't1', capacityLiters: 1000 }],
      crews: 1,
      shift: { start: '06:00', end: '18:00' },
      stops: [stop('trace', hazardous)],
    }
    const [route] = evaluateRoutes([{ truckId: 't1', stopIds: ['trace'], capacityLiters: 1000 }], scenario)
    expect(hazardous).toBe(true)
    expect(route?.feasible).toBe(false)
    expect(route?.violations).toContain('hazardous_separate')
  })
})
