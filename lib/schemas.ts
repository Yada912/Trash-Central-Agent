import { z } from 'zod'

export const TRASH_TYPES = ['organic', 'plastic', 'paper', 'metal', 'residual', 'hazardous'] as const
export const trashTypeSchema = z.enum(TRASH_TYPES)
export type TrashType = z.infer<typeof trashTypeSchema>

export const URGENCIES = ['low', 'medium', 'high'] as const
export const urgencySchema = z.enum(URGENCIES)
export type Urgency = z.infer<typeof urgencySchema>

export const VOLUME_LABELS = ['small', 'medium', 'large'] as const
export const volumeLabelSchema = z.enum(VOLUME_LABELS)
export type VolumeLabel = z.infer<typeof volumeLabelSchema>

export const REPORT_STATUSES = ['new', 'planned', 'collected'] as const
export const reportStatusSchema = z.enum(REPORT_STATUSES)
export type ReportStatus = z.infer<typeof reportStatusSchema>

export const PLAN_STATUSES = ['proposed', 'edited_pending', 'approved', 'rejected'] as const
export const planStatusSchema = z.enum(PLAN_STATUSES)
export type PlanStatus = z.infer<typeof planStatusSchema>

export const KECAMATAN = ['Denpasar Barat', 'Denpasar Timur', 'Denpasar Selatan', 'Denpasar Utara'] as const
export const kecamatanSchema = z.enum(KECAMATAN)
export type Kecamatan = z.infer<typeof kecamatanSchema>

export const CLASSIFICATION_FLAGS = [
  'hazardous_present',
  'low_image_quality',
  'no_image',
  'insufficient_text',
  'contradictory',
] as const
export const classificationFlagSchema = z.enum(CLASSIFICATION_FLAGS)
export type ClassificationFlag = z.infer<typeof classificationFlagSchema>

export const REVIEW_REASONS = [
  'low_confidence',
  'hazardous',
  'insufficient_text',
  'contradictory',
  'low_image_quality',
] as const
export const reviewReasonSchema = z.enum(REVIEW_REASONS)
export type ReviewReason = z.infer<typeof reviewReasonSchema>

export const CLASSIFICATION_SOURCES = ['gemini', 'mock', 'manual'] as const
export const classificationSourceSchema = z.enum(CLASSIFICATION_SOURCES)
export type ClassificationSource = z.infer<typeof classificationSourceSchema>

export const REVIEW_CONFIDENCE_THRESHOLD = 0.5

export const ERROR_CODES = [
  'VALIDATION',
  'TIMEOUT',
  'UPSTREAM',
  'RATE_LIMIT',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL',
] as const
export const errorCodeSchema = z.enum(ERROR_CODES)
export type ErrorCode = z.infer<typeof errorCodeSchema>

export const API_MODES = ['live', 'demo'] as const
export const apiModeSchema = z.enum(API_MODES)
export type ApiMode = z.infer<typeof apiModeSchema>

const DENPASAR_LAT_MIN = -8.75
const DENPASAR_LAT_MAX = -8.57
const DENPASAR_LNG_MIN = 115.16
const DENPASAR_LNG_MAX = 115.28

function isTwoDecimalPlaces(value: number): boolean {
  if (!Number.isFinite(value)) return false
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-4
}

export function volumeLabelFor(liters: number): VolumeLabel {
  if (liters < 50) return 'small'
  if (liters <= 300) return 'medium'
  return 'large'
}

const shareSchema = z.object({
  type: trashTypeSchema,
  share: z.number().min(0).max(1),
})

