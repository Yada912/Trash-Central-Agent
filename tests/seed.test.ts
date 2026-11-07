import { describe, expect, it } from 'vitest'
import facilities from '@/data/facilities.json'
import reports from '@/data/reports.json'
import { isHazardousClassification } from '@/lib/schemas'
import { accountTypeForSeed, mapSeedFacility, mapSeedReport, type SeedFacility, type SeedReport } from '@/lib/store/map-seed'

describe('seed data', () => {
  it('maps every demo report and facility through the contract', () => {
    const mapped = (reports as SeedReport[]).map((report) => mapSeedReport(report))
    expect(mapped).toHaveLength(150)
    expect(mapped.every((report) => report.isDemo && report.provenance === 'synthetic')).toBe(true)
    const households = mapped.filter((report) => report.accountType === 'household')
    expect(households.length / mapped.length).toBeGreaterThan(0.7)
    expect(households.length / mapped.length).toBeLessThan(0.9)
    expect(mapped.some((report) => report.accountType === 'company')).toBe(true)
    expect(mapped.every((report) => report.accountType === accountTypeForSeed(report.id))).toBe(true)
    const hazardous = mapped.filter((report) => isHazardousClassification(report.classification))
    expect(hazardous.length).toBeGreaterThan(0)
    expect(hazardous.every((report) => report.classification.flags.includes('hazardous_present'))).toBe(true)
    const places = (facilities as SeedFacility[]).map((facility) => mapSeedFacility(facility))
    expect(places.map((facility) => facility.id)).toContain('dps-tpa-suwung')
    expect(places.every((facility) => facility.lat !== null && facility.lng !== null)).toBe(true)
  })
})
