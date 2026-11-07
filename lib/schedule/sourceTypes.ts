import type { WasteStream } from '@/lib/schemas'

/** Five source groups in Pergub Bali 47/2019 Pasal 6(2). Guide copy only. */
export const SOURCE_TYPES = ['mudah_terurai', 'guna_ulang', 'daur_ulang', 'b3', 'residu'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const SOURCE_GUIDE_CITATION = 'Pergub Bali 47/2019 Pasal 6(2)' as const

/**
 * Logistics map from the five legal source groups onto the four pickup streams.
 * guna_ulang and daur_ulang share anorganik. Not a legal taxonomy.
 */
export const SOURCE_TO_STREAM: Readonly<Record<SourceType, WasteStream>> = Object.freeze({
  mudah_terurai: 'organik',
  guna_ulang: 'anorganik',
  daur_ulang: 'anorganik',
  b3: 'B3',
  residu: 'residu',
})

export type SourceGuideLabel = {
  readonly id: string
  readonly en: string
  readonly citation: typeof SOURCE_GUIDE_CITATION
}

/** Resident-facing names for the five source groups. Not used by classify or scheduling. */
export const SOURCE_GUIDE_LABELS: Readonly<Record<SourceType, SourceGuideLabel>> = Object.freeze({
  mudah_terurai: Object.freeze({
    id: 'Sampah yang mudah terurai',
    en: 'Readily decomposable waste',
    citation: SOURCE_GUIDE_CITATION,
  }),
  guna_ulang: Object.freeze({
    id: 'Sampah yang dapat diguna ulang',
    en: 'Reusable waste',
    citation: SOURCE_GUIDE_CITATION,
  }),
  daur_ulang: Object.freeze({
    id: 'Sampah yang dapat didaur ulang',
    en: 'Recyclable waste',
    citation: SOURCE_GUIDE_CITATION,
  }),
  b3: Object.freeze({
    id: 'Sampah yang mengandung bahan berbahaya dan beracun',
    en: 'Waste containing hazardous and toxic materials',
    citation: SOURCE_GUIDE_CITATION,
  }),
  residu: Object.freeze({
    id: 'Sampah residu',
    en: 'Residual waste',
    citation: SOURCE_GUIDE_CITATION,
  }),
})
