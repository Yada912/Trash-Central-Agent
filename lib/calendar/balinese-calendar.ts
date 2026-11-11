import type { Kecamatan, WasteStream } from '@/lib/schemas'
import type { PetugasTimetableSlot } from '@/lib/accounts/store'
import { sanitizeIcsField } from '@/lib/security/guard'
import { getTodayWita } from '@/lib/time'

export type BalineseEventCategory =
  | 'rahinan_besar'
  | 'purnama_tilem'
  | 'tumpek_kajeng'
  | 'adat_keluarga'

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
  isPersonalOtonan?: boolean
}

const WUKU_NAMES = [
  'Sinta',
  'Landep',
  'Ukir',
  'Kulantir',
  'Tolu',
  'Gumbreg',
  'Wariga',
  'Warigadean',
  'Julungwangi',
  'Sungsang',
  'Dungulan',
  'Kuningan',
  'Langkir',
  'Medangsia',
  'Pujut',
  'Pahang',
  'Krulut',
  'Merakih',
  'Tambir',
  'Medangkungan',
  'Matal',
  'Uye',
  'Menail',
  'Prangbakat',
  'Bala',
  'Ugu',
  'Wayang',
  'Kelawu',
  'Dukut',
  'Watugunung',
] as const

const SAPTAWARA_NAMES = [
  'Redite (Minggu)',
  'Soma (Senin)',
  'Anggara (Selasa)',
  'Buda (Rabu)',
  'Wraspati (Kamis)',
  'Sukra (Jumat)',
  'Saniscara (Sabtu)',
] as const

const PANCAWARA_NAMES = ['Umanis', 'Paing', 'Pon', 'Wage', 'Kliwon'] as const

export type UserOtonanSummary = {
  birthDate: string
  wukuName: string
  saptawaraName: string
  pancawaraName: string
  pawukonLabel: string
  nextOtonanDate: string
  calendarHighlightDate: string // Date shown on the active November 2026 calendar
  daysUntilNextOtonan: number
  extraLitersHousehold: number
  organicSurgePct: number
  anorganikSurgePct: number
  EventItem: BalineseCalendarEvent
}

// Reference epoch: 2026-11-04 is Buda (3) Kliwon (4) Wuku Dungulan (index 10 -> day 73 in 0..209 Pawukon cycle)
const EPOCH_MS = Date.UTC(2026, 10, 4)
const EPOCH_PAWUKON_DAY = 10 * 7 + 3 // Wuku Dungulan (10), Buda (3) = 73
const EPOCH_PANCAWARA_INDEX = 4 // Kliwon

function parseIsoUtc(dateIso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return Date.UTC(year, month - 1, day)
}

