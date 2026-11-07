// Permanent schedule adapter.
//
// buildSchedule(reports, opts) -> ScheduleEntry[]
// scheduleDemand(reports) -> ScheduleDemand[]
//
// Demand is share-weighted litres per kecamatan × stream × accountType.
// A report that isHazardousClassification is true puts every litre on B3 and
// none on organik, anorganik, or residu. Any other report splits its litres
// by share across those three streams. Hazardous share on a non-hazardous
// report cannot occur, because any hazardous share makes the report hazardous.
// Each report's allocated litres sum to its volume.
//
// The weekday template below is an internal placeholder. Hummer's
// lib/planner/weekly.ts will later supply dated runs. This file stays.
// nextPickup and unassigned are left unset until that solver fills them.
// A company entry is one group window for that kecamatan and stream.

import {
  ACCOUNT_TYPES,
  KECAMATAN,
  WASTE_STREAMS,
  isHazardousClassification,
  streamOf,
  type AccountType,
  type Kecamatan,
  type Report,
  type ScheduleEntry,
  type WasteStream,
  type Weekday,
} from '@/lib/schemas'

export const SCHEDULE_DISCLAIMER = 'Simulated demo schedule derived from reports; not an official DLH Denpasar schedule.'
const PLACEHOLDER_NOTE = 'Capacity feasibility was not checked.'

export type ScheduleBuildOptions = {
  kecamatan?: Kecamatan
  stream?: WasteStream
  accountType?: AccountType
}

export type ScheduleDemand = {
  kecamatan: Kecamatan
  stream: WasteStream
  accountType: AccountType
  reports: number
  liters: number
}

type Cell = {
  kecamatan: Kecamatan
  stream: WasteStream
  accountType: AccountType
  reports: number
  cents: number
}

function cellKey(kecamatan: Kecamatan, stream: WasteStream, accountType: AccountType): string {
  return `${kecamatan}|${stream}|${accountType}`
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Share-weighted litres. The last stream of a report receives the remainder so the report sums exactly. */
function portions(report: Report): Array<{ stream: WasteStream; cents: number }> {
  const cents = Math.round(report.classification.volume.liters * 100)
  if (isHazardousClassification(report.classification)) return [{ stream: 'B3', cents }]
  const shares = new Map<WasteStream, number>()
  for (const entry of report.classification.types) {
    const stream = streamOf(entry.type)
    if (stream === 'B3') continue
    shares.set(stream, (shares.get(stream) ?? 0) + entry.share)
  }
  const streams = WASTE_STREAMS.filter((stream) => (shares.get(stream) ?? 0) > 0 && stream !== 'B3')
  const shareSum = streams.reduce((total, stream) => total + (shares.get(stream) ?? 0), 0) || 1
  let used = 0
  return streams.map((stream, index) => {
    if (index === streams.length - 1) return { stream, cents: cents - used }
    const portion = Math.round((cents * (shares.get(stream) ?? 0)) / shareSum)
    used += portion
    return { stream, cents: portion }
  })
}

export function scheduleDemand(reports: readonly Report[]): ScheduleDemand[] {
  const cells = new Map<string, Cell>()
  for (const report of reports) {
    for (const portion of portions(report)) {
      if (portion.cents <= 0) continue
      const key = cellKey(report.kecamatan, portion.stream, report.accountType)
      const cell = cells.get(key) ?? {
        kecamatan: report.kecamatan,
        stream: portion.stream,
        accountType: report.accountType,
        reports: 0,
        cents: 0,
      }
      cell.reports += 1
      cell.cents += portion.cents
      cells.set(key, cell)
    }
  }
  return [...cells.values()]
    .sort((a, b) => {
      const byKecamatan = KECAMATAN.indexOf(a.kecamatan) - KECAMATAN.indexOf(b.kecamatan)
      if (byKecamatan !== 0) return byKecamatan
      const byStream = WASTE_STREAMS.indexOf(a.stream) - WASTE_STREAMS.indexOf(b.stream)
      if (byStream !== 0) return byStream
      return ACCOUNT_TYPES.indexOf(a.accountType) - ACCOUNT_TYPES.indexOf(b.accountType)
    })
    .map((cell) => ({
      kecamatan: cell.kecamatan,
      stream: cell.stream,
      accountType: cell.accountType,
      reports: cell.reports,
      liters: cell.cents / 100,
    }))
}

function placeholderRule(stream: WasteStream, accountType: AccountType): {
  days: Weekday[]
  window: { start: string; end: string } | null
  mode: 'routine' | 'on_request'
} {
  if (stream === 'B3') return { days: [], window: null, mode: 'on_request' }
  const days: Weekday[] =
    stream === 'organik' ? ['mon', 'wed', 'fri'] : stream === 'anorganik' ? ['tue', 'sat'] : ['thu']
  const window =
    accountType === 'company' ? { start: '14:00', end: '17:00' } : { start: '06:00', end: '09:00' }
  return { days, window, mode: 'routine' }
}

export function buildSchedule(reports: readonly Report[], opts: ScheduleBuildOptions = {}): ScheduleEntry[] {
  return scheduleDemand(reports)
    .filter((cell) => !opts.kecamatan || cell.kecamatan === opts.kecamatan)
    .filter((cell) => !opts.stream || cell.stream === opts.stream)
    .filter((cell) => !opts.accountType || cell.accountType === opts.accountType)
    .map((cell) => {
      const rule = placeholderRule(cell.stream, cell.accountType)
      const entry: ScheduleEntry = {
        kecamatan: cell.kecamatan,
        stream: cell.stream,
        accountType: cell.accountType,
        days: rule.days,
        window: rule.window,
        mode: rule.mode,
        basis: { reports: cell.reports, liters: round2(cell.liters) },
        source: 'simulated',
        note: PLACEHOLDER_NOTE,
        feasibility: 'unverified_template',
      }
      return entry
    })
}
