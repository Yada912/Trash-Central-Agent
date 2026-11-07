import { describe, expect, it } from 'vitest'
import { WASTE_STREAMS } from '@/lib/schemas'
import { SOURCE_GUIDE_CITATION, SOURCE_GUIDE_LABELS, SOURCE_TO_STREAM, SOURCE_TYPES } from '@/lib/schedule/sourceTypes'

describe('source type guide', () => {
  it('maps every source type to a valid waste stream', () => {
    expect(Object.isFrozen(SOURCE_TO_STREAM)).toBe(true)
    for (const source of SOURCE_TYPES) {
      expect(WASTE_STREAMS).toContain(SOURCE_TO_STREAM[source])
      expect(SOURCE_GUIDE_LABELS[source].citation).toBe(SOURCE_GUIDE_CITATION)
      expect(SOURCE_GUIDE_LABELS[source].id.length).toBeGreaterThan(0)
      expect(SOURCE_GUIDE_LABELS[source].en.length).toBeGreaterThan(0)
    }
  })
})
