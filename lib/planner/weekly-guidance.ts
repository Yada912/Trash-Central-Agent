// Factual templates rendered from a solved weekly result. No model call.
// Dates and times are copied from that result. District names are not copied,
// so text inside a kecamatan label cannot become an instruction.

import type { WeeklyAccountType, WeeklyScheduleResult, WeeklyStream } from '@/lib/planner/weekly'

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

function nextLine(result: WeeklyScheduleResult, accountType: WeeklyAccountType, stream: WeeklyStream): string | null {
  const next = result.nextPickups.find((item) => item.accountType === accountType && item.stream === stream && item.date)
  if (!next?.date || !next.start || !next.end) return null
  return `Next simulated ${stream} set-out for the ${accountType} group is ${next.date} from ${next.start} to ${next.end}.`
}

export function weeklyGuidance(result: WeeklyScheduleResult, accountType: WeeklyAccountType): WeeklyGuidance {
  const lines = [
    'Simulated planning only. This is not a dispatch and not an official schedule.',
    result.feasibility === 'solver_checked'
      ? 'Truck and shift figures were checked only against the availability supplied with this plan.'
      : 'Truck and shift availability were not supplied. Nothing here is a capacity assurance.',
  ]
  if (accountType === 'household') lines.push(...HOUSEHOLD)
  else lines.push(...COMPANY)
  for (const stream of ['organik', 'anorganik', 'residu'] as const) {
    const line = nextLine(result, accountType, stream)
    if (line) lines.push(line)
  }
  const b3 = result.unassigned.some((row) => row.stream === 'B3' && row.accountType === accountType)
  if (b3) lines.push(...B3)
  return { simulated: true, accountType, lines }
}
