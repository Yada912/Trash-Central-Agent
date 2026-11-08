import type { AccountType, Kecamatan, TrashType, WasteStream } from '@/lib/schemas'
import { getDesaDetails } from '@/lib/data/denpasar-regions'
import {
  BALINESE_CALENDAR_EVENTS_2026,
  computeUserOtonanFromBirthDate,
  type UserOtonanSummary,
} from '@/lib/calendar/balinese-calendar'

export type UserRole = 'warga' | 'petugas'

export type ContainerPreset = 'kantong_15l' | 'ember_25l' | 'karung_50l' | 'gerobak_150l'

export const CONTAINER_PRESETS: Record<
  ContainerPreset,
  { label: string; liters: number; hint: string; icon: string }
> = {
  kantong_15l: {
    label: 'Kantong Kresek Sedang',
    liters: 15,
    hint: '1 kantong belanja penuh ≈ 15 Liter',
    icon: 'shopping_bag',
  },
  ember_25l: {
    label: 'Ember / Tong Rumah',
    liters: 25,
    hint: '1 ember sampah dapur penuh ≈ 25 Liter',
    icon: 'delete',
  },
  karung_50l: {
    label: 'Karung Besar',
    liters: 50,
    hint: '1 karung beras 50 kg penuh ≈ 50 Liter',
    icon: 'inventory_2',
  },
  gerobak_150l: {
    label: 'Gerobak / Kontainer',
    liters: 150,
    hint: '1 gerobak dorong penuh ≈ 150 Liter',
    icon: 'local_shipping',
  },
}

export type SpecialEventSurge = {
  id: string
  name: string
  frequency: string
  extraLiters: number
  dominantStream: WasteStream
  activeThisWeek: boolean
  notes: string
}

export type PersonalPickupRecord = {
  id: string
  date: string // YYYY-MM-DD
  window: string // HH:MM–HH:MM WITA
  stream: WasteStream
  liters: number
  containersLabel: string
  status: 'completed' | 'scheduled' | 'requested'
  notes: string
}

export type CurrentTrashCondition = 'terkendali' | 'menumpuk' | 'meluber' | 'pasca_upacara'

export type AgentChatMessage = {
  id: string
  sender: 'user' | 'agent'
  text: string
  timestamp: string
  modelUpdateSummary?: string
  source?: 'gemini' | 'template'
}

export type AgentMemoryItem = {
  id: string
  fact: string
  createdAt: string
  category?: 'upacara' | 'kebiasaan' | 'lokasi' | 'wadah'
}

export type ResidentWasteProfile = {
  currentCondition: CurrentTrashCondition
  conditionNote: string
  weeklyRegularLiters: number
  containerPreset: ContainerPreset
  householdMembers: number
  sortingReadiness: 'sudah_dipilah' | 'sebagian' | 'belum_dipilah'
  compositionPct: Record<TrashType, number>
  specialEvents: SpecialEventSurge[]
  selectedBalineseEventIds?: string[]
  pickupHistory?: PersonalPickupRecord[]
  chatMessages?: AgentChatMessage[]
  agentMemory?: AgentMemoryItem[]
}

export type UserAccount = {
  id: string
  name: string
  email: string
  password?: string
  role: UserRole
  badgeId?: string
  kecamatan: Kecamatan
  desa: string
  banjarName?: string
  tps3rNode?: string
  birthDate?: string
  address: string
  lat: number
  lng: number
  accountType: AccountType
  wasteProfile?: ResidentWasteProfile
}

export type PetugasTimetableSlot = {
  id: string
  kecamatan: Kecamatan
  stream: WasteStream
  days: string[]
  windowStart: string
  windowEnd: string
  leewayMinutes: number
  surgeTolerancePct: number
  maxLitersPerPickup: number
  notes: string
}

export type StreamOptimizationAdvice = {
  stream: WasteStream
  weeklyLiters: number
  pickupsPerWeek: number
  litersPerPickup: number
  maxAllowedWithLeeway: number
  status: 'within_routine' | 'within_leeway' | 'needs_extra_pickup' | 'on_request_b3'
  windowLabel: string
  leewayLabel: string
  recommendation: string
}

export type ResidentOptimizationSummary = {
  baseWeeklyLiters: number
  eventExtraLiters: number
  balineseCalendarExtraLiters: number
  totalWeeklyLiters: number
  equivalentContainers: number
  containerLabel: string
  activeEventNames: string[]
  overallStatus: 'optimal' | 'leeway_used' | 'action_required'
  headline: string
  streams: StreamOptimizationAdvice[]
  actionItems: string[]
  otonan: UserOtonanSummary | null
  decentralizedNode: {
    banjar: string
    tps3r: string
    ruleText: string
  }
}

