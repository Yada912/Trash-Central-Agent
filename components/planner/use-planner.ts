'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { explanationMetaFrom, type ExplanationMeta } from '@/components/planner/explanation-label'
import { withExpectedVersion } from '@/components/planner/decision-request'
import { ApiError, messageForApiError, requestJson } from '@/lib/client/api'
import type { Plan } from '@/lib/schemas'

export type TruckDraft = { key: string; id: string; capacity: string }

const DEFAULT_TRUCKS: TruckDraft[] = [
  { key: 'truck-1', id: 'truck-1', capacity: '25000' },
  { key: 'truck-2', id: 'truck-2', capacity: '25000' },
  { key: 'truck-3', id: 'truck-3', capacity: '25000' },
  { key: 'truck-4', id: 'truck-4', capacity: '25000' },
]

export function usePlanner() {
  const router = useRouter()
  const params = useSearchParams()
  const planId = params.get('plan')
  const lock = useRef(false)
  const knownModelPlanId = useRef<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(Boolean(planId))
  const [trucks, setTrucks] = useState<TruckDraft[]>(DEFAULT_TRUCKS)
  const [crews, setCrews] = useState('4')
  const [shiftStart, setShiftStart] = useState('06:00')
  const [shiftEnd, setShiftEnd] = useState('16:00')
  const [formError, setFormError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [violations, setViolations] = useState<string[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [mode, setMode] = useState<'live' | 'demo' | null>(null)
  const [explanationMeta, setExplanationMeta] = useState<ExplanationMeta | null>(null)
  const [explainFailure, setExplainFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState<'run' | 'edit' | 'approve' | 'reject' | 'explain' | null>(null)
  const [note, setNote] = useState('')
  const [moveStopId, setMoveStopId] = useState('')
  const [moveTruckId, setMoveTruckId] = useState('')

  function updateTruck(key: string, patch: Partial<Pick<TruckDraft, 'id' | 'capacity'>>) {
    setTrucks((current) => current.map((truck) => (truck.key === key ? { ...truck, ...patch } : truck)))
  }

  useEffect(() => {
    if (!planId) {
      setLoadingPlan(false)
      return
    }
    let cancelled = false
    setLoadingPlan(true)
    void requestJson<Plan>(`/api/plans/${planId}`)
      .then((response) => {
        if (cancelled) return
        setPlan(response.data)
        setMode(response.meta.mode)
        const incoming = explanationMetaFrom(response.meta)
        setExplanationMeta((current) => {
          if (knownModelPlanId.current === response.data.id && current?.modelFieldPresent && !incoming.modelFieldPresent) return current
          if (incoming.modelFieldPresent) knownModelPlanId.current = response.data.id
          return incoming
        })
        setTrucks(
          response.data.input.trucks.map((truck, index) => ({
            key: `loaded-${index + 1}`,
            id: truck.id,
            capacity: String(truck.capacityLiters),
          })),
        )
        setCrews(String(response.data.input.crews))
        setShiftStart(response.data.input.shift.start)
        setShiftEnd(response.data.input.shift.end)
      })
      .catch((error: unknown) => {
        if (!cancelled) setRequestError(messageForApiError(error))
      })
      .finally(() => {
        if (!cancelled) setLoadingPlan(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  function remember(next: Plan) {
    const href = `/planner?plan=${next.id}`
    if (params.get('plan') !== next.id) router.replace(href)
  }

  async function run(action: typeof busy, path: string, body: unknown) {
    if (lock.current || !action) return
    lock.current = true
    setBusy(action)
    setRequestError(null)
    if (action !== 'explain') setViolations([])
    try {
      const response = await requestJson<Plan>(path, { method: 'POST', body })
      setPlan(response.data)
      setMode(response.meta.mode)
      if (action === 'run' || action === 'explain') {
        const incoming = explanationMetaFrom(response.meta)
        if (incoming.modelFieldPresent) knownModelPlanId.current = response.data.id
        setExplanationMeta(incoming)
        setExplainFailure(null)
      }
      remember(response.data)
      if (action === 'edit' || action === 'approve' || action === 'reject') setNote('')
    } catch (error) {
      if (error instanceof ApiError && error.fields?.violations) setViolations(error.fields.violations)
      const prefix = error instanceof ApiError && error.status === 409 ? '409 ' : ''
      const message = `${prefix}${messageForApiError(error)}`
      setRequestError(message)
      if (action === 'explain') setExplainFailure(message)
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  function runPlan() {
    const ids = trucks.map((truck) => truck.id.trim())
    if (ids.some((id) => id.length === 0)) {
      setFormError('Setiap truk wajib memiliki ID.')
      return
    }
    if (new Set(ids).size !== ids.length) {
      setFormError('ID truk harus unik.')
      return
    }
    const parsedTrucks = trucks.map((truck) => ({ id: truck.id.trim(), capacityLiters: Number(truck.capacity) }))
    if (parsedTrucks.some((truck) => !Number.isFinite(truck.capacityLiters) || truck.capacityLiters <= 0)) {
      setFormError('Setiap truk wajib memiliki kapasitas lebih dari 0.')
      return
    }
    const crewCount = Number(crews)
    if (!Number.isInteger(crewCount) || crewCount < 1) {
      setFormError('Jumlah kru harus bilangan bulat minimal 1.')
      return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd) || shiftEnd <= shiftStart) {
      setFormError('Jam akhir sif harus setelah jam mulai sif. Gunakan format 24 jam HH:MM.')
      return
    }
    setFormError(null)
    void run('run', '/api/plans', {
      trucks: parsedTrucks,
      crews: crewCount,
      shift: { start: shiftStart, end: shiftEnd },
    })
  }

  return {
    trucks,
    setTrucks,
    updateTruck,
    crews,
    setCrews,
    shiftStart,
    setShiftStart,
    shiftEnd,
    setShiftEnd,
    formError,
    requestError,
    violations,
    plan,
    loadingPlan,
    mode,
    explanationMeta,
    explainFailure,
    busy,
    note,
    setNote,
    moveStopId,
    setMoveStopId,
    moveTruckId,
    setMoveTruckId,
    runPlan,
    approve: () => {
      if (!plan) return
      void run('approve', `/api/plans/${plan.id}/decision`, withExpectedVersion(plan.version, { action: 'approve' }))
    },
    reject: () => {
      if (!plan || note.trim().length === 0) return
      void run('reject', `/api/plans/${plan.id}/decision`, withExpectedVersion(plan.version, { action: 'reject', note: note.trim() }))
    },
    edit: () => {
      if (!plan || !moveStopId || !moveTruckId) return
      void run('edit', `/api/plans/${plan.id}/decision`, withExpectedVersion(plan.version, {
        action: 'edit',
        edits: { moveStop: { stopId: moveStopId, toTruckId: moveTruckId } },
      }))
    },
    reexplain: () => {
      if (!plan) return
      void run('explain', `/api/plans/${plan.id}/explain`, {})
    },
  }
}
