import { describe, expect, it } from 'vitest'
import { movableStopIds, ordinaryStopIds, shownUnassigned } from '@/components/planner/route-display'
import { flagsForConfirmation } from '@/components/report/confirmed-flags'
import { HAZARDOUS_LABEL, isSeparateHazard } from '@/components/report/hazard-policy'
import type { ClassificationFlag } from '@/lib/schemas'

const label = HAZARDOUS_LABEL

describe('hazard boundaries', () => {
  it('treats a 0.01 share as hazardous with no flag and no 0.2 cutoff', () => {
    const classification = { types: [{ type: 'hazardous', share: 0.01 }], flags: [] as string[] }
    expect(isSeparateHazard(classification)).toBe(true)
    expect(isSeparateHazard({ types: [{ type: 'hazardous', share: 0.2 }], flags: [] })).toBe(true)
    const flags = flagsForConfirmation({
      baseFlags: ['no_image'],
      hasImage: false,
      includeHazardousPresent: false,
      hazardousShare: 0.01,
    })
    expect(flags).toContain('hazardous_present')
    expect(classification.flags).toEqual([])
  })

  it('keeps a zero share hazardous when the flag is set', () => {
    const original: ClassificationFlag[] = ['no_image', 'hazardous_present']
    expect(isSeparateHazard({ types: [{ type: 'plastic', share: 1 }], flags: original })).toBe(true)
    const flags = flagsForConfirmation({
      baseFlags: original,
      hasImage: false,
      includeHazardousPresent: true,
      hazardousShare: 0,
    })
    expect(flags).toContain('hazardous_present')
    expect(original).toEqual(['no_image', 'hazardous_present'])
  })

  it('clears the confirmed flag at zero share when the warning is unchecked', () => {
    const original: ClassificationFlag[] = ['no_image', 'hazardous_present']
    const classification = { types: [{ type: 'plastic', share: 1 }], flags: [] as string[] }
    expect(isSeparateHazard(classification)).toBe(false)
    const flags = flagsForConfirmation({
      baseFlags: original,
      hasImage: false,
      includeHazardousPresent: false,
      hazardousShare: 0,
    })
    expect(flags).not.toContain('hazardous_present')
    expect(isSeparateHazard({ types: [{ type: 'plastic', share: 1 }], flags })).toBe(false)
    expect(original).toEqual(['no_image', 'hazardous_present'])
  })
})

describe('ordinary route display', () => {
  it('does not list a positive-hazard stop on an ordinary route and still shows it', () => {
    const separate = new Set(['trace'])
    expect(ordinaryStopIds(['quiet', 'trace'], separate)).toEqual(['quiet'])
    expect(movableStopIds(['quiet', 'trace'], [{ id: 'flagged', reason: 'hazardous_separate' }], separate)).toEqual(['quiet'])
    const rows = shownUnassigned(
      [{ id: 'flagged', reason: 'hazardous_separate' }, { id: 'full', reason: 'over_capacity' }],
      ['quiet', 'trace'],
      separate,
    )
    expect(rows.map((row) => row.text)).toEqual([
      `flagged · ${label}`,
      'full · over_capacity',
      `trace · ${label}`,
    ])
    expect(label).toBe('Flagged for special handling by DLH (demo, not sent)')
  })
})
