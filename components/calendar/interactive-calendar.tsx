'use client'

import { useMemo, useState } from 'react'
import type { PetugasTimetableSlot } from '@/lib/accounts/store'
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildMonthCalendarGrid,
  type CalendarDayCell,
  type ExternalCalendarEventInput,
} from '@/lib/calendar/balinese-calendar'
import type { Kecamatan, WasteStream } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'

const STREAM_BADGE: Record<WasteStream, { label: string; bg: string; icon: string }> = {
  organik: { label: 'Organik', bg: 'bg-mint text-ink', icon: 'compost' },
  anorganik: { label: 'Anorganik', bg: 'bg-sky text-ink', icon: 'recycling' },
  residu: { label: 'Residu', bg: 'bg-amber text-ink', icon: 'delete' },
  B3: { label: 'Khusus B3', bg: 'bg-coral text-ink', icon: 'warning' },
}

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const

export function InteractiveCalendar({
  kecamatan,
  timetable,
  weeklyRegularLiters,
  selectedBalineseEventIds,
  onToggleBalineseEvent,
}: {
  kecamatan: Kecamatan
  timetable: PetugasTimetableSlot[]
  weeklyRegularLiters: number
  selectedBalineseEventIds: string[]
  onToggleBalineseEvent?: (eventId: string) => void
}) {
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-07')
  const [downloadedNotice, setDownloadedNotice] = useState<string | null>(null)

  const cells = useMemo(
    () =>
      buildMonthCalendarGrid({
        year: 2026,
        month: 11,
        todayDate: '2026-11-07',
        kecamatan,
        timetable,
        weeklyRegularLiters,
        selectedBalineseEventIds,
      }),
    [kecamatan, timetable, weeklyRegularLiters, selectedBalineseEventIds],
  )

  const activeCell: CalendarDayCell =
    cells.find((c) => c.date === selectedDate) ??
    cells.find((c) => c.isToday) ??
    cells[0]

  function triggerIcsDownload(input: ExternalCalendarEventInput) {
    const ics = buildIcsContent(input)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jadwal-sampah-${input.date}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setDownloadedNotice(`Jadwal "${input.title}" (${input.date}) siap ditambahkan ke aplikasi Kalender Anda (.ics).`)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]" data-testid="interactive-calendar">
      {/* Left: Monthly Calendar Grid */}
      <div className="vector-card bg-card p-5 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="vector-pill bg-mint text-ink">
              <MaterialIcon name="calendar_month" size="sm" />
              November 2026 · WITA
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold">
              Kalender Angkut & Hari Raya Bali ({kecamatan})
            </h3>
            <p className="text-xs text-ink/75">
              Klik tanggal mana pun untuk melihat detail jenis sampah yang diangkut, lonjakan Rahinan Bali, dan menyimpannya ke kalender HP/Google Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-extrabold">
            <span className="rounded border-2 border-ink bg-mint px-2 py-0.5">Organik</span>
            <span className="rounded border-2 border-ink bg-sky px-2 py-0.5">Anorganik</span>
            <span className="rounded border-2 border-ink bg-amber px-2 py-0.5">Residu</span>
            <span className="rounded border-2 border-ink bg-lavender px-2 py-0.5">Rahinan Bali</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold uppercase text-ink/75">
          {WEEKDAY_HEADERS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            const isSelected = cell.date === activeCell.date
            const hasSelectedBaliEvent = cell.balineseEvents.some((e) => e.isSelectedByUser)
            const hasAnyBaliEvent = cell.balineseEvents.length > 0

            return (
              <button
                key={cell.date}
                type="button"
                data-testid={`calendar-cell-${cell.date}`}
                onClick={() => {
                  setSelectedDate(cell.date)
                  setDownloadedNotice(null)
                }}
                aria-pressed={isSelected}
                className={[
                  'min-h-[4.8rem] rounded-md border-2 p-1.5 text-left transition-transform flex flex-col justify-between',
                  isSelected
                    ? 'border-ink bg-amber/35 ring-2 ring-ink -translate-y-0.5'
                    : cell.isToday
                      ? 'border-primary bg-mint/25 hover:bg-mint/40'
                      : cell.isCurrentMonth
                        ? 'border-ink/70 bg-bg hover:bg-card'
                        : 'border-ink/30 bg-bg/50 opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={[
                      'inline-flex h-6 w-6 items-center justify-center rounded text-xs font-extrabold',
                      cell.isToday
                        ? 'bg-primary text-white border border-ink'
                        : isSelected
                          ? 'bg-ink text-white'
                          : 'text-ink',
                    ].join(' ')}
                  >
                    {cell.dayOfMonth}
                  </span>
                  {cell.isToday ? (
                    <span className="rounded bg-primary px-1 text-[9px] font-extrabold text-white">
                      Hari Ini
                    </span>
                  ) : cell.isPast && cell.pickups.length > 0 ? (
                    <MaterialIcon name="check_circle" size="sm" className="text-success" title="Selesai diangkut" />
                  ) : null}
                </div>

                {/* Stream pills */}
                <div className="mt-1 grid gap-0.5">
                  {cell.pickups.map((p) => (
                    <span
                      key={p.stream}
                      className={`truncate rounded border border-ink px-1 py-0.2 text-[9px] font-extrabold leading-tight ${STREAM_BADGE[p.stream].bg}`}
                    >
                      {STREAM_BADGE[p.stream].label}
                    </span>
                  ))}
                  {hasAnyBaliEvent ? (
                    <span
                      className={[
                        'truncate rounded border border-ink px-1 py-0.2 text-[9px] font-extrabold leading-tight',
                        hasSelectedBaliEvent ? 'bg-lavender text-ink' : 'bg-card text-ink/70',
                      ].join(' ')}
                    >
                      {cell.balineseEvents[0].name}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Clicked Day Cell Details & Add to Actual Calendar */}
      <div className="vector-card bg-card p-5 grid content-start gap-4" data-testid="calendar-day-detail">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Detail Tanggal Terpilih
            </span>
            <h4 className="text-xl font-extrabold">
              {activeCell.weekdayNameId}, {activeCell.dayOfMonth} November 2026
            </h4>
          </div>
          <span
            className={[
              'vector-pill text-xs',
              activeCell.isToday
                ? 'bg-primary text-white'
                : activeCell.isPast
                  ? 'bg-bg text-ink'
                  : 'bg-mint text-ink',
            ].join(' ')}
          >
            <MaterialIcon
              name={activeCell.isToday ? 'today' : activeCell.isPast ? 'history' : 'upcoming'}
              size="sm"
            />
            {activeCell.isToday ? 'Hari Ini' : activeCell.isPast ? 'Riwayat Selesai' : 'Jadwal Mendatang'}
          </span>
        </div>

        {/* Balinese Calendar Event on this date */}
        {activeCell.balineseEvents.length > 0 ? (
          <div className="grid gap-3">
            {activeCell.balineseEvents.map((ev) => (
              <div
                key={ev.id}
                className={`vector-card-soft p-3.5 grid gap-2 ${
                  ev.isSelectedByUser ? 'bg-lavender/50' : 'bg-bg'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="vector-pill bg-amber text-ink text-[11px]">
                      <MaterialIcon name="temple_hindu" size="sm" />
                      Kalender Bali · {ev.balineseName}
                    </span>
                    <p className="mt-1 text-base font-extrabold">{ev.name}</p>
                  </div>
                  {onToggleBalineseEvent ? (
                    <Button
                      variant={ev.isSelectedByUser ? 'primary' : 'secondary'}
                      onClick={() => onToggleBalineseEvent(ev.id)}
                      className="px-2.5 py-1 text-xs"
                    >
                      <MaterialIcon
                        name={ev.isSelectedByUser ? 'check_box' : 'check_box_outline_blank'}
                        size="sm"
                      />
                      {ev.isSelectedByUser ? 'Berdampak pada Saya' : 'Tandai Berdampak'}
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs font-bold text-ink/85">
                  Prediksi Lonjakan: Organik +{ev.organicSurgePct}% · Anorganik +{ev.anorganikSurgePct}% (+{ev.extraLitersHousehold} L)
                </p>
                <p className="text-xs text-ink/80">
                  <strong>Jenis Sampah Khas:</strong> {ev.typicalWasteItems.join(', ')}
                </p>
                <p className="text-xs text-ink/85 bg-card/80 rounded border border-ink/30 p-2">
                  <strong>Saran AI & Petugas:</strong> {ev.preparationTip} {ev.postEventTip}
                </p>
              </div>
            ))}
          </div>
        ) : activeCell.predictedExtraLiters > 0 ? (
          <div className="vector-card-soft bg-lavender/35 p-3 text-xs font-semibold">
            <p className="font-extrabold flex items-center gap-1">
              <MaterialIcon name="auto_awesome" size="sm" className="text-primary" />
              Efek H+1 Setelah Rahinan Bali (+{activeCell.predictedExtraLiters} L)
            </p>
            <p className="mt-0.5 text-ink/80">
              Sistem memperhitungkan sisa lungsuran canang/banten dari hari raya kemarin pada pengangkutan hari ini.
            </p>
          </div>
        ) : null}

        {/* Scheduled Pickups for this date */}
        <div className="grid gap-3">
          <p className="text-sm font-extrabold flex items-center gap-1.5">
            <MaterialIcon name="local_shipping" size="sm" className="text-primary" />
            Jadwal Pengangkutan Armada ({activeCell.pickups.length} aliran)
          </p>

          {activeCell.pickups.length === 0 ? (
            <div className="vector-card-soft bg-bg p-4 text-sm">
              <p className="font-bold">Tidak ada jadwal angkut reguler pada hari ini.</p>
              <p className="mt-1 text-xs text-ink/75">
                Simpan sampah terpilah di wadah tertutup hingga jadwal pengangkutan berikutnya.
              </p>
            </div>
          ) : (
            activeCell.pickups.map((pickup) => {
              const badge = STREAM_BADGE[pickup.stream]
              const calInput: ExternalCalendarEventInput = {
                title: `Angkut Sampah ${badge.label} (${kecamatan})`,
                date: activeCell.date,
                startTime: pickup.windowStart,
                endTime: pickup.windowEnd,
                description: `Jadwal penjemputan sampah ${badge.label} oleh armada DLHK ${kecamatan}. Toleransi leeway ±${pickup.leewayMinutes} menit. Perkiraan volume Anda: ${pickup.estimatedUserLiters} L.`,
                location: `${kecamatan}, Kota Denpasar, Bali`,
              }
              const googleUrl = buildGoogleCalendarUrl(calInput)

              return (
                <div key={pickup.stream} className="vector-card-soft bg-bg p-3.5 grid gap-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`vector-pill ${badge.bg}`}>
                      <MaterialIcon name={badge.icon} size="sm" />
                      Armada {badge.label}
                    </span>
                    <span className="text-xs font-extrabold">
                      {pickup.windowStart}–{pickup.windowEnd} WITA (±{pickup.leewayMinutes} mnt)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink/85">
                    <span>
                      Estimasi Volume Anda: <strong>{pickup.estimatedUserLiters} L</strong>
                    </span>
                    <span>
                      Batas Kuota Jemput: <strong>{pickup.maxLitersPerPickup} L</strong> (+{pickup.surgeTolerancePct}% hari raya)
                    </span>
                  </div>

                  {/* Add to user's actual calendar buttons */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-ink/20">
                    <Button
                      variant="secondary"
                      onClick={() => triggerIcsDownload(calInput)}
                      className="px-2.5 py-1.5 text-xs"
                      data-testid={`download-ics-${pickup.stream}`}
                    >
                      <MaterialIcon name="event_available" size="sm" />
                      Simpan ke Kalender HP/Laptop (.ics)
                    </Button>
                    <a
                      href={googleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`google-cal-${pickup.stream}`}
                      className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-mint px-2.5 py-1.5 text-xs font-bold text-ink"
                    >
                      <MaterialIcon name="open_in_new" size="sm" />
                      Tambah ke Google Calendar
                    </a>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {downloadedNotice ? (
          <div
            role="status"
            data-testid="calendar-download-notice"
            className="vector-card-soft bg-mint/60 px-3 py-2 text-xs font-extrabold text-ink flex items-center gap-1.5"
          >
            <MaterialIcon name="check_circle" size="sm" className="text-primary" />
            <span>{downloadedNotice}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
