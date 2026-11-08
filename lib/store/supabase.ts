import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { facilitySchema, planSchema, reportSchema, type Plan, type Report } from '@/lib/schemas'
import { normalizeStoredClassification } from '@/lib/store/normalize-classification'
import type { Store } from '@/lib/store/types'

type ReportRow = {
  id: string
  is_demo: boolean
  created_at: string
  lat: number
  lng: number
  kecamatan: Report['kecamatan']
  desa: string | null
  description: string
  description_en: string | null
  photo_url: string | null
  classification: Report['classification']
  ai_classification: Report['classification'] | null
  edited: boolean
  account_type: Report['accountType'] | null
  status: Report['status']
  provenance: string | null
  estimated_weight_kg: number | null
  account_id?: string | null
  collection_audit?: Report['collectionAudit'] | null
}

function assertServiceRole(key: string): void {
  if (key.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a service_role key, but received a publishable (anon) key.')
  }
  const segment = key.split('.')[1]
  if (!segment) return
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as { role?: string }
    if (payload.role && payload.role !== 'service_role') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a service_role key.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('service_role')) throw error
  }
}

function toReport(row: ReportRow): Report {
  return reportSchema.parse({
    id: row.id,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    lat: row.lat,
    lng: row.lng,
    kecamatan: row.kecamatan,
    ...(row.desa ? { desa: row.desa } : {}),
    description: row.description,
    ...(row.photo_url ? { photoUrl: row.photo_url } : {}),
    classification: normalizeStoredClassification(row.classification),
    ...(row.ai_classification ? { aiClassification: normalizeStoredClassification(row.ai_classification) } : {}),
    edited: row.edited,
    ...(row.account_type ? { accountType: row.account_type } : {}),
    status: row.status,
    ...(row.provenance ? { provenance: row.provenance } : {}),
    ...(row.description_en ? { descriptionEn: row.description_en } : {}),
    ...(row.estimated_weight_kg != null ? { estimatedWeightKg: row.estimated_weight_kg } : {}),
    ...(row.account_id ? { accountId: row.account_id } : {}),
    ...(row.collection_audit && row.collection_audit.length > 0 ? { collectionAudit: row.collection_audit } : {}),
  })
}

function missingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42703' || /column .+ does not exist/i.test(error.message ?? '')
}

function withoutOwnerColumns(row: ReportRow): ReportRow {
  const copy = { ...row }
  delete copy.account_id
  delete copy.collection_audit
  return copy
}

function readReportRow(row: ReportRow): Report | null {
  try {
    return toReport(row)
  } catch (error) {
    console.error(`Skipping unreadable report ${row.id}`, error)
    return null
  }
}

function toReportRow(report: Report): ReportRow {
  return {
    id: report.id,
    is_demo: report.isDemo,
    created_at: report.createdAt,
    lat: report.lat,
    lng: report.lng,
    kecamatan: report.kecamatan,
    desa: report.desa ?? null,
    description: report.description,
    description_en: report.descriptionEn ?? null,
    photo_url: report.photoUrl ?? null,
    classification: report.classification,
    ai_classification: report.aiClassification ?? null,
    edited: report.edited,
    account_type: report.accountType,
    status: report.status,
    provenance: report.provenance ?? null,
    estimated_weight_kg: report.estimatedWeightKg ?? null,
    ...(report.accountId ? { account_id: report.accountId } : {}),
    ...(report.collectionAudit ? { collection_audit: report.collectionAudit } : {}),
  }
}

type PlanRow = {
  id: string
  status: Plan['status']
  version: number
  input: Plan['input']
  result: Plan['result']
  explanation: Plan['explanation']
  decisions: Plan['decisions']
}

function toPlan(row: PlanRow): Plan {
  return planSchema.parse(row)
}

