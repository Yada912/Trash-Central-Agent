'use client'

import { CityMap } from '@/components/map/map-loader'
import { routeStyle } from '@/components/planner/route-style'
import { usePlanner } from '@/components/planner/use-planner'
import { DemoBadge } from '@/components/report/DemoBadge'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEPOT_LABEL, HAZARDOUS_DEMO_TEXT, HAZARDOUS_HANDLING_TEXT } from '@/lib/copy'
import { formatWita } from '@/lib/time'

export function PlannerView() {
  const planner = usePlanner()
  const plan = planner.plan
  const allFeasible = Boolean(plan && plan.result.routes.every((route) => route.feasible))
  const canDecide = plan && (plan.status === 'proposed' || plan.status === 'edited_pending') && !planner.busy
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

  return (
    <main id="main" className="grid gap-8">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Planner</h1>
          <DemoBadge mode={planner.mode} />
        </div>
        <p className="text-sm">Routes start at TPA Suwung, a {DEPOT_LABEL}. Straight-line distance is not a road route.</p>
        <ErrorNotice message={planner.requestError} />
      </div>

      <section className="grid gap-4" aria-labelledby="step-inputs">
        <h2 id="step-inputs" className="text-xl font-semibold">
          1. Inputs
        </h2>
        <div className="grid gap-3">
          {planner.trucks.map((truck, index) => (
            <div key={truck.key} className="grid gap-2 rounded-lg border border-ink/10 bg-card p-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
              <p className="text-sm font-semibold">Truck {index + 1}</p>
              <div className="grid gap-1">
                <Label htmlFor={`truck-id-${truck.key}`}>Truck ID</Label>
                <Input id={`truck-id-${truck.key}`} value={truck.id} onChange={(event) => planner.updateTruck(truck.key, { id: event.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`truck-cap-${truck.key}`}>Capacity (litres)</Label>
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
                Remove
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
          Add truck
        </Button>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-1">
            <Label htmlFor="crews">Crews</Label>
            <Input id="crews" inputMode="numeric" value={planner.crews} onChange={(event) => planner.setCrews(event.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="shift-start">Shift start</Label>
            <Input id="shift-start" value={planner.shiftStart} onChange={(event) => planner.setShiftStart(event.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="shift-end">Shift end</Label>
            <Input id="shift-end" value={planner.shiftEnd} onChange={(event) => planner.setShiftEnd(event.target.value)} />
          </div>
        </div>
        <ErrorNotice message={planner.formError} />
        <Button onClick={planner.runPlan} disabled={Boolean(planner.busy)}>
          {planner.busy === 'run' ? 'Running…' : 'Run plan'}
        </Button>
      </section>

      <section className="grid gap-4" aria-labelledby="step-proposal">
        <h2 id="step-proposal" className="text-xl font-semibold">
          2. Proposal
        </h2>
        {planner.loadingPlan && !plan ? <p>Loading the saved plan…</p> : null}
        {!plan && !planner.loadingPlan ? <p>Run the planner to see a proposal.</p> : null}
        {plan ? (
          <>
            <p className="text-sm" data-testid="plan-status">
              Status {plan.status}. Version {plan.version}.
              {planner.busy === 'edit' ? ' Recomputing the plan. Totals stay unchanged until the server responds.' : ''}
            </p>
            {planner.busy === 'edit' ? <p role="status">Recomputing…</p> : null}
            <CityMap routes={routes} height="380px" />
            <section aria-labelledby="route-facts" className="grid gap-3">
              <h3 id="route-facts" className="text-lg font-semibold">
                Route facts
              </h3>
              <p className="text-sm">These figures come from the deterministic planner.</p>
              <ul className="grid gap-3">
                {plan.result.routes.map((route, index) => {
                  const style = routeStyle(index)
                  return (
                    <li key={route.truckId} className="rounded-lg border border-ink/10 bg-card p-3">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        <svg width="56" height="10" aria-hidden="true">
                          <line x1="0" y1="5" x2="56" y2="5" stroke={style.color} strokeWidth="3" strokeDasharray={style.dashArray} />
                        </svg>
                        Truck {index + 1} · {route.truckId} · crew {index + 1} · {style.pattern} line
                      </p>
                      <p className="text-sm">
                        {route.stopIds.length} stops · load {route.loadLiters} / {route.capacityLiters} L · {route.distanceKm} km · {route.durationMin} min ·{' '}
                        {route.feasible ? 'feasible' : 'not feasible'}
                      </p>
                      {route.violations.length > 0 ? (
                        <ul className="mt-1 text-sm text-alert">
                          {route.violations.map((violation) => (
                            <li key={violation}>{violation}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              <p className="text-sm">
                Totals: {plan.result.totals.stops} stops, {plan.result.totals.liters} L, {plan.result.totals.distanceKm} km.
              </p>
            </section>
            <section aria-labelledby="unassigned" className="grid gap-2">
              <h3 id="unassigned" className="text-lg font-semibold">
                Unassigned
              </h3>
              {plan.result.unassigned.length === 0 ? <p className="text-sm">None.</p> : null}
              <ul className="grid gap-2 text-sm">
                {plan.result.unassigned.map((item) => (
                  <li key={item.id}>
                    {item.id}
                    {item.reason === 'hazardous_separate' ? (
                      <>
                        {' '}
                        · {HAZARDOUS_HANDLING_TEXT} <span className="font-semibold">{HAZARDOUS_DEMO_TEXT}</span>
                      </>
                    ) : (
                      ` · ${item.reason}`
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="ai-explanation" className="grid gap-2 rounded-lg border border-ink/10 bg-card p-4">
              <h3 id="ai-explanation" className="text-lg font-semibold">
                AI-generated explanation
              </h3>
              {plan.explanation.stale ? <p className="font-semibold">Outdated after edit</p> : null}
              {planner.busy === 'explain' ? <p role="status">Updating the explanation…</p> : null}
              <p>{plan.explanation.summary}</p>
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
              {plan.explanation.stale ? (
                <Button variant="secondary" onClick={planner.reexplain} disabled={Boolean(planner.busy)}>
                  Re-explain
                </Button>
              ) : null}
            </section>
          </>
        ) : null}
      </section>

      <section className="grid gap-4" aria-labelledby="step-decision">
        <h2 id="step-decision" className="text-xl font-semibold">
          3. Decision and audit log
        </h2>
        {!plan ? <p>A decision can be recorded after a proposal exists.</p> : null}
        {plan ? (
          <>
            {planner.violations.length > 0 ? (
              <div>
                <p className="font-semibold text-alert">The server rejected the decision:</p>
                <ul className="list-disc pl-5 text-sm text-alert">
                  {planner.violations.map((violation) => (
                    <li key={violation}>{violation}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!allFeasible ? (
              <p className="text-sm font-semibold text-alert">
                One or more routes are infeasible. Approving now is rejected until every route is feasible.
              </p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="move-stop">Move stop</Label>
                <select id="move-stop" className="rounded-md border border-ink/15 bg-card px-3 py-2" value={planner.moveStopId} onChange={(event) => planner.setMoveStopId(event.target.value)}>
                  <option value="">Choose a stop</option>
                  {plan.result.routes.flatMap((route) => route.stopIds).concat(plan.result.unassigned.map((item) => item.id)).map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="move-truck">To truck</Label>
                <select id="move-truck" className="rounded-md border border-ink/15 bg-card px-3 py-2" value={planner.moveTruckId} onChange={(event) => planner.setMoveTruckId(event.target.value)}>
                  <option value="">Choose a truck</option>
                  {plan.result.routes.map((route, index) => (
                    <option key={route.truckId} value={route.truckId}>
                      Truck {index + 1} · {route.truckId}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button variant="secondary" onClick={planner.edit} disabled={!canDecide || !planner.moveStopId || !planner.moveTruckId}>
              {planner.busy === 'edit' ? 'Saving edit…' : 'Save edit'}
            </Button>
            <div className="grid gap-1">
              <Label htmlFor="reject-note">Reject note</Label>
              <Input id="reject-note" value={planner.note} onChange={(event) => planner.setNote(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={planner.approve} disabled={!canDecide}>
                {planner.busy === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
              <Button variant="alert" onClick={planner.reject} disabled={!canDecide || planner.note.trim().length === 0}>
                {planner.busy === 'reject' ? 'Rejecting…' : 'Reject'}
              </Button>
            </div>
            <section aria-labelledby="audit-log" data-testid="audit-log">
              <h3 id="audit-log" className="text-lg font-semibold">
                Audit log
              </h3>
              {plan.decisions.length === 0 ? <p className="text-sm">No decisions yet.</p> : null}
              <ol className="mt-2 grid gap-2">
                {plan.decisions.map((decision, index) => (
                  <li key={`${decision.at}-${index}`} className="rounded-md border border-ink/10 bg-card px-3 py-2 text-sm">
                    <p>
                      {decision.action} · version {decision.toVersion} · {decision.actor}
                    </p>
                    <time dateTime={decision.at}>{formatWita(decision.at)}</time>
                    {decision.note ? <p>{decision.note}</p> : null}
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