export const DEFAULT_SELECTED_BALI_EVENTS = BALINESE_CALENDAR_EVENTS_2026.filter((e) => e.defaultSelected).map((e) => e.id)

/** Demo login secret from the environment. Unset means this process has no password for that account. */
function demoPassword(envName: string): string | undefined {
  const value = process.env[envName]?.trim()
  return value || undefined
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_warga_01',
    name: 'I Made Adi Wijaya',
    email: 'made.adi@warga.denpasar.id',
    password: demoPassword('DEMO_WARGA_PASSWORD'),
    role: 'warga',
    kecamatan: 'Denpasar Barat',
    desa: 'Pemecutan',
    banjarName: 'Banjar Pekambingan',
    tps3rNode: 'TPS3R Pemecutan (Desa Berbasis Sumber)',
    birthDate: '1996-05-14',
    address: 'Jl. Hasanuddin Gang IV No. 12, Banjar Pekambingan',
    lat: -8.6562,
    lng: 115.2124,
    accountType: 'household',
    wasteProfile: {
      currentCondition: 'menumpuk',
      conditionNote: 'Tumpukan sisa canang, daun halaman, dan kemasan plastik dapur selama 3 hari terakhir.',
      weeklyRegularLiters: 105,
      containerPreset: 'kantong_15l',
      householdMembers: 5,
      sortingReadiness: 'sebagian',
      compositionPct: {
        organic: 60,
        plastic: 20,
        paper: 10,
        metal: 2,
        residual: 8,
        hazardous: 0,
      },
      selectedBalineseEventIds: DEFAULT_SELECTED_BALI_EVENTS,
      specialEvents: [
        {
          id: 'evt_galungan',
          name: 'Hari Raya Galungan & Kuningan / Penampahan',
          frequency: 'Setiap 210 hari (aktif bulan ini)',
          extraLiters: 60,
          dominantStream: 'organik',
          activeThisWeek: true,
          notes: 'Lonjakan janur, sampian, canang sari, daun pisang, dan sisa olahan dapur.',
        },
        {
          id: 'evt_akhir_pekan',
          name: 'Kumpul Keluarga Akhir Pekan',
          frequency: 'Mingguan (Sabtu–Minggu)',
          extraLiters: 30,
          dominantStream: 'anorganik',
          activeThisWeek: false,
          notes: 'Tambahan botol plastik, kardus makanan, dan kaleng minuman.',
        },
      ],
      pickupHistory: [
        {
          id: 'pkp_past_01',
          date: '2026-11-02',
          window: '06:00–09:00 WITA',
          stream: 'organik',
          liters: 30,
          containersLabel: '2 Kantong Kresek',
          status: 'completed',
          notes: 'Diangkut tepat waktu oleh Armada Kompos Swakelola Barat-01.',
        },
        {
          id: 'pkp_past_02',
          date: '2026-11-03',
          window: '08:00–11:30 WITA',
          stream: 'anorganik',
          liters: 30,
          containersLabel: '2 Kantong Kresek',
          status: 'completed',
          notes: 'Botol plastik & kardus terpilah disalurkan ke Bank Sampah Banjar.',
        },
        {
          id: 'pkp_past_03',
          date: '2026-11-04',
          window: '06:00–09:00 WITA',
          stream: 'organik',
          liters: 60,
          containersLabel: '4 Kantong Kresek',
          status: 'completed',
          notes: 'Lonjakan Galungan (janur & daun pisang) terangkut dalam batas leeway.',
        },
        {
          id: 'pkp_past_04',
          date: '2026-11-05',
          window: '06:00–09:00 WITA',
          stream: 'organik',
          liters: 45,
          containersLabel: '3 Kantong Kresek',
          status: 'completed',
          notes: 'Sisa lungsuran Umanis Galungan selesai diangkut ke TPS3R Pemecutan.',
        },
        {
          id: 'pkp_next_01',
          date: '2026-11-09',
          window: '06:00–09:00 WITA',
          stream: 'organik',
          liters: 45,
          containersLabel: '3 Kantong Kresek',
          status: 'scheduled',
          notes: 'Bertepatan dengan Tilem Sasih Kelima — siapkan kantong canang sebelum 06:00 WITA.',
        },
        {
          id: 'pkp_next_02',
          date: '2026-11-10',
          window: '08:00–11:30 WITA',
          stream: 'anorganik',
          liters: 30,
          containersLabel: '2 Kantong Kresek',
          status: 'scheduled',
          notes: 'Penjemputan rutin anorganik Bank Sampah (plastik, kertas, kaleng).',
        },
        {
          id: 'pkp_next_03',
          date: '2026-11-12',
          window: '06:00–09:00 WITA',
          stream: 'organik',
          liters: 60,
          containersLabel: '4 Kantong Kresek',
          status: 'scheduled',
          notes: 'Penjemputan organik Kamis rutin TPS3R Pemecutan.',
        },
      ],
    },
  },
  {
    id: 'usr_warga_02',
    name: 'Ni Luh Putu Sari (Warung Sari Sanur)',
    email: 'putu.sari@umkm.denpasar.id',
    password: demoPassword('DEMO_WARGA_PASSWORD'),
    role: 'warga',
    kecamatan: 'Denpasar Selatan',
    desa: 'Sanur',
    banjarName: 'Banjar Intaran',
    tps3rNode: 'TPS3R Sanur Kauh',
    birthDate: '1991-08-22',
    address: 'Jl. Danau Tamblingan No. 48, Sanur',
    lat: -8.6915,
    lng: 115.2623,
    accountType: 'company',
    wasteProfile: {
      currentCondition: 'terkendali',
      conditionNote: 'Sampah dapur warung sudah dipisah antara sisa makanan organik dan botol plastik.',
      weeklyRegularLiters: 350,
      containerPreset: 'karung_50l',
      householdMembers: 8,
      sortingReadiness: 'sudah_dipilah',
      compositionPct: {
        organic: 65,
        plastic: 22,
        paper: 6,
        metal: 2,
        residual: 5,
        hazardous: 0,
      },
      selectedBalineseEventIds: ['bali_galungan', 'bali_kuningan', 'bali_purnama_keenam'],
      specialEvents: [
        {
          id: 'evt_libur_panjang',
          name: 'Akhir Pekan & Libur Wisatawan',
          frequency: 'Jumat–Minggu',
          extraLiters: 150,
          dominantStream: 'organik',
          activeThisWeek: true,
          notes: 'Kenaikan pelanggan warung meningkatkan sisa makanan dan botol PET.',
        },
      ],
      pickupHistory: [
        {
          id: 'pkp_umkm_01',
          date: '2026-11-04',
          window: '06:30–09:30 WITA',
          stream: 'organik',
          liters: 100,
          containersLabel: '2 Karung Besar',
          status: 'completed',
          notes: 'Diangkut Cikar TPS3R Sanur-02.',
        },
        {
          id: 'pkp_umkm_02',
          date: '2026-11-09',
          window: '06:30–09:30 WITA',
          stream: 'organik',
          liters: 100,
          containersLabel: '2 Karung Besar',
          status: 'scheduled',
          notes: 'Penjemputan pagi koridor Danau Tamblingan.',
        },
      ],
    },
  },
  {
    id: 'usr_petugas_01',
    name: 'I Wayan Gde Surya Wirawan',
    email: 'surya.wirawan@dlhk.denpasar.id',
    password: demoPassword('DEMO_PETUGAS_PASSWORD'),
    role: 'petugas',
    badgeId: 'DLHK-DPS-042',
    kecamatan: 'Denpasar Barat',
    desa: 'Dauh Puri',
    banjarName: 'Pos Koordinasi DLHK Denpasar',
    tps3rNode: 'Sentra Koordinasi TPST & TPS3R Kota Denpasar',
    address: 'Pos Koordinasi Armada DLHK Kota Denpasar',
    lat: -8.6595,
    lng: 115.2165,
    accountType: 'company',
  },
]

