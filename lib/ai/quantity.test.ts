import { describe, expect, it } from 'vitest'
import { estimateHouseholdReport } from '@/lib/ai/quantity'

describe('household quantity estimates', () => {
  it('maps counted bags and bottles to litres and a mixed composition', () => {
    const estimate = estimateHouseholdReport('dua kantong sisa canang dan daun, satu botol plastik')
    expect(estimate).not.toBeNull()
    expect(estimate?.liters).toBe(31)
    expect(estimate?.types.map((entry) => entry.type).sort()).toEqual(['organic', 'plastic'])
    expect(estimate?.flags).not.toContain('hazardous_present')
  })

  it('treats a pile in the demo sentence as a provisional volume', () => {
    const estimate = estimateHouseholdReport(
      'Ada tumpukan sampah plastik dan sisa makanan di pinggir jalan dekat pasar',
    )
    expect(estimate?.liters).toBe(40)
    expect(estimate?.confidence).toBeLessThan(0.5)
    expect(estimate?.flags).toContain('insufficient_text')
    expect(estimate?.types.map((entry) => entry.type).sort()).toEqual(['organic', 'plastic'])
  })

  it('flags batteries, paint, and medical waste even without an amount', () => {
    const paint = estimateHouseholdReport('Ada baterai bocor dan kaleng cat di dekat jalur pejalan kaki')
    expect(paint?.flags).toContain('hazardous_present')
    expect(paint?.types).toEqual([{ type: 'hazardous', share: 1 }])
    expect(paint?.urgency).toBe('high')

    const medical = estimateHouseholdReport('Ada jarum suntik dan obat di trotoar')
    expect(medical?.flags).toContain('hazardous_present')
    expect(medical?.types.some((entry) => entry.type === 'hazardous')).toBe(true)
  })

  it('maps karung, kresek, ember, and tas counts', () => {
    expect(estimateHouseholdReport('Wenten luu plastik 3 karung')?.liters).toBe(150)
    expect(estimateHouseholdReport('empat kresek daun')?.liters).toBe(60)
    expect(estimateHouseholdReport('satu ember sisa makanan')?.liters).toBe(10)
    expect(estimateHouseholdReport('dua tas kardus')?.liters).toBe(40)
  })

  it('does not invent a volume for a short or vague note', () => {
    expect(estimateHouseholdReport('plastik')).toBeNull()
    expect(estimateHouseholdReport('Ada sesuatu di sana')).toBeNull()
    expect(estimateHouseholdReport('Ada sampah plastik di gang dekat rumah')).toBeNull()
  })
})