export const classificationSchema = z
  .object({
    types: z.array(shareSchema).min(1).max(6),
    volume: z.object({
      liters: z.number().int().min(1),
      label: volumeLabelSchema,
    }),
    urgency: urgencySchema,
    confidence: z.number().min(0).max(1),
    rationale: z.string().max(280),
    flags: z.array(classificationFlagSchema),
    needsReview: z.boolean(),
    reviewReasons: z.array(reviewReasonSchema),
    source: classificationSourceSchema,
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>()
    for (const entry of value.types) {
      if (seen.has(entry.type)) {
        ctx.addIssue({ code: 'custom', path: ['types'], message: 'Trash types must be unique.' })
      }
      seen.add(entry.type)
      if (!isTwoDecimalPlaces(entry.share)) {
        ctx.addIssue({
          code: 'custom',
          path: ['types'],
          message: 'Each share must be a number with at most 2 decimal places.',
        })
      }
    }
    for (let index = 1; index < value.types.length; index += 1) {
      if (value.types[index].share > value.types[index - 1].share + 1e-9) {
        ctx.addIssue({
          code: 'custom',
          path: ['types'],
          message: 'Types must be sorted by share, descending.',
        })
        break
      }
    }
    const sum = value.types.reduce((total, entry) => total + entry.share, 0)
    if (Math.abs(sum - 1) > 0.01 + 1e-9) {
      ctx.addIssue({
        code: 'custom',
        path: ['types'],
        message: 'Shares must sum to 1 within 0.01.',
      })
    }
    if (value.volume.label !== volumeLabelFor(value.volume.liters)) {
      ctx.addIssue({
        code: 'custom',
        path: ['volume', 'label'],
        message: 'Volume label does not match the litre count.',
      })
    }
    if (new Set(value.flags).size !== value.flags.length) {
      ctx.addIssue({ code: 'custom', path: ['flags'], message: 'Flags must be unique.' })
    }
    if (new Set(value.reviewReasons).size !== value.reviewReasons.length) {
      ctx.addIssue({ code: 'custom', path: ['reviewReasons'], message: 'Review reasons must be unique.' })
    }
  })
export type Classification = z.infer<typeof classificationSchema>

/**
 * Ordinary-route exclusion. True when any hazardous share is above 0, or when
 * `hazardous_present` was set explicitly. There is no 0.2 cutoff.
 */
export function isHazardousClassification(classification: {
  types: ReadonlyArray<{ type: string; share: number }>
  flags: readonly string[]
}): boolean {
  if (classification.flags.includes('hazardous_present')) return true
  const hazardous = classification.types.find((entry) => entry.type === 'hazardous')
  return (hazardous?.share ?? 0) > 0
}

export const INSUFFICIENT_MISSING = ['type', 'volume', 'location_context'] as const
export const insufficientMissingSchema = z.enum(INSUFFICIENT_MISSING)
export type InsufficientMissing = z.infer<typeof insufficientMissingSchema>

export const classifyOutcomeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('trash'),
    classification: classificationSchema,
  }),
  z.object({
    kind: z.literal('not_trash'),
    reason: z.string().min(1).max(280),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal('insufficient'),
    reason: z.string().min(1).max(280),
    missing: z.array(insufficientMissingSchema).min(1),
  }),
])
export type ClassifyOutcome = z.infer<typeof classifyOutcomeSchema>

export const imageSchema = z
  .object({
    base64: z.string().min(1),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  })
  .strict()

export const classifyRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(1000),
    image: imageSchema.optional(),
  })
  .strict()
export type ClassifyRequest = z.infer<typeof classifyRequestSchema>

/**
 * POST /api/reports idempotency: send header `Idempotency-Key` and/or `clientRequestId`.
 * The header wins when both are present. An identical repeat returns the original report id.
 * The same key with a different canonical body is 409 CONFLICT. Omitting both creates a new report every time.
 */
export const createReportSchema = z
  .object({
    text: z.string().trim().min(1).max(1000),
    lat: z.number().gte(DENPASAR_LAT_MIN).lte(DENPASAR_LAT_MAX),
    lng: z.number().gte(DENPASAR_LNG_MIN).lte(DENPASAR_LNG_MAX),
    image: imageSchema.optional(),
    classification: classificationSchema,
    aiClassification: classificationSchema.optional(),
    clientRequestId: z.string().trim().min(8).max(200).optional(),
  })
  .strict()