const DEFAULT_TIMETABLE: PetugasTimetableSlot[] = [
  {
    id: 'slot_barat_organik',
    kecamatan: 'Denpasar Barat',
    stream: 'organik',
    days: ['Mon', 'Wed', 'Thu', 'Sat'],
    windowStart: '06:00',
    windowEnd: '09:00',
    leewayMinutes: 45,
    surgeTolerancePct: 35,
    maxLitersPerPickup: 60,
    notes: 'Desentralisasi Pergub Bali 47/2019: Cikar swakelola TPS3R Pemecutan/Padangsambian menjemput organik untuk kompos lokal. Toleransi surge +35% saat rahinan adat.',
  },
  {
    id: 'slot_barat_anorganik',
    kecamatan: 'Denpasar Barat',
    stream: 'anorganik',
    days: ['Tue', 'Fri', 'Sun'],
    windowStart: '08:00',
    windowEnd: '11:30',
    leewayMinutes: 60,
    surgeTolerancePct: 30,
    maxLitersPerPickup: 45,
    notes: 'Jalur Bank Sampah Banjar & Unit Daur Ulang TPS3R: Botol plastik, kardus, dan kaleng wajib terpilah.',
  },
  {
    id: 'slot_barat_residu',
    kecamatan: 'Denpasar Barat',
    stream: 'residu',
    days: ['Thu', 'Sun'],
    windowStart: '13:00',
    windowEnd: '16:00',
    leewayMinutes: 30,
    surgeTolerancePct: 15,
    maxLitersPerPickup: 35,
    notes: 'Khusus sampah residu non-organik/non-daur ulang untuk diangkut armada DLHK menuju TPST Padangsambian.',
  },
  {
    id: 'slot_selatan_organik',
    kecamatan: 'Denpasar Selatan',
    stream: 'organik',
    days: ['Mon', 'Wed', 'Thu', 'Sat'],
    windowStart: '06:30',
    windowEnd: '09:30',
    leewayMinutes: 45,
    surgeTolerancePct: 40,
    maxLitersPerPickup: 140,
    notes: 'Jalur pesisir Sanur–Sesetan–Panjer menuju TPS3R Sanur Kauh & Tahura Ngurah Rai.',
  },
  {
    id: 'slot_selatan_anorganik',
    kecamatan: 'Denpasar Selatan',
    stream: 'anorganik',
    days: ['Tue', 'Fri', 'Sun'],
    windowStart: '08:30',
    windowEnd: '12:00',
    leewayMinutes: 45,
    surgeTolerancePct: 30,
    maxLitersPerPickup: 90,
    notes: 'Jalur daur ulang Bank Sampah Banjar Sanur & unit pilah TPS3R.',
  },
  {
    id: 'slot_selatan_residu',
    kecamatan: 'Denpasar Selatan',
    stream: 'residu',
    days: ['Thu', 'Sun'],
    windowStart: '13:30',
    windowEnd: '16:30',
    leewayMinutes: 30,
    surgeTolerancePct: 20,
    maxLitersPerPickup: 60,
    notes: 'Pengangkutan residu resmi menuju TPST Tahura.',
  },
  {
    id: 'slot_timur_organik',
    kecamatan: 'Denpasar Timur',
    stream: 'organik',
    days: ['Mon', 'Wed', 'Thu', 'Sat'],
    windowStart: '06:00',
    windowEnd: '09:00',
    leewayMinutes: 40,
    surgeTolerancePct: 30,
    maxLitersPerPickup: 65,
    notes: 'Jalur Kesiman–Sumerta–Penatih menuju TPS3R Biaung & TPST Kesiman Kertalangu.',
  },
  {
    id: 'slot_timur_anorganik',
    kecamatan: 'Denpasar Timur',
    stream: 'anorganik',
    days: ['Tue', 'Fri', 'Sun'],
    windowStart: '09:00',
    windowEnd: '12:00',
    leewayMinutes: 45,
    surgeTolerancePct: 25,
    maxLitersPerPickup: 50,
    notes: 'Jalur Bank Sampah terpilah Kesiman & Penatih.',
  },
  {
    id: 'slot_timur_residu',
    kecamatan: 'Denpasar Timur',
    stream: 'residu',
    days: ['Thu', 'Sun'],
    windowStart: '14:00',
    windowEnd: '17:00',
    leewayMinutes: 30,
    surgeTolerancePct: 15,
    maxLitersPerPickup: 40,
    notes: 'Pengangkutan residu menuju TPST Kesiman Kertalangu.',
  },
  {
    id: 'slot_utara_organik',
    kecamatan: 'Denpasar Utara',
    stream: 'organik',
    days: ['Mon', 'Wed', 'Thu', 'Sat'],
    windowStart: '06:00',
    windowEnd: '09:00',
    leewayMinutes: 45,
    surgeTolerancePct: 35,
    maxLitersPerPickup: 70,
    notes: 'Jalur Ubung–Peguyangan–Tonja menuju TPS3R Swakelola Desa.',
  },
  {
    id: 'slot_utara_anorganik',
    kecamatan: 'Denpasar Utara',
    stream: 'anorganik',
    days: ['Tue', 'Fri', 'Sun'],
    windowStart: '08:00',
    windowEnd: '11:00',
    leewayMinutes: 45,
    surgeTolerancePct: 30,
    maxLitersPerPickup: 50,
    notes: 'Jalur anorganik layak daur ulang Bank Sampah.',
  },
  {
    id: 'slot_utara_residu',
    kecamatan: 'Denpasar Utara',
    stream: 'residu',
    days: ['Thu', 'Sun'],
    windowStart: '13:00',
    windowEnd: '16:00',
    leewayMinutes: 30,
    surgeTolerancePct: 15,
    maxLitersPerPickup: 40,
    notes: 'Jalur residu mingguan menuju TPST DLHK Denpasar.',
  },
]

