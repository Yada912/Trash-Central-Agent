'use client'

import { useMemo, useState } from 'react'
import { EMPTY_FILTERS, filterDashboard, filtersAreActive, type ReportListFilters } from '@/components/dashboard/filter-reports'
import { CityMap } from '@/components/map/map-loader'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { useDashboard } from '@/components/dashboard/use-dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DEPOT_FACILITY_ID, DEPOT_LABEL } from '@/lib/copy'
import { HAZARDOUS_LABEL } from '@/components/report/hazard-policy'
import { KECAMATAN, REPORT_STATUSES, TRASH_TYPES, type Report } from '@/lib/schemas'
import { storedRecordLabel } from '@/components/report/report-labels'

function ReportList({ reports, onSelect, selectedId }: { reports: Report[]; onSelect: (id: string) => void; selectedId: string | null }) {
  if (reports.length === 0) return <p>No reports in this list.</p>
  return (
    <ul className="grid max-h-[32rem] gap-2 overflow-auto">
      {reports.map((report) => {
        const selected = selectedId === report.id
        return (
          <li key={report.id}>
            <button
              type="button"
              onClick={() => onSelect(report.id)}
              aria-pressed={selected}
              className={
                selected
                  ? 'w-full rounded-md border-2 border-primary bg-card px-3 py-2 text-left'
                  : 'w-full rounded-md border border-ink/10 bg-card px-3 py-2 text-left'
              }
            >
              <span className="block font-semibold">{report.id}</span>
              <span className="block text-sm">
                {report.kecamatan}
                {report.desa ? ` · ${report.desa}` : ''} · {report.status} · {report.classification.urgency} · {report.classification.volume.liters} L
              </span>
              <span className="block text-sm">{report.classification.types.map((entry) => entry.type).join(', ')}</span>
              <span className="block text-sm">{storedRecordLabel({ isDemo: report.isDemo, source: report.classification.source })}</span>
              {report.classification.needsReview ? <span className="block text-sm font-semibold text-alert">Needs review</span> : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function DashboardView() {
  const { reports, dashboard, meta, error, loading, reload } = useDashboard()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReportListFilters>(EMPTY_FILTERS)
  const view = useMemo(
    () => filterDashboard(reports, dashboard?.facilities ?? [], filters),
    [reports, dashboard?.facilities, filters],
  )
  const selected = view.visible.find((report) => report.id === selectedId) ?? null
  const filtersActive = filtersAreActive(filters)
  const markers = [
    ...view.aggregate.zones.map((zone) => ({
      id: zone.id,
      lat: zone.centroid[0],
      lng: zone.centroid[1],
      color: '#0F766E',
      label: `${zone.id}: ${zone.liters} L, mostly ${zone.dominantType}, ${zone.reportIds.length} reports`,
    })),
    ...view.aggregate.facilities.flatMap((facility) => {
      if (facility.lat === null || facility.lng === null) return []
      const depot = facility.id === DEPOT_FACILITY_ID
      return [
        {
          id: facility.id,
          lat: facility.lat,
          lng: facility.lng,
          color: depot ? '#C8A24A' : '#1F2933',
          label: depot ? `${facility.name}. ${DEPOT_LABEL}` : `${facility.name}. Published point only.`,
        },
      ]
    }),
    ...view.hazardous.map((report) => ({
      id: report.id,
      lat: report.lat,
      lng: report.lng,
      color: '#B4532A',
      label: `${report.id}. ${HAZARDOUS_LABEL}`,
    })),
    ...(selected ? [{ id: `selected-${selected.id}`, lat: selected.lat, lng: selected.lng, color: '#1D4E89', label: selected.id }] : []),
  ]

  function patch(next: Partial<ReportListFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  return (
    <main id="main" className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Officer view</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="max-w-3xl text-lg">Watch the reports. Set the priority.</p>
        {meta ? <p className="text-sm">API mode: {meta.mode}. This is the mode on the dashboard response, not a label for each stored report.</p> : null}
        {reports.some((report) => report.isDemo) ? (
          <p className="w-fit rounded-md border border-gold px-2 py-1 text-sm font-semibold">DEMO — synthetic reports</p>
        ) : null}
      </div>
      <p className="text-sm">Coordinates on seeded reports are approximate fixtures, not dispatch points. TPA Suwung is a {DEPOT_LABEL}.</p>
      <ErrorNotice message={error} />
      {loading ? <p>Loading reports…</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void reload()} disabled={loading}>
          Refresh reports
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2 rounded-lg border border-ink/10 bg-card p-4">
          <Label htmlFor="filter-kecamatan">Kecamatan</Label>
          <Select id="filter-kecamatan" value={filters.kecamatan} onChange={(event) => patch({ kecamatan: event.target.value })}>
            <option value="">All</option>
            {KECAMATAN.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2 rounded-lg border border-ink/10 bg-card p-4">
          <Label htmlFor="filter-status">Status</Label>
          <Select id="filter-status" value={filters.status} onChange={(event) => patch({ status: event.target.value as ReportListFilters['status'] })}>
            <option value="">All</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2 rounded-lg border border-ink/10 bg-card p-4">
          <Label htmlFor="filter-since">Since</Label>
          <Input id="filter-since" type="date" value={filters.since} onChange={(event) => patch({ since: event.target.value })} />
        </div>
        <div className="grid content-start gap-2 rounded-lg border border-ink/10 bg-card p-4">
          <p className="text-sm font-semibold">Needs review</p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={filters.needsReviewOnly}
              onChange={(event) => patch({ needsReviewOnly: event.target.checked })}
            />
            Needs review
          </label>
        </div>
      </div>
      <p className="text-sm" aria-live="polite">
        {filtersActive
          ? 'Totals, map clusters, and both lists count only reports that match these filters. They are not the unfiltered city totals.'
          : 'Totals, map clusters, and both lists count every loaded report.'}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <section aria-labelledby="reported-litres" className="rounded-lg border border-ink/10 bg-card p-4">
          <h2 id="reported-litres" className="text-sm font-semibold text-primary">
            Reported litres
          </h2>
          <p className="mt-2 text-3xl font-semibold" data-testid="reported-litres">
            {view.reportedLiters} L
          </p>
          <p className="mt-1 text-sm">{view.visible.length} reports in this filter</p>
        </section>
        <section aria-labelledby="by-type" className="rounded-lg border border-ink/10 bg-card p-4">
          <h2 id="by-type" className="text-sm font-semibold text-primary">
            Litres by type
          </h2>
          <ul className="mt-2 text-sm">
            {TRASH_TYPES.map((type) => (
              <li key={type} data-testid={`litres-${type}`}>
                {type}: {view.aggregate.totals.byType[type]}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-area" className="rounded-lg border border-ink/10 bg-card p-4">
          <h2 id="by-area" className="text-sm font-semibold text-primary">
            By kecamatan
          </h2>
          <ul className="mt-2 text-sm">
            {KECAMATAN.map((name) => (
              <li key={name}>
                {name}: {view.aggregate.totals.byKecamatan[name].reports} reports, {view.aggregate.totals.byKecamatan[name].liters} L
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-urgency" className="rounded-lg border border-ink/10 bg-card p-4">
          <h2 id="by-urgency" className="text-sm font-semibold text-primary">
            By urgency
          </h2>
          <ul className="mt-2 text-sm">
            <li>high: {view.aggregate.totals.byUrgency.high}</li>
            <li>medium: {view.aggregate.totals.byUrgency.medium}</li>
            <li>low: {view.aggregate.totals.byUrgency.low}</li>
          </ul>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="map-heading" className="grid gap-2">
          <h2 id="map-heading" className="text-xl font-semibold">
            Map clusters
          </h2>
          <p className="text-sm">Clusters are ordinary reports in this filter. Hazardous reports are separate markers. The list beside the map is the keyboard alternative.</p>
          <CityMap markers={markers} height="420px" />
        </section>
        <section aria-labelledby="report-list" className="grid gap-3">
          <h2 id="report-list" className="text-xl font-semibold">
            Reports
          </h2>
          <ReportList reports={view.ordinary} onSelect={setSelectedId} selectedId={selected?.id ?? null} />
        </section>
      </div>
      <section aria-labelledby="hazardous-list" className="grid gap-3 rounded-lg border border-alert/30 bg-alert/10 p-4">
        <h2 id="hazardous-list" className="text-xl font-semibold">
          Hazardous reports
        </h2>
        <p>{HAZARDOUS_LABEL}</p>
        <ReportList reports={view.hazardous} onSelect={setSelectedId} selectedId={selected?.id ?? null} />
      </section>
      {dashboard ? (
        <section aria-labelledby="facilities" className="grid gap-2">
          <h2 id="facilities" className="text-xl font-semibold">
            Facilities
          </h2>
          <ul className="grid gap-2 text-sm">
            {dashboard.facilities.map((facility) => (
              <li key={facility.id} className="rounded-md border border-ink/10 bg-card px-3 py-2">
                <span className="font-semibold">{facility.name}</span> · {facility.kind}
                {facility.id === DEPOT_FACILITY_ID ? ` · ${DEPOT_LABEL}` : ''}
                {facility.verified ? ' · published point only' : ''}
                {facility.address ? ` · ${facility.address}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
