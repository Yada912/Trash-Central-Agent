// Simulated weekly pickup allocation. Not a dispatch and not an official schedule.
//
// solveWeekly(input) -> WeeklyScheduleResult
//
// The caller supplies the Monday (WITA civil date) and every liter, truck, and
// shift. This module does not read the clock. Streams are the normalized slugs
// organik | anorganik | residu | B3. Account type is household | company.
// Company rows are groups (kecamatan x stream x accountType), not named firms.
//
// weeklyLiters is confirmed demand for this horizon only. It is not a forecast.
// Confirmed reports are passed as weeklyLiters, not as backlogLiters. Optional
// backlogLiters stay visible and are never placed on a run.
//
// Availability omitted: feasibility 'unverified_template'. Runs stay empty.
// No weekday template, truck, or nextPickup is invented here. The adapter owns
// any unverified weekday pattern and must not treat these rows as booked runs.
// Availability present, including empty arrays: feasibility 'solver_checked'.
// Empty trucks or slots leave demand unassigned. They do not fall back to a template.
// B3 is never dated. A next pickup is the earliest run whose window has not
// ended by asOf (date-only asOf is 00:00; overnight end < start ends next day).
//
// Adapter to Hensen's ScheduleEntry (he owns the canonical type):
//   routine run -> days: [weekday of run.date], window: {start, end},
//     mode: 'routine', basis.liters: the GROUP weeklyLiters (not the sum of chunks),
//     basis.reports: reportCount, source: 'simulated',
//     note when dedicated: company-group window, not a per-company booking.
//   unassigned and every B3 row -> mode: 'on_request', days: [], window: null,
//     unassigned: { liters, reason }, note from the row.
//   optional nextPickup YYYY-MM-DD comes from nextPickups (already computed from asOf).
//   copy feasibility through unchanged.

export const WEEKLY_STREAMS = ['organik', 'anorganik', 'residu', 'B3'] as const
export type WeeklyStream = (typeof WEEKLY_STREAMS)[number]

export const WEEKLY_ACCOUNT_TYPES = ['household', 'company'] as const
export type WeeklyAccountType = (typeof WEEKLY_ACCOUNT_TYPES)[number]

export const WEEKLY_POLICY_DEFAULTS = {
  frequencyTargets: { organik: 3, anorganik: 2, residu: 1 },
  /** Company-group weekly liters at or above this are marked dedicated. Not a regulation. */
  highVolumeCompanyLiters: 500,
  /** Minimum window length treated as one run. Not a travel time and not a liter measure. */
  runMinutes: 180,
} as const

const SCALE = 1_000_000

export class WeeklyInputError extends Error {
  readonly code = 'INVALID_INPUT' as const
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'WeeklyInputError'
    this.field = field
  }
}

export interface WeeklyDemand {
  kecamatan: string
  stream: WeeklyStream
  accountType: WeeklyAccountType
  /** Confirmed liters for this horizon. Not a forecast and not backlog. */
  weeklyLiters: number
  /** Held outside this week. Reported and not scheduled. */
  backlogLiters?: number
  /** Source reports already counted by the caller. Not multiplied into liters. */
  reportCount?: number
}

export interface WeeklyTruck {
  id: string
  capacityLiters: number
}

export interface WeeklySlot {
  truckId: string
  /** Civil date YYYY-MM-DD inside the week that starts on weekStart. */
  date: string
  /** 0 = weekStart. Checked when present. */
  dayIndex?: number
  start: string
  end: string
  accountType: WeeklyAccountType
  /** Available minutes for this run. When omitted, the clock window is used. */
  durationMin?: number
}

export interface WeeklyExcluded {
  kecamatan: string
  stream: WeeklyStream
  accountType: WeeklyAccountType
  liters: number
  reason: 'needs_sorting' | 'mixed' | 'contaminated'
}

export interface WeeklyPolicyInput {
  frequencyTargets?: { organik?: number; anorganik?: number; residu?: number }
  highVolumeCompanyLiters?: number
  runMinutes?: number
}

export interface WeeklyAvailability {
  trucks: WeeklyTruck[]
  slots: WeeklySlot[]
}

