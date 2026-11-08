import type { Facility, Kecamatan, Plan, Report, ReportStatus } from '@/lib/schemas'

export type ReportQuery = {
  kecamatan?: Kecamatan
  status?: ReportStatus
  since?: string
}

export interface Store {
  listReports(query?: ReportQuery): Promise<Report[]>
  getReport(id: string): Promise<Report | null>
  createReport(
    report: Report,
    idempotency?: { key: string; bodyHash: string },
  ): Promise<{ status: 'created' | 'replay'; report: Report } | { status: 'conflict' }>
  updateReport(id: string, patch: Partial<Pick<Report, 'status' | 'collectionAudit' | 'accountId'>>): Promise<Report | null>
  listFacilities(): Promise<Facility[]>
  getPlan(id: string): Promise<Plan | null>
  savePlan(plan: Plan): Promise<Plan>
}
