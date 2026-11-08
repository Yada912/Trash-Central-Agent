import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildSolveInput } from '@/lib/plans/build-input'
import { getMemoryStore, resetMemoryStoreForTests } from '@/lib/store/memory'

afterEach(() => {
  resetMemoryStoreForTests()
})

describe('buildSolveInput collected reports', () => {
  it('skips a collected id and keeps the other explicit reports', async () => {
    const store = getMemoryStore()
    const [seed] = await store.listReports()
    expect(seed).toBeTruthy()
    await store.createReport({ ...seed!, id: 'rpt_collected', status: 'collected' })
    await store.createReport({ ...seed!, id: 'rpt_open', status: 'new' })
    const input = await buildSolveInput(store, {
      trucks: [{ id: 't1', capacityLiters: 1000 }],
      crews: 1,
      shift: { start: '06:00', end: '16:00' },
      reportIds: ['rpt_collected', 'rpt_open'],
    })
    expect(input.stops.map((stop) => stop.id)).toEqual(['rpt_open'])
  })
})
