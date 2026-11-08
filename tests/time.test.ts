import { describe, expect, it } from 'vitest'
import { currentWitaMonday, formatWita, nowWita } from '@/lib/time'

describe('WITA timestamps', () => {
  it('stamps decisions at UTC+8 and labels the display WITA', () => {
    expect(nowWita(new Date('2026-11-07T06:05:09.000Z'))).toBe('2026-11-07T14:05:09+08:00')
    expect(formatWita('2026-11-07T14:05:09+08:00')).toContain('WITA')
  })

  it('uses the Monday of the current WITA week', () => {
    expect(currentWitaMonday(new Date('2026-11-08T12:00:00.000Z'))).toBe('2026-11-02')
    expect(currentWitaMonday(new Date('2026-11-10T00:00:00.000Z'))).toBe('2026-11-09')
  })
})
