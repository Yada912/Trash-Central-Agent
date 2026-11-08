import { stampClassification } from '@/lib/review'
import { volumeLabelFor, type ClassificationFlag, type ClassificationSource, type ClassifyOutcome, type TrashType, type Urgency } from '@/lib/schemas'

const COUNT_WORD: Record<string, number> = {
  se: 1,
  satu: 1,
  sebuah: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  besik: 1,
  dadua: 2,
  telu: 3,
  papat: 4,
  lime: 5,
}

const UNIT_LITERS: Record<string, number> = {
  karung: 50,
  kantong: 15,
  kresek: 15,
  ember: 10,
  tas: 20,
  botol: 1,
  jerigen: 20,
  jeriken: 20,
  keranjang: 25,
  tong: 40,
  bak: 30,
}

const COUNT_PATTERN =
  'sepuluh|sembilan|delapan|tujuh|enam|lima|empat|tiga|dua|satu|sebuah|besik|dadua|telu|papat|lime|se|\\d+'
const UNIT_PATTERN = 'karung|kantong|kresek|ember|tas|botol|jerigen|jeriken|keranjang|tong|bak'
const COUNT_UNIT = new RegExp(`\\b(${COUNT_PATTERN})\\s*(${UNIT_PATTERN})\\b`, 'gi')

const HAZARD_PATTERN =
  /\b(baterai|battery|aki|oli|obat|jarum|suntik|medis|pestisida|pesticide|aerosol|neon|kaleng\s+cat|cat\s+tembok)\b/i
const PILE_PATTERN = /\b(tumpukan|setumpuk|gunungan)\b/i

const MATERIAL_RULES: Array<{ type: TrashType; pattern: RegExp }> = [
  { type: 'hazardous', pattern: HAZARD_PATTERN },
  { type: 'organic', pattern: /\b(organik|organic|canang|janur|daun|sayur|makanan|buah|nasi|upakara|banten)\b/i },
  { type: 'plastic', pattern: /\b(plastik|plastic|botol|kresek|kemasan)\b/i },
  { type: 'paper', pattern: /\b(kertas|paper|kardus|karton|cardboard)\b/i },
  { type: 'metal', pattern: /\b(logam|metal|besi|kaleng)\b/i },
]

export type HouseholdEstimate = {
  liters: number
  types: Array<{ type: TrashType; share: number }>
  confidence: number
  urgency: Urgency
  rationale: string
  flags: Array<'hazardous_present' | 'insufficient_text'>
  /** True when litres come from a counted container, not a pile or a B3 placeholder. */
  counted: boolean
}

export function textMentionsHazard(text: string): boolean {
  return HAZARD_PATTERN.test(text)
}

function countOf(token: string): number | null {
  if (/^\d+$/.test(token)) {
    const value = Number(token)
    if (!Number.isInteger(value) || value < 1 || value > 500) return null
    return value
  }
  return COUNT_WORD[token.toLowerCase()] ?? null
}

function countedVolume(text: string): { liters: number; detail: string } | null {
  const parts: string[] = []
  let total = 0
  for (const match of text.matchAll(COUNT_UNIT)) {
    const count = countOf(match[1] ?? '')
    const unit = (match[2] ?? '').toLowerCase()
    const each = UNIT_LITERS[unit]
    if (!count || !each) continue
    total += count * each
    parts.push(`${count} ${unit} (${each} L)`)
  }
  if (total < 1 || parts.length === 0) return null
  return { liters: Math.round(total), detail: parts.join(', ') }
}

function materialTypes(text: string): TrashType[] {
  const paintCan = /\bkaleng\s+cat\b/i.test(text)
  const found: TrashType[] = []
  for (const rule of MATERIAL_RULES) {
    if (!rule.pattern.test(text)) continue
    if (rule.type === 'metal' && paintCan) {
      const withoutPaint = text.replace(/\bkaleng\s+cat\b/gi, '')
      if (!/\b(logam|metal|besi|kaleng)\b/i.test(withoutPaint)) continue
    }
    found.push(rule.type)
  }
  if (/\bbotol\b/i.test(text) && !/\bkaca\b/i.test(text) && !found.includes('plastic')) found.push('plastic')
  return found
}

function equalShares(types: readonly TrashType[]): Array<{ type: TrashType; share: number }> {
  const unique = [...new Set(types)]
  const count = unique.length
  const base = Math.floor(100 / count)
  let remainder = 100 - base * count
  const shares = unique.map((type) => {
    const extra = remainder > 0 ? 1 : 0
    if (remainder > 0) remainder -= 1
    return { type, share: (base + extra) / 100 }
  })
  shares.sort((left, right) => right.share - left.share || left.type.localeCompare(right.type))
  return shares
}

/**
 * Maps Indonesian and Balinese container counts to litres.
 * A bare pile is a low-confidence estimate. Named hazardous items are flagged
 * even when the resident gave no amount.
 */
export function estimateHouseholdReport(text: string): HouseholdEstimate | null {
  const counted = countedVolume(text)
  const pile = PILE_PATTERN.test(text)
  const hazardous = textMentionsHazard(text)
  const types = materialTypes(text)
  if (types.length === 0) return null
  if (!counted && !pile && !hazardous) return null

  const placeholder = !counted && !pile && hazardous
  const liters = counted?.liters ?? (pile ? 40 : 1)
  const flags: HouseholdEstimate['flags'] = []
  if (hazardous) flags.push('hazardous_present')
  if (placeholder || (!counted && pile)) flags.push('insufficient_text')

  let rationale: string
  if (placeholder) {
    rationale =
      'Bahan berbahaya disebut tanpa jumlah. Angka 1 liter hanya penahan agar peringatan B3 bisa ditinjau, bukan takaran yang terukur.'
  } else if (counted) {
    rationale = `Perkiraan ${liters} liter dari ${counted.detail}. Seseorang perlu mengonfirmasi jenis dan volume.`
  } else {
    rationale = `Perkiraan sementara ${liters} liter dari kata tumpukan. Jenis diambil dari kata bahan dan perlu dikonfirmasi.`
  }

  return {
    liters,
    types: equalShares(types),
    confidence: counted ? 0.64 : pile ? 0.42 : 0.35,
    urgency: hazardous ? 'high' : 'medium',
    rationale: rationale.slice(0, 280),
    flags,
    counted: Boolean(counted),
  }
}

export function outcomeFromHouseholdEstimate(
  text: string,
  estimate: HouseholdEstimate,
  options: { hasImage: boolean; source: ClassificationSource; demoLabel?: boolean },
): ClassifyOutcome {
  const flags: ClassificationFlag[] = [...estimate.flags]
  if (!options.hasImage) flags.push('no_image')
  const prefixed = options.demoLabel ? `Demo output: ${estimate.rationale}` : estimate.rationale
  return {
    kind: 'trash',
    classification: stampClassification(
      {
        types: estimate.types,
        volume: { liters: estimate.liters, label: volumeLabelFor(estimate.liters) },
        urgency: estimate.urgency,
        confidence: estimate.confidence,
        rationale: prefixed.slice(0, 280),
        flags,
      },
      { text, hasImage: options.hasImage, source: options.source },
    ),
  }
}