export interface WeeklyPlanInput {
  /** WITA civil Monday, YYYY-MM-DD. Caller supplied. */
  weekStart: string
  /** YYYY-MM-DD or YYYY-MM-DDTHH:MM[:SS]+08:00. Caller supplied. */
  asOf: string
  demand: WeeklyDemand[]
  excluded?: WeeklyExcluded[]
  /** Omit the property for an unverified template. Pass arrays, even empty, to check resources. */
  availability?: WeeklyAvailability
  policy?: WeeklyPolicyInput
}

export interface WeeklyRun {
  kecamatan: string
  stream: Exclude<WeeklyStream, 'B3'>
  accountType: WeeklyAccountType
  date: string
  start: string
  end: string
  truckId: string
  liters: number
  /** True only for a company group at or above the high-volume threshold. Not a named booking. */
  dedicated: boolean
  simulated: true
}

export type WeeklyUnassignedReason =
  | 'b3_separate_dlh_demo'
  | 'no_truck'
  | 'no_slot'
  | 'capacity'
  | 'needs_sorting'
  | 'unverified_template'

export interface WeeklyUnassigned {
  kecamatan: string
  stream: WeeklyStream
  accountType: WeeklyAccountType
  liters: number
  reason: WeeklyUnassignedReason
  note: string
}

export interface WeeklyGroupResult {
  kecamatan: string
  stream: WeeklyStream
  accountType: WeeklyAccountType
  weeklyLiters: number
  backlogLiters: number
  reportCount: number
  assignedLiters: number
  unassignedLiters: number
  dedicated: boolean
}

export interface WeeklyNextPickup {
  kecamatan: string
  stream: WeeklyStream
  accountType: WeeklyAccountType
  date: string | null
  start: string | null
  end: string | null
}

export interface WeeklyWarning {
  code: 'frequency_unmet'
  kecamatan: string
  stream: Exclude<WeeklyStream, 'B3'>
  accountType: WeeklyAccountType
  target: number
  achieved: number
  message: string
}

export interface WeeklyScheduleResult {
  feasibility: 'unverified_template' | 'solver_checked'
  source: 'simulated'
  weekStart: string
  asOf: string
  runs: WeeklyRun[]
  unassigned: WeeklyUnassigned[]
  groups: WeeklyGroupResult[]
  timelines: Array<{ kecamatan: string; runs: WeeklyRun[] }>
  nextPickups: WeeklyNextPickup[]
  reconciliation: {
    weeklyLitersIn: number
    assignedLiters: number
    unassignedLiters: number
    backlogLiters: number
    excludedLiters: number
  }
  warnings: WeeklyWarning[]
  assumptions: string[]
  policy: {
    frequencyTargets: { organik: number; anorganik: number; residu: number }
    highVolumeCompanyLiters: number
    runMinutes: number
  }
  limitations: string[]
}

interface Normalized {
  weekStart: string
  asOf: { date: string; time: string | null }
  demand: Array<WeeklyDemand & { units: number; backlogUnits: number }>
  excluded: Array<WeeklyExcluded & { units: number }>
  availability: WeeklyAvailability | undefined
  policy: WeeklyScheduleResult['policy']
}

function fail(message: string, field?: string): never {
  throw new WeeklyInputError(message, field)
}

function isDateOnly(value: string): boolean {
  return /^(\d{4})-(\d{2})-(\d{2})$/.test(value)
}

function parseDateParts(value: string, field: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) fail(`${field} must be YYYY-MM-DD.`, field)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    fail(`${field} is not a civil date.`, field)
  }
  return { year, month, day }
}

