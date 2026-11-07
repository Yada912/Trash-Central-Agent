import { NextResponse } from 'next/server'
import { classifyReport } from '@/lib/ai/classify'
import { classifyModelId, explainModelId, geminiApiKeys, hasGeminiApiKey } from '@/lib/ai/keys'
import { solvePlan } from '@/lib/planner/vrp'
import { buildSolveInput } from '@/lib/plans/build-input'
import { getStore } from '@/lib/store'
import {
  BALINESE_CALENDAR_EVENTS_2026,
  buildMonthCalendarGrid,
} from '@/lib/calendar/balinese-calendar'
import {
  computeResidentOptimization,
  listAccounts,
  listTimetableSlots,
} from '@/lib/accounts/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 25

export type EvalCheckResult = {
  id: string
  category: 'ai_classifier' | 'vrp_solver' | 'hazard_safety' | 'balinese_calendar'
  name: string
  passed: boolean
  expected: string
  actual: string
  latencyMs: number
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const runLiveAi = url.searchParams.get('live') === '1'
  const startedAt = Date.now()
  const checks: EvalCheckResult[] = []

  // 1. VRP Solver & B3 Hazard Isolation Checks on Real Store Data
  const tSolverStart = Date.now()
  const store = getStore()
  const reports = await store.listReports({ status: 'new' })
  const solveInput = await buildSolveInput(store, {
    reportIds: reports.map((r) => r.id),
    trucks: [
      { id: 'truck-eval-1', capacityLiters: 25000 },
      { id: 'truck-eval-2', capacityLiters: 25000 },
    ],
    crews: 2,
    shift: { start: '07:00', end: '15:00' },
  })
  const vrpResult = solvePlan(solveInput)
  const solverLatency = Date.now() - tSolverStart

  const hazardousReports = reports.filter(
    (r) =>
      r.classification.flags.includes('hazardous_present') ||
      r.classification.types.some((t) => t.type === 'hazardous' && t.share > 0),
  )
  const routedStopIds = new Set(vrpResult.routes.flatMap((r) => r.stopIds))
  const leakedHazards = hazardousReports.filter((r) => routedStopIds.has(r.id))

  checks.push({
    id: 'eval_b3_isolation',
    category: 'hazard_safety',
    name: 'Isolasi Ketat Limbah B3 dari Truk Reguler',
    passed: leakedHazards.length === 0,
    expected: '0 laporan B3 masuk ke rute truk kompaktor biasa',
    actual: `${leakedHazards.length} bocor dari ${hazardousReports.length} laporan B3`,
    latencyMs: solverLatency,
  })

  const allRoutesRespectCapacity = vrpResult.routes.every(
    (route) => !route.feasible || route.loadLiters <= route.capacityLiters,
  )
  checks.push({
    id: 'eval_vrp_capacity',
    category: 'vrp_solver',
    name: 'Kepatuhan Batas Kapasitas Armada VRP',
    passed: allRoutesRespectCapacity && vrpResult.routes.length === 2,
    expected: 'Muatan <= Kapasitas pada seluruh rute layak (2 armada)',
    actual: vrpResult.routes
      .map(
        (r) =>
          `${r.truckId}: ${r.loadLiters}/${r.capacityLiters}L (${r.feasible ? 'layak' : 'tidak layak'})`,
      )
      .join(', '),
    latencyMs: solverLatency,
  })

  // 2. Balinese Calendar (Kalender Bali) & Resident Leeway Optimization Checks
  const tCalStart = Date.now()
  const accounts = listAccounts()
  const timetable = listTimetableSlots()
  const sampleWarga = accounts.find((a) => a.role === 'warga') ?? accounts[0]
  const galunganEvent = BALINESE_CALENDAR_EVENTS_2026.find((e) => e.id === 'bali_galungan')
  const grid = buildMonthCalendarGrid({
    year: 2026,
    month: 11,
    todayDate: '2026-11-07',
    kecamatan: sampleWarga.kecamatan,
    timetable,
    weeklyRegularLiters: sampleWarga.wasteProfile?.weeklyRegularLiters ?? 105,
    selectedBalineseEventIds: ['bali_galungan', 'bali_kuningan'],
  })
  const galunganCell = grid.find((c) => c.date === '2026-11-04')
  const opt = computeResidentOptimization(sampleWarga, timetable)
  const calLatency = Date.now() - tCalStart

  checks.push({
    id: 'eval_bali_calendar_surge',
    category: 'balinese_calendar',
    name: 'Prediksi Lonjakan Sampah Hari Raya Galungan & Kuningan',
    passed:
      Boolean(galunganEvent) &&
      Boolean(galunganCell) &&
      (galunganCell?.predictedExtraLiters ?? 0) >= 60 &&
      opt !== null &&
      opt.totalWeeklyLiters > opt.baseWeeklyLiters,
    expected: 'Lonjakan Galungan >= +60L & Total Pekan Hari Raya > Rutin',
    actual: `Galungan +${galunganCell?.predictedExtraLiters ?? 0}L · Total Pekan Hari Raya ${opt?.totalWeeklyLiters ?? 0}L vs Rutin ${opt?.baseWeeklyLiters ?? 0}L`,
    latencyMs: calLatency,
  })

  // 3. Guardrail Input Pendek (Anti-Hallucination Check)
  const tShortStart = Date.now()
  let shortPassed = false
  let shortActual = ''
  try {
    const shortRes = await classifyReport({ text: 'plastik' })
    shortPassed = shortRes.kind === 'insufficient'
    shortActual = `kind="${shortRes.kind}" (${shortRes.kind === 'insufficient' ? shortRes.missing.join(', ') : ''})`
  } catch (err) {
    shortActual = err instanceof Error ? err.message : 'error'
  }
  checks.push({
    id: 'eval_short_note_guardrail',
    category: 'ai_classifier',
    name: 'Guardrail Anti-Halusinasi pada Deskripsi Terlalu Pendek',
    passed: shortPassed,
    expected: 'kind="insufficient" untuk teks < 10 karakter ("plastik")',
    actual: shortActual,
    latencyMs: Date.now() - tShortStart,
  })

  // 4. Optional Live Gemini Classifier Benchmark (when ?live=1 and API key is present)
  if (runLiveAi && hasGeminiApiKey()) {
    const tLiveStart = Date.now()
    try {
      const liveOutcome = await classifyReport({
        text: 'Ada 4 kantong sampah organik sisa daun canang sari, janur penjor, dan sisa sayur dapur sekitar 60 liter di depan rumah seusai Galungan.',
      })
      const liveLatency = Date.now() - tLiveStart
      const isOrganicTrash =
        liveOutcome.kind === 'trash' &&
        liveOutcome.classification.types.some((t) => t.type === 'organic') &&
        liveOutcome.classification.volume.liters > 0

      checks.push({
        id: 'eval_live_gemini_classify',
        category: 'ai_classifier',
        name: `Uji Langsung Gemini API (${classifyModelId()}) — Sampah Upacara & Organik`,
        passed: isOrganicTrash,
        expected: 'kind="trash", terdapat tipe "organic", estimasi liter > 0',
        actual:
          liveOutcome.kind === 'trash'
            ? `kind="trash" · ${liveOutcome.classification.types.map((t) => `${t.type} ${Math.round(t.share * 100)}%`).join(', ')} · ${liveOutcome.classification.volume.liters}L (${liveOutcome.classification.source})`
            : `kind="${liveOutcome.kind}"`,
        latencyMs: liveLatency,
      })
    } catch (error) {
      checks.push({
        id: 'eval_live_gemini_classify',
        category: 'ai_classifier',
        name: `Uji Langsung Gemini API (${classifyModelId()})`,
        passed: false,
        expected: 'Respons klasifikasi valid dari Gemini API',
        actual: error instanceof Error ? error.message : 'Gagal menghubungi Gemini API',
        latencyMs: Date.now() - tLiveStart,
      })
    }
  }

  const passedCount = checks.filter((c) => c.passed).length
  const overallScorePct = Math.round((passedCount / checks.length) * 100)

  return NextResponse.json({
    ok: true,
    data: {
      evaluatedAt: new Date().toISOString(),
      mode: hasGeminiApiKey() ? 'live' : 'demo',
      aiConfig: {
        hasApiKey: hasGeminiApiKey(),
        apiKeyPoolCount: geminiApiKeys().length,
        classifyModel: classifyModelId(),
        explainModel: explainModelId(),
      },
      summary: {
        totalChecks: checks.length,
        passedChecks: passedCount,
        failedChecks: checks.length - passedCount,
        overallScorePct,
        totalLatencyMs: Date.now() - startedAt,
      },
      checks,
    },
  })
}
