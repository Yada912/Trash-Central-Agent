export function canApprovePlan(input: { status: string; busy: boolean; allFeasible: boolean; stale: boolean }): boolean {
  const open = (input.status === 'proposed' || input.status === 'edited_pending') && !input.busy
  return open && input.allFeasible && !input.stale
}

export function withExpectedVersion<T extends Record<string, unknown>>(version: number, body: T): T & { expectedVersion: number } {
  return { ...body, expectedVersion: version }
}
