import facilitiesJson from '@/data/facilities.json'
import reportsJson from '@/data/reports.json'
import type { Facility, Plan, Report } from '@/lib/schemas'
import { mapSeedFacility, mapSeedReport, type SeedFacility, type SeedReport } from '@/lib/store/map-seed'
import type { ReportQuery, Store } from '@/lib/store/types'

type MemoryState = {
  reports: Report[]
  facilities: Facility[]
  plans: Plan[]
  idempotency: Record<string, { reportId: string; bodyHash: string }>
}

const globalStore = globalThis as typeof globalThis & { __ctaMemory?: MemoryState }

function state(): MemoryState {
  if (!globalStore.__ctaMemory) {
    globalStore.__ctaMemory = {
      reports: (reportsJson as SeedReport[]).map((report) => mapSeedReport(report)),
      facilities: (facilitiesJson as SeedFacility[]).map((facility) => mapSeedFacility(facility)),
      plans: [],
      idempotency: {},
    }
  }
  return globalStore.__ctaMemory
}

function matches(report: Report, query?: ReportQuery): boolean {
  if (!query) return true
  if (query.kecamatan && report.kecamatan !== query.kecamatan) return false
  if (query.status && report.status !== query.status) return false
  if (query.since && Date.parse(report.createdAt) < Date.parse(query.since)) return false
  return true
}

export function getMemoryStore(): Store {
  return {
    async listReports(query) {
      return state()
        .reports.filter((report) => matches(report, query))
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : a.id.localeCompare(b.id)))
    },
    async getReport(id) {
      return state().reports.find((report) => report.id === id) ?? null
    },
    async createReport(report, idempotency) {
      const memory = state()
      if (idempotency) {
        const existing = memory.idempotency[idempotency.key]
        if (existing) {
          if (existing.bodyHash !== idempotency.bodyHash) return { status: 'conflict' }
          const saved = memory.reports.find((item) => item.id === existing.reportId)
          if (saved) return { status: 'replay', report: saved }
        }
      }
      memory.reports.unshift(report)
      if (idempotency) memory.idempotency[idempotency.key] = { reportId: report.id, bodyHash: idempotency.bodyHash }
      return { status: 'created', report }
    },
    async updateReport(id, patch) {
      const reports = state().reports
      const index = reports.findIndex((report) => report.id === id)
      if (index < 0) return null
      const next = { ...reports[index], ...patch }
      reports[index] = next
      return next
    },
    async listFacilities() {
      return state().facilities.slice()
    },
    async getPlan(id) {
      return state().plans.find((plan) => plan.id === id) ?? null
    },
    async savePlan(plan) {
      const plans = state().plans
      const index = plans.findIndex((item) => item.id === plan.id)
      if (index >= 0) plans[index] = plan
      else plans.unshift(plan)
      return plan
    },
  }
}

export function resetMemoryStoreForTests(): void {
  globalStore.__ctaMemory = undefined
}
