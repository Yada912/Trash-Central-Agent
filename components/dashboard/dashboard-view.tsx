'use client'

import { useMemo, useState } from 'react'
import { CityMap } from '@/components/map/map-loader'
import { DemoBadge } from '@/components/report/DemoBadge'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { useDashboard } from '@/components/dashboard/use-dashboard'
import { Button } from '@/components/ui/button'
import { DEPOT_FACILITY_ID, DEPOT_LABEL, HAZARDOUS_DEMO_TEXT, HAZARDOUS_HANDLING_TEXT } from '@/lib/copy'
import { isHazardousClassification, KECAMATAN, TRASH_TYPES, type Report } from '@/lib/schemas'

function ReportList({ reports, onSelect, selectedId }: { reports: Report[]; onSelect: (id: string) => void; selectedId: string | null }) {
  if (reports.length === 0) return <p>No reports in this list.</p>
  return (
    <ul className="grid max-h-[32rem] gap-2 overflow-auto">
      {reports.map((report) => (
        <li key={report.id}>
          <button
            type="button"
            onClick={() => onSelect(report.id)}
            aria-pressed={selectedId === report.id}
            className="w-full rounded-md border border-ink/10 bg-card px-3 py-2 text-left"
          >
            <span className="block font-semibold">{report.id}</span>
            <span className="block text-sm">
              {report.kecamatan}
              {report.desa ? ` · ${report.desa}` : ''} · {report.status} · {report.classification.urgency} · {report.classification.volume.liters} L
            </span>
            <span className="block text-sm">{report.classification.types.map((entry) => entry.type).join(', ')}</span>
            {report.isDemo ? <span className="block text-sm">Demo data</span> : null}
            {report.classification.needsReview ? <span className="block text-sm">Needs review</span> : null}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function DashboardView() {
  const { reports, dashboard, meta, error, loading, reload } = useDashboard()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [kecamatan, setKecamatan] = useState('')
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false)
  const hazardous = useMemo(() => reports.filter((report) => isHazardousClassification(report.classification)), [reports])
  const ordinary = useMemo(
    () =>
      reports.filter((report) => {
        if (isHazardousClassification(report.classification)) return false
        if (kecamatan && report.kecamatan !== kecamatan) return false
        if (needsReviewOnly && !report.classification.needsReview) return false
        return true
      }),
    [reports, kecamatan, needsReviewOnly],
  )
  const hazardousVisible = useMemo(
    () => hazardous.filter((report) => !needsReviewOnly || report.classification.needsReview),
    [hazardous, needsReviewOnly],
  )
  const selected = reports.find((report) => report.id === selectedId) ?? null
  const markers = [
    ...(dashboard?.zones.map((zone) => ({
      id: zone.id,
      lat: zone.centroid[0],
      lng: zone.centroid[1],
      color: '#0F766E',
      label: `${zone.id}: ${zone.liters} L, mostly ${zone.dominantType}, ${zone.reportIds.length} reports`,
    })) ?? []),
    ...(dashboard?.facilities.flatMap((facility) => {
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
    }) ?? []),
    ...hazardous.map((report) => ({
      id: report.id,
      lat: report.lat,
      lng: report.lng,
      color: '#B4532A',
      label: `${report.id}. ${HAZARDOUS_HANDLING_TEXT} ${HAZARDOUS_DEMO_TEXT}`,
    })),
    ...(selected ? [{ id: `selected-${selected.id}`, lat: selected.lat, lng: selected.lng, color: '#1D4E89', label: selected.id }] : []),
  ]

  return (
    <main id="main" className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DemoBadge mode={meta?.mode} />
        {reports.some((report) => report.isDemo) ? <span className="rounded-md border border-gold px-2 py-1 text-sm font-semibold">DEMO — synthetic reports</span> : null}
      </div>
      <p className="text-sm">Coordinates on seeded reports are approximate fixtures, not dispatch points. TPA Suwung is a {DEPOT_LABEL}.</p>
      <ErrorNotice message={error} />
      {loading ? <p>Loading reports…</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void reload()} disabled={loading}>
          Refresh reports
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Kecamatan
          <select className="rounded-md border border-ink/15 bg-card px-2 py-2" value={kecamatan} onChange={(event) => setKecamatan(event.target.value)}>
            <option value="">All</option>
            {KECAMATAN.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={needsReviewOnly} onChange={(event) => setNeedsReviewOnly(event.target.checked)} />
          Needs review
        </label>
      </div>
      {dashboard ? (
        <div className="grid gap-4 md:grid-cols-3">
          <section aria-labelledby="by-type" className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 id="by-type" className="font-semibold">Litres by type</h2>
            <ul className="mt-2 text-sm">
              {TRASH_TYPES.map((type) => (
                <li key={type}>
                  {type}: {dashboard.totals.byType[type]}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="by-area" className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 id="by-area" className="font-semibold">By kecamatan</h2>
            <ul className="mt-2 text-sm">
              {KECAMATAN.map((name) => (
                <li key={name}>
                  {name}: {dashboard.totals.byKecamatan[name].reports} reports, {dashboard.totals.byKecamatan[name].liters} L
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="by-urgency" className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 id="by-urgency" className="font-semibold">By urgency</h2>
            <ul className="mt-2 text-sm">
              <li>high: {dashboard.totals.byUrgency.high}</li>
              <li>medium: {dashboard.totals.byUrgency.medium}</li>
              <li>low: {dashboard.totals.byUrgency.low}</li>
            </ul>
          </section>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <CityMap markers={markers} height="420px" />
        <section aria-labelledby="report-list" className="grid gap-3">
          <h2 id="report-list" className="text-xl font-semibold">
            Reports
          </h2>
          <ReportList reports={ordinary} onSelect={setSelectedId} selectedId={selectedId} />
        </section>
      </div>
      <section aria-labelledby="hazardous-list" className="grid gap-3">
        <h2 id="hazardous-list" className="text-xl font-semibold">
          Hazardous reports
        </h2>
        <p>
          {HAZARDOUS_HANDLING_TEXT} <span className="font-semibold">{HAZARDOUS_DEMO_TEXT}</span>
        </p>
        <ReportList reports={hazardousVisible} onSelect={setSelectedId} selectedId={selectedId} />
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
