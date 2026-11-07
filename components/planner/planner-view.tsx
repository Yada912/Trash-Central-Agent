'use client'

import { useMemo } from 'react'
import { useDashboard } from '@/components/dashboard/use-dashboard'
import { CityMap } from '@/components/map/map-loader'
import { canApprovePlan } from '@/components/planner/decision-request'
import { explanationFieldLine, explanationHeading, templateTextLabel } from '@/components/planner/explanation-label'
import { demoMockLabel } from '@/components/report/report-labels'
import { movableStopIds, ordinaryStopIds, shownUnassigned } from '@/components/planner/route-display'
import { routeStyle } from '@/components/planner/route-style'
import { usePlanner } from '@/components/planner/use-planner'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { isSeparateHazard } from '@/components/report/hazard-policy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { DEPOT_LABEL } from '@/lib/copy'
import { formatWita } from '@/lib/time'

const STEPS = ['Kapasitas dan sif', 'Usulan rute', 'Keputusan dan audit'] as const

export function PlannerView() {
  const planner = usePlanner()
  const plan = planner.plan
  const allFeasible = Boolean(plan && plan.result.routes.every((route) => route.feasible))
  const canDecide = plan && (plan.status === 'proposed' || plan.status === 'edited_pending') && !planner.busy
  const stale = Boolean(plan?.explanation.stale)
  const canApprove = plan ? canApprovePlan({ status: plan.status, busy: Boolean(planner.busy), allFeasible, stale }) : false
  const routes = plan
    ? plan.result.routes.map((route, index) => {
        const style = routeStyle(index)
        return {
          id: route.truckId,
          positions: route.polyline,
          color: style.color,
          dashArray: style.dashArray,
        }
      })
    : []
  const { reports } = useDashboard()
  const separateIds = useMemo(() => {
    const ids = new Set<string>()
    for (const report of reports) {
      if (isSeparateHazard(report.classification)) ids.add(report.id)
    }
    return ids
  }, [reports])
  const stepIndex = !plan ? 0 : plan.decisions.length > 0 || plan.status === 'approved' || plan.status === 'rejected' ? 2 : 1
  const unassignedRows = plan
    ? shownUnassigned(
        plan.result.unassigned,
        plan.result.routes.flatMap((route) => route.stopIds),
        separateIds,
      )
    : []
  const movableIds = plan
    ? movableStopIds(
        plan.result.routes.flatMap((route) => route.stopIds),
        plan.result.unassigned,
        separateIds,
      )
    : []

  return (
    <main id="main" className="grid gap-8">
      <div className="vector-card bg-card p-6 grid gap-3">
        <span className="vector-pill bg-lavender text-ink w-fit tilt-left">
          <MaterialIcon name="route" size="sm" />
          Perencana petugas
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Perencana</h1>
        <p className="max-w-3xl text-lg font-medium">Atur kapasitas armada. Perhitungan rute terpisah dari penjelasan naratif.</p>
        {planner.mode ? <p className="text-xs text-ink/75">Mode API: {planner.mode}. Angka rute berasal dari solver deterministik. Label penjelasan di bawah mengikuti kolom model pada respons.</p> : null}
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={
                index === stepIndex
                  ? 'vector-card bg-primary text-white px-3 py-2 text-sm font-extrabold'
                  : 'vector-card-soft bg-bg px-3 py-2 text-sm font-bold text-ink/75'
              }
            >
              0{index + 1} · {label}
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink/75">Rute dimulai dari TPA Suwung, yaitu {DEPOT_LABEL}. Jarak garis lurus bukan rute jalan raya sebenarnya.</p>
        <ErrorNotice message={planner.requestError} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-labelledby="step-inputs">
        <div className="vector-card p-5 grid gap-4">
          <h2 id="step-inputs" className="text-xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="local_shipping" className="text-primary" />
            1. Parameter masukan
          </h2>
          <div className="grid gap-3">
            {planner.trucks.map((truck, index) => (
              <div key={truck.key} className="vector-card-soft bg-bg p-3 grid gap-2 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
                <p className="text-sm font-extrabold">Truk {index + 1}</p>
                <div className="grid gap-1">
                  <Label htmlFor={`truck-id-${truck.key}`}>ID Truk</Label>
                  <Input id={`truck-id-${truck.key}`} value={truck.id} onChange={(event) => planner.updateTruck(truck.key, { id: event.target.value })} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`truck-cap-${truck.key}`}>Kapasitas (liter)</Label>
                  <Input
                    id={`truck-cap-${truck.key}`}
                    inputMode="decimal"
                    value={truck.capacity}
                    onChange={(event) => planner.updateTruck(truck.key, { capacity: event.target.value })}
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={planner.trucks.length === 1 || Boolean(planner.busy)}
                  onClick={() => planner.setTrucks(planner.trucks.filter((item) => item.key !== truck.key))}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            disabled={Boolean(planner.busy)}
            onClick={() =>
              planner.setTrucks([
                ...planner.trucks,
                { key: `truck-${crypto.randomUUID()}`, id: `truck-${planner.trucks.length + 1}`, capacity: '25000' },
              ])
            }
          >
            <MaterialIcon name="add" size="sm" />
            Tambah truk
          </Button>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="crews">Kru</Label>
              <Input id="crews" inputMode="numeric" value={planner.crews} onChange={(event) => planner.setCrews(event.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="shift-start">Mulai sif</Label>
              <Input id="shift-start" value={planner.shiftStart} onChange={(event) => planner.setShiftStart(event.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="shift-end">Akhir sif</Label>
              <Input id="shift-end" value={planner.shiftEnd} onChange={(event) => planner.setShiftEnd(event.target.value)} />
            </div>
          </div>
          <ErrorNotice message={planner.formError} />
          <Button onClick={planner.runPlan} disabled={Boolean(planner.busy)}>
            <MaterialIcon name="play_arrow" />
            {planner.busy === 'run' ? 'Menjalankan…' : 'Jalankan rencana'}
          </Button>
        </div>
        <aside className="vector-card bg-amber/30 h-fit p-5 grid gap-3">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="verified_user" className="text-primary" />
            Sistem mengusulkan. Anda memutuskan.
          </h2>
          <p className="text-sm">
            Solver deterministik menghitung pemberhentian, muatan, jarak, dan kelayakan rute. Angka tersebut adalah fakta rute. Paragraf di bawah judul penjelasan bersifat terpisah, dan judulnya mencantumkan mode serta model dari respons yang menghasilkannya.
          </p>
          <p className="text-sm font-medium">Jumlah kru dan kapasitas truk harus valid. ID truk harus unik. Jam akhir sif harus setelah jam mulai sif.</p>
        </aside>
      </section>

      <section className="grid gap-4" aria-labelledby="step-proposal">
        <h2 id="step-proposal" className="text-xl font-extrabold">
          2. Usulan rute
        </h2>
        {planner.loadingPlan && !plan ? <p className="font-bold">Memuat rencana tersimpan…</p> : null}
        {!plan && !planner.loadingPlan ? <p className="text-sm font-semibold">Jalankan perencana untuk melihat usulan rute.</p> : null}
        {plan ? (
          <>
            <p className="text-sm font-extrabold" data-testid="plan-status">
              Status {plan.status}. Version {plan.version}.
              {planner.busy === 'edit' ? ' Menghitung ulang rencana. Total tetap sama hingga server merespons.' : ''}
            </p>
            {planner.busy === 'edit' ? <p role="status">Menghitung ulang…</p> : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <section aria-labelledby="route-facts" className="vector-card p-5 grid gap-3">
                <h3 id="route-facts" className="text-lg font-extrabold">
                  Fakta rute
                </h3>
                <p className="text-xs text-ink/75">Angka-angka ini berasal dari perencana deterministik. Warna dipasangkan dengan nomor kru dan pola garis.</p>
                <ul className="grid gap-3">
                  {plan.result.routes.map((route, index) => {
                    const style = routeStyle(index)
                    return (
                      <li key={route.truckId} className="vector-card-soft bg-bg p-3.5" style={{ borderLeftWidth: 8, borderLeftColor: style.color }}>
                        <p className="flex flex-wrap items-center gap-2 font-extrabold">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-sm text-white"
                            style={{ background: style.color }}
                          >
                            <span className="sr-only">Kru </span>
                            {index + 1}
                          </span>
                          <svg width="56" height="10" aria-hidden="true">
                            <line x1="0" y1="5" x2="56" y2="5" stroke={style.color} strokeWidth="3" strokeDasharray={style.dashArray} />
                          </svg>
                          Truk {index + 1} · {route.truckId} · kru {index + 1} · garis {style.pattern}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {ordinaryStopIds(route.stopIds, separateIds).length} pemberhentian biasa · muatan {route.loadLiters} / {route.capacityLiters} L · {route.distanceKm} km · {route.durationMin} mnt ·{' '}
                          {route.feasible ? 'layak (feasible)' : 'tidak layak (not feasible)'}
                        </p>
                        {route.violations.length > 0 ? (
                          <ul className="mt-1 text-sm font-bold text-alert">
                            {route.violations.map((violation) => (
                              <li key={violation}>{violation}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                <p className="text-sm font-bold">
                  Total: {plan.result.totals.stops} pemberhentian, {plan.result.totals.liters} L, {plan.result.totals.distanceKm} km.
                </p>
              </section>
              <div className="vector-card p-5 grid gap-2">
                <h3 className="text-lg font-extrabold">Peta rute</h3>
                <CityMap routes={routes} height="380px" />
              </div>
            </div>
            <section aria-labelledby="unassigned" className="vector-card p-5 grid gap-2">
              <h3 id="unassigned" className="text-lg font-extrabold">
                Belum terjadwal
              </h3>
              {unassignedRows.length === 0 ? <p className="text-sm">Tidak ada.</p> : <p className="text-sm font-semibold">{unassignedRows.length} pemberhentian berada di luar rute biasa.</p>}
              <ul className="grid max-h-80 gap-2 overflow-auto text-sm">
                {unassignedRows.map((item) => (
                  <li key={item.id} className="vector-card-soft bg-bg px-3 py-2">{item.text}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="ai-explanation" className="vector-card bg-sky/25 p-5 grid gap-2">
              <h3 id="ai-explanation" className="text-lg font-extrabold" data-testid="explanation-heading">
                {explanationHeading(planner.explanationMeta, plan.explanation)}
              </h3>
              {demoMockLabel(planner.explanationMeta?.mode ?? null) ? (
                <p className="text-sm font-semibold">{demoMockLabel(planner.explanationMeta?.mode ?? null)}</p>
              ) : null}
              {templateTextLabel(plan.explanation) ? <p className="text-sm font-semibold">{templateTextLabel(plan.explanation)}</p> : null}
              <p className="text-sm">{explanationFieldLine(planner.explanationMeta, plan.explanation)}</p>
              {plan.explanation.stale ? (
                <p className="vector-card-soft bg-amber px-3 py-2 text-sm font-bold">
                  Penjelasan ini kedaluwarsa setelah perubahan rute. Ini bukan penjelasan untuk versi rute saat ini.
                </p>
              ) : null}
              {planner.explainFailure ? (
                <p className="text-sm font-bold text-alert">Permintaan penjelasan terbaru gagal. Teks di bawah tidak berubah. {planner.explainFailure}</p>
              ) : null}
              {planner.busy === 'explain' ? <p role="status">Memperbarui penjelasan…</p> : null}
              <p className="font-medium">{plan.explanation.summary}</p>
              <ul className="list-disc pl-5 text-sm">
                {plan.explanation.perRoute.map((line, index) => (
                  <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
              <ul className="list-disc pl-5 text-sm">
                {plan.explanation.risks.map((line, index) => (
                  <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
              <p className="text-xs font-semibold">Jelaskan ulang hanya memperbarui teks ini dan tidak menyetujui rencana secara otomatis.</p>
              {plan.explanation.stale ? (
                <Button variant="secondary" onClick={planner.reexplain} disabled={Boolean(planner.busy)}>
                  Jelaskan ulang
                </Button>
              ) : null}
            </section>
          </>
        ) : null}
      </section>

      <section className="grid gap-4" aria-labelledby="step-decision">
        <h2 id="step-decision" className="text-xl font-extrabold">
          3. Keputusan dan log audit
        </h2>
        {!plan ? <p className="text-sm font-semibold">Keputusan dapat dicatat setelah usulan rute dibuat.</p> : null}
        {plan ? (
          <>
            {planner.violations.length > 0 ? (
              <div className="vector-card bg-coral p-4">
                <p className="font-extrabold text-alert">Server menolak keputusan:</p>
                <ul className="list-disc pl-5 text-sm font-bold text-alert">
                  {planner.violations.map((violation) => (
                    <li key={violation}>{violation}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!allFeasible ? (
              <p className="vector-card bg-coral p-4 text-sm font-extrabold text-alert">
                Persetujuan diblokir hingga seluruh rute layak (feasible).
              </p>
            ) : null}
            <div className="vector-card p-5 grid gap-4">
              <h3 className="text-lg font-extrabold">Ubah penugasan</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="move-stop">Pindahkan pemberhentian</Label>
                  <Select id="move-stop" value={planner.moveStopId} onChange={(event) => planner.setMoveStopId(event.target.value)}>
                    <option value="">Pilih pemberhentian</option>
                    {movableIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="move-truck">Ke truk</Label>
                  <Select id="move-truck" value={planner.moveTruckId} onChange={(event) => planner.setMoveTruckId(event.target.value)}>
                    <option value="">Pilih truk</option>
                    {plan.result.routes.map((route, index) => (
                      <option key={route.truckId} value={route.truckId}>
                        Truk {index + 1} · {route.truckId}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button variant="secondary" onClick={planner.edit} disabled={!canDecide || !planner.moveStopId || !planner.moveTruckId}>
                {planner.busy === 'edit' ? 'Menyimpan perubahan…' : 'Simpan perubahan'}
              </Button>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="reject-note">Catatan penolakan</Label>
              <Input id="reject-note" value={planner.note} onChange={(event) => planner.setNote(event.target.value)} />
              <p className="text-xs font-semibold">Catatan penolakan wajib diisi.</p>
            </div>
            {plan.explanation.stale ? (
              <div className="vector-card bg-amber/40 p-4 grid gap-2">
                <p className="text-sm font-extrabold">Persetujuan diblokir hingga penjelasan diperbarui (explanation stale; re-explain first).</p>
                <Button variant="secondary" onClick={planner.reexplain} disabled={Boolean(planner.busy)}>
                  Jelaskan ulang
                </Button>
                <p className="text-xs font-semibold">Jelaskan ulang hanya memperbarui teks ini dan tidak menyetujui rencana secara otomatis.</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button onClick={planner.approve} disabled={!canApprove}>
                <MaterialIcon name="check_circle" size="sm" />
                {planner.busy === 'approve' ? 'Menyetujui…' : 'Setujui'}
              </Button>
              <Button variant="alert" onClick={planner.reject} disabled={!canDecide || planner.note.trim().length === 0}>
                <MaterialIcon name="cancel" size="sm" />
                {planner.busy === 'reject' ? 'Menolak…' : 'Tolak'}
              </Button>
            </div>
            <section aria-labelledby="audit-log" data-testid="audit-log" className="vector-card p-5 grid gap-2">
              <h3 id="audit-log" className="text-lg font-extrabold">
                Log audit
              </h3>
              <p className="text-xs font-semibold">Waktu ditampilkan dalam WITA (UTC+8).</p>
              {plan.decisions.length === 0 ? <p className="text-sm">Belum ada keputusan.</p> : null}
              <ol className="mt-2 grid gap-2">
                {plan.decisions.map((decision, index) => (
                  <li key={`${decision.at}-${index}`} className="vector-card-soft bg-bg px-3.5 py-2 text-sm">
                    <p className="font-bold">
                      {decision.action} · versi {decision.toVersion} · {decision.actor}
                    </p>
                    <time dateTime={decision.at} className="text-xs text-ink/75">{formatWita(decision.at)}</time>
                    {decision.note ? <p className="mt-1">{decision.note}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}
