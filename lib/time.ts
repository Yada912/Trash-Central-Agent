const WITA = 'Asia/Makassar'

function partsInWita(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: WITA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }
  return parts
}

export function nowWita(date = new Date()): string {
  const parts = partsInWita(date)
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}+08:00`
}

/** Monday YYYY-MM-DD of the civil week that contains `date` in WITA. */
export function currentWitaMonday(date = new Date()): string {
  const [year, month, day] = nowWita(date).slice(0, 10).split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  const weekday = utc.getUTCDay()
  utc.setUTCDate(utc.getUTCDate() - (weekday === 0 ? 6 : weekday - 1))
  const monthText = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const dayText = String(utc.getUTCDate()).padStart(2, '0')
  return `${utc.getUTCFullYear()}-${monthText}-${dayText}`
}

export function formatWita(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return `${iso} WITA`
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: WITA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return `${formatted} WITA`
}