export function createSupabaseStore(url: string, serviceRoleKey: string): Store {
  assertServiceRole(serviceRoleKey)
  const client: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return {
    async listReports(query) {
      let request = client.from('reports').select('*').order('created_at', { ascending: false })
      if (query?.kecamatan) request = request.eq('kecamatan', query.kecamatan)
      if (query?.status) request = request.eq('status', query.status)
      const { data, error } = await request
      if (error) throw new Error(error.message)
      const reports = ((data ?? []) as ReportRow[]).flatMap((row) => {
        const report = readReportRow(row)
        return report ? [report] : []
      })
      if (!query?.since) return reports
      const sinceMs = Date.parse(query.since)
      return reports.filter((report) => Date.parse(report.createdAt) >= sinceMs)
    },
    async getReport(id) {
      const { data, error } = await client.from('reports').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? readReportRow(data as ReportRow) : null
    },
    async createReport(report, idempotency) {
      if (idempotency) {
        const existing = await client
          .from('reports')
          .select('*, idempotency_body_hash')
          .eq('client_request_id', idempotency.key)
          .maybeSingle()
        if (existing.error) throw new Error(existing.error.message)
        if (existing.data) {
          const stored = existing.data as ReportRow & { idempotency_body_hash?: string | null }
          if (stored.idempotency_body_hash && stored.idempotency_body_hash !== idempotency.bodyHash) {
            return { status: 'conflict' }
          }
          return { status: 'replay', report: toReport(stored) }
        }
      }
      const row = {
        ...toReportRow(report),
        ...(idempotency
          ? { client_request_id: idempotency.key, idempotency_body_hash: idempotency.bodyHash }
          : {}),
      }
      let { error } = await client.from('reports').insert(row)
      if (missingColumn(error)) {
        const retry = await client.from('reports').insert(withoutOwnerColumns(row))
        error = retry.error
      }
      if (error && idempotency && error.code === '23505') {
        const again = await client
          .from('reports')
          .select('*, idempotency_body_hash')
          .eq('client_request_id', idempotency.key)
          .maybeSingle()
        if (again.error) throw new Error(again.error.message)
        if (again.data) {
          const stored = again.data as ReportRow & { idempotency_body_hash?: string | null }
          if (stored.idempotency_body_hash && stored.idempotency_body_hash !== idempotency.bodyHash) {
            return { status: 'conflict' }
          }
          return { status: 'replay', report: toReport(stored) }
        }
      }
      if (error) throw new Error(error.message)
      return { status: 'created', report }
    },
    async updateReport(id, patch) {
      const existing = await this.getReport(id)
      if (!existing) return null
      const next = reportSchema.parse({ ...existing, ...patch })
      const row = toReportRow(next)
      let { error } = await client.from('reports').update(row).eq('id', id)
      if (missingColumn(error)) {
        const retry = await client.from('reports').update(withoutOwnerColumns(row)).eq('id', id)
        error = retry.error
      }
      if (error) throw new Error(error.message)
      return next
    },
    async listFacilities() {
      const { data, error } = await client.from('facilities').select('*').order('id')
      if (error) throw new Error(error.message)
      return ((data ?? []) as Array<{
        id: string
        name: string
        kind: string
        lat: number | null
        lng: number | null
        address: string | null
        source_url: string | null
        verified: boolean
      }>).map((row) =>
        facilitySchema.parse({
          id: row.id,
          name: row.name,
          kind: row.kind,
          lat: row.lat,
          lng: row.lng,
          ...(row.address ? { address: row.address } : {}),
          ...(row.source_url ? { sourceUrl: row.source_url } : {}),
          verified: row.verified,
        }),
      )
    },
    async getPlan(id) {
      const { data, error } = await client.from('plans').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toPlan(data as PlanRow) : null
    },
    async savePlan(plan) {
      const row: PlanRow = {
        id: plan.id,
        status: plan.status,
        version: plan.version,
        input: plan.input,
        result: plan.result,
        explanation: plan.explanation,
        decisions: plan.decisions,
      }
      const { error } = await client.from('plans').upsert(row)
      if (error) throw new Error(error.message)
      return plan
    },
  }
}
