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
