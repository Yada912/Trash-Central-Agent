import { describe, it, expect } from 'vitest'
import {
  DENPASAR_REGIONS,
  getDesaListByKecamatan,
  getDesaDetails,
  getBanjarsByDesa,
} from '@/lib/data/denpasar-regions'
import { isInsideDenpasar } from '@/lib/geo'

describe('denpasar-regions', () => {
  it('covers all 4 kecamatan in Kota Denpasar with 43 desa / kelurahan', () => {
    expect(DENPASAR_REGIONS.length).toBe(43)
    const barat = getDesaListByKecamatan('Denpasar Barat')
    const selatan = getDesaListByKecamatan('Denpasar Selatan')
    const timur = getDesaListByKecamatan('Denpasar Timur')
    const utara = getDesaListByKecamatan('Denpasar Utara')

    expect(barat.length).toBe(11)
    expect(selatan.length).toBe(10)
    expect(timur.length).toBe(11)
    expect(utara.length).toBe(11)
  })

  it('provides valid GPS coordinates inside Denpasar bounds for every desa', () => {
    for (const region of DENPASAR_REGIONS) {
      expect(isInsideDenpasar(region.lat, region.lng)).toBe(true)
      expect(region.tps3rNode.length).toBeGreaterThan(0)
      expect(region.banjars.length).toBeGreaterThan(0)
    }
  })

  it('resolves desa details and banjars correctly', () => {
    const pemecutan = getDesaDetails('Denpasar Barat', 'Pemecutan')
    expect(pemecutan).toBeDefined()
    expect(pemecutan?.name).toBe('Pemecutan')
    expect(pemecutan?.tps3rNode).toContain('TPS3R Pemecutan')

    const banjars = getBanjarsByDesa('Denpasar Barat', 'Pemecutan')
    expect(banjars).toContain('Banjar Pekambingan')
  })
})
