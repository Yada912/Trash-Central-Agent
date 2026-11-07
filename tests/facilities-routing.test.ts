import { describe, expect, it } from 'vitest'
import { hasMapCoordinates } from '@/lib/plans/build-input'

describe('bank sampah coordinates', () => {
  it('never treats a null-coordinate site as a routable point', () => {
    const sites = [
      { id: 'bank-sampah-1', kind: 'bank sampah', lat: null, lng: null },
      { id: 'dps-tpa-suwung', kind: 'TPA', lat: -8.7193435, lng: 115.2205973 },
    ]
    expect(sites.filter((site) => hasMapCoordinates(site)).map((site) => site.id)).toEqual(['dps-tpa-suwung'])
  })
})
