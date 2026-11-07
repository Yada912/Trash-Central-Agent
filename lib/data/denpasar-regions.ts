import type { Kecamatan } from '@/lib/schemas'

export type DesaInfo = {
  name: string
  kecamatan: Kecamatan
  type: 'Desa' | 'Kelurahan'
  tps3rNode: string
  lat: number
  lng: number
  banjars: string[]
}

export const DENPASAR_REGIONS: DesaInfo[] = [
  // ==========================================
  // DENPASAR BARAT (11 Desa / Kelurahan)
  // ==========================================
  {
    name: 'Pemecutan',
    kecamatan: 'Denpasar Barat',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Pemecutan (Desa Berbasis Sumber)',
    lat: -8.6562,
    lng: 115.2124,
    banjars: [
      'Banjar Pekambingan',
      'Banjar Busung Yeh',
      'Banjar Alangkaja',
      'Banjar Pemedilan',
      'Banjar Kerandan',
      'Banjar Gelogor',
    ],
  },
  {
    name: 'Pemecutan Klod',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Pemecutan Klod Swakelola',
    lat: -8.675,
    lng: 115.205,
    banjars: [
      'Banjar Tegal Gede',
      'Banjar Abian Timbul',
      'Banjar Gunung Sari',
      'Banjar Buagan',
      'Banjar Mekar Jaya',
    ],
  },
  {
    name: 'Dauh Puri',
    kecamatan: 'Denpasar Barat',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Dauh Puri Swakelola',
    lat: -8.6595,
    lng: 115.2165,
    banjars: [
      'Banjar Pelita',
      'Banjar Catur Panca',
      'Banjar Sebelanga',
      'Banjar Suci',
      'Banjar Kaliungu Kaja',
      'Banjar Kaliungu Kelod',
    ],
  },
  {
    name: 'Dauh Puri Kangin',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Dauh Puri Kangin',
    lat: -8.657,
    lng: 115.22,
    banjars: [
      'Banjar Sutomo',
      'Banjar Suci',
      'Banjar Titih',
      'Banjar Beraban',
    ],
  },
  {
    name: 'Dauh Puri Kauh',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Dauh Puri Kauh',
    lat: -8.665,
    lng: 115.208,
    banjars: [
      'Banjar Pengiasan',
      'Banjar Beraban',
      'Banjar Jematang',
      'Banjar Gemeh',
      'Banjar Diponegoro',
    ],
  },
  {
    name: 'Dauh Puri Klod',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Sanglah Dauh Puri Klod',
    lat: -8.671,
    lng: 115.218,
    banjars: [
      'Banjar Sanglah Barat',
      'Banjar Sanglah Timur',
      'Banjar Rente',
      'Banjar Bumi Asri',
    ],
  },
  {
    name: 'Padangsambian',
    kecamatan: 'Denpasar Barat',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Padangsambian',
    lat: -8.651,
    lng: 115.188,
    banjars: [
      'Banjar Balun',
      'Banjar Minggir',
      'Banjar Padang Praja',
      'Banjar Tegallantang',
      'Banjar Pagok',
    ],
  },
  {
    name: 'Padangsambian Kaja',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Padangsambian Kaja Resik',
    lat: -8.638,
    lng: 115.185,
    banjars: [
      'Banjar Batu Kandik',
      'Banjar Batu Paras',
      'Banjar Bhuana Asri',
      'Banjar Robokan',
    ],
  },
  {
    name: 'Padangsambian Klod',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Padangsambian Klod',
    lat: -8.664,
    lng: 115.182,
    banjars: [
      'Banjar Padang Sambian Klod',
      'Banjar Buana Desa',
      'Banjar Tegal Dukuh',
      'Banjar Kertha Bhuana',
    ],
  },
  {
    name: 'Tegal Harum',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Tegal Harum Mandiri',
    lat: -8.662,
    lng: 115.195,
    banjars: [
      'Banjar Tegal Sari',
      'Banjar Bhuana Kubu',
      'Banjar Sapta Bumi',
      'Banjar Sanga Agung',
    ],
  },
  {
    name: 'Tegal Kertha',
    kecamatan: 'Denpasar Barat',
    type: 'Desa',
    tps3rNode: 'TPS3R Tegal Kertha Asri',
    lat: -8.659,
    lng: 115.201,
    banjars: [
      'Banjar Panca Kertha',
      'Banjar Mulia Kertha',
      'Banjar Pura Kertha',
      'Banjar Graha Shanti',
    ],
  },

  // ==========================================
  // DENPASAR SELATAN (10 Desa / Kelurahan)
  // ==========================================
  {
    name: 'Sanur',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Sanur Berbasis Sumber',
    lat: -8.6915,
    lng: 115.2623,
    banjars: [
      'Banjar Sindu Kaja',
      'Banjar Sindu Kelod',
      'Banjar Gulingan',
      'Banjar Semawang',
    ],
  },
  {
    name: 'Sanur Kaja',
    kecamatan: 'Denpasar Selatan',
    type: 'Desa',
    tps3rNode: 'TPS3R Cemara Sanur Kaja',
    lat: -8.6745,
    lng: 115.2517,
    banjars: [
      'Banjar Pekandelan',
      'Banjar Anggarkasih',
      'Banjar Belong',
    ],
  },
  {
    name: 'Sanur Kauh',
    kecamatan: 'Denpasar Selatan',
    type: 'Desa',
    tps3rNode: 'TPS3R Sanur Kauh',
    lat: -8.698,
    lng: 115.25,
    banjars: [
      'Banjar Betngandang',
      'Banjar Dangin Peken',
      'Banjar Puseh Kangin',
    ],
  },
  {
    name: 'Renon',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Renon Mandiri',
    lat: -8.678,
    lng: 115.234,
    banjars: [
      'Banjar Peken Renon',
      'Banjar Kaja Renon',
      'Banjar Kelod Renon',
      'Banjar Tengah Renon',
    ],
  },
  {
    name: 'Panjer',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Panjer Resik',
    lat: -8.683,
    lng: 115.225,
    banjars: [
      'Banjar Kaja Panjer',
      'Banjar Sasih Panjer',
      'Banjar Kangin Panjer',
      'Banjar Celuk',
      'Banjar Antap',
    ],
  },
  {
    name: 'Sesetan',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Sesetan Segara',
    lat: -8.7017,
    lng: 115.2175,
    banjars: [
      'Banjar Gaduh',
      'Banjar Suwung Batan Kendal',
      'Banjar Kaja Sesetan',
      'Banjar Tengah Sesetan',
      'Banjar Pegok',
    ],
  },
  {
    name: 'Pedungan',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Pedungan Bersih',
    lat: -8.705,
    lng: 115.205,
    banjars: [
      'Banjar Begawan',
      'Banjar Pande',
      'Banjar Menesa',
      'Banjar Dukuh Pesirahan',
    ],
  },
  {
    name: 'Sidakarya',
    kecamatan: 'Denpasar Selatan',
    type: 'Desa',
    tps3rNode: 'TPS3R Sidakarya Lestari',
    lat: -8.702,
    lng: 115.235,
    banjars: [
      'Banjar Graha Kerti',
      'Banjar Tengah Sidakarya',
      'Banjar Kaja Sidakarya',
      'Banjar Sari Sidakarya',
    ],
  },
  {
    name: 'Serangan',
    kecamatan: 'Denpasar Selatan',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Pesisir Serangan',
    lat: -8.728,
    lng: 115.231,
    banjars: [
      'Banjar Kaja Serangan',
      'Banjar Tengah Serangan',
      'Banjar Ponjok',
      'Banjar Peken Serangan',
    ],
  },
  {
    name: 'Pemogan',
    kecamatan: 'Denpasar Selatan',
    type: 'Desa',
    tps3rNode: 'TPS3R Pemogan Swakelola',
    lat: -8.711,
    lng: 115.198,
    banjars: [
      'Banjar Gunung Pemogan',
      'Banjar Sakah',
      'Banjar Kajeng',
      'Banjar Rame',
      'Banjar Dukuh Tangkas',
    ],
  },

  // ==========================================
  // DENPASAR TIMUR (11 Desa / Kelurahan)
  // ==========================================
  {
    name: 'Kesiman',
    kecamatan: 'Denpasar Timur',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Kesiman Resik',
    lat: -8.648,
    lng: 115.242,
    banjars: [
      'Banjar Dajan Tangluk',
      'Banjar Abian Nangka Kaja',
      'Banjar Buaji Sakah',
    ],
  },
  {
    name: 'Kesiman Petilan',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Kesiman Petilan',
    lat: -8.651,
    lng: 115.249,
    banjars: [
      'Banjar Batan Buah',
      'Banjar Kedaton',
      'Banjar Kehen',
      'Banjar Abian Tubuh',
    ],
  },
  {
    name: 'Kesiman Kertalangu',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPST & TPS3R Biaung Kertalangu',
    lat: -8.645,
    lng: 115.265,
    banjars: [
      'Banjar Kesambi',
      'Banjar Tohpati',
      'Banjar Biaung',
      'Banjar Kertalangu',
    ],
  },
  {
    name: 'Dangin Puri',
    kecamatan: 'Denpasar Timur',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Dangin Puri',
    lat: -8.654,
    lng: 115.223,
    banjars: [
      'Banjar Kayumas Kaja',
      'Banjar Kayumas Kelod',
    ],
  },
  {
    name: 'Dangin Puri Klod',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Tanjung Bungkak Dangin Puri Klod',
    lat: -8.665,
    lng: 115.232,
    banjars: [
      'Banjar Tanjung Bungkak Kaja',
      'Banjar Tanjung Bungkak Kelod',
      'Banjar Sebudi',
      'Banjar Yangbatu Kangin',
    ],
  },
  {
    name: 'Dangin Puri Kangin',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Dangin Puri Kangin',
    lat: -8.656,
    lng: 115.228,
    banjars: [
      'Banjar Kerta Bhuana',
      'Banjar Merta Rauh',
      'Banjar Kertha Sari',
    ],
  },
  {
    name: 'Sumerta',
    kecamatan: 'Denpasar Timur',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Sumerta',
    lat: -8.652,
    lng: 115.235,
    banjars: [
      'Banjar Ketapian Kaja',
      'Banjar Ketapian Kelod',
      'Banjar Abian Kapas Kaja',
      'Banjar Abian Kapas Kelod',
    ],
  },
  {
    name: 'Sumerta Kelod',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Sumerta Kelod',
    lat: -8.661,
    lng: 115.239,
    banjars: [
      'Banjar Babakan Sumerta',
      'Banjar Tanjung Bungkak Timur',
      'Banjar Bengkel',
    ],
  },
  {
    name: 'Sumerta Kauh',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Pagan Sumerta Kauh',
    lat: -8.648,
    lng: 115.229,
    banjars: [
      'Banjar Pagan Kelod',
      'Banjar Pagan Kaja',
      'Banjar Pagan Tengah',
    ],
  },
  {
    name: 'Sumerta Kaja',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Sumerta Kaja',
    lat: -8.641,
    lng: 115.232,
    banjars: [
      'Banjar Kelandis',
      'Banjar Pandande',
    ],
  },
  {
    name: 'Penatih',
    kecamatan: 'Denpasar Timur',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Penatih Swakelola',
    lat: -8.625,
    lng: 115.245,
    banjars: [
      'Banjar Paang Tebel',
      'Banjar Saba',
      'Banjar Gunung Penatih',
    ],
  },
  {
    name: 'Penatih Dangin Puri',
    kecamatan: 'Denpasar Timur',
    type: 'Desa',
    tps3rNode: 'TPS3R Penatih Dangin Puri',
    lat: -8.621,
    lng: 115.255,
    banjars: [
      'Banjar Laplap Kauh',
      'Banjar Laplap Tengah',
      'Banjar Poh Manis',
    ],
  },

  // ==========================================
  // DENPASAR UTARA (8 Desa / Kelurahan)
  // ==========================================
  {
    name: 'Peguyangan',
    kecamatan: 'Denpasar Utara',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Peguyangan Resik',
    lat: -8.618,
    lng: 115.215,
    banjars: [
      'Banjar Asti Bhuana',
      'Banjar Tagtag Kaja',
      'Banjar Tagtag Kelod',
      'Banjar Hita Bhuana',
    ],
  },
  {
    name: 'Peguyangan Kaja',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Peguyangan Kaja',
    lat: -8.601,
    lng: 115.212,
    banjars: [
      'Banjar Batur',
      'Banjar Denyeh',
      'Banjar Saih',
      'Banjar Buana Merta',
    ],
  },
  {
    name: 'Peguyangan Kangin',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Peguyangan Kangin',
    lat: -8.612,
    lng: 115.226,
    banjars: [
      'Banjar Cengkilung',
      'Banjar Jenah',
      'Banjar Purnama Asri',
    ],
  },
  {
    name: 'Ubung',
    kecamatan: 'Denpasar Utara',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Ubung Bersatu',
    lat: -8.632,
    lng: 115.203,
    banjars: [
      'Banjar Bhuana Merta',
      'Banjar Tengah Ubung',
      'Banjar Ubung Kaja',
    ],
  },
  {
    name: 'Ubung Kaja',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Ubung Kaja',
    lat: -8.619,
    lng: 115.198,
    banjars: [
      'Banjar Pohgading',
      'Banjar Petangan Gede',
      'Banjar Anyar Kaja',
    ],
  },
  {
    name: 'Pemecutan Kaja',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Pemecutan Kaja',
    lat: -8.642,
    lng: 115.208,
    banjars: [
      'Banjar Taruna Bhineka',
      'Banjar Tegal Kori Kaja',
      'Banjar Tulangampiang',
    ],
  },
  {
    name: 'Dangin Puri Kaja',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Lumintang Dangin Puri Kaja',
    lat: -8.641,
    lng: 115.218,
    banjars: [
      'Banjar Lumintang',
      'Banjar Wangaya Kaja',
      'Banjar Wangaya Kelod',
    ],
  },
  {
    name: 'Tonja',
    kecamatan: 'Denpasar Utara',
    type: 'Kelurahan',
    tps3rNode: 'TPS3R Tonja Mandiri',
    lat: -8.632,
    lng: 115.231,
    banjars: [
      'Banjar Tega',
      'Banjar Tegeh Sari',
      'Banjar Oongan',
      'Banjar Sengguan',
    ],
  },
  {
    name: 'Dauh Puri Kaja',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Dauh Puri Kaja Mandiri',
    lat: -8.643,
    lng: 115.207,
    banjars: [
      'Banjar Lelateng',
      'Banjar Teruna',
      'Banjar Gemeh',
      'Banjar Kaliungu Kaja',
      'Banjar Wangaya Kaja',
    ],
  },
  {
    name: 'Dangin Puri Kauh',
    kecamatan: 'Denpasar Utara',
    type: 'Desa',
    tps3rNode: 'TPS3R Dangin Puri Kauh',
    lat: -8.648,
    lng: 115.215,
    banjars: [
      'Banjar Belaluan',
      'Banjar Belaluan Sadmerta',
      'Banjar Tampakgangsul',
      'Banjar Titih Kaja',
    ],
  },
]

export function getDesaListByKecamatan(kecamatan: Kecamatan): DesaInfo[] {
  return DENPASAR_REGIONS.filter((r) => r.kecamatan === kecamatan)
}

export function getDesaDetails(kecamatan: Kecamatan, desaName: string): DesaInfo | undefined {
  return DENPASAR_REGIONS.find(
    (r) => r.kecamatan === kecamatan && r.name.toLowerCase() === desaName.trim().toLowerCase(),
  )
}

export function getBanjarsByDesa(kecamatan: Kecamatan, desaName: string): string[] {
  const info = getDesaDetails(kecamatan, desaName)
  return info ? info.banjars : []
}