const DAY_LABELS_ID: Record<string, string> = {
  Mon: 'Senin',
  Tue: 'Selasa',
  Wed: 'Rabu',
  Thu: 'Kamis',
  Fri: 'Jumat',
  Sat: 'Sabtu',
  Sun: 'Minggu',
}

export function formatSlotDaysId(days: string[]): string {
  return days.map((d) => DAY_LABELS_ID[d] ?? d).join(', ')
}

export function computeResidentOptimization(
  account: UserAccount,
  timetable: PetugasTimetableSlot[],
): ResidentOptimizationSummary | null {
  const profile = account.wasteProfile
  if (!profile) return null

  const preset = CONTAINER_PRESETS[profile.containerPreset] ?? CONTAINER_PRESETS.kantong_15l
  const activeEvents = profile.specialEvents.filter((event) => event.activeThisWeek)
  const customExtraLiters = activeEvents.reduce((sum, event) => sum + event.extraLiters, 0)

  // Also include selected Balinese calendar events occurring in the upcoming 7-day horizon (2026-11-07 .. 2026-11-14)
  const selectedBaliSet = new Set(profile.selectedBalineseEventIds ?? DEFAULT_SELECTED_BALI_EVENTS)
  const upcomingBaliEvents = BALINESE_CALENDAR_EVENTS_2026.filter(
    (ev) => selectedBaliSet.has(ev.id) && ev.date >= '2026-11-07' && ev.date <= '2026-11-14',
  )
  // Check personal Otonan Pawukon
  const otonan = account.birthDate ? computeUserOtonanFromBirthDate(account.birthDate) : null
  let otonanExtraLiters = 0
  if (otonan && otonan.calendarHighlightDate >= '2026-11-07' && otonan.calendarHighlightDate <= '2026-11-14') {
    otonanExtraLiters = otonan.extraLitersHousehold
  }

  const balineseCalendarExtraLiters = upcomingBaliEvents.reduce((sum, ev) => sum + ev.extraLitersHousehold, 0) + otonanExtraLiters

  const eventExtraLiters = customExtraLiters + balineseCalendarExtraLiters
  const baseWeeklyLiters = profile.weeklyRegularLiters
  const totalWeeklyLiters = baseWeeklyLiters + eventExtraLiters
  const equivalentContainers = Math.max(1, Math.ceil(totalWeeklyLiters / preset.liters))

  const comp = profile.compositionPct
  const streamWeeklyLiters: Record<WasteStream, number> = {
    organik: Math.round((baseWeeklyLiters * (comp.organic ?? 0)) / 100),
    anorganik: Math.round((baseWeeklyLiters * ((comp.plastic ?? 0) + (comp.paper ?? 0) + (comp.metal ?? 0))) / 100),
    residu: Math.round((baseWeeklyLiters * (comp.residual ?? 0)) / 100),
    B3: Math.round((baseWeeklyLiters * (comp.hazardous ?? 0)) / 100),
  }

  for (const event of activeEvents) {
    streamWeeklyLiters[event.dominantStream] += event.extraLiters
  }
  // Balinese ceremonies add ~80% organic (canang, janur, daun) and ~20% anorganik (kemasan)
  streamWeeklyLiters.organik += Math.round(balineseCalendarExtraLiters * 0.8)
  streamWeeklyLiters.anorganik += Math.round(balineseCalendarExtraLiters * 0.2)

  const streams: StreamOptimizationAdvice[] = (['organik', 'anorganik', 'residu', 'B3'] as const).map((stream) => {
    const weeklyLiters = streamWeeklyLiters[stream]
    if (stream === 'B3') {
      return {
        stream,
        weeklyLiters,
        pickupsPerWeek: 0,
        litersPerPickup: weeklyLiters,
        maxAllowedWithLeeway: 0,
        status: 'on_request_b3',
        windowLabel: 'Opsional (Jemput Khusus bila ada)',
        leewayLabel: 'Terpisah dari kantong harian',
        recommendation:
          weeklyLiters > 0
            ? `Ada ${weeklyLiters} L barang khusus (baterai/lampu). Simpan terpisah dan minta jemputan saat diperlukan.`
            : 'Tidak ada barang khusus minggu ini.',
      }
    }

    const slot = timetable.find((item) => item.kecamatan === account.kecamatan && item.stream === stream)
    const pickupsPerWeek = Math.max(1, slot?.days.length ?? (stream === 'organik' ? 4 : stream === 'anorganik' ? 3 : 2))
    const litersPerPickup = Math.ceil(weeklyLiters / pickupsPerWeek)
    const baseMax = slot?.maxLitersPerPickup ?? 60
    const surgePct = slot?.surgeTolerancePct ?? 25
    const maxAllowedWithLeeway = Math.round(baseMax * (1 + surgePct / 100))

    let status: StreamOptimizationAdvice['status'] = 'within_routine'
    if (litersPerPickup > maxAllowedWithLeeway) {
      status = 'needs_extra_pickup'
    } else if (litersPerPickup > baseMax) {
      status = 'within_leeway'
    }

    const daysText = slot ? formatSlotDaysId(slot.days) : 'Senin, Rabu, Kamis, Sabtu'
    const windowLabel = slot ? `${daysText} · ${slot.windowStart}–${slot.windowEnd} WITA` : `${daysText} · 06:00–09:00 WITA`
    const leewayLabel = slot
      ? `Leeway waktu ±${slot.leewayMinutes} mnt · Kapasitas normal ${baseMax} L/angkut (+${surgePct}% toleransi s/d ${maxAllowedWithLeeway} L)`
      : `Kapasitas normal ${baseMax} L/angkut`

    let recommendation = `Rata-rata ${litersPerPickup} L per penjemputan (${Math.ceil(litersPerPickup / preset.liters)} ${preset.label.toLowerCase()}) aman diangkut pada jadwal rutin (${daysText}).`
    if (status === 'within_leeway') {
      recommendation = `Beban ${litersPerPickup} L/penjemputan melebihi batas normal (${baseMax} L), namun MASIH TERTAMPUNG dalam toleransi leeway petugas (maks. ${maxAllowedWithLeeway} L). Keluarkan kantong 15 menit sebelum pukul ${slot?.windowStart ?? '06:00'} WITA.`
    } else if (status === 'needs_extra_pickup') {
      const overflow = litersPerPickup - maxAllowedWithLeeway
      recommendation = `Beban ${litersPerPickup} L/penjemputan melampaui batas leeway petugas (${maxAllowedWithLeeway} L) sebesar +${overflow} L. Bagi ke ${pickupsPerWeek} hari angkut atau kirim permintaan jemput tambahan.`
    }

    return {
      stream,
      weeklyLiters,
      pickupsPerWeek,
      litersPerPickup,
      maxAllowedWithLeeway,
      status,
      windowLabel,
      leewayLabel,
      recommendation,
    }
  })

  const hasOverflow = streams.some((s) => s.status === 'needs_extra_pickup')
  const hasLeeway = streams.some((s) => s.status === 'within_leeway')
  const overallStatus: ResidentOptimizationSummary['overallStatus'] = hasOverflow
    ? 'action_required'
    : hasLeeway
      ? 'leeway_used'
      : 'optimal'

  const actionItems: string[] = []
  if (otonan) {
    actionItems.push(
      `Otonan Pribadi Pawukon Anda jatuh pada ${otonan.pawukonLabel} (siklus 210 hari; berikutnya: ${otonan.nextOtonanDate}). Timbulan banten otonan (+${otonan.extraLitersHousehold} L) siap diserap oleh jadwal Organik TPS3R.`,
    )
  }
  if (upcomingBaliEvents.length > 0) {
    actionItems.push(
      `Kalender Bali minggu ini mencatat ${upcomingBaliEvents.map((e) => e.name).join(', ')} (+${balineseCalendarExtraLiters} L). ${upcomingBaliEvents[0].preparationTip}`,
    )
  }
  if (profile.sortingReadiness !== 'sudah_dipilah') {
    actionItems.push(
      'Sesuai Pergub Bali No. 47/2019, pisahkan sampah organik (canang, daun, sisa dapur) dari botol plastik. Sampah tidak terpilah tidak akan diangkut swakelola banjar.',
    )
  }
  if (profile.currentCondition === 'menumpuk' || profile.currentCondition === 'meluber') {
    actionItems.push(
      'Kondisi sampah Anda saat ini tercatat menumpuk/meluber. Gunakan tombol "Lapor & Minta Angkut" untuk mengirim foto ke petugas.',
    )
  }
  if (actionItems.length === 0) {
    actionItems.push('Volume dan pemilahan sampah Anda sudah selaras dengan jadwal desentralisasi TPS3R dan leeway armada kecamatan.')
  }

  const headline =
    overallStatus === 'optimal'
      ? 'Seluruh timbulan mingguan Anda tertampung nyaman di jadwal rutin desentralisasi TPS3R.'
      : overallStatus === 'leeway_used'
        ? 'Lonjakan hari raya/upacara adat minggu ini tertampung dalam kuota toleransi (leeway) armada TPS3R.'
        : 'Lonjakan sampah melampaui batas leeway rutin — disarankan minta penjemputan tambahan swakelola.'

  const activeNames = [...activeEvents.map((e) => e.name), ...upcomingBaliEvents.map((e) => e.name)]
  if (otonan) {
    activeNames.push(`Otonan: ${otonan.pawukonLabel}`)
  }

  return {
    baseWeeklyLiters,
    eventExtraLiters,
    balineseCalendarExtraLiters,
    totalWeeklyLiters,
    equivalentContainers,
    containerLabel: preset.label,
    activeEventNames: activeNames,
    overallStatus,
    headline,
    streams,
    actionItems,
    otonan,
    decentralizedNode: {
      banjar: account.banjarName ?? 'Banjar Lingkungan Setempat',
      tps3r: account.tps3rNode ?? 'TPS3R Unit Swakelola Desa',
      ruleText:
        'Pergub Bali No. 47/2019 & Perda Kota Denpasar No. 8/2023: Pemilahan Wajib Berbasis Sumber. Sampah tanpa pilah ditunda penjemputannya.',
    },
  }
}

