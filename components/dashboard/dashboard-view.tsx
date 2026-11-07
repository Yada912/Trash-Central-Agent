'use client'

import { useMemo, useState } from 'react'
import { EMPTY_FILTERS, filterDashboard, filtersAreActive, type ReportListFilters } from '@/components/dashboard/filter-reports'
import { CityMap } from '@/components/map/map-loader'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { useDashboard } from '@/components/dashboard/use-dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { DEPOT_FACILITY_ID, DEPOT_LABEL } from '@/lib/copy'
import { HAZARDOUS_LABEL } from '@/components/report/hazard-policy'
import { KECAMATAN, REPORT_STATUSES, TRASH_TYPES, type Report } from '@/lib/schemas'
import { storedRecordLabel } from '@/components/report/report-labels'

function ReportList({ reports, onSelect, selectedId }: { reports: Report[]; onSelect: (id: string) => void; selectedId: string | null }) {
  if (reports.length === 0) return <p className="text-sm font-semibold">Tidak ada laporan pada daftar ini.</p>
  return (
    <ul className="grid max-h-[32rem] gap-2.5 overflow-auto pr-1">
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
                  ? 'vector-card w-full bg-mint/45 px-3.5 py-2.5 text-left'
                  : 'vector-card-soft w-full bg-card hover:bg-amber/20 px-3.5 py-2.5 text-left'
              }
            >
              <span className="block font-extrabold">{report.id}</span>
              <span className="block text-sm font-medium">
                {report.kecamatan}
                {report.desa ? ` · ${report.desa}` : ''} · {report.status} · {report.classification.urgency} · {report.classification.volume.liters} L
              </span>
              <span className="block text-sm">{report.classification.types.map((entry) => entry.type).join(', ')}</span>
              <span className="block text-xs text-ink/75">{storedRecordLabel({ isDemo: report.isDemo, source: report.classification.source })}</span>
              {report.classification.needsReview ? <span className="block text-xs font-extrabold text-alert mt-0.5">Perlu tinjauan</span> : null}
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
      label: `${zone.id}: ${zone.liters} L, mayoritas ${zone.dominantType}, ${zone.reportIds.length} laporan`,
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
          label: depot ? `${facility.name}. ${DEPOT_LABEL}` : `${facility.name}. Titik referensi terpublikasi.`,
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
      <div className="vector-card bg-card p-6 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="vector-pill bg-sky text-ink tilt-left">
              <MaterialIcon name="space_dashboard" size="sm" />
              Tampilan petugas
            </span>
            {reports.some((report) => report.isDemo) ? (
              <span className="vector-pill bg-amber text-ink">DEMO — laporan sintetis</span>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => void reload()} disabled={loading}>
            <MaterialIcon name="refresh" size="sm" />
            Muat ulang laporan
          </Button>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dasbor</h1>
        <p className="max-w-3xl text-lg font-medium">Pantau laporan warga. Tentukan prioritas pengangkutan.</p>
        {meta ? <p className="text-xs text-ink/75">Mode API: {meta.mode}. Ini adalah mode pada respons dasbor, bukan label untuk tiap rekaman tersimpan.</p> : null}
        <p className="text-xs text-ink/75">Koordinat pada laporan awal adalah titik perkiraan, bukan titik penjemputan pasti. TPA Suwung adalah {DEPOT_LABEL}.</p>
      </div>

      <ErrorNotice message={error} />
      {loading ? <p className="font-bold">Memuat laporan…</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="vector-card-soft bg-card p-4 grid gap-2">
          <Label htmlFor="filter-kecamatan">Kecamatan</Label>
          <Select id="filter-kecamatan" value={filters.kecamatan} onChange={(event) => patch({ kecamatan: event.target.value })}>
            <option value="">Semua</option>
            {KECAMATAN.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="vector-card-soft bg-card p-4 grid gap-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select id="filter-status" value={filters.status} onChange={(event) => patch({ status: event.target.value as ReportListFilters['status'] })}>
            <option value="">Semua</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div className="vector-card-soft bg-card p-4 grid gap-2">
          <Label htmlFor="filter-since">Sejak</Label>
          <Input id="filter-since" type="date" value={filters.since} onChange={(event) => patch({ since: event.target.value })} />
        </div>
        <div className="vector-card-soft bg-card p-4 grid content-start gap-2">
          <p className="text-sm font-extrabold">Perlu tinjauan</p>
          <label className="flex items-start gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={filters.needsReviewOnly}
              onChange={(event) => patch({ needsReviewOnly: event.target.checked })}
            />
            Perlu tinjauan
          </label>
        </div>
      </div>

      <p className="text-sm font-semibold" aria-live="polite">
        {filtersActive
          ? 'Total, klaster peta, dan kedua daftar hanya menghitung laporan yang cocok dengan filter ini. Bukan total seluruh kota tanpa filter.'
          : 'Total, klaster peta, dan kedua daftar menghitung seluruh laporan yang dimuat.'}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <section aria-labelledby="reported-litres" className="vector-card bg-mint/45 p-4">
          <h2 id="reported-litres" className="text-sm font-extrabold text-primary flex items-center gap-1.5">
            <MaterialIcon name="delete_sweep" size="sm" />
            Volume terlapor
          </h2>
          <p className="mt-2 text-3xl font-extrabold" data-testid="reported-litres">
            {view.reportedLiters} L
          </p>
          <p className="mt-1 text-xs font-bold">{view.visible.length} laporan pada filter ini</p>
        </section>
        <section aria-labelledby="by-type" className="vector-card bg-sky/45 p-4">
          <h2 id="by-type" className="text-sm font-extrabold text-primary flex items-center gap-1.5">
            <MaterialIcon name="category" size="sm" />
            Volume per jenis
          </h2>
          <ul className="mt-2 text-sm font-semibold">
            {TRASH_TYPES.map((type) => (
              <li key={type} data-testid={`litres-${type}`}>
                {type}: {view.aggregate.totals.byType[type]}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-area" className="vector-card bg-amber/40 p-4">
          <h2 id="by-area" className="text-sm font-extrabold text-primary flex items-center gap-1.5">
            <MaterialIcon name="location_city" size="sm" />
            Per kecamatan
          </h2>
          <ul className="mt-2 text-sm font-semibold">
            {KECAMATAN.map((name) => (
              <li key={name}>
                {name}: {view.aggregate.totals.byKecamatan[name].reports} laporan, {view.aggregate.totals.byKecamatan[name].liters} L
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-urgency" className="vector-card bg-lavender/45 p-4">
          <h2 id="by-urgency" className="text-sm font-extrabold text-primary flex items-center gap-1.5">
            <MaterialIcon name="priority_high" size="sm" />
            Per urgensi
          </h2>
          <ul className="mt-2 text-sm font-semibold">
            <li>high: {view.aggregate.totals.byUrgency.high}</li>
            <li>medium: {view.aggregate.totals.byUrgency.medium}</li>
            <li>low: {view.aggregate.totals.byUrgency.low}</li>
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="map-heading" className="vector-card p-5 grid gap-2">
          <h2 id="map-heading" className="text-xl font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="map" className="text-primary" />
            Klaster peta
          </h2>
          <p className="text-xs text-ink/80">Klaster menampilkan laporan biasa pada filter ini. Laporan B3 memiliki penanda terpisah. Daftar di samping peta dapat diakses dengan papan ketik.</p>
          <CityMap markers={markers} height="420px" />
        </section>
        <section aria-labelledby="report-list" className="vector-card p-5 grid gap-3">
          <h2 id="report-list" className="text-xl font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="list_alt" className="text-primary" />
            Laporan
          </h2>
          <ReportList reports={view.ordinary} onSelect={setSelectedId} selectedId={selected?.id ?? null} />
        </section>
      </div>

      <section aria-labelledby="hazardous-list" className="vector-card bg-coral/40 p-5 grid gap-3">
        <h2 id="hazardous-list" className="text-xl font-extrabold flex items-center gap-1.5 text-alert">
          <MaterialIcon name="warning" />
          Laporan B3
        </h2>
        <p className="text-sm font-bold">{HAZARDOUS_LABEL}</p>
        <ReportList reports={view.hazardous} onSelect={setSelectedId} selectedId={selected?.id ?? null} />
      </section>

      {dashboard ? (
        <section aria-labelledby="facilities" className="vector-card p-5 grid gap-3">
          <h2 id="facilities" className="text-xl font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="factory" className="text-primary" />
            Fasilitas
          </h2>
          <ul className="grid gap-2 text-sm">
            {dashboard.facilities.map((facility) => (
              <li key={facility.id} className="vector-card-soft bg-bg px-3.5 py-2.5">
                <span className="font-extrabold">{facility.name}</span> · {facility.kind}
                {facility.id === DEPOT_FACILITY_ID ? ` · ${DEPOT_LABEL}` : ''}
                {facility.verified ? ' · titik referensi terpublikasi' : ''}
                {facility.address ? ` · ${facility.address}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
