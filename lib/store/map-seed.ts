import { stampClassification } from '@/lib/review'
import {
  facilitySchema,
  isHazardousClassification,
  reportSchema,
  trashTypeSchema,
  volumeLabelFor,
  type ClassificationFlag,
  type Facility,
  type Report,
  type TrashType,
} from '@/lib/schemas'

export type SeedReport = {
  id: string
  isDemo: boolean
  provenance?: string
  createdAt: string
  lat: number
  lng: number
  kecamatan: string
  desa?: string
  description: string
  descriptionEn?: string
  types: Array<{ type: string; share: number }>
  volumeLiters: number
  estimatedWeightKg?: number
  urgency: string
  confidence: number
  status: string
}

export type SeedFacility = {
  id: string
  name: string
  kind: string
  lat: number | null
  lng: number | null
  address?: string
  sourceUrl?: string
  verified: boolean
}

function normalizeShares(types: Array<{ type: TrashType; share: number }>): Array<{ type: TrashType; share: number }> {
  const rounded = types.map((entry) => ({
    type: entry.type,
    share: Math.round(entry.share * 100) / 100,
  }))
  const cents = rounded.reduce((total, entry) => total + Math.round(entry.share * 100), 0)
  const delta = 100 - cents
  if (rounded.length > 0 && delta !== 0) {
    let index = 0
    for (let cursor = 1; cursor < rounded.length; cursor += 1) {
      if (rounded[cursor].share > rounded[index].share) index = cursor
    }
    rounded[index] = {
      type: rounded[index].type,
      share: (Math.round(rounded[index].share * 100) + delta) / 100,
    }
  }
  return rounded
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share || a.type.localeCompare(b.type))
}

export function mapSeedReport(raw: SeedReport): Report {
  const types = normalizeShares(
    raw.types.map((entry) => {
      const type = trashTypeSchema.parse(entry.type)
      return { type, share: entry.share }
    }),
  )
  const liters = Math.max(1, Math.round(raw.volumeLiters))
  const flags: ClassificationFlag[] = ['no_image']
  if (isHazardousClassification({ types, flags: [] })) {
    flags.unshift('hazardous_present')
  }
  const report: Report = {
    id: raw.id,
    isDemo: true,
    createdAt: raw.createdAt,
    lat: raw.lat,
    lng: raw.lng,
    kecamatan: raw.kecamatan as Report['kecamatan'],
    ...(raw.desa ? { desa: raw.desa } : {}),
    description: raw.description,
    classification: stampClassification(
      {
        types,
        volume: { liters, label: volumeLabelFor(liters) },
        urgency: raw.urgency as Report['classification']['urgency'],
        confidence: raw.confidence,
        rationale: 'Synthetic demo fixture. Not a model classification.',
        flags,
      },
      { text: raw.description, hasImage: false, source: 'mock' },
    ),
    edited: false,
    status: raw.status as Report['status'],
    ...(raw.provenance ? { provenance: raw.provenance } : {}),
    ...(raw.descriptionEn ? { descriptionEn: raw.descriptionEn } : {}),
    ...(raw.estimatedWeightKg !== undefined ? { estimatedWeightKg: raw.estimatedWeightKg } : {}),
  }
  return reportSchema.parse(report)
}

export function mapSeedFacility(raw: SeedFacility): Facility {
  return facilitySchema.parse(raw)
}