function formatIsoUtc(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeUserOtonanFromBirthDate(
  birthDate: string,
  referenceDate = getTodayWita(),
): UserOtonanSummary | null {
  const birthMs = parseIsoUtc(birthDate)
  const refMs = parseIsoUtc(referenceDate) ?? EPOCH_MS
  if (birthMs === null) return null

  const diffFromEpochDays = Math.round((birthMs - EPOCH_MS) / 86_400_000)
  const pawukonDay = ((EPOCH_PAWUKON_DAY + diffFromEpochDays) % 210 + 210) % 210
  const wukuIndex = Math.floor(pawukonDay / 7)
  const saptawaraIndex = pawukonDay % 7
  const pancawaraIndex = ((EPOCH_PANCAWARA_INDEX + diffFromEpochDays) % 5 + 5) % 5

  const wukuName = WUKU_NAMES[wukuIndex] ?? 'Dungulan'
  const saptawaraName = SAPTAWARA_NAMES[saptawaraIndex] ?? 'Buda (Rabu)'
  const pancawaraName = PANCAWARA_NAMES[pancawaraIndex] ?? 'Kliwon'
  const pawukonLabel = `${saptawaraName.split(' ')[0]} ${pancawaraName} Wuku ${wukuName}`

  // Next 210-day cycle occurrence on or after referenceDate
  const daysSinceBirth = Math.max(0, Math.round((refMs - birthMs) / 86_400_000))
  const remainder = daysSinceBirth % 210
  const daysUntilNextOtonan = remainder === 0 ? 0 : 210 - remainder
  const nextOtonanMs = refMs + daysUntilNextOtonan * 86_400_000
  const nextOtonanDate = formatIsoUtc(nextOtonanMs)

  // Real Otonan date in the 210-day cycle
  const calendarHighlightDate = nextOtonanDate

  const eventItem: BalineseCalendarEvent = {
    id: 'bali_personal_otonan',
    name: `Otonan Pribadi (${pawukonLabel})`,
    balineseName: `${pawukonLabel} · Siklus 210 Hari`,
    date: calendarHighlightDate,
    category: 'adat_keluarga',
    defaultSelected: true,
    organicSurgePct: 45,
    anorganikSurgePct: 15,
    extraLitersHousehold: 30,
    typicalWasteItems: [
      'Banten otonan, sesayut & tumpeng',
      'Janur sampian & canang sari',
      'Kemasan hidangan keluarga',
    ],
    preparationTip: `Otonan Anda jatuh pada ${pawukonLabel} (berikutnya: ${nextOtonanDate}). Siapkan 2 wadah organik terpisah untuk lungsuran banten otonan.`,
    postEventTip:
      'Sisa organik banten otonan diangkut oleh petugas swakelola menuju TPS3R pada jadwal Organik terdekat (Senin/Rabu/Kamis/Sabtu).',
    isPersonalOtonan: true,
  }

  return {
    birthDate,
    wukuName,
    saptawaraName,
    pancawaraName,
    pawukonLabel,
    nextOtonanDate,
    calendarHighlightDate,
    daysUntilNextOtonan,
    extraLitersHousehold: 30,
    organicSurgePct: 45,
    anorganikSurgePct: 15,
    EventItem: eventItem,
  }
}

export const BALINESE_CALENDAR_EVENTS_2026: BalineseCalendarEvent[] = [
  {
    id: 'bali_sugihan_jawa',
    name: 'Sugihan Jawa',
    balineseName: 'Wraspati Wage Sungsang',
    date: '2026-10-29',
    category: 'rahinan_besar',
    defaultSelected: false,
    organicSurgePct: 35,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang raka, banten arerebuan', 'Dedaunan pembersihan merajan'],
    preparationTip: 'Kumpulkan pangkasan daun dan bunga merajan ke kantong organik menuju TPS3R.',
    postEventTip: 'Dijemput armada organik Sabtu pagi.',
  },
  {
    id: 'bali_sugihan_bali',
    name: 'Sugihan Bali',
    balineseName: 'Sukra Kliwon Sungsang',
    date: '2026-10-30',
    category: 'rahinan_besar',
    defaultSelected: false,
    organicSurgePct: 40,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Banten penglukatan, bungkak kelapa muda', 'Janur & bunga'],
    preparationTip: 'Belah atau pisahkan batok kelapa muda (bungkak) agar mudah dicacah di TPS3R.',
    postEventTip: 'Diangkut pada jadwal organik Sabtu pagi.',
  },
  {
    id: 'bali_penyekeban_galungan',
    name: 'Penyekeban & Penyajaan Galungan',
    balineseName: 'Redite Paing – Soma Pon Dungulan',
    date: '2026-11-01',
    category: 'rahinan_besar',
    defaultSelected: false,
    organicSurgePct: 45,
    anorganikSurgePct: 20,
    extraLitersHousehold: 30,
    typicalWasteItems: ['Daun pisang pembungkus tape', 'Kulit buah & ampas kelapa', 'Plastik bahan jaje'],
    preparationTip: 'Pisahkan plastik kemasan tepung/gula dari daun pisang sejak tahap persiapan.',
    postEventTip: 'Organik diangkut Senin pagi; plastik kemasan diangkut Selasa.',
  },
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
    postEventTip: 'Ikat rapat sisa organik basah agar siap diangkut armada swakelola TPS3R Rabu pagi.',
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
    postEventTip: 'Lungsuran banten & canang diangkut ke TPS3R pada jadwal organik Kamis & Sabtu pagi.',
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
    preparationTip: 'Kempiskan botol plastik dan lipat kardus agar hemat ruang untuk jadwal anorganik Jumat.',
    postEventTip: 'Pastikan residu tisu/bungkus makanan tidak tercampur ke kantong canang organik.',
  },
  {
    id: 'bali_pemaridan_guru',
    name: 'Pemaridan Guru (Ngelungsur Galungan)',
    balineseName: 'Saniscara Pon Dungulan',
    date: '2026-11-07',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 55,
    anorganikSurgePct: 15,
    extraLitersHousehold: 35,
    typicalWasteItems: ['Lungsuran banten Galungan', 'Buah, jaje & janur kering'],
    preparationTip: 'Hari ini adalah jadwal angkut Organik Sabtu! Pisahkan buah/jaje dari tusuk semat sebelum diserahkan ke petugas TPS3R.',
    postEventTip: 'Sisa anorganik akan dijemput besok (Minggu) pada jadwal Bank Sampah/Anorganik.',
  },
  {
    id: 'bali_kajeng_kliwon_1',
    name: 'Kajeng Kliwon Enyitan',
    balineseName: 'Kajeng Kliwon Kuningan',
    date: '2026-11-08',
    category: 'tumpek_kajeng',
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
    balineseName: 'Soma Paing Kuningan · Tilem',
    date: '2026-11-09',
    category: 'purnama_tilem',
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
    typicalWasteItems: ['Janur tamiang & endongan', 'Daun pandan & pisang', 'Sisa bahan nasi kuning'],
    preparationTip: 'Potong kecil sisa janur dan daun pandan agar tidak meluber dari kantong organik.',
    postEventTip: 'Armada TPS3R & DLHK membuka toleransi leeway ekstra +35% untuk pengangkutan Sabtu pagi.',
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
    postEventTip: 'Truk anorganik beroperasi Minggu pagi, sedangkan lungsuran organik dijemput Senin pagi ke TPS3R.',
  },
  {
    id: 'bali_pegat_uwakan',
    name: 'Buda Kliwon Pegat Uwakan (Cabut Penjor)',
    balineseName: 'Buda Kliwon Pahang',
    date: '2026-11-18',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 45,
    anorganikSurgePct: 15,
    extraLitersHousehold: 35,
    typicalWasteItems: ['Janur penjor kering', 'Bambu & hiasan sampian penjor'],
    preparationTip: 'Potong bambu/janur penjor sepanjang maks. 60 cm dan ikat rapi agar mudah dimuat motor cikar TPS3R.',
    postEventTip: 'Letakkan ikatan penjor di samping kantong organik pada jadwal angkut Rabu/Kamis.',
  },
  {
    id: 'bali_kajeng_kliwon_2',
    name: 'Kajeng Kliwon Uwudan',
    balineseName: 'Kajeng Kliwon Pahang',
    date: '2026-11-23',
    category: 'tumpek_kajeng',
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
    balineseName: 'Anggara Pon Krulut · Purnama',
    date: '2026-11-24',
    category: 'purnama_tilem',
    defaultSelected: true,
    organicSurgePct: 35,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang sari, daksina & bunga', 'Janur & buah lungsuran'],
    preparationTip: 'Kelompokkan canang dan daun ke kantong organik; simpan batok kelapa daksina terpisah.',
    postEventTip: 'Dijemput pada jadwal organik Rabu/Kamis pagi menuju TPS3R.',
  },
  {
    id: 'bali_tumpek_krulut',
    name: 'Tumpek Krulut (Rahinan Kasih Sayang & Gong)',
    balineseName: 'Saniscara Kliwon Krulut',
    date: '2026-11-28',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 35,
    anorganikSurgePct: 20,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Banten otonan gamelan/seni', 'Canang & kemasan acara keluarga'],
    preparationTip: 'Hari Sabtu adalah hari angkut Organik; keluarkan sisa daun/bunga pagi hari dan simpan botol plastik untuk Minggu.',
    postEventTip: 'Anorganik dijemput Minggu pagi oleh unit Bank Sampah/TPS3R.',
  },
  {
    id: 'bali_anggarakasih_merakih',
    name: 'Anggarakasih Merakih',
    balineseName: 'Anggara Kliwon Merakih',
    date: '2026-12-01',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 25,
    anorganikSurgePct: 10,
    extraLitersHousehold: 20,
    typicalWasteItems: ['Canang reresik & banten merajan'],
    preparationTip: 'Pisahkan sisa bunga/janur ke ember kompos rumah tangga.',
    postEventTip: 'Diangkut pada jadwal organik Rabu pagi.',
  },
  {
    id: 'bali_kajeng_kliwon_dec',
    name: 'Kajeng Kliwon Enyitan (Sasih Keenam)',
    balineseName: 'Kajeng Kliwon Menail',
    date: '2026-12-08',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 20,
    anorganikSurgePct: 5,
    extraLitersHousehold: 15,
    typicalWasteItems: ['Canang sari, segehan manca warna', 'Bunga & janur lungsuran'],
    preparationTip: 'Kumpulkan canang dan segehan ke wadah organik setelah persembahyangan.',
    postEventTip: 'Diangkut pada jadwal organik terdekat TPS3R.',
  },
  {
    id: 'bali_tilem_kanem',
    name: 'Tilem Sasih Keenam (Tilem Kanem)',
    balineseName: 'Buda Paing Menail · Tilem Kanem',
    date: '2026-12-09',
    category: 'purnama_tilem',
    defaultSelected: true,
    organicSurgePct: 35,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang rebong & daksina', 'Janur & bunga sisa upakara'],
    preparationTip: 'Pastikan abu dupa padam sempurna sebelum dimasukkan ke kantong organik.',
    postEventTip: 'Armada TPS3R mengangkut lungsuran pada jadwal Organik Kamis pagi.',
  },
  {
    id: 'bali_purnama_kapitu',
    name: 'Purnama Sasih Kapitu',
    balineseName: 'Wraspati Paing Bala · Purnama Kapitu',
    date: '2026-12-24',
    category: 'purnama_tilem',
    defaultSelected: true,
    organicSurgePct: 40,
    anorganikSurgePct: 15,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang, sampian & banten saiban', 'Sisa buah & janur'],
    preparationTip: 'Pisahkan wadah plastik atau mika jajanan dari sisa janur organik.',
    postEventTip: 'Organik dijemput pada jadwal rutin berikutnya; botol/plastik disetor ke Bank Sampah.',
  },
  {
    id: 'bali_tumpek_uye',
    name: 'Tumpek Kandang / Tumpek Uye (Penyucian Hewan)',
    balineseName: 'Saniscara Kliwon Uye',
    date: '2027-01-02',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 30,
    anorganikSurgePct: 10,
    extraLitersHousehold: 20,
    typicalWasteItems: ['Banten kandang & pakan ternak', 'Janur & canang pemujaan Sang Hyang Rare Angon'],
    preparationTip: 'Kumpulkan sisa pakan ternak dan janur ke komposter atau kantong organik.',
    postEventTip: 'Diangkut oleh armada swakelola TPS3R pada jadwal Organik terdekat.',
  },
  {
    id: 'bali_siwaratri_tilem_kapitu',
    name: 'Hari Raya Siwaratri & Tilem Sasih Kapitu',
    balineseName: 'Wraspati Wage Wayang · Malam Siwaratri',
    date: '2027-01-07',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 50,
    anorganikSurgePct: 20,
    extraLitersHousehold: 35,
    typicalWasteItems: ['Daun bila, canang sari & lungsuran sesajen', 'Kemasan air mineral pesamuan'],
    preparationTip: 'Kumpulkan botol/gelas plastik jemaah malam jagra ke karung anorganik khusus.',
    postEventTip: 'Sampah anorganik disalurkan ke Bank Sampah; organik diangkut Jumat/Sabtu.',
  },
  {
    id: 'bali_purnama_kawalu',
    name: 'Purnama Sasih Kawalu',
    balineseName: 'Sukra Wage Wayang · Purnama Kawalu',
    date: '2027-01-22',
    category: 'purnama_tilem',
    defaultSelected: true,
    organicSurgePct: 35,
    anorganikSurgePct: 10,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Canang sari & banten pejati', 'Janur, daun pisang & bunga'],
    preparationTip: 'Pisahkan semat bambu dari daun pisang agar cacahan kompos di TPS3R optimal.',
    postEventTip: 'Diangkut pada jadwal pengangkutan Organik Sabtu pagi.',
  },
  {
    id: 'bali_tumpek_wayang',
    name: 'Tumpek Wayang (Penyucian Kesenian & Wayang)',
    balineseName: 'Saniscara Kliwon Wayang',
    date: '2027-02-06',
    category: 'tumpek_kajeng',
    defaultSelected: false,
    organicSurgePct: 35,
    anorganikSurgePct: 15,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Sesajen wayang, suci & pras', 'Canang, janur & kelapa daksina'],
    preparationTip: 'Kelompokkan batok kelapa daksina terpisah untuk pemanfaatan arang ramah lingkungan.',
    postEventTip: 'Armada TPS3R menjemput pada jadwal Organik terdekat.',
  },
  {
    id: 'bali_purnama_kasanga',
    name: 'Purnama Sasih Kasanga',
    balineseName: 'Redite Umanis Dukut · Purnama Kasanga',
    date: '2027-02-21',
    category: 'purnama_tilem',
    defaultSelected: true,
    organicSurgePct: 40,
    anorganikSurgePct: 15,
    extraLitersHousehold: 30,
    typicalWasteItems: ['Canang sari & banten penyamblehan', 'Janur & bunga sisa upakara kasanga'],
    preparationTip: 'Persiapkan wadah pilah sejak pagi karena volume lungsuran meningkat menjelang Tawur Kesanga.',
    postEventTip: 'Diangkut pada jadwal Organik Senin pagi.',
  },
  {
    id: 'bali_tawur_kesanga_ogoh',
    name: 'Tawur Agung Kasanga & Pawai Ogoh-ogoh',
    balineseName: 'Soma Paing Watugunung · Pengerupukan',
    date: '2027-03-08',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 80,
    anorganikSurgePct: 45,
    extraLitersHousehold: 50,
    typicalWasteItems: ['Bambu & styrofoam ogoh-ogoh', 'Obor & janur sanggah cucuk', 'Kemasan botol minuman warga'],
    preparationTip: 'Penting: Pilah bambu penopang ogoh-ogoh dan kumpulkan botol plastik penonton ke titik kumpul banjar sebelum tengah malam.',
    postEventTip: 'Tim respon cepat DLHK & TPS3R membersihkan koridor jalan raya sebelum jam 05:00 WITA.',
  },
  {
    id: 'bali_nyepi_1949',
    name: 'Hari Suci Nyepi Saka 1949 (Sipeng)',
    balineseName: 'Anggara Pon Watugunung · Nyepi Catur Brata',
    date: '2027-03-09',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 0,
    anorganikSurgePct: 0,
    extraLitersHousehold: 0,
    typicalWasteItems: ['Tidak ada aktivitas pengangkutan sampah selama 24 jam Nyepi (Catur Brata Penyepian)'],
    preparationTip: 'Simpan seluruh sampah terpilah di dalam rumah/pekarangan tertutup selama pelaksanaan Nyepi.',
    postEventTip: 'Pengangkutan armada kembali beroperasi normal pada Ngembak Geni (10 Maret 2027).',
  },
  {
    id: 'bali_ngembak_geni',
    name: 'Ngembak Geni (Pasca Nyepi)',
    balineseName: 'Buda Wage Watugunung · Ngembak Geni',
    date: '2027-03-10',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 60,
    anorganikSurgePct: 30,
    extraLitersHousehold: 40,
    typicalWasteItems: ['Akumulasi sampah organik 2 hari', 'Sisa makanan silaturahmi keluarga'],
    preparationTip: 'Keluarkan kantong organik terpilah setelah pukul 06:00 WITA.',
    postEventTip: 'Armada DLHK & TPS3R menambah ritase penjemputan untuk mengantisipasi akumulasi 2 hari.',
  },
  {
    id: 'bali_saraswati',
    name: 'Hari Raya Saraswati',
    balineseName: 'Saniscara Umanis Watugunung',
    date: '2027-03-27',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 65,
    anorganikSurgePct: 20,
    extraLitersHousehold: 40,
    typicalWasteItems: ['Banten saraswati, daun pisang & janur', 'Bunga canang pustaka'],
    preparationTip: 'Kumpulkan lungsuran canang pustaka dan buku ke kantong organik khusus.',
    postEventTip: 'Diangkut pada jadwal Organik terdekat armada swakelola.',
  },
  {
    id: 'bali_banyu_pinaruh',
    name: 'Banyu Pinaruh (Pembersihan Diri)',
    balineseName: 'Redite Paing Sinta',
    date: '2027-03-28',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 40,
    anorganikSurgePct: 20,
    extraLitersHousehold: 25,
    typicalWasteItems: ['Banten banyu pinaruh, kumkuman bunga', 'Kemasan bekal di kawasan pantai/sumber air'],
    preparationTip: 'Bawa pulang kembali kantong bekal/botol saat malukat di pantai atau sumber mata air.',
    postEventTip: 'Bank Sampah & armada menjemput di titik pantai dan pemukiman.',
  },
  {
    id: 'bali_pagerwesi',
    name: 'Hari Raya Pagerwesi',
    balineseName: 'Buda Kliwon Sinta',
    date: '2027-03-31',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 70,
    anorganikSurgePct: 25,
    extraLitersHousehold: 45,
    typicalWasteItems: ['Banten pagerwesi, segehan agung', 'Janur, canang & buah lungsuran'],
    preparationTip: 'Pisahkan sisa buah lungsuran dari janur kering untuk kemudahan pengomposan di TPS3R.',
    postEventTip: 'Diangkut pada jadwal Organik Kamis pagi.',
  },
  {
    id: 'bali_galungan_2027',
    name: 'Hari Raya Galungan 2027',
    balineseName: 'Buda Kliwon Dungulan · Siklus 210 Hari',
    date: '2027-06-02',
    category: 'rahinan_besar',
    defaultSelected: true,
    organicSurgePct: 90,
    anorganikSurgePct: 35,
    extraLitersHousehold: 60,
    typicalWasteItems: ['Canang sari & banten penjor', 'Janur & sampian Galungan', 'Kemasan minuman silaturahmi'],
    preparationTip: 'Siapkan 3 wadah terpisah (organik basah, janur kering, anorganik kemasan).',
    postEventTip: 'TPS3R & DLHK membuka shift khusus ekstra leeway untuk pengangkutan pasca Galungan.',
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
  birthDate?: string
}): CalendarDayCell[] {
  const {
    year,
    month,
    todayDate = getTodayWita(),
    kecamatan,
    timetable,
    weeklyRegularLiters,
    selectedBalineseEventIds,
    birthDate,
  } = params

  const slots = timetable.filter((s) => s.kecamatan === kecamatan)
  const selectedSet = new Set(selectedBalineseEventIds)

  const otonanSummary = birthDate ? computeUserOtonanFromBirthDate(birthDate, todayDate) : null
  const allEvents: BalineseCalendarEvent[] = otonanSummary
    ? [...BALINESE_CALENDAR_EVENTS_2026, otonanSummary.EventItem]
    : BALINESE_CALENDAR_EVENTS_2026

  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const startDow = firstDay.getUTCDay() // 0 = Sun
  const leadDays = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const totalCells = leadDays + daysInMonth > 35 ? 42 : 35
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - leadDays))

  const birthMs = birthDate ? parseIsoUtc(birthDate) : null
  const birthPawukonDay =
    birthMs !== null
      ? ((EPOCH_PAWUKON_DAY + Math.round((birthMs - EPOCH_MS) / 86_400_000)) % 210 + 210) % 210
      : null

  const cells: CalendarDayCell[] = []
  for (let i = 0; i < totalCells; i++) {
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

    const dPawukonDay = ((EPOCH_PAWUKON_DAY + Math.round((d.getTime() - EPOCH_MS) / 86_400_000)) % 210 + 210) % 210
    const isOtonanToday = birthPawukonDay !== null && dPawukonDay === birthPawukonDay

    const baseEvents = allEvents.filter((ev) => ev.date === dateIso)
    const dayEvents = baseEvents.map((ev) => ({
      ...ev,
      isSelectedByUser: ev.isPersonalOtonan ? true : selectedSet.has(ev.id),
    }))

    if (isOtonanToday && otonanSummary && !dayEvents.some((e) => e.isPersonalOtonan)) {
      dayEvents.push({
        ...otonanSummary.EventItem,
        date: dateIso,
        isSelectedByUser: true,
      })
    }

    const prevDate = new Date(d.getTime() - 86_400_000)
    const prevIso = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDate.getUTCDate()).padStart(2, '0')}`
    const prevPawukonDay = ((EPOCH_PAWUKON_DAY + Math.round((prevDate.getTime() - EPOCH_MS) / 86_400_000)) % 210 + 210) % 210
    const wasOtonanYesterday = birthPawukonDay !== null && prevPawukonDay === birthPawukonDay

    const prevSelectedEvents = allEvents.filter(
      (ev) => ev.date === prevIso && (ev.isPersonalOtonan || selectedSet.has(ev.id)),
    )
    if (wasOtonanYesterday && otonanSummary && !prevSelectedEvents.some((e) => e.isPersonalOtonan)) {
      prevSelectedEvents.push({
        ...otonanSummary.EventItem,
        date: prevIso,
      })
    }

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
  const safeTitle = sanitizeIcsField(input.title)
  const safeLocation = sanitizeIcsField(input.location)
  const cleanDesc = sanitizeIcsField(input.description)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Central Trash Agent Bali//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${startUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${safeLocation}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
