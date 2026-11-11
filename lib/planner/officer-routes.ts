import { addDaysIso, formatDayDateId, getTodayWita } from '@/lib/time'

export type OfficerRouteStop = {
  seq: number
  name: string
  action: string
  lat: number
  lng: number
  volumeText: string
}

export type OfficerRouteItem = {
  id: string
  title: string
  date: string
  dayLabel: string
  stream: 'organik' | 'anorganik' | 'residu' | 'B3'
  streamLabel: string
  armadaName: string
  isToday: boolean
  loadLiters: number
  maxCapacityLiters: number
  stops: OfficerRouteStop[]
  routes: Array<{
    id: string
    positions: [number, number][]
    color: string
    dashArray?: string
  }>
  markers: Array<{
    id: string
    lat: number
    lng: number
    label: string
    color: string
  }>
}

export function getOfficerRoutes(liveToday = getTodayWita()): OfficerRouteItem[] {
  const futureDate1 = addDaysIso(liveToday, 2)
  const futureDate2 = addDaysIso(liveToday, 3)

  return [
    {
      id: 'today_organik',
      title: 'Rute Hari Ini: Koridor Organik Barat-01',
      date: liveToday,
      dayLabel: `${formatDayDateId(liveToday)} (Hari Ini)`,
      stream: 'organik',
      streamLabel: 'Sampah Organik (Kompos)',
      armadaName: 'Truk Kompos Barat-01 (Kapasitas 2.000 L)',
      isToday: true,
      loadLiters: 1620,
      maxCapacityLiters: 2000,
      stops: [
        { seq: 1, name: 'Posko Armada DLHK / TPS3R Pemecutan', action: 'Mulai Rute', lat: -8.6595, lng: 115.2165, volumeText: '0 L' },
        { seq: 2, name: 'Banjar Pekambingan (Rumah I Made Adi)', action: 'Jemput 3 Kantong Canang & Janur', lat: -8.6562, lng: 115.2124, volumeText: '+45 L' },
        { seq: 3, name: 'Koridor Pemukiman Dauh Puri Kelod', action: 'Jemput 18 Titik Organik', lat: -8.6630, lng: 115.2140, volumeText: '+820 L' },
        { seq: 4, name: 'Kawasan Pasar Tradisional Badung Barat', action: 'Jemput Sisa Sayur & Buah Terpilah', lat: -8.6530, lng: 115.2180, volumeText: '+755 L' },
        { seq: 5, name: 'TPST Padangsambian (Unit Kompos & RDF)', action: 'Bongkar Muatan & Selesai', lat: -8.6480, lng: 115.1880, volumeText: 'Total 1.620 L' },
      ],
      routes: [
        {
          id: 'r_today',
          positions: [
            [-8.6595, 115.2165],
            [-8.6562, 115.2124],
            [-8.6630, 115.2140],
            [-8.6530, 115.2180],
            [-8.6480, 115.1880],
          ],
          color: '#00A676',
        },
      ],
      markers: [
        { id: 'm1', lat: -8.6595, lng: 115.2165, label: '1. Posko DLHK Pemecutan', color: '#1F2933' },
        { id: 'm2', lat: -8.6562, lng: 115.2124, label: '2. Br. Pekambingan (I Made Adi)', color: '#00A676' },
        { id: 'm3', lat: -8.6630, lng: 115.2140, label: '3. Dauh Puri Kelod', color: '#00A676' },
        { id: 'm4', lat: -8.6530, lng: 115.2180, label: '4. Pasar Tradisional', color: '#00A676' },
        { id: 'm5', lat: -8.6480, lng: 115.1880, label: '5. TPST Padangsambian (Akhir)', color: '#DC2626' },
      ],
    },
    {
      id: 'future_organik_tilem',
      title: 'Rute Mendatang: Penjemputan Koridor Organik Barat-02',
      date: futureDate1,
      dayLabel: `${formatDayDateId(futureDate1)} (Mendatang)`,
      stream: 'organik',
      streamLabel: 'Sampah Organik (Surge Upakara)',
      armadaName: 'Truk Kompos Barat-02 (Kapasitas 2.000 L)',
      isToday: false,
      loadLiters: 1840,
      maxCapacityLiters: 2000,
      stops: [
        { seq: 1, name: 'TPS3R Pemecutan Kaja', action: 'Mulai Rute', lat: -8.6450, lng: 115.2050, volumeText: '0 L' },
        { seq: 2, name: 'Koridor Pura & Banjar Busungyeh', action: 'Jemput Canang & Upakara', lat: -8.6520, lng: 115.2090, volumeText: '+680 L' },
        { seq: 3, name: 'Banjar Tegal Harum', action: 'Jemput Lungsuran Upacara', lat: -8.6610, lng: 115.2010, volumeText: '+720 L' },
        { seq: 4, name: 'Sentra Kompos Tahura Ngurah Rai', action: 'Bongkar Muatan', lat: -8.7050, lng: 115.2250, volumeText: 'Total 1.840 L' },
      ],
      routes: [
        {
          id: 'r_future_tilem',
          positions: [
            [-8.6450, 115.2050],
            [-8.6520, 115.2090],
            [-8.6610, 115.2010],
            [-8.7050, 115.2250],
          ],
          color: '#60A5FA',
          dashArray: '6, 6',
        },
      ],
      markers: [
        { id: 'ft1', lat: -8.6450, lng: 115.2050, label: '1. TPS3R Pemecutan Kaja', color: '#1F2933' },
        { id: 'ft2', lat: -8.6520, lng: 115.2090, label: '2. Br. Busungyeh', color: '#60A5FA' },
        { id: 'ft3', lat: -8.6610, lng: 115.2010, label: '3. Br. Tegal Harum', color: '#60A5FA' },
        { id: 'ft4', lat: -8.7050, lng: 115.2250, label: '4. Sentra Tahura', color: '#DC2626' },
      ],
    },
    {
      id: 'future_anorganik_bank',
      title: 'Rute Mendatang: Jalur Bank Sampah & Daur Ulang Sanur',
      date: futureDate2,
      dayLabel: `${formatDayDateId(futureDate2)} (Mendatang)`,
      stream: 'anorganik',
      streamLabel: 'Sampah Anorganik Terpilah',
      armadaName: 'Cikar Listrik Daur Ulang Sanur-01 (Kapasitas 1.500 L)',
      isToday: false,
      loadLiters: 1180,
      maxCapacityLiters: 1500,
      stops: [
        { seq: 1, name: 'TPS3R Sanur Kauh', action: 'Mulai', lat: -8.6950, lng: 115.2520, volumeText: '0 L' },
        { seq: 2, name: 'Koridor Danau Tamblingan (Warung Sari Sanur)', action: 'Jemput Botol PET & Kardus', lat: -8.6915, lng: 115.2623, volumeText: '+240 L' },
        { seq: 3, name: 'Kawasan Wisata Sindu Sanur', action: 'Jemput Pilahan Wisatawan', lat: -8.6830, lng: 115.2610, volumeText: '+520 L' },
        { seq: 4, name: 'Bank Sampah Induk Banjar Intaran', action: 'Setor Bahan Daur Ulang', lat: -8.6920, lng: 115.2580, volumeText: 'Total 1.180 L' },
      ],
      routes: [
        {
          id: 'r_future_bank',
          positions: [
            [-8.6950, 115.2520],
            [-8.6915, 115.2623],
            [-8.6830, 115.2610],
            [-8.6920, 115.2580],
          ],
          color: '#F59E0B',
          dashArray: '6, 6',
        },
      ],
      markers: [
        { id: 'fb1', lat: -8.6950, lng: 115.2520, label: '1. TPS3R Sanur Kauh', color: '#1F2933' },
        { id: 'fb2', lat: -8.6915, lng: 115.2623, label: '2. Warung Sari (Ni Luh Putu Sari)', color: '#F59E0B' },
        { id: 'fb3', lat: -8.6830, lng: 115.2610, label: '3. Kawasan Sindu', color: '#F59E0B' },
        { id: 'fb4', lat: -8.6920, lng: 115.2580, label: '4. Bank Sampah Br. Intaran', color: '#DC2626' },
      ],
    },
  ]
}
