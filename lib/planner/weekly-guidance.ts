// Factual templates rendered from a solved weekly result. No model call.
// Dates and times are copied from that result. District names are not copied,
// so text inside a kecamatan label cannot become an instruction.

import type { WeeklyAccountType, WeeklyScheduleResult } from '@/lib/planner/weekly'

export interface WeeklyGuidance {
  simulated: true
  accountType: WeeklyAccountType
  lines: string[]
}

const HOUSEHOLD = [
  'Separate each stream before set-out.',
  'Keep organic waste contained.',
  'Keep dry recyclables dry.',
]

const COMPANY = [
  'A dedicated window, when listed, is for the company group in that district and stream.',
  'It is not a booking for a named company. No company identity was supplied.',
  'Set out only a quantity that appears on the simulated run.',
]

const B3 = [
  'Do not mix this waste with ordinary streams.',
  'Contact the city environmental office (DLH) about separate handling.',
  'No collection date is promised, and no handling procedure is given.',
]

function earliestNext(result: WeeklyScheduleResult, accountType: WeeklyAccountType) {
  return result.nextPickups
    .filter((item) => item.accountType === accountType && item.date && item.start && item.end)
    .sort((a, b) => a.date!.localeCompare(b.date!) || a.start!.localeCompare(b.start!) || a.stream.localeCompare(b.stream))[0]
}

export function weeklyGuidance(result: WeeklyScheduleResult, accountType: WeeklyAccountType): WeeklyGuidance {
  const lines = [
    'Simulated planning only. This is not a dispatch and not an official schedule.',
    result.feasibility === 'solver_checked'
      ? 'The only capacity check is supplied liters against truck capacity and runMinutes against the shift window. It is not a travel or dispatch check.'
      : 'Truck and shift availability were not supplied. Nothing here is a capacity assurance or a booked run.',
  ]
  if (accountType === 'household') lines.push(...HOUSEHOLD)
  else lines.push(...COMPANY)
  const next = earliestNext(result, accountType)
  if (next?.date && next.start && next.end) {
    lines.push(`Next simulated ${next.stream} set-out for the ${accountType} group is ${next.date} from ${next.start} to ${next.end}.`)
  } else {
    lines.push('No simulated pickup for this account type has a window still open at the supplied as-of moment.')
  }
  const b3 = result.unassigned.some((row) => row.stream === 'B3' && row.accountType === accountType)
  if (b3) lines.push(...B3)
  return { simulated: true, accountType, lines }
}
