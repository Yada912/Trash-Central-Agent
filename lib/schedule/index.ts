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
// solveWeekly places the confirmed litres. This file does not forecast demand
// and does not pass backlogLiters. With no availability, the visible days are
// the policy template and nextPickup is omitted. Dated runs appear only when
// the caller supplies availability.
// A company entry is one group window for that kecamatan and stream.

import { solveWeekly, type WeeklyAvailability, type WeeklyPlanInput, type WeeklyScheduleResult } from '@/lib/planner/weekly'
import { currentWitaMonday } from '@/lib/time'
import {
  ACCOUNT_TYPES,
  KECAMATAN,
  WEEKDAYS,
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
export const SCHEDULE_GENERATED_FROM =
  'seed+reports; demand equals the currently confirmed reports and is not a forecast'
const POLICY_NOTE = 'policy days, capacity not verified'
const COMPANY_NOTE = 'Company-group window for this kecamatan and stream. Not a booking for a named company.'
const POLICY_DAYS: Record<Exclude<WasteStream, 'B3'>, Weekday[]> = {
  organik: ['mon', 'wed', 'fri'],
  anorganik: ['tue', 'sat'],
  residu: ['thu'],
}

export type ScheduleBuildOptions = {
  kecamatan?: Kecamatan
  stream?: WasteStream
  accountType?: AccountType
  /** Omit for the policy template. Present, even with empty arrays, checks the solver. */
  availability?: WeeklyAvailability
  weekStart?: string
  asOf?: string
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
    if (report.status === 'collected') continue
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

function policyWindow(accountType: AccountType): { start: string; end: string } {
  return accountType === 'company' ? { start: '14:00', end: '17:00' } : { start: '06:00', end: '09:00' }
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function weekdayOf(iso: string): Weekday {
  const [year, month, day] = iso.split('-').map(Number)
  const sunday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return WEEKDAYS[(sunday + 6) % 7]
}

/** One demo truck and the household and company windows, Monday through Saturday. */
export function demoCheckedAvailability(weekStart: string): WeeklyAvailability {
  const slots: WeeklyAvailability['slots'] = []
  for (let day = 0; day < 6; day += 1) {
    const date = addDays(weekStart, day)
    slots.push({ truckId: 'demo-truck', date, dayIndex: day, start: '06:00', end: '09:00', accountType: 'household' })
    slots.push({ truckId: 'demo-truck', date, dayIndex: day, start: '14:00', end: '17:00', accountType: 'company' })
  }
  return { trucks: [{ id: 'demo-truck', capacityLiters: 100_000 }], slots }
}

function sameGroup(row: { kecamatan: string; stream: string; accountType: string }, cell: ScheduleDemand): boolean {
  return row.kecamatan === cell.kecamatan && row.stream === cell.stream && row.accountType === cell.accountType
}

function entryFor(cell: ScheduleDemand, result: WeeklyScheduleResult): ScheduleEntry {
  const group = result.groups.find((row) => sameGroup(row, cell))
  const basis = {
    reports: group?.reportCount ?? cell.reports,
    liters: round2(group?.weeklyLiters ?? cell.liters),
  }
  const shared = {
    kecamatan: cell.kecamatan,
    stream: cell.stream,
    accountType: cell.accountType,
    basis,
    source: 'simulated' as const,
    feasibility: result.feasibility,
  }
  if (result.feasibility === 'unverified_template') {
    if (cell.stream === 'B3') {
      return { ...shared, days: [], window: null, mode: 'on_request', note: POLICY_NOTE }
    }
    return {
      ...shared,
      days: POLICY_DAYS[cell.stream],
      window: policyWindow(cell.accountType),
      mode: 'routine',
      note: POLICY_NOTE,
    }
  }
  if (cell.stream === 'B3') {
    const row = result.unassigned.find((item) => sameGroup(item, cell))
    return {
      ...shared,
      days: [],
      window: null,
      mode: 'on_request',
      note: row?.note ?? 'Simulated request for separate DLH handling. No date, truck, or booking is assigned.',
      unassigned: { liters: basis.liters, reason: row?.reason ?? 'b3_separate_dlh_demo' },
    }
  }
  const runs = result.runs.filter((run) => sameGroup(run, cell))
  const leftover = result.unassigned.find((item) => sameGroup(item, cell))
  if (runs.length === 0) {
    return {
      ...shared,
      days: [],
      window: null,
      mode: 'on_request',
      note: leftover?.note,
      unassigned: { liters: leftover?.liters ?? basis.liters, reason: leftover?.reason ?? 'no_slot' },
    }
  }
  const days = WEEKDAYS.filter((day) => runs.some((run) => weekdayOf(run.date) === day))
  const next = result.nextPickups.find((item) => sameGroup(item, cell) && item.date)
  const entry: ScheduleEntry = {
    ...shared,
    days,
    window: { start: runs[0].start, end: runs[0].end },
    mode: 'routine',
    ...(group?.dedicated ? { note: COMPANY_NOTE } : {}),
    ...(next?.date ? { nextPickup: next.date } : {}),
    ...(leftover && leftover.liters > 0 ? { unassigned: { liters: leftover.liters, reason: leftover.reason } } : {}),
  }
  return entry
}

export function buildSchedule(reports: readonly Report[], opts: ScheduleBuildOptions = {}): ScheduleEntry[] {
  const cells = scheduleDemand(reports)
    .filter((cell) => !opts.kecamatan || cell.kecamatan === opts.kecamatan)
    .filter((cell) => !opts.stream || cell.stream === opts.stream)
    .filter((cell) => !opts.accountType || cell.accountType === opts.accountType)
  const weekStart = opts.weekStart ?? currentWitaMonday()
  const input: WeeklyPlanInput = {
    weekStart,
    asOf: opts.asOf ?? `${weekStart}T08:00+08:00`,
    demand: cells.map((cell) => ({
      kecamatan: cell.kecamatan,
      stream: cell.stream,
      accountType: cell.accountType,
      weeklyLiters: cell.liters,
      reportCount: cell.reports,
    })),
    ...(opts.availability ? { availability: opts.availability } : {}),
  }
  const result = solveWeekly(input)
  return cells.map((cell) => entryFor(cell, result))
}
