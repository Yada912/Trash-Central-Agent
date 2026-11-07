import { isHazardousClassification, KECAMATAN, TRASH_TYPES, type Dashboard, type Report, type TrashType } from '@/lib/schemas'

const CELL = 0.02

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function aggregateDashboard(reports: Report[], facilities: Dashboard['facilities']): Dashboard {
  const byType = {
    organic: 0,
    plastic: 0,
    paper: 0,
    metal: 0,
    residual: 0,
    hazardous: 0,
  }
  const byKecamatan = {
    'Denpasar Barat': { reports: 0, liters: 0 },
    'Denpasar Timur': { reports: 0, liters: 0 },
    'Denpasar Selatan': { reports: 0, liters: 0 },
    'Denpasar Utara': { reports: 0, liters: 0 },
  }
  const byUrgency = { low: 0, medium: 0, high: 0 }
  const groups = new Map<string, Report[]>()

  for (const report of reports) {
    byUrgency[report.classification.urgency] += 1
    byKecamatan[report.kecamatan].reports += 1
    byKecamatan[report.kecamatan].liters += report.classification.volume.liters
    for (const entry of report.classification.types) {
      byType[entry.type] += report.classification.volume.liters * entry.share
    }
    if (isHazardousClassification(report.classification)) continue
    const row = Math.floor((report.lat - -8.75) / CELL)
    const column = Math.floor((report.lng - 115.16) / CELL)
    const key = `${row}:${column}`
    const list = groups.get(key) ?? []
    list.push(report)
    groups.set(key, list)
  }

  const zones = [...groups.entries()]
    .map(([key, list]) => {
      const lat = list.reduce((total, report) => total + report.lat, 0) / list.length
      const lng = list.reduce((total, report) => total + report.lng, 0) / list.length
      const liters = list.reduce((total, report) => total + report.classification.volume.liters, 0)
      const typeLiters: Record<TrashType, number> = {
        organic: 0,
        plastic: 0,
        paper: 0,
        metal: 0,
        residual: 0,
        hazardous: 0,
      }
      for (const report of list) {
        for (const entry of report.classification.types) {
          typeLiters[entry.type] += report.classification.volume.liters * entry.share
        }
      }
      const dominantType = TRASH_TYPES.reduce((best, type) => (typeLiters[type] > typeLiters[best] ? type : best))
      return {
        id: `zone-${key}`,
        centroid: [Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6] as [number, number],
        reportIds: list.map((report) => report.id).sort(),
        liters: Math.round(liters),
        dominantType,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))

  for (const name of KECAMATAN) {
    byKecamatan[name].liters = round1(byKecamatan[name].liters)
  }
  for (const type of TRASH_TYPES) byType[type] = round1(byType[type])

  return { totals: { byType, byKecamatan, byUrgency }, zones, facilities }
}
