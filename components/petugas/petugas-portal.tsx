'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { useDashboard } from '@/components/dashboard/use-dashboard'
import { InteractiveCalendar } from '@/components/calendar/interactive-calendar'
import { ModeBadge } from '@/components/mode-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { KECAMATAN, type Kecamatan } from '@/lib/schemas'
import type { EvalCheckResult } from '@/app/api/eval/route'

type EvalResponseData = {
  evaluatedAt: string
  mode: 'live' | 'demo'
  aiConfig: {
    hasApiKey: boolean
    apiKeyPoolCount: number
    classifyModel: string
    explainModel: string
  }
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    overallScorePct: number
    totalLatencyMs: number
  }
  checks: EvalCheckResult[]
}

export function PetugasPortal() {
  const { activeAccount, accounts, isSignedIn, timetable, updateTimetable, login } = useAccount()
  const { reports, loading: loadingReports, reload } = useDashboard()

  const [selectedKecamatan, setSelectedKecamatan] = useState<Kecamatan>('Denpasar Barat')
  const [evalData, setEvalData] = useState<EvalResponseData | null>(null)
  const [runningEval, setRunningEval] = useState(false)
  const [timetableToast, setTimetableToast] = useState<string | null>(null)

  async function runSystemEval(liveAi: boolean) {
    setRunningEval(true)
    try {
      const res = await fetch(`/api/eval${liveAi ? '?live=1' : ''}`, { cache: 'no-store' })
      const json = (await res.json()) as { ok: boolean; data?: EvalResponseData }
      if (json.ok && json.data) {
        setEvalData(json.data)
      }
    } finally {
      setRunningEval(false)
    }
  }

  useEffect(() => {
    void runSystemEval(false)
  }, [])

  // Strict Role Guard: only accessible when signed in as 'petugas'
  if (!isSignedIn || !activeAccount || activeAccount.role !== 'petugas') {
    return (
      <main id="main" className="grid gap-6 max-w-3xl mx-auto" data-testid="petugas-role-guard">
        <section className="vector-card bg-card p-6 grid gap-4">
          <span className="vector-pill bg-lavender text-ink w-fit">
            <MaterialIcon name="admin_panel_settings" size="sm" />
            Area Khusus Petugas DLHK
          </span>
          <h1 className="text-3xl font-extrabold">
            Halaman Ini Khusus untuk Petugas Armada & Koordinator DLHK
          </h1>
          <p className="text-base font-medium text-ink/85">
            {activeAccount?.role === 'warga'
              ? `Anda sedang masuk sebagai akun Warga (${activeAccount.name}). Demi keamanan operasional, warga tidak dapat mengakses panel kendali armada, pengaturan leeway, atau persetujuan rute VRP.`
              : 'Silakan masuk menggunakan akun Petugas DLHK untuk mengakses pusat kendali operasional, manajemen jadwal, dan evaluasi sistem AI.'}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => void login('surya.wirawan@dlhk.denpasar.id', 'petugas123')}
              data-testid="switch-to-petugas-btn"
            >
              <MaterialIcon name="badge" size="sm" />
              Masuk Cepat sebagai Petugas (I Ketut Surya)
            </Button>
            {activeAccount?.role === 'warga' ? (
              <Link
                href="/warga"
                className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-mint px-4 py-2.5 text-sm font-bold text-ink"
              >
                <MaterialIcon name="home" size="sm" />
                Buka Portal Warga Saya
              </Link>
            ) : null}
            <Link
              href="/masuk"
              className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-card px-4 py-2.5 text-sm font-bold text-ink"
            >
              <MaterialIcon name="login" size="sm" />
              Halaman Masuk / Daftar
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const needsReviewReports = reports.filter((r) => r.classification.needsReview)
  const hazardousReports = reports.filter((r) =>
    r.classification.flags.includes('hazardous_present') ||
    r.classification.types.some((t) => t.type === 'hazardous' && t.share > 0),
  )
  const totalReportedLiters = reports.reduce((acc, r) => acc + r.classification.volume.liters, 0)
  const wargaAccounts = accounts.filter((a) => a.role === 'warga')
  const kecamatanSlots = timetable.filter((s) => s.kecamatan === selectedKecamatan)

  async function handleQuickLeewayUpdate(slotId: string, leewayMinutes: number, surgeTolerancePct: number) {
    await updateTimetable({
      slotId,
      leewayMinutes: Math.max(0, Math.min(180, leewayMinutes)),
      surgeTolerancePct: Math.max(0, Math.min(200, surgeTolerancePct)),
    })
    setTimetableToast(`Parameter leeway & toleransi hari raya untuk ${slotId} berhasil disimpan.`)
  }

  return (
    <main id="main" className="grid gap-6" data-testid="petugas-portal">
      {/* 1. Petugas Command Header with Exclusive ModeBadge & Sub-navigation */}
      <section className="vector-card bg-card p-6 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="vector-pill bg-lavender text-ink tilt-left">
              <MaterialIcon name="badge" size="sm" />
              Pusat Kendali Petugas DLHK
            </span>
            <div className="rounded-md border-2 border-ink bg-amber px-3 py-1">
              <ModeBadge mode={evalData?.mode ?? null} />
            </div>
            {evalData ? (
              <span className="vector-pill bg-mint text-ink text-xs">
                <MaterialIcon name="key" size="sm" />
                {evalData.aiConfig.apiKeyPoolCount} API Key Aktif · {evalData.aiConfig.classifyModel} & {evalData.aiConfig.explainModel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-sky px-3.5 py-1.5 text-xs font-extrabold text-ink"
            >
              <MaterialIcon name="map" size="sm" />
              Peta & Filter Laporan (/dashboard)
            </Link>
            <Link
              href="/planner"
              className="vector-btn inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-primary px-3.5 py-1.5 text-xs font-extrabold text-white"
            >
              <MaterialIcon name="route" size="sm" />
              Perencana Rute VRP (/planner)
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="grid gap-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Selamat Bertugas, {activeAccount.name}
            </h1>
            <p className="text-base font-medium text-ink/85">
              {activeAccount.address} · Wilayah Koordinasi Utama: <strong>{activeAccount.kecamatan}</strong>. Kelola antrean laporan warga, atur toleransi leeway jadwal kecamatan menjelang Hari Raya Bali, dan jalankan optimasi rute armada.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="vector-card-soft bg-mint/45 p-3">
              <span className="text-[11px] font-extrabold uppercase text-primary block">Total Laporan</span>
              <span className="text-2xl font-extrabold">{reports.length}</span>
              <span className="text-[11px] font-bold block">{totalReportedLiters} L</span>
            </div>
            <div className="vector-card-soft bg-amber/45 p-3">
              <span className="text-[11px] font-extrabold uppercase text-ink block">Perlu Tinjauan</span>
              <span className="text-2xl font-extrabold">{needsReviewReports.length}</span>
              <span className="text-[11px] font-bold block">Verifikasi Manual</span>
            </div>
            <div className="vector-card-soft bg-coral/50 p-3">
              <span className="text-[11px] font-extrabold uppercase text-alert block">Unit Khusus B3</span>
              <span className="text-2xl font-extrabold text-alert">{hazardousReports.length}</span>
              <span className="text-[11px] font-bold block">Jemput Terpisah</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Clear Officer Capabilities & SOP Action Matrix */}
      <section aria-labelledby="petugas-capabilities-heading" className="grid gap-4 md:grid-cols-4">
        <div className="vector-card bg-mint/35 p-4 grid content-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="fact_check" size="sm" />
              Tugas 1 · Verifikasi
            </span>
            <h2 id="petugas-capabilities-heading" className="text-base font-extrabold">
              Tinjau Laporan Warga & Isolasi B3
            </h2>
            <p className="text-xs text-ink/80">
              Periksa {needsReviewReports.length} laporan berstatus <em>Perlu Tinjauan</em> dan pastikan {hazardousReports.length} laporan B3 ditangani unit khusus.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="vector-btn inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold text-ink"
          >
            Buka Daftar & Peta Laporan →
          </Link>
        </div>

        <div className="vector-card bg-sky/35 p-4 grid content-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="tune" size="sm" />
              Tugas 2 · Leeway Jadwal
            </span>
            <h3 className="text-base font-extrabold">
              Atur Jadwal & Toleransi Hari Raya
            </h3>
            <p className="text-xs text-ink/80">
              Sesuaikan jeda waktu (leeway menit) dan kuota lonjakan (+%) per kecamatan saat pekan Galungan/Kuningan.
            </p>
          </div>
          <a
            href="#leeway-manager"
            className="vector-btn inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold text-ink"
          >
            Kelola Leeway di Bawah ↓
          </a>
        </div>

        <div className="vector-card bg-lavender/40 p-4 grid content-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="local_shipping" size="sm" />
              Tugas 3 · Optimasi VRP
            </span>
            <h3 className="text-base font-extrabold">
              Susun & Setujui Rute Armada
            </h3>
            <p className="text-xs text-ink/80">
              Jalankan solver deterministik dari TPA Suwung, pindahkan titik henti antar truk, dan catat keputusan di log audit.
            </p>
          </div>
          <Link
            href="/planner"
            className="vector-btn inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-primary px-3 py-1.5 text-xs font-extrabold text-white"
          >
            Buka Perencana Rute →
          </Link>
        </div>

        <div className="vector-card bg-amber/35 p-4 grid content-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-extrabold uppercase text-primary flex items-center gap-1">
              <MaterialIcon name="science" size="sm" />
              Tugas 4 · Audit AI & Sistem
            </span>
            <h3 className="text-base font-extrabold">
              Uji Efektivitas AI & Guardrail
            </h3>
            <p className="text-xs text-ink/80">
              Pantau akurasi klasifikasi AI, isolasi B3 100%, dan kelayakan kapasitas VRP secara langsung.
            </p>
          </div>
          <a
            href="#system-ai-eval"
            className="vector-btn inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold text-ink"
          >
            Lihat Hasil Uji Sistem ↓
          </a>
        </div>
      </section>

      {/* 3. Interactive AI & System Effectiveness Evaluation Suite */}
      <section
        id="system-ai-eval"
        aria-labelledby="eval-heading"
        data-testid="petugas-eval-panel"
        className="vector-card bg-card p-6 grid gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="vector-pill bg-mint text-ink">
              <MaterialIcon name="verified" size="sm" />
              Panel Evaluasi & Pengujian Sistem Terpadu
            </span>
            <h2 id="eval-heading" className="mt-1 text-2xl font-extrabold">
              Uji Efektivitas AI, Keamanan B3, VRP Solver & Prediksi Kalender Bali
            </h2>
            <p className="text-xs text-ink/75">
              Menguji seluruh komponen kritis secara otomatis untuk memastikan AI dan solver bekerja akurat sesuai standar operasional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={runningEval}
              onClick={() => void runSystemEval(false)}
              data-testid="run-deterministic-eval-btn"
            >
              <MaterialIcon name="play_circle" size="sm" />
              {runningEval ? 'Menguji…' : 'Uji Cepat Sistem'}
            </Button>
            <Button
              variant="primary"
              disabled={runningEval}
              onClick={() => void runSystemEval(true)}
              data-testid="run-live-ai-eval-btn"
            >
              <MaterialIcon name="bolt" size="sm" />
              {runningEval ? 'Menghubungi Gemini…' : 'Uji Langsung dengan Gemini API Live'}
            </Button>
          </div>
        </div>

        {evalData ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="vector-card-soft bg-mint/40 p-3.5">
                <span className="text-xs font-extrabold uppercase text-primary">Skor Efektivitas</span>
                <p className="text-3xl font-extrabold" data-testid="eval-score-pct">
                  {evalData.summary.overallScorePct}%
                </p>
                <p className="text-xs font-semibold">
                  {evalData.summary.passedChecks} / {evalData.summary.totalChecks} pengujian lulus
                </p>
              </div>
              <div className="vector-card-soft bg-sky/35 p-3.5">
                <span className="text-xs font-extrabold uppercase text-primary">Model Klasifikasi</span>
                <p className="text-base font-extrabold mt-1">{evalData.aiConfig.classifyModel}</p>
                <p className="text-xs font-semibold">Rotasi {evalData.aiConfig.apiKeyPoolCount} Kunci API</p>
              </div>
              <div className="vector-card-soft bg-lavender/40 p-3.5">
                <span className="text-xs font-extrabold uppercase text-primary">Model Penjelasan Rute</span>
                <p className="text-base font-extrabold mt-1">{evalData.aiConfig.explainModel}</p>
                <p className="text-xs font-semibold">Pemisahan Tugas (Task-Split)</p>
              </div>
              <div className="vector-card-soft bg-amber/35 p-3.5">
                <span className="text-xs font-extrabold uppercase text-primary">Waktu Eksekusi Uji</span>
                <p className="text-2xl font-extrabold">{evalData.summary.totalLatencyMs} ms</p>
                <p className="text-xs font-semibold">Mode: {evalData.mode.toUpperCase()}</p>
              </div>
            </div>

            <div className="grid gap-2.5">
              {evalData.checks.map((check) => (
                <div
                  key={check.id}
                  data-testid={`eval-check-${check.id}`}
                  className={[
                    'vector-card-soft p-3.5 flex flex-wrap items-center justify-between gap-3',
                    check.passed ? 'bg-bg' : 'bg-coral/40',
                  ].join(' ')}
                >
                  <div className="grid gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'inline-flex items-center gap-1 rounded border border-ink px-2 py-0.5 text-xs font-extrabold',
                          check.passed ? 'bg-mint text-ink' : 'bg-coral text-alert',
                        ].join(' ')}
                      >
                        <MaterialIcon
                          name={check.passed ? 'check_circle' : 'error'}
                          size="sm"
                        />
                        {check.passed ? 'LULUS' : 'PERLU PERHATIAN'}
                      </span>
                      <span className="font-extrabold text-sm">{check.name}</span>
                    </div>
                    <p className="text-xs text-ink/75 mt-1">
                      <strong>Target:</strong> {check.expected} · <strong>Hasil Aktual:</strong> {check.actual}
                    </p>
                  </div>
                  <span className="rounded border border-ink/40 bg-card px-2.5 py-1 text-xs font-extrabold">
                    {check.latencyMs} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm font-bold">Menjalankan evaluasi sistem…</p>
        )}
      </section>

      {/* 4. Kecamatan Timetable & Leeway Control + Fleet Calendar */}
      <section
        id="leeway-manager"
        aria-labelledby="leeway-heading"
        className="vector-card bg-card p-6 grid gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="vector-pill bg-sky text-ink">
              <MaterialIcon name="schedule" size="sm" />
              Kendali Jadwal Tetap & Leeway Armada
            </span>
            <h2 id="leeway-heading" className="mt-1 text-2xl font-extrabold">
              Atur Toleransi Leeway & Kuota Hari Raya per Kecamatan
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="petugas-kecamatan-select">Pilih Kecamatan:</Label>
            <Select
              id="petugas-kecamatan-select"
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value as Kecamatan)}
              className="w-52"
            >
              {KECAMATAN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {timetableToast ? (
          <p role="status" className="vector-card-soft bg-mint/50 px-3 py-2 text-xs font-extrabold">
            {timetableToast}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {kecamatanSlots.map((slot) => (
            <div key={slot.id} className="vector-card-soft bg-bg p-4 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="vector-pill bg-mint text-ink uppercase text-xs">
                  {slot.stream}
                </span>
                <span className="text-xs font-extrabold">
                  {slot.windowStart}–{slot.windowEnd} WITA
                </span>
              </div>
              <p className="text-xs font-semibold text-ink/80">{slot.notes}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="grid gap-1">
                  <Label htmlFor={`leeway-${slot.id}`}>Leeway (menit)</Label>
                  <Input
                    id={`leeway-${slot.id}`}
                    type="number"
                    defaultValue={slot.leewayMinutes}
                    onBlur={(e) =>
                      void handleQuickLeewayUpdate(
                        slot.id,
                        Number(e.target.value) || slot.leewayMinutes,
                        slot.surgeTolerancePct,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`surge-${slot.id}`}>Lonjakan Hari Raya (%)</Label>
                  <Input
                    id={`surge-${slot.id}`}
                    type="number"
                    defaultValue={slot.surgeTolerancePct}
                    onBlur={(e) =>
                      void handleQuickLeewayUpdate(
                        slot.id,
                        slot.leewayMinutes,
                        Number(e.target.value) || slot.surgeTolerancePct,
                      )
                    }
                  />
                </div>
              </div>
              <p className="text-[11px] font-bold text-primary">
                Kuota Dasar: {slot.maxLitersPerPickup} L/jemput · Kuota Hari Raya:{' '}
                {Math.round(slot.maxLitersPerPickup * (1 + slot.surgeTolerancePct / 100))} L
              </p>
            </div>
          ))}
        </div>

        {/* Fleet Interactive Calendar for Selected Kecamatan */}
        <InteractiveCalendar
          kecamatan={selectedKecamatan}
          timetable={timetable}
          weeklyRegularLiters={wargaAccounts
            .filter((w) => w.kecamatan === selectedKecamatan)
            .reduce((sum, w) => sum + (w.wasteProfile?.weeklyRegularLiters ?? 80), 80)}
          selectedBalineseEventIds={[
            'bali_penampahan_galungan',
            'bali_galungan',
            'bali_umanis_galungan',
            'bali_penampahan_kuningan',
            'bali_kuningan',
          ]}
        />
      </section>

      {/* 5. Active Priority Queue Preview */}
      <section className="vector-card bg-card p-6 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="assignment_late" className="text-primary" />
            Antrean Laporan Prioritas & Perlu Tinjauan ({needsReviewReports.length})
          </h2>
          <Button variant="secondary" onClick={() => void reload()} disabled={loadingReports}>
            <MaterialIcon name="refresh" size="sm" />
            Muat Ulang
          </Button>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {needsReviewReports.slice(0, 6).map((report) => (
            <div key={report.id} className="vector-card-soft bg-bg p-3.5 grid gap-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">{report.id}</span>
                <span className="rounded border border-ink bg-amber px-2 py-0.5 text-[11px] font-extrabold">
                  {report.classification.volume.liters} L · {report.classification.urgency}
                </span>
              </div>
              <p className="text-xs font-bold">{report.kecamatan} · {report.desa}</p>
              <p className="text-xs text-ink/80 truncate">{report.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