export type CreateReportInput = z.infer<typeof createReportSchema>

export const reportSchema = z.object({
  id: z.string().min(1),
  isDemo: z.boolean(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/),
  lat: z.number(),
  lng: z.number(),
  kecamatan: kecamatanSchema,
  desa: z.string().min(1).optional(),
  description: z.string().min(1),
  photoUrl: z.string().min(1).optional(),
  classification: classificationSchema,
  /** Original model classification, kept when the resident corrects it. */
  aiClassification: classificationSchema.optional(),
  edited: z.boolean(),
  status: reportStatusSchema,
  provenance: z.string().min(1).optional(),
  descriptionEn: z.string().min(1).optional(),
  estimatedWeightKg: z.number().positive().optional(),
})
export type Report = z.infer<typeof reportSchema>

export const facilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  address: z.string().optional(),
  sourceUrl: z.string().optional(),
  verified: z.boolean(),
})
export type Facility = z.infer<typeof facilitySchema>

export const zoneSchema = z.object({
  id: z.string().min(1),
  centroid: z.tuple([z.number(), z.number()]),
  reportIds: z.array(z.string()),
  liters: z.number(),
  dominantType: trashTypeSchema,
})
export type Zone = z.infer<typeof zoneSchema>

export const dashboardSchema = z.object({
  totals: z.object({
    byType: z.object({
      organic: z.number(),
      plastic: z.number(),
      paper: z.number(),
      metal: z.number(),
      residual: z.number(),
      hazardous: z.number(),
    }),
    byKecamatan: z.object({
      'Denpasar Barat': z.object({ reports: z.number(), liters: z.number() }),
      'Denpasar Timur': z.object({ reports: z.number(), liters: z.number() }),
      'Denpasar Selatan': z.object({ reports: z.number(), liters: z.number() }),
      'Denpasar Utara': z.object({ reports: z.number(), liters: z.number() }),
    }),
    byUrgency: z.object({
      low: z.number(),
      medium: z.number(),
      high: z.number(),
    }),
  }),
  zones: z.array(zoneSchema),
  facilities: z.array(facilitySchema),
})
export type Dashboard = z.infer<typeof dashboardSchema>

const clockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const planRequestSchema = z
  .object({
    trucks: z
      .array(
        z
          .object({
            id: z.string().trim().min(1),
            capacityLiters: z.number().positive(),
          })
          .strict(),
      )
      .min(1),
    crews: z.number().int().min(1),
    shift: z
      .object({
        start: clockSchema,
        end: clockSchema,
      })
      .strict(),
    reportIds: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = value.trucks.map((truck) => truck.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['trucks'], message: 'Truck IDs must be unique.' })
    }
    if (value.shift.end <= value.shift.start) {
      ctx.addIssue({ code: 'custom', path: ['shift'], message: 'Shift end must be after shift start.' })
    }
    if (value.reportIds && new Set(value.reportIds).size !== value.reportIds.length) {
      ctx.addIssue({ code: 'custom', path: ['reportIds'], message: 'Report IDs must be unique.' })
    }
  })
export type PlanRequest = z.infer<typeof planRequestSchema>

export const routeResultSchema = z.object({
  truckId: z.string(),
  stopIds: z.array(z.string()),
  loadLiters: z.number(),
  capacityLiters: z.number(),
  distanceKm: z.number(),
  durationMin: z.number(),
  feasible: z.boolean(),
  violations: z.array(z.string()),
  polyline: z.array(z.tuple([z.number(), z.number()])),
})
export type RouteResult = z.infer<typeof routeResultSchema>

