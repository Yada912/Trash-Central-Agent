import { aggregateDashboard } from '@/lib/dashboard/aggregate'
import { isSeparateHazard } from '@/components/report/hazard-policy'
import type { Dashboard, Report, ReportStatus } from '@/lib/schemas'

export type ReportListFilters = {
  kecamatan: string
  status: '' | ReportStatus
  since: string
  needsReviewOnly: boolean
}

export const EMPTY_FILTERS: ReportListFilters = {
  kecamatan: '',
  status: '',
  since: '',
  needsReviewOnly: false,
}

export function filtersAreActive(filters: ReportListFilters): boolean {
  return Boolean(filters.kecamatan || filters.status || filters.since || filters.needsReviewOnly)
}

export function reportMatchesFilters(report: Report, filters: ReportListFilters): boolean {
  if (filters.kecamatan && report.kecamatan !== filters.kecamatan) return false
  if (filters.status && report.status !== filters.status) return false
  if (filters.needsReviewOnly && !report.classification.needsReview) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(filters.since) && report.createdAt.slice(0, 10) < filters.since) return false
  return true
}

export function filterDashboard(reports: Report[], facilities: Dashboard['facilities'], filters: ReportListFilters) {
  const visible = reports.filter((report) => reportMatchesFilters(report, filters))
  const hazardous = visible.filter((report) => isSeparateHazard(report.classification))
  const ordinary = visible.filter((report) => !isSeparateHazard(report.classification))
  const totals = aggregateDashboard(visible, facilities)
  const ordinaryZones = aggregateDashboard(ordinary, facilities).zones
  return {
    visible,
    hazardous,
    ordinary,
    aggregate: { ...totals, zones: ordinaryZones },
    reportedLiters: visible.reduce((total, report) => total + report.classification.volume.liters, 0),
  }
}
