'use client'

import { useRef, useState } from 'react'
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
  const lock = useRef(false)
  const [trucks, setTrucks] = useState<TruckDraft[]>(DEFAULT_TRUCKS)
  const [crews, setCrews] = useState('4')
  const [shiftStart, setShiftStart] = useState('06:00')
  const [shiftEnd, setShiftEnd] = useState('16:00')
  const [formError, setFormError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [violations, setViolations] = useState<string[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [mode, setMode] = useState<'live' | 'demo' | null>(null)
  const [busy, setBusy] = useState<'run' | 'edit' | 'approve' | 'reject' | 'explain' | null>(null)
  const [note, setNote] = useState('')
  const [moveStopId, setMoveStopId] = useState('')
  const [moveTruckId, setMoveTruckId] = useState('')

  function updateTruck(key: string, patch: Partial<Pick<TruckDraft, 'id' | 'capacity'>>) {
    setTrucks((current) => current.map((truck) => (truck.key === key ? { ...truck, ...patch } : truck)))
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
      if (action === 'edit' || action === 'approve' || action === 'reject') setNote('')
    } catch (error) {
      if (error instanceof ApiError && error.fields?.violations) setViolations(error.fields.violations)
      setRequestError(messageForApiError(error))
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  function runPlan() {
    const ids = trucks.map((truck) => truck.id.trim())
    if (ids.some((id) => id.length === 0)) {
      setFormError('Every truck needs an ID.')
      return
    }
    if (new Set(ids).size !== ids.length) {
      setFormError('Truck IDs must be unique.')
      return
    }
    const parsedTrucks = trucks.map((truck) => ({ id: truck.id.trim(), capacityLiters: Number(truck.capacity) }))
    if (parsedTrucks.some((truck) => !Number.isFinite(truck.capacityLiters) || truck.capacityLiters <= 0)) {
      setFormError('Every truck needs a capacity greater than 0.')
      return
    }
    const crewCount = Number(crews)
    if (!Number.isInteger(crewCount) || crewCount < 0) {
      setFormError('Crews must be a whole number, zero or more.')
      return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd) || shiftEnd <= shiftStart) {
      setFormError('Shift end must be after shift start. Use 24-hour HH:MM.')
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
    mode,
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
      void run('approve', `/api/plans/${plan.id}/decision`, { action: 'approve' })
    },
    reject: () => {
      if (!plan || note.trim().length === 0) return
      void run('reject', `/api/plans/${plan.id}/decision`, { action: 'reject', note: note.trim() })
    },
    edit: () => {
      if (!plan || !moveStopId || !moveTruckId) return
      void run('edit', `/api/plans/${plan.id}/decision`, {
        action: 'edit',
        edits: { moveStop: { stopId: moveStopId, toTruckId: moveTruckId } },
      })
    },
    reexplain: () => {
      if (!plan) return
      void run('explain', `/api/plans/${plan.id}/explain`, {})
    },
  }
}
