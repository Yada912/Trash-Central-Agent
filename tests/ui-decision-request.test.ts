import { describe, expect, it } from 'vitest'
import { canApprovePlan, withExpectedVersion } from '@/components/planner/decision-request'

describe('plan decisions from the officer UI', () => {
  it('sends the current expectedVersion on approve, reject, and edit', () => {
    expect(withExpectedVersion(4, { action: 'approve' })).toEqual({ action: 'approve', expectedVersion: 4 })
    expect(withExpectedVersion(2, { action: 'reject', note: 'Crew is not available.' })).toMatchObject({ expectedVersion: 2 })
    expect(withExpectedVersion(1, { action: 'edit', edits: { moveStop: { stopId: 'a', toTruckId: 'b' } } }).expectedVersion).toBe(1)
  })

  it('disables approval when the explanation is stale even if every route is feasible', () => {
    expect(canApprovePlan({ status: 'edited_pending', busy: false, allFeasible: true, stale: true })).toBe(false)
    expect(canApprovePlan({ status: 'proposed', busy: false, allFeasible: true, stale: false })).toBe(true)
    expect(canApprovePlan({ status: 'edited_pending', busy: false, allFeasible: false, stale: false })).toBe(false)
  })
})