function weekdayIndex(value: string): number {
  const { year, month, day } = parseDateParts(value, 'date')
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function addDays(value: string, days: number): string {
  const { year, month, day } = parseDateParts(value, 'date')
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  const y = utc.getUTCFullYear()
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dayOffset(weekStart: string, date: string): number {
  const start = parseDateParts(weekStart, 'weekStart')
  const current = parseDateParts(date, 'date')
  const a = Date.UTC(start.year, start.month - 1, start.day)
  const b = Date.UTC(current.year, current.month - 1, current.day)
  return Math.round((b - a) / 86_400_000)
}

function clockMinutes(value: string, field: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) fail(`${field} must be HH:MM.`, field)
  return Number(match[1]) * 60 + Number(match[2])
}

function windowMinutes(start: string, end: string, field: string): number {
  const from = clockMinutes(start, field)
  const to = clockMinutes(end, field)
  if (to > from) return to - from
  if (to < from) return 24 * 60 - from + to
  fail(`${field} has an empty clock window. Use end after start, or an earlier end for an overnight window.`, field)
}

function toUnits(liters: number, field: string): number {
  if (!Number.isFinite(liters) || liters < 0) fail(`${field} must be a finite number of liters >= 0.`, field)
  return Math.round(liters * SCALE)
}

function fromUnits(units: number): number {
  return units / SCALE
}

function parseAsOf(value: string): { date: string; time: string | null } {
  if (isDateOnly(value)) {
    parseDateParts(value, 'asOf')
    return { date: value, time: null }
  }
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?\+08:00$/.exec(value)
  if (!match) fail('asOf must be YYYY-MM-DD or a WITA timestamp ending in +08:00.', 'asOf')
  parseDateParts(match[1], 'asOf')
  clockMinutes(match[2], 'asOf')
  return { date: match[1], time: match[2] }
}

function assertLabel(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 120) fail(`${field} must be 1 to 120 characters.`, field)
}

function normalize(input: WeeklyPlanInput): Normalized {
  if (!input || typeof input !== 'object') fail('Weekly input is missing.', 'input')
  if (!isDateOnly(input.weekStart)) fail('weekStart must be YYYY-MM-DD.', 'weekStart')
  parseDateParts(input.weekStart, 'weekStart')
  if (weekdayIndex(input.weekStart) !== 1) fail('weekStart must be a Monday civil date.', 'weekStart')
  const asOf = parseAsOf(input.asOf)
  if (!Array.isArray(input.demand)) fail('demand must be an array.', 'demand')
  const seen = new Set<string>()
  const demand = input.demand.map((row, index) => {
    const field = `demand.${index}`
    assertLabel(row.kecamatan, `${field}.kecamatan`)
    if (!WEEKLY_STREAMS.includes(row.stream)) fail(`${field}.stream is not a weekly stream.`, `${field}.stream`)
    if (!WEEKLY_ACCOUNT_TYPES.includes(row.accountType)) fail(`${field}.accountType is invalid.`, `${field}.accountType`)
    const key = `${row.kecamatan}\0${row.stream}\0${row.accountType}`
    if (seen.has(key)) fail(`${field} repeats a kecamatan, stream, and account type.`, field)
    seen.add(key)
    if (row.reportCount !== undefined && (!Number.isInteger(row.reportCount) || row.reportCount < 0)) {
      fail(`${field}.reportCount must be a non-negative integer.`, `${field}.reportCount`)
    }
    return {
      ...row,
      units: toUnits(row.weeklyLiters, `${field}.weeklyLiters`),
      backlogUnits: toUnits(row.backlogLiters ?? 0, `${field}.backlogLiters`),
    }
  })
  const excluded = (input.excluded ?? []).map((row, index) => {
    const field = `excluded.${index}`
    assertLabel(row.kecamatan, `${field}.kecamatan`)
    if (!WEEKLY_STREAMS.includes(row.stream)) fail(`${field}.stream is not a weekly stream.`, `${field}.stream`)
    if (!WEEKLY_ACCOUNT_TYPES.includes(row.accountType)) fail(`${field}.accountType is invalid.`, `${field}.accountType`)
    if (!['needs_sorting', 'mixed', 'contaminated'].includes(row.reason)) fail(`${field}.reason is invalid.`, `${field}.reason`)
    return { ...row, units: toUnits(row.liters, `${field}.liters`) }
  })
  const policy = resolvePolicy(input.policy)
  if (input.availability !== undefined) validateAvailability(input.availability, input.weekStart)
  return { weekStart: input.weekStart, asOf, demand, excluded, availability: input.availability, policy }
}

