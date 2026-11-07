import { describe, expect, it } from 'vitest'
import { formatWita, nowWita } from '@/lib/time'

describe('WITA timestamps', () => {
  it('stamps decisions at UTC+8 and labels the display WITA', () => {
    expect(nowWita(new Date('2026-11-07T06:05:09.000Z'))).toBe('2026-11-07T14:05:09+08:00')
    expect(formatWita('2026-11-07T14:05:09+08:00')).toContain('WITA')
  })
})
