import type { Kecamatan, WasteStream } from '@/lib/schemas'
import type { PetugasTimetableSlot } from '@/lib/accounts/store'

export type BalineseEventCategory = 'rahinan_besar' | 'rahinan_rutin' | 'adat_keluarga'

export type BalineseCalendarEvent = {
  id: string
  name: string
  balineseName: string
  date: string // YYYY-MM-DD
  category: BalineseEventCategory
  defaultSelected: boolean
  organicSurgePct: number
  anorganikSurgePct: number
  extraLitersHousehold: number
  typicalWasteItems: string[]
  preparationTip: string
  postEventTip: string
}

export const BALINESE_CALENDAR_EVENTS_2026: BalineseCalendarEvent[] = [
  {
    id: 'bali_penampahan_galungan',
    name: 'Penampahan Galungan',
    balineseName: 'Anggara Wage Dungulan',
    date: '2026-11-03',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 75,
    anorganikSurgePct: 25,
    extraLitersHousehold: 45,
    typicalWasteItems: ['Sisa olahan dapur & lawar', 'Daun pisang', 'Potongan bambu & janur penjor'],
    preparationTip: 'Siapkan 2 kantong kompos/organik terpisah sejak pagi untuk sisa olahan dapur dan potongan janur.',
    postEventTip: 'Ikat rapat sisa organik basah agar siap diangkut armada organik Rabu pagi.',
  },
  {
    id: 'bali_galungan',
    name: 'Hari Raya Galungan',
    balineseName: 'Buda Kliwon Dungulan',
    date: '2026-11-04',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 90,
    anorganikSurgePct: 35,
    extraLitersHousehold: 60,
    typicalWasteItems: ['Canang sari & banten', 'Janur & sampian', 'Kemasan minuman tamu'],
    preparationTip: 'Pisahkan tusuk bambu/semat tajam dari daun canang, dan kumpulkan botol plastik tamu di wadah khusus.',
    postEventTip: 'Lungsuran banten & canang dapat dikeluarkan pada jadwal truk organik Jumat pagi (masuk kuota leeway hari raya).',
  },
  {
    id: 'bali_umanis_galungan',
    name: 'Umanis Galungan',
    balineseName: 'Wraspati Umanis Dungulan',
    date: '2026-11-05',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 50,
    anorganikSurgePct: 40,
    extraLitersHousehold: 35,
    typicalWasteItems: ['Lungsuran canang & buah', 'Botol plastik & kardus makanan keluarga'],
    preparationTip: 'Kempiskan botol plastik dan lipat kardus agar hemat ruang sambil menunggu jadwal angkut anorganik Sabtu.',
    postEventTip: 'Pastikan residu tisu/bungkus makanan tidak tercampur ke kantong canang organik.',
  },
  {
    id: 'bali_kajeng_kliwon_1',
    name: 'Kajeng Kliwon Enyitan',
    balineseName: 'Kajeng Kliwon',
    date: '2026-11-08',
    category: 'rahinan_rutin',
    defaultSelected: false,
    organicSurgePct: 20,
    anorganikSurgePct: 5,
    extraLitersHousehold: 15,
    typicalWasteItems: ['Segehan & canang sari', 'Daun janur & bunga'],
    preparationTip: 'Kumpulkan sisa canang dan segehan setelah selesai sembahyang ke ember organik.',
    postEventTip: 'Akan terangkut otomatis pada jadwal rutin organik Senin pagi.',
  },
  {
    id: 'bali_tilem_kelima',
    name: 'Tilem Sasih Kelima',
    balineseName: 'Tilem Kelima',
    date: '2026-11-09',
    category: 'rahinan_rutin',
    defaultSelected: true,
    organicSurgePct: 30,
    anorganikSurgePct: 10,
    extraLitersHousehold: 20,
    typicalWasteItems: ['Canang rebong', 'Bunga & janur', 'Dupa habis pakai'],
    preparationTip: 'Pastikan abu dan batang dupa sudah benar-benar mati sebelum dimasukkan ke kantong.',
    postEventTip: 'Dijemput bersama pengangkutan organik rutin hari Senin/Rabu.',
  },
  {
    id: 'bali_penampahan_kuningan',
    name: 'Penampahan Kuningan',
    balineseName: 'Sukra Wage Kuningan',
    date: '2026-11-13',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 65,
    anorganikSurgePct: 20,
    extraLitersHousehold: 40,
    typicalWasteItems: ['Janur tamiang & endongan', 'Daun pandan & pisang', 'Sisa bahan masakan kuning'],
    preparationTip: 'Potong kecil sisa janur dan daun pandan agar tidak meluber dari kantong organik.',
    postEventTip: 'Armada DLHK membuka toleransi leeway ekstra +35% untuk pengangkutan pasca-Kuningan.',
  },
  {
    id: 'bali_kuningan',
    name: 'Hari Raya Kuningan',
    balineseName: 'Saniscara Kliwon Kuningan',
    date: '2026-11-14',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 85,
    anorganikSurgePct: 30,
    extraLitersHousehold: 55,
    typicalWasteItems: ['Tamiang, kolem & endongan', 'Canang & tebog', 'Kemasan plastik'],
    preparationTip: 'Sembahyang selesai sebelum tengah hari; pisahkan wadah plastik dari lungsuran banten organik.',
    postEventTip: 'Truk anorganik beroperasi Sabtu siang, sedangkan lungsuran organik dijemput Senin pagi.',
  },
  {
    id: 'bali_pegat_uwakan',
    name: 'Buda Kliwon Pegat Uwakan',
    balineseName: 'Buda Kliwon Pahang (Cabut Penjor)',
    date: '2026-11-18',
    category: 'rahinan_rutin',
    defaultSelected: false,
    organicSurgePct: 40,
    anorganikSurgePct: 15,
    extraLitersHousehold: 30,
    typicalWasteItems: ['Janur penjor kering', 'Bambu & hiasan sampian penjor'],
    preparationTip: 'Potong bambu/janur penjor sepanjang maks. 60 cm dan ikat rapi agar mudah dimuat petugas.',
    postEventTip: 'Letakkan ikatan penjor di samping kantong organik pada jadwal angkut Rabu/Jumat.',
  },
  {
    id: 'bali_kajeng_kliwon_2',
    name: 'Kajeng Kliwon Uwudan',
    balineseName: 'Kajeng Kliwon',
    date: '2026-11-23',
    category: 'rahinan_rutin',
    defaultSelected: false,
    organicSurgePct: 20,
    anorganikSurgePct: 5,
    extraLitersHousehold: 15,
    typicalWasteItems: ['Canang sari & segehan'],
    preparationTip: 'Gabungkan sisa canang ke dalam wadah kompos/organik rumah tangga.',
    postEventTip: 'Terangkut penuh pada jadwal organik Senin/Rabu.',
  },
  {
    id: 'bali_purnama_keenam',
    name: 'Purnama Sasih Keenam',
    balineseName: 'Purnama Keenam',
    date: '2026-11-24',
    category: 'rahinan_rutin',
    defaultSelected: true,
    organicSurgePct: 35,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang sari, daksina & bunga', 'Janur & buah lungsuran'],
    preparationTip: 'Kelompokkan canang dan daun ke kantong organik; simpan batok kelapa daksina terpisah.',
    postEventTip: 'Dijemput pada jadwal organik Rabu pagi.',
  },
  {
    id: 'bali_tumpek_krulut',
    name: 'Tumpek Krulut (Hari Kasih Sayang Bali)',
    balineseName: 'Saniscara Kliwon Krulut',
    date: '2026-11-28',
    category: 'rahinan_rutin',
    defaultSelected: false,
    organicSurgePct: 30,
    anorganikSurgePct: 20,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Banten otonan gamelan/seni', 'Canang & kemasan acara keluarga'],
    preparationTip: 'Pisahkan botol/gelas plastik acara keluarga untuk diangkut truk anorganik hari Sabtu.',
    postEventTip: 'Sisa organik banten dijemput Senin pagi.',
  },
]

const WEEKDAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export type CalendarPickupItem = {
  stream: WasteStream
  windowStart: string
  windowEnd: string
  leewayMinutes: number
  maxLitersPerPickup: number
  surgeTolerancePct: number
  status: 'completed' | 'today' | 'upcoming'
  estimatedUserLiters: number
}

export type CalendarDayCell = {
  date: string // YYYY-MM-DD
  dayOfMonth: number
  weekdayCode: string
  weekdayNameId: string
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  pickups: CalendarPickupItem[]
  balineseEvents: Array<BalineseCalendarEvent & { isSelectedByUser: boolean }>
  predictedExtraLiters: number
}

const WEEKDAY_NAMES_ID: Record<string, string> = {
  Sun: 'Minggu',
  Mon: 'Senin',
  Tue: 'Selasa',
  Wed: 'Rabu',
  Thu: 'Kamis',
  Fri: 'Jumat',
  Sat: 'Sabtu',
}

export function buildMonthCalendarGrid(params: {
  year: number
  month: number // 1-12
  todayDate?: string // YYYY-MM-DD
  kecamatan: Kecamatan
  timetable: PetugasTimetableSlot[]
  weeklyRegularLiters: number
  selectedBalineseEventIds: string[]
}): CalendarDayCell[] {
  const {
    year,
    month,
    todayDate = '2026-11-07',
    kecamatan,
    timetable,
    weeklyRegularLiters,
    selectedBalineseEventIds,
  } = params

  const slots = timetable.filter((s) => s.kecamatan === kecamatan)
  const selectedSet = new Set(selectedBalineseEventIds)

  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const startDow = firstDay.getUTCDay() // 0 = Sun
  // Start grid on Monday (ISO week)
  const leadDays = startDow === 0 ? 6 : startDow - 1
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - leadDays))

  const cells: CalendarDayCell[] = []
  for (let i = 0; i < 35; i++) {
    const d = new Date(gridStart.getTime() + i * 86_400_000)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dayNum = d.getUTCDate()
    const dayStr = String(dayNum).padStart(2, '0')
    const dateIso = `${y}-${m}-${dayStr}`
    const weekdayCode = WEEKDAY_CODES[d.getUTCDay()]

    const isCurrentMonth = d.getUTCMonth() + 1 === month
    const isToday = dateIso === todayDate
    const isPast = dateIso < todayDate

    const dayEvents = BALINESE_CALENDAR_EVENTS_2026.filter((ev) => ev.date === dateIso).map((ev) => ({
      ...ev,
      isSelectedByUser: selectedSet.has(ev.id),
    }))

    // Also check if yesterday had a selected Balinese ceremony (post-ceremony waste surge happens on the day and +1 day)
    const prevDate = new Date(d.getTime() - 86_400_000)
    const prevIso = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDate.getUTCDate()).padStart(2, '0')}`
    const prevSelectedEvents = BALINESE_CALENDAR_EVENTS_2026.filter(
      (ev) => ev.date === prevIso && selectedSet.has(ev.id),
    )

    const predictedExtraLiters =
      dayEvents.filter((e) => e.isSelectedByUser).reduce((acc, e) => acc + e.extraLitersHousehold, 0) +
      prevSelectedEvents.reduce((acc, e) => acc + Math.round(e.extraLitersHousehold * 0.6), 0)

    const pickups: CalendarPickupItem[] = slots
      .filter((slot) => slot.days.includes(weekdayCode))
      .map((slot) => {
        const streamShare = slot.stream === 'organik' ? 0.6 : slot.stream === 'anorganik' ? 0.28 : 0.12
        const pickupsCount = Math.max(1, slot.days.length)
        const basePerPickup = Math.round((weeklyRegularLiters * streamShare) / pickupsCount)
        const eventBump =
          slot.stream === 'organik'
            ? Math.round(predictedExtraLiters * 0.75)
            : slot.stream === 'anorganik'
              ? Math.round(predictedExtraLiters * 0.25)
              : 0

        return {
          stream: slot.stream,
          windowStart: slot.windowStart,
          windowEnd: slot.windowEnd,
          leewayMinutes: slot.leewayMinutes,
          maxLitersPerPickup: slot.maxLitersPerPickup,
          surgeTolerancePct: slot.surgeTolerancePct,
          status: isPast ? 'completed' : isToday ? 'today' : 'upcoming',
          estimatedUserLiters: basePerPickup + eventBump,
        }
      })

    cells.push({
      date: dateIso,
      dayOfMonth: dayNum,
      weekdayCode,
      weekdayNameId: WEEKDAY_NAMES_ID[weekdayCode] ?? weekdayCode,
      isCurrentMonth,
      isToday,
      isPast,
      pickups,
      balineseEvents: dayEvents,
      predictedExtraLiters,
    })
  }

  return cells
}

export type ExternalCalendarEventInput = {
  title: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  description: string
  location: string
}

function toCompactUtcStamp(dateIso: string, timeHm: string): string {
  // WITA is UTC+8, so subtract 8 hours to get UTC timestamp YYYYMMDDTHHMMSSZ
  const [y, m, d] = dateIso.split('-').map(Number)
  const [hh, mm] = timeHm.split(':').map(Number)
  const utcMs = Date.UTC(y, m - 1, d, hh - 8, mm, 0)
  const dt = new Date(utcMs)
  const yy = dt.getUTCFullYear()
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const da = String(dt.getUTCDate()).padStart(2, '0')
  const hr = String(dt.getUTCHours()).padStart(2, '0')
  const mi = String(dt.getUTCMinutes()).padStart(2, '0')
  return `${yy}${mo}${da}T${hr}${mi}00Z`
}

export function buildGoogleCalendarUrl(input: ExternalCalendarEventInput): string {
  const startUtc = toCompactUtcStamp(input.date, input.startTime)
  const endUtc = toCompactUtcStamp(input.date, input.endTime)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${startUtc}/${endUtc}`,
    details: input.description,
    location: input.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildIcsContent(input: ExternalCalendarEventInput): string {
  const startUtc = toCompactUtcStamp(input.date, input.startTime)
  const endUtc = toCompactUtcStamp(input.date, input.endTime)
  const uid = `cta-${input.date}-${input.startTime.replace(':', '')}@denpasar.trash-agent.local`
  const cleanDesc = input.description.replace(/\r?\n/g, '\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Central Trash Agent Denpasar//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${startUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${input.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
