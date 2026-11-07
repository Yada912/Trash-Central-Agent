import { HAZARDOUS_LABEL } from '@/components/report/hazard-policy'

export function ordinaryStopIds(stopIds: readonly string[], separateIds: ReadonlySet<string>): string[] {
  return stopIds.filter((id) => !separateIds.has(id))
}

export function shownUnassigned(
  unassigned: readonly { id: string; reason: string }[],
  routeStopIds: readonly string[],
  separateIds: ReadonlySet<string>,
): { id: string; text: string }[] {
  const rows: { id: string; text: string }[] = []
  const seen = new Set<string>()
  for (const item of unassigned) {
    seen.add(item.id)
    const hazardous = item.reason === 'hazardous_separate' || separateIds.has(item.id)
    rows.push({ id: item.id, text: hazardous ? `${item.id} · ${HAZARDOUS_LABEL}` : `${item.id} · ${item.reason}` })
  }
  for (const id of routeStopIds) {
    if (!separateIds.has(id) || seen.has(id)) continue
    seen.add(id)
    rows.push({ id, text: `${id} · ${HAZARDOUS_LABEL}` })
  }
  return rows
}

export function movableStopIds(
  routeStopIds: readonly string[],
  unassigned: readonly { id: string; reason: string }[],
  separateIds: ReadonlySet<string>,
): string[] {
  return [
    ...routeStopIds.filter((id) => !separateIds.has(id)),
    ...unassigned.filter((item) => item.reason !== 'hazardous_separate' && !separateIds.has(item.id)).map((item) => item.id),
  ]
}
