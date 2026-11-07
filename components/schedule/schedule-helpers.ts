import {
  SOURCE_GUIDE_CITATION,
  SOURCE_GUIDE_LABELS,
  SOURCE_TO_STREAM,
  SOURCE_TYPES,
  type SourceType,
} from '@/lib/schedule/sourceTypes'
import { WASTE_STREAMS, type ScheduleEntry, type WasteStream, type Weekday } from '@/lib/schemas'

const DAY_LABELS_ID: Readonly<Record<Weekday, string>> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
}

const STREAM_LABELS_ID: Readonly<Record<WasteStream, string>> = {
  organik: 'Organik (Mudah Terurai)',
  anorganik: 'Anorganik (Guna Ulang & Daur Ulang)',
  residu: 'Residu',
  B3: 'B3 (Bahan Berbahaya & Beracun)',
}

export function formatScheduleDaysId(days: readonly Weekday[]): string {
  if (days.length === 0) return 'Sesuai permintaan (Penanganan khusus DLH)'
  return days.map((day) => DAY_LABELS_ID[day] ?? day).join(', ')
}

export function formatStreamLabelId(stream: WasteStream): string {
  return STREAM_LABELS_ID[stream]
}

export type StreamGroupSummary = {
  stream: WasteStream
  label: string
  daysText: string
  windowText: string
  mode: 'routine' | 'on_request'
  totalReports: number
  totalLiters: number
  nextPickup?: string
  note?: string
}

export function groupScheduleByStream(entries: readonly ScheduleEntry[]): StreamGroupSummary[] {
  return WASTE_STREAMS.map((stream) => {
    const matching = entries.filter((entry) => entry.stream === stream)
    const totalReports = matching.reduce((sum, item) => sum + item.basis.reports, 0)
    const totalLiters = Math.round(matching.reduce((sum, item) => sum + item.basis.liters, 0) * 100) / 100
    const first = matching[0]
    const daysText = first ? formatScheduleDaysId(first.days) : stream === 'B3' ? formatScheduleDaysId([]) : 'Belum ada jadwal tercatat'
    const windowText = first?.window ? `${first.window.start}–${first.window.end} WITA` : stream === 'B3' ? 'Penanganan terpisah DLH' : '—'
    const nextPickup = matching.map((item) => item.nextPickup).find((val): val is string => Boolean(val))
    return {
      stream,
      label: formatStreamLabelId(stream),
      daysText,
      windowText,
      mode: stream === 'B3' ? 'on_request' : (first?.mode ?? 'routine'),
      totalReports,
      totalLiters,
      ...(nextPickup ? { nextPickup } : {}),
      ...(first?.note ? { note: first.note } : {}),
    }
  })
}

export type SourceSortingCard = {
  sourceType: SourceType
  titleId: string
  titleEn: string
  stream: WasteStream
  streamLabel: string
  citation: typeof SOURCE_GUIDE_CITATION
}

export function sourceSortingCards(): SourceSortingCard[] {
  return SOURCE_TYPES.map((sourceType) => {
    const label = SOURCE_GUIDE_LABELS[sourceType]
    const stream = SOURCE_TO_STREAM[sourceType]
    return {
      sourceType,
      titleId: label.id,
      titleEn: label.en,
      stream,
      streamLabel: formatStreamLabelId(stream),
      citation: label.citation,
    }
  })
}