export const planResultSchema = z.object({
  routes: z.array(routeResultSchema),
  unassigned: z.array(z.object({ id: z.string(), reason: z.string() }).strict()),
  totals: z
    .object({
      distanceKm: z.number(),
      liters: z.number(),
      stops: z.number(),
    })
    .strict(),
})
export type PlanResult = z.infer<typeof planResultSchema>

export const explanationProvenanceSchema = z.object({
  source: z.enum(['gemini', 'template']),
  model: z.string().min(1),
})
export type ExplanationProvenance = z.infer<typeof explanationProvenanceSchema>

export const explanationSchema = z.object({
  summary: z.string(),
  perRoute: z.array(z.string()),
  risks: z.array(z.string()),
  stale: z.boolean(),
  provenance: explanationProvenanceSchema,
})
export type Explanation = z.infer<typeof explanationSchema>

/**
 * Decision requests must send `expectedVersion` equal to the plan version the officer is looking at.
 * A mismatch is 409 CONFLICT. `actor` defaults to demo-officer when omitted.
 * Stored entries record actor, from/to status, from/to version, and, for edits, assignment summaries.
 */
export const decisionEntrySchema = z.object({
  action: z.enum(['approve', 'reject', 'edit']),
  note: z.string().optional(),
  at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/),
  version: z.number().int().positive(),
  actor: z.string().min(1),
  fromStatus: planStatusSchema,
  toStatus: planStatusSchema,
  fromVersion: z.number().int().positive(),
  toVersion: z.number().int().positive(),
  beforeAssignments: z.string().optional(),
  afterAssignments: z.string().optional(),
})
export type DecisionEntry = z.infer<typeof decisionEntrySchema>

export const planSchema = z.object({
  id: z.string().min(1),
  status: planStatusSchema,
  version: z.number().int().positive(),
  input: planRequestSchema,
  result: planResultSchema,
  explanation: explanationSchema,
  decisions: z.array(decisionEntrySchema),
})
export type Plan = z.infer<typeof planSchema>

const decisionActor = z.string().trim().min(1).max(120).optional()
const decisionExpectedVersion = z.number().int().positive()

export const decisionRequestSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('approve'),
      note: z.string().trim().min(1).optional(),
      actor: decisionActor,
      expectedVersion: decisionExpectedVersion,
    })
    .strict(),
  z
    .object({
      action: z.literal('reject'),
      note: z.string().trim().min(1),
      actor: decisionActor,
      expectedVersion: decisionExpectedVersion,
    })
    .strict(),
  z
    .object({
      action: z.literal('edit'),
      note: z.string().trim().min(1).optional(),
      actor: decisionActor,
      expectedVersion: decisionExpectedVersion,
      edits: z
        .object({
          moveStop: z
            .object({
              stopId: z.string().min(1),
              toTruckId: z.string().min(1),
            })
            .strict(),
        })
        .strict(),
    })
    .strict(),
])
export type DecisionRequest = z.infer<typeof decisionRequestSchema>

export const explainRequestSchema = z.object({}).strict()

export const solveStopSchema = z.object({
  id: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  liters: z.number().nonnegative(),
  urgency: urgencySchema,
  hazardous: z.boolean(),
})
export type SolveStop = z.infer<typeof solveStopSchema>

export const solvePlanInputSchema = z.object({
  depot: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().min(1),
    label: z.string().min(1),
  }),
  trucks: z.array(
    z.object({
      id: z.string().min(1),
      capacityLiters: z.number().positive(),
    }),
  ),
  crews: z.number().int().min(0),
  shift: z.object({
    start: z.string(),
    end: z.string(),
  }),
  stops: z.array(solveStopSchema),
})
export type SolvePlanInput = z.infer<typeof solvePlanInputSchema>

export const successMetaSchema = z.object({
  mode: apiModeSchema,
  requestId: z.string().min(1),
  model: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
})

export const errorBodySchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.record(z.array(z.string())).optional(),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
})

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'body'
    const list = fields[key] ?? []
    list.push(issue.message)
    fields[key] = list
  }
  return fields
}