function resolvePolicy(input: WeeklyPolicyInput | undefined): WeeklyScheduleResult['policy'] {
  const targets = {
    organik: input?.frequencyTargets?.organik ?? WEEKLY_POLICY_DEFAULTS.frequencyTargets.organik,
    anorganik: input?.frequencyTargets?.anorganik ?? WEEKLY_POLICY_DEFAULTS.frequencyTargets.anorganik,
    residu: input?.frequencyTargets?.residu ?? WEEKLY_POLICY_DEFAULTS.frequencyTargets.residu,
  }
  for (const [stream, value] of Object.entries(targets)) {
    if (!Number.isInteger(value) || value < 0 || value > 7) {
      fail(`frequency target for ${stream} must be an integer from 0 to 7.`, 'policy.frequencyTargets')
    }
  }
  const highVolumeCompanyLiters = input?.highVolumeCompanyLiters ?? WEEKLY_POLICY_DEFAULTS.highVolumeCompanyLiters
  if (!Number.isFinite(highVolumeCompanyLiters) || highVolumeCompanyLiters <= 0) {
    fail('highVolumeCompanyLiters must be a finite number > 0.', 'policy.highVolumeCompanyLiters')
  }
  const runMinutes = input?.runMinutes ?? WEEKLY_POLICY_DEFAULTS.runMinutes
  if (!Number.isInteger(runMinutes) || runMinutes < 1 || runMinutes > 24 * 60) {
    fail('runMinutes must be an integer from 1 to 1440.', 'policy.runMinutes')
  }
  return { frequencyTargets: targets, highVolumeCompanyLiters, runMinutes }
}

function validateAvailability(availability: WeeklyAvailability, weekStart: string): void {
  if (!availability || !Array.isArray(availability.trucks) || !Array.isArray(availability.slots)) {
    fail('availability needs trucks and slots arrays.', 'availability')
  }
  const trucks = new Map<string, WeeklyTruck>()
  for (const [index, truck] of availability.trucks.entries()) {
    if (typeof truck.id !== 'string' || truck.id.trim() === '' || truck.id.length > 64) {
      fail(`trucks.${index}.id is invalid.`, `availability.trucks.${index}.id`)
    }
    if (trucks.has(truck.id)) fail(`Duplicate truck id ${truck.id}.`, 'availability.trucks')
    if (!Number.isFinite(truck.capacityLiters) || truck.capacityLiters <= 0) {
      fail(`Truck ${truck.id} capacity must be a finite number > 0.`, `availability.trucks.${index}.capacityLiters`)
    }
    trucks.set(truck.id, truck)
  }
  const intervals: Array<{ truckId: string; start: number; end: number }> = []
  for (const [index, slot] of availability.slots.entries()) {
    const field = `availability.slots.${index}`
    if (!trucks.has(slot.truckId)) fail(`${field} names an unknown truck.`, `${field}.truckId`)
    if (!isDateOnly(slot.date)) fail(`${field}.date must be YYYY-MM-DD.`, `${field}.date`)
    const offset = dayOffset(weekStart, slot.date)
    if (offset < 0 || offset > 6) fail(`${field}.date is outside the 7-day horizon.`, `${field}.date`)
    if (slot.dayIndex !== undefined && slot.dayIndex !== offset) {
      fail(`${field}.dayIndex does not match the date.`, `${field}.dayIndex`)
    }
    if (!WEEKLY_ACCOUNT_TYPES.includes(slot.accountType)) fail(`${field}.accountType is invalid.`, `${field}.accountType`)
    const span = windowMinutes(slot.start, slot.end, `${field}.window`)
    if (slot.durationMin !== undefined) {
      if (!Number.isInteger(slot.durationMin) || slot.durationMin < 1 || slot.durationMin > span) {
        fail(`${field}.durationMin must be a positive integer no longer than the clock window.`, `${field}.durationMin`)
      }
    }
    const dayStart = offset * 1440
    const start = dayStart + clockMinutes(slot.start, `${field}.start`)
    const end = clockMinutes(slot.end, `${field}.end`)
    const finish = end > clockMinutes(slot.start, `${field}.start`) ? dayStart + end : dayStart + 1440 + end
    intervals.push({ truckId: slot.truckId, start, end: finish })
  }
  intervals.sort((a, b) => a.truckId.localeCompare(b.truckId) || a.start - b.start)
  for (let index = 1; index < intervals.length; index += 1) {
    const previous = intervals[index - 1]
    const current = intervals[index]
    if (previous.truckId === current.truckId && current.start < previous.end) {
      fail(`Truck ${current.truckId} has overlapping shifts.`, 'availability.slots')
    }
  }
}