type AccountMemoryState = {
  accounts: UserAccount[]
  activeAccountId: string
  timetable: PetugasTimetableSlot[]
}

const globalForAccounts = globalThis as unknown as {
  __ctaAccountState?: AccountMemoryState
}

function getAccountState(): AccountMemoryState {
  if (!globalForAccounts.__ctaAccountState) {
    globalForAccounts.__ctaAccountState = {
      accounts: structuredClone(DEFAULT_ACCOUNTS),
      activeAccountId: DEFAULT_ACCOUNTS[0].id,
      timetable: structuredClone(DEFAULT_TIMETABLE),
    }
  }
  return globalForAccounts.__ctaAccountState
}

function sanitizeAccount(account: UserAccount): UserAccount {
  const { password: _removedPassword, ...safeAccount } = account
  void _removedPassword
  return structuredClone(safeAccount)
}

export function loadExternalAccounts(externalAccounts: UserAccount[]): void {
  const state = getAccountState()
  const map = new Map<string, UserAccount>()
  for (const acc of state.accounts) {
    map.set(acc.id, acc)
  }
  for (const ext of externalAccounts) {
    map.set(ext.id, ext)
  }
  state.accounts = Array.from(map.values())
}

export function loadExternalTimetable(externalTimetable: PetugasTimetableSlot[]): void {
  const state = getAccountState()
  const map = new Map<string, PetugasTimetableSlot>()
  for (const slot of state.timetable) {
    map.set(slot.id, slot)
  }
  for (const ext of externalTimetable) {
    map.set(ext.id, ext)
  }
  state.timetable = Array.from(map.values())
}

