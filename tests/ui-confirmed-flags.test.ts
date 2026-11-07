import { describe, expect, it } from 'vitest'
import { flagsForConfirmation } from '@/components/report/confirmed-flags'
import { initialHazardWarning, nextHazardWarning } from '@/components/report/hazard-warning-state'
import type { ClassificationFlag } from '@/lib/schemas'

const base: ClassificationFlag[] = ['no_image', 'hazardous_present', 'low_image_quality']

describe('confirmed flags', () => {
  it('drops hazardous_present when the resident does not keep the warning', () => {
    const flags = flagsForConfirmation({ baseFlags: base, hasImage: false, includeHazardousPresent: false, hazardousShare: 0 })
    expect(flags).not.toContain('hazardous_present')
    expect(base).toEqual(['no_image', 'hazardous_present', 'low_image_quality'])
  })

  it('keeps hazardous_present only when the warning is checked, including at share 0', () => {
    const flags = flagsForConfirmation({ baseFlags: ['no_image'], hasImage: false, includeHazardousPresent: true, hazardousShare: 0 })
    expect(flags).toContain('hazardous_present')
  })

  it('does not send a photo-quality flag when no photo is confirmed', () => {
    const flags = flagsForConfirmation({ baseFlags: base, hasImage: false, includeHazardousPresent: false, hazardousShare: 0 })
    expect(flags).toContain('no_image')
    expect(flags).not.toContain('low_image_quality')
  })

  it('drops a quality flag that arrived with no_image even if a photo is added later', () => {
    const flags = flagsForConfirmation({ baseFlags: base, hasImage: true, includeHazardousPresent: false, hazardousShare: 0 })
    expect(flags).not.toContain('no_image')
    expect(flags).not.toContain('low_image_quality')
  })

  it('keeps low_image_quality when the classifier saw a photo', () => {
    const flags = flagsForConfirmation({
      baseFlags: ['low_image_quality'],
      hasImage: true,
      includeHazardousPresent: false,
      hazardousShare: 0,
    })
    expect(flags).toEqual(['low_image_quality'])
  })
})

describe('hazard warning state', () => {
  it('starts unchecked when the hazardous share is 0, even if the classifier set the flag', () => {
    expect(initialHazardWarning(['hazardous_present'], 0)).toEqual({ checked: false, explicit: false })
  })

  it('starts checked when the classifier flag matches a non-zero share', () => {
    expect(initialHazardWarning(['hazardous_present', 'no_image'], 100)).toEqual({ checked: true, explicit: false })
  })

  it('does not invent the flag for a hazardous share the classifier did not flag', () => {
    expect(initialHazardWarning(['no_image'], 100)).toEqual({ checked: false, explicit: false })
  })

  it('clears the warning when the share is corrected to 0', () => {
    const started = initialHazardWarning(['hazardous_present'], 100)
    expect(nextHazardWarning(started, 0)).toEqual({ checked: false, explicit: false })
  })

  it('leaves an explicit warning in place after the share is set to 0', () => {
    expect(nextHazardWarning({ checked: true, explicit: true }, 0)).toEqual({ checked: true, explicit: true })
  })

  it('does not check the warning just because the share becomes large', () => {
    expect(nextHazardWarning({ checked: false, explicit: false }, 80)).toEqual({ checked: false, explicit: false })
  })
})