function assumptions(policy: WeeklyScheduleResult['policy'], feasibility: WeeklyScheduleResult['feasibility']): string[] {
  return [
    'Simulated planning only. This is not a dispatch and not an official collection calendar.',
    `runMinutes (${policy.runMinutes}) is a planning assumption for whether a shift window can hold one run. It is not a travel time and it is not a volume.`,
    'Frequency targets are heuristic goals. Demand is not increased to create extra runs, and a missed target is a warning rather than a promise.',
    `A company group at or above ${policy.highVolumeCompanyLiters} weekly liters is marked dedicated. That is not a booking for a named company.`,
    'Source separation is a caller prerequisite. Mixed or contaminated liters belong in excluded, not in a clean stream.',
    'B3 is a simulated request for separate DLH handling. No specialist date or truck is assigned.',
    'weeklyLiters is demand for this supplied horizon only. It is not a forecast of later weeks.',
    'Optional backlogLiters are visible in groups and reconciliation and are never placed on a run.',
    feasibility === 'unverified_template'
      ? 'Truck and shift availability were not supplied. Runs are empty. No capacity check was performed.'
      : 'solver_checked compares liters with supplied truck capacity and the window with runMinutes. That is not a travel or dispatch feasibility check.',
  ]
}

const LIMITATIONS = [
  'No road distance or travel time is estimated.',
  'Backlog liters are reported and are not placed on a run.',
  'A company row is a district and stream group, not an identified firm.',
  'Ordinary runs never carry B3.',
]

function unassignedRow(
  row: { kecamatan: string; stream: WeeklyStream; accountType: WeeklyAccountType },
  units: number,
  reason: WeeklyUnassignedReason,
  note: string,
): WeeklyUnassigned {
  return { kecamatan: row.kecamatan, stream: row.stream, accountType: row.accountType, liters: fromUnits(units), reason, note }
}

function compareMoment(date: string, time: string, asOf: Normalized['asOf']): number {
  if (date !== asOf.date) return date < asOf.date ? -1 : 1
  const probe = asOf.time ?? '00:00'
  if (time === probe) return 0
  return time < probe ? -1 : 1
}

function windowEnd(date: string, start: string, end: string): { date: string; time: string } {
  if (end > start) return { date, time: end }
  return { date: addDays(date, 1), time: end }
}