export function getRawAccount(id: string): UserAccount | null {
  const state = getAccountState()
  const found = state.accounts.find((acc) => acc.id === id)
  return found ? structuredClone(found) : null
}

export function getRawAccountByEmail(email: string): UserAccount | null {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  const found = getAccountState().accounts.find((acc) => acc.email.toLowerCase() === normalized)
  return found ? structuredClone(found) : null
}

export function getAccountById(id: string): UserAccount | null {
  const found = getAccountState().accounts.find((acc) => acc.id === id)
  return found ? sanitizeAccount(found) : null
}

export function setAccountPassword(id: string, password: string): void {
  const state = getAccountState()
  const index = state.accounts.findIndex((acc) => acc.id === id)
  if (index === -1) return
  state.accounts[index] = { ...state.accounts[index], password }
}

export function listAccounts(): UserAccount[] {
  return getAccountState().accounts.map(sanitizeAccount)
}

export function getActiveAccount(preferredId?: string | null): UserAccount {
  const state = getAccountState()
  if (preferredId) {
    const found = state.accounts.find((acc) => acc.id === preferredId)
    if (found) return sanitizeAccount(found)
  }
  const active = state.accounts.find((acc) => acc.id === state.activeAccountId) ?? state.accounts[0]
  return sanitizeAccount(active)
}

export function setActiveAccountId(accountId: string): UserAccount | null {
  const state = getAccountState()
  const found = state.accounts.find((acc) => acc.id === accountId)
  if (!found) return null
  state.activeAccountId = found.id
  return sanitizeAccount(found)
}

export function updateAccountProfile(
  accountId: string,
  patch: Partial<
    Pick<
      UserAccount,
      'name' | 'kecamatan' | 'desa' | 'address' | 'lat' | 'lng' | 'accountType' | 'birthDate' | 'banjarName' | 'tps3rNode'
    >
  > & {
    wasteProfile?: ResidentWasteProfile
  },
): UserAccount | null {
  const state = getAccountState()
  const index = state.accounts.findIndex((acc) => acc.id === accountId)
  if (index === -1) return null
  const current = state.accounts[index]
  const updated: UserAccount = {
    ...current,
    name: patch.name !== undefined ? patch.name.trim().slice(0, 120) : current.name,
    kecamatan: patch.kecamatan ?? current.kecamatan,
    desa: patch.desa !== undefined ? patch.desa.trim().slice(0, 120) : current.desa,
    banjarName: patch.banjarName !== undefined ? patch.banjarName.trim().slice(0, 120) : current.banjarName,
    tps3rNode: patch.tps3rNode !== undefined ? patch.tps3rNode.trim().slice(0, 120) : current.tps3rNode,
    birthDate: patch.birthDate !== undefined ? patch.birthDate.trim().slice(0, 20) : current.birthDate,
    address: patch.address !== undefined ? patch.address.trim().slice(0, 240) : current.address,
    lat: patch.lat ?? current.lat,
    lng: patch.lng ?? current.lng,
    accountType: patch.accountType ?? current.accountType,
    wasteProfile: patch.wasteProfile ?? current.wasteProfile,
  }
  state.accounts[index] = updated
  return sanitizeAccount(updated)
}