function nextFor(runs: WeeklyRun[], row: WeeklyDemand, asOf: Normalized['asOf']): WeeklyNextPickup {
  const probe = asOf.time ?? '00:00'
  const candidates = runs
    .filter((run) => run.kecamatan === row.kecamatan && run.stream === row.stream && run.accountType === row.accountType)
    .filter((run) => {
      const end = windowEnd(run.date, run.start, run.end)
      return compareMoment(end.date, end.time, { date: asOf.date, time: probe }) > 0
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.truckId.localeCompare(b.truckId))
  const next = candidates[0]
  return {
    kecamatan: row.kecamatan,
    stream: row.stream,
    accountType: row.accountType,
    date: next?.date ?? null,
    start: next?.start ?? null,
    end: next?.end ?? null,
  }
}

interface SlotUse {
  slot: WeeklySlot
  truck: WeeklyTruck
  capacityUnits: number
}

function usableSlots(availability: WeeklyAvailability, runMinutes: number): SlotUse[] {
  const trucks = new Map(availability.trucks.map((truck) => [truck.id, truck]))
  return availability.slots
    .map((slot) => {
      const truck = trucks.get(slot.truckId)
      if (!truck) return null
      const span = windowMinutes(slot.start, slot.end, 'slot')
      const available = slot.durationMin ?? span
      if (available < runMinutes) return null
      return { slot, truck, capacityUnits: toUnits(truck.capacityLiters, 'capacity') }
    })
    .filter((slot): slot is SlotUse => slot !== null)
    .sort(
      (a, b) =>
        a.slot.date.localeCompare(b.slot.date) ||
        a.slot.start.localeCompare(b.slot.start) ||
        a.slot.truckId.localeCompare(b.slot.truckId),
    )
}

function pickSpread(slots: SlotUse[], count: number): SlotUse[] {
  if (count <= 0 || slots.length === 0) return []
  if (count >= slots.length) return slots.slice()
  const chosen: SlotUse[] = []
  const used = new Set<number>()
  for (let index = 0; index < count; index += 1) {
    let pick = Math.floor((index * slots.length) / count)
    while (used.has(pick) && pick < slots.length) pick += 1
    if (pick >= slots.length) break
    used.add(pick)
    chosen.push(slots[pick])
  }
  return chosen
}

function placeGroup(
  row: Normalized['demand'][number],
  slots: SlotUse[],
  used: Set<WeeklySlot>,
  policy: WeeklyScheduleResult['policy'],
): { runs: WeeklyRun[]; unassignedUnits: number; achieved: number; target: number } {
  const eligible = slots.filter((slot) => !used.has(slot.slot) && slot.slot.accountType === row.accountType)
  const target = row.stream === 'B3' ? 0 : policy.frequencyTargets[row.stream]
  if (row.units <= 0) return { runs: [], unassignedUnits: 0, achieved: 0, target }
  if (eligible.length === 0) return { runs: [], unassignedUnits: row.units, achieved: 0, target }
  const primary = target > 0 ? pickSpread(eligible, Math.min(target, eligible.length)) : []
  const primarySet = new Set(primary.map((slot) => slot.slot))
  const order = [...primary, ...eligible.filter((slot) => !primarySet.has(slot.slot))]
  let remaining = row.units
  const parts: Array<{ slot: SlotUse; units: number }> = []
  if (primary.length > 0) {
    let left = remaining
    for (let index = 0; index < primary.length; index += 1) {
      const slotsLeft = primary.length - index
      const fair = Math.ceil(left / slotsLeft)
      const take = Math.min(fair, primary[index].capacityUnits, left)
      if (take > 0) parts.push({ slot: primary[index], units: take })
      left -= take
    }
    remaining = left
  }
  for (const slot of order) {
    if (remaining <= 0) break
    const existing = parts.find((part) => part.slot === slot)
    if (existing) {
      const room = slot.capacityUnits - existing.units
      const add = Math.min(room, remaining)
      existing.units += add
      remaining -= add
      continue
    }
    const take = Math.min(slot.capacityUnits, remaining)
    if (take > 0) parts.push({ slot, units: take })
    remaining -= take
  }
  const dedicated = row.accountType === 'company' && fromUnits(row.units) >= policy.highVolumeCompanyLiters
  const runs: WeeklyRun[] = []
  for (const part of parts) {
    if (part.units <= 0 || row.stream === 'B3') continue
    used.add(part.slot.slot)
    runs.push({
      kecamatan: row.kecamatan,
      stream: row.stream,
      accountType: row.accountType,
      date: part.slot.slot.date,
      start: part.slot.slot.start,
      end: part.slot.slot.end,
      truckId: part.slot.slot.truckId,
      liters: fromUnits(part.units),
      dedicated,
      simulated: true,
    })
  }
  return { runs, unassignedUnits: remaining, achieved: runs.length, target }
}

function streamRank(stream: WeeklyStream): number {
  return WEEKLY_STREAMS.indexOf(stream)
}

export function solveWeekly(input: WeeklyPlanInput): WeeklyScheduleResult {
  const normalized = normalize(input)
  const feasibility = normalized.availability === undefined ? 'unverified_template' : 'solver_checked'
  const policy = normalized.policy
  const runs: WeeklyRun[] = []
  const unassigned: WeeklyUnassigned[] = []
  const warnings: WeeklyWarning[] = []
  const groups: WeeklyGroupResult[] = []
  let assignedUnitsTotal = 0
  let unassignedDemandUnits = 0
  const slots = normalized.availability ? usableSlots(normalized.availability, policy.runMinutes) : []
  const used = new Set<WeeklySlot>()
  const ordered = normalized.demand.slice().sort(
    (a, b) =>
      streamRank(a.stream) - streamRank(b.stream) ||
      (a.accountType === b.accountType ? 0 : a.accountType === 'company' ? -1 : 1) ||
      a.kecamatan.localeCompare(b.kecamatan),
  )
  for (const row of ordered) {
    if (row.stream === 'B3') {
      if (row.units > 0) {
        unassigned.push(
          unassignedRow(
            row,
            row.units,
            'b3_separate_dlh_demo',
            'Simulated request for separate DLH handling. No date, truck, or booking is assigned.',
          ),
        )
      }
      unassignedDemandUnits += row.units
      groups.push({
        kecamatan: row.kecamatan,
        stream: row.stream,
        accountType: row.accountType,
        weeklyLiters: fromUnits(row.units),
        backlogLiters: fromUnits(row.backlogUnits),
        reportCount: row.reportCount ?? 0,
        assignedLiters: 0,
        unassignedLiters: fromUnits(row.units),
        dedicated: false,
      })
      continue
    }
    if (feasibility === 'unverified_template') {
      if (row.units > 0) {
        unassigned.push(
          unassignedRow(
            row,
            row.units,
            'unverified_template',
            'Availability was not supplied, so this quantity was not checked against trucks or shifts.',
          ),
        )
      }
      unassignedDemandUnits += row.units
      groups.push({
        kecamatan: row.kecamatan,
        stream: row.stream,
        accountType: row.accountType,
        weeklyLiters: fromUnits(row.units),
        backlogLiters: fromUnits(row.backlogUnits),
        reportCount: row.reportCount ?? 0,
        assignedLiters: 0,
        unassignedLiters: fromUnits(row.units),
        dedicated: row.accountType === 'company' && fromUnits(row.units) >= policy.highVolumeCompanyLiters,
      })
      continue
    }
    const placed = placeGroup(row, slots, used, policy)
    runs.push(...placed.runs)
    const assignedUnits = row.units - placed.unassignedUnits
    assignedUnitsTotal += assignedUnits
    unassignedDemandUnits += placed.unassignedUnits
    const noTrucks = (normalized.availability?.trucks.length ?? 0) === 0
    if (placed.unassignedUnits > 0) {
      unassigned.push(
        unassignedRow(
          row,
          placed.unassignedUnits,
          noTrucks ? 'no_truck' : placed.achieved === 0 ? 'no_slot' : 'capacity',
          noTrucks
            ? 'No truck was supplied.'
            : placed.achieved === 0
              ? 'No usable shift was supplied for this account type.'
              : 'Supplied truck capacity could not hold the remaining liters.',
        ),
      )
    }
    if (placed.target > 0 && row.units > 0 && placed.achieved < placed.target) {
      warnings.push({
        code: 'frequency_unmet',
        kecamatan: row.kecamatan,
        stream: row.stream,
        accountType: row.accountType,
        target: placed.target,
        achieved: placed.achieved,
        message: `Heuristic frequency target was ${placed.target} and ${placed.achieved} run(s) were placed. Demand was not increased.`,
      })
    }
    groups.push({
      kecamatan: row.kecamatan,
      stream: row.stream,
      accountType: row.accountType,
      weeklyLiters: fromUnits(row.units),
      backlogLiters: fromUnits(row.backlogUnits),
      reportCount: row.reportCount ?? 0,
      assignedLiters: fromUnits(assignedUnits),
      unassignedLiters: fromUnits(placed.unassignedUnits),
      dedicated: row.accountType === 'company' && fromUnits(row.units) >= policy.highVolumeCompanyLiters,
    })
  }
  for (const row of normalized.excluded) {
    if (row.units <= 0) continue
    unassigned.push(
      unassignedRow(
        row,
        row.units,
        'needs_sorting',
        `Excluded before scheduling (${row.reason}). Not treated as a clean stream.`,
      ),
    )
  }
  runs.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.start.localeCompare(b.start) ||
      a.truckId.localeCompare(b.truckId) ||
      a.kecamatan.localeCompare(b.kecamatan) ||
      a.stream.localeCompare(b.stream),
  )
  const districts = [...new Set(normalized.demand.map((row) => row.kecamatan).concat(normalized.excluded.map((row) => row.kecamatan)))].sort(
    (a, b) => a.localeCompare(b),
  )
  const nextPickups = normalized.demand.map((row) => nextFor(runs, row, normalized.asOf))
  const weeklyUnits = normalized.demand.reduce((total, row) => total + row.units, 0)
  return {
    feasibility,
    source: 'simulated',
    weekStart: normalized.weekStart,
    asOf: input.asOf,
    runs,
    unassigned,
    groups,
    timelines: districts.map((kecamatan) => ({ kecamatan, runs: runs.filter((run) => run.kecamatan === kecamatan) })),
    nextPickups,
    reconciliation: {
      weeklyLitersIn: fromUnits(weeklyUnits),
      assignedLiters: fromUnits(assignedUnitsTotal),
      unassignedLiters: fromUnits(unassignedDemandUnits),
      backlogLiters: fromUnits(normalized.demand.reduce((total, row) => total + row.backlogUnits, 0)),
      excludedLiters: fromUnits(normalized.excluded.reduce((total, row) => total + row.units, 0)),
    },
    warnings,
    assumptions: assumptions(policy, feasibility),
    policy,
    limitations: LIMITATIONS,
  }
}