export function createAccount(input: {
  name: string
  email: string
  password?: string
  role: UserRole
  kecamatan: Kecamatan
  desa: string
  banjarName?: string
  tps3rNode?: string
  birthDate?: string
  address: string
  lat?: number
  lng?: number
  accountType: AccountType
  wasteProfile?: Partial<ResidentWasteProfile>
}): UserAccount {
  const regionInfo = getDesaDetails(input.kecamatan, input.desa)
  const resolvedLat = input.lat ?? regionInfo?.lat ?? -8.6562
  const resolvedLng = input.lng ?? regionInfo?.lng ?? 115.2124
  const resolvedNode = input.tps3rNode?.trim() || regionInfo?.tps3rNode || `TPS3R Swakelola ${input.desa.trim() || 'Desa'}`
  const state = getAccountState()
  const id = `usr_${input.role}_${Date.now().toString(36)}`
  const defaultProfile: ResidentWasteProfile | undefined =
    input.role === 'warga'
      ? {
          currentCondition: input.wasteProfile?.currentCondition ?? 'terkendali',
          conditionNote: input.wasteProfile?.conditionNote ?? 'Sampah rumah tangga rutin mingguan.',
          weeklyRegularLiters: input.wasteProfile?.weeklyRegularLiters ?? 75,
          containerPreset: input.wasteProfile?.containerPreset ?? 'kantong_15l',
          householdMembers: input.wasteProfile?.householdMembers ?? 4,
          sortingReadiness: input.wasteProfile?.sortingReadiness ?? 'sebagian',
          compositionPct: input.wasteProfile?.compositionPct ?? {
            organic: 60,
            plastic: 20,
            paper: 10,
            metal: 0,
            residual: 10,
            hazardous: 0,
          },
          selectedBalineseEventIds: input.wasteProfile?.selectedBalineseEventIds ?? DEFAULT_SELECTED_BALI_EVENTS,
          specialEvents: input.wasteProfile?.specialEvents ?? [
            {
              id: `evt_${Date.now().toString(36)}`,
              name: 'Hari Raya / Upacara Keluarga',
              frequency: 'Saat hari raya / odalan',
              extraLiters: 60,
              dominantStream: 'organik',
              activeThisWeek: false,
              notes: 'Tambahan janur, canang, daun, dan kemasan.',
            },
          ],
          pickupHistory: input.wasteProfile?.pickupHistory ?? [
            {
              id: `pkp_${Date.now().toString(36)}`,
              date: '2026-11-09',
              window: '06:00–09:00 WITA',
              stream: 'organik',
              liters: 30,
              containersLabel: '2 Kantong Kresek',
              status: 'scheduled',
              notes: 'Penjemputan organik terjadwal berikutnya.',
            },
          ],
        }
      : undefined

  const created: UserAccount = {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    ...(input.password?.trim() ? { password: input.password.trim() } : {}),
    role: input.role,
    ...(input.role === 'petugas' ? { badgeId: `DLHK-DPS-${Math.floor(100 + Math.random() * 899)}` } : {}),
    kecamatan: input.kecamatan,
    desa: input.desa.trim() || 'Pemecutan',
    banjarName: input.banjarName?.trim() || `Banjar Lingkungan ${input.desa.trim() || 'Desa'}`,
    tps3rNode: resolvedNode,
    birthDate: input.birthDate?.trim(),
    address: input.address.trim() || `Wilayah ${input.kecamatan}`,
    lat: resolvedLat,
    lng: resolvedLng,
    accountType: input.accountType,
    wasteProfile: defaultProfile,
  }
  state.accounts.push(created)
  state.activeAccountId = created.id
  return sanitizeAccount(created)
}

export function listTimetableSlots(kecamatan?: Kecamatan): PetugasTimetableSlot[] {
  const slots = getAccountState().timetable
  if (!kecamatan) return slots
  return slots.filter((slot) => slot.kecamatan === kecamatan)
}

export function updateTimetableSlot(
  slotId: string,
  patch: Partial<Pick<PetugasTimetableSlot, 'days' | 'windowStart' | 'windowEnd' | 'leewayMinutes' | 'surgeTolerancePct' | 'maxLitersPerPickup' | 'notes'>>,
): PetugasTimetableSlot | null {
  const state = getAccountState()
  const idx = state.timetable.findIndex((item) => item.id === slotId)
  if (idx === -1) return null
  state.timetable[idx] = { ...state.timetable[idx], ...patch }
  return state.timetable[idx]
}
