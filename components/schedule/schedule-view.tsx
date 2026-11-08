'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAccount } from '@/components/account/use-account'
import { ModeBadge } from '@/components/mode-badge'
import {
  formatScheduleDaysId,
  formatStreamLabelId,
  groupScheduleByStream,
  sourceSortingCards,
} from '@/components/schedule/schedule-helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'
import { formatSlotDaysId } from '@/lib/accounts/store'
import { messageForApiError, requestJson } from '@/lib/client/api'
import { currentWitaMonday } from '@/lib/time'
import {
  ACCOUNT_TYPES,
  KECAMATAN,
  WASTE_STREAMS,
  type AccountType,
  type ApiMode,
  type Kecamatan,
  type ScheduleResponse,
  type WasteStream,
} from '@/lib/schemas'

export function ScheduleView() {
  const { activeAccount, timetable, optimization } = useAccount()
  const [kecamatan, setKecamatan] = useState<Kecamatan | ''>('')
  const [stream, setStream] = useState<WasteStream | ''>('')
  const [accountType, setAccountType] = useState<AccountType>('household')
  const [checkedAvailability, setCheckedAvailability] = useState(false)
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [mode, setMode] = useState<ApiMode | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isPetugas = activeAccount?.role === 'petugas'
  const viewRole: 'resident' | 'officer' = isPetugas ? 'officer' : 'resident'

  const loadSchedule = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (kecamatan) params.set('kecamatan', kecamatan)
      if (viewRole === 'officer' && stream) params.set('stream', stream)
      if (accountType) params.set('accountType', accountType)
      if (checkedAvailability) {
        params.set('availability', 'checked')
        params.set('weekStart', currentWitaMonday())
      }
      const query = params.toString()
      const response = await requestJson<ScheduleResponse>(
        `/api/schedule${query ? `?${query}` : ''}`,
      )
      setData(response.data)
      setMode(response.meta.mode)
    } catch (caught) {
      setError(messageForApiError(caught))
    } finally {
      setBusy(false)
    }
  }, [kecamatan, stream, accountType, viewRole, checkedAvailability])

  useEffect(() => {
    void loadSchedule()
    const refresh = () => {
      void loadSchedule()
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('cta-data-changed', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('cta-data-changed', refresh)
    }
  }, [loadSchedule])

  const entries = data?.entries ?? []
  const streamSummary = groupScheduleByStream(entries)
  const sortingGuide = sourceSortingCards()
  const filteredTimetable = kecamatan
    ? timetable.filter((slot) => slot.kecamatan === kecamatan)
    : timetable.filter((slot) => slot.kecamatan === (activeAccount?.kecamatan ?? 'Denpasar Barat'))

  return (
    <div className="grid gap-6">
      <div className="vector-card bg-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-1">
          <span className="vector-pill bg-amber text-ink w-fit tilt-left">
            <MaterialIcon name="calendar_month" size="sm" />
            Denpasar · Jadwal Pengangkutan &amp; Leeway Armada
          </span>
          <h1 className="text-3xl font-extrabold mt-1">Jadwal Pengangkutan Sampah</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={mode} />
          <span
            className={`vector-pill text-xs font-black flex items-center gap-1.5 ${
              isPetugas ? 'bg-lavender text-ink' : 'bg-mint text-ink'
            }`}
          >
            <MaterialIcon name={isPetugas ? 'badge' : 'person'} size="sm" />
            <span>{isPetugas ? 'Mode Petugas Operasional' : 'Mode Warga Denpasar'}</span>
          </span>
        </div>
      </div>

      {/* Personalized Warga Optimization & Petugas Leeway Integration */}
      {optimization && activeAccount ? (
        <section className="vector-card bg-mint/35 p-5 grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <span className="vector-pill bg-card text-ink w-fit">
                <MaterialIcon name="verified" size="sm" className="text-primary" />
                Optimasi Profil Warga: {activeAccount.name} ({activeAccount.kecamatan})
              </span>
              <h2 className="text-xl font-extrabold">{optimization.headline}</h2>
            </div>
            <Button asChild variant="gold">
              <Link href="/akun">
                <MaterialIcon name="tune" size="sm" />
                Sesuaikan Takaran Mingguan &amp; Acara
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {optimization.streams.map((st) => (
              <div key={st.stream} className="vector-card-soft bg-card p-3.5 grid gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase">{st.stream}</span>
                  <span className="rounded border border-ink bg-amber/50 px-1.5 py-0.5 text-[11px] font-bold">
                    {st.weeklyLiters} L/mgg
                  </span>
                </div>
                <p className="text-xs font-bold text-primary">{st.windowLabel}</p>
                <p className="text-[11px] font-bold text-ink">{st.leewayLabel}</p>
                <p className="mt-1 text-xs font-medium">{st.recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Card className="vector-card-soft grid gap-2 bg-amber/25 p-4 text-sm">
        <p className="font-bold flex items-center gap-1.5">
          <MaterialIcon name="info" size="sm" className="text-primary" />
          {data?.disclaimer ??
            'Jadwal operasional pengangkutan sampah terpadu Kota Denpasar berbasis desentralisasi TPS3R dan DLHK.'}
        </p>
        <p className="text-ink/80 text-xs">
          Sumber data: <code>{data?.generatedFrom ?? 'seed+reports'}</code> — Dikombinasikan dengan pengaturan jadwal tetap &amp; toleransi leeway petugas kecamatan.
        </p>
      </Card>

      <Card className="vector-card p-5 grid gap-4 sm:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="schedule-kecamatan">Kecamatan</Label>
          <Select
            id="schedule-kecamatan"
            value={kecamatan}
            onChange={(event) => setKecamatan(event.target.value as Kecamatan | '')}
          >
            <option value="">Semua kecamatan</option>
            {KECAMATAN.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="schedule-account">Jenis Akun</Label>
          <Select
            id="schedule-account"
            value={accountType}
            onChange={(event) => setAccountType(event.target.value as AccountType)}
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'household'
                  ? 'Rumah tangga (household)'
                  : 'Perusahaan / Usaha (company)'}
              </option>
            ))}
          </Select>
        </div>

        {viewRole === 'officer' ? (
          <div className="grid gap-2">
            <Label htmlFor="schedule-stream">Aliran Sampah (Stream)</Label>
            <Select
              id="schedule-stream"
              value={stream}
              onChange={(event) => setStream(event.target.value as WasteStream | '')}
            >
              <option value="">Semua aliran</option>
              {WASTE_STREAMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="grid items-end gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={checkedAvailability}
              onChange={(event) => setCheckedAvailability(event.target.checked)}
            />
            <span>Validasi ketersediaan armada mingguan (solver_checked)</span>
          </label>
          <Button variant="secondary" onClick={() => void loadSchedule()} disabled={busy}>
            <MaterialIcon name="refresh" size="sm" />
            {busy ? 'Memuat…' : 'Muat ulang jadwal'}
          </Button>
        </div>
      </Card>

      {error ? (
        <p
          role="alert"
          className="vector-card bg-coral px-4 py-3 text-sm font-bold text-alert"
        >
          {error}
        </p>
      ) : null}

      {viewRole === 'resident' ? (
        <section className="grid gap-4" aria-label="Kartu jadwal warga">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <MaterialIcon name="local_shipping" className="text-primary" />
            Jadwal Pengangkutan Saya (
            {accountType === 'household' ? 'Rumah Tangga' : 'Perusahaan'})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {streamSummary.map((item) => (
              <Card
                key={item.stream}
                className={
                  item.stream === 'B3'
                    ? 'vector-card grid gap-2 bg-coral/40 p-5'
                    : 'vector-card grid gap-2 bg-card p-5'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold">{item.label}</h3>
                  <Badge
                    className={
                      item.stream === 'B3'
                        ? 'vector-pill bg-alert text-white'
                        : 'vector-pill bg-mint text-ink'
                    }
                  >
                    {item.mode === 'on_request' ? 'Khusus / On-request' : 'Rutin'}
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>Hari pengangkutan:</strong> {item.daysText}
                </p>
                <p className="text-sm">
                  <strong>Jendela waktu:</strong> {item.windowText}
                </p>
                {item.nextPickup ? (
                  <p className="text-sm font-bold text-primary">
                    Pengangkutan terjadwal berikutnya: {item.nextPickup}
                  </p>
                ) : null}
                <p className="text-xs text-ink/80 font-medium">
                  Basis laporan terkonfirmasi: {item.totalReports} laporan · {item.totalLiters} L
                </p>
                {item.stream === 'B3' ? (
                  <p className="text-xs font-bold text-alert">
                    Sampah B3 tidak pernah digabung ke truk pengangkut biasa. Hubungi DLH untuk
                    penanganan terpisah.
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid gap-4" aria-label="Tabel jadwal area petugas">
          <h2 className="text-xl font-extrabold">
            Tabel Jadwal Pengangkutan per Kecamatan
          </h2>
          <Card className="vector-card overflow-x-auto p-4">
            {entries.length === 0 ? (
              <p className="text-sm">Tidak ada entri jadwal untuk filter yang dipilih.</p>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-ink">
                    <th className="py-2 pr-4 font-extrabold">Kecamatan</th>
                    <th className="py-2 pr-4 font-extrabold">Aliran</th>
                    <th className="py-2 pr-4 font-extrabold">Akun</th>
                    <th className="py-2 pr-4 font-extrabold">Hari</th>
                    <th className="py-2 pr-4 font-extrabold">Waktu (WITA)</th>
                    <th className="py-2 pr-4 font-extrabold">Volume &amp; Laporan</th>
                    <th className="py-2 font-extrabold">Status Kelayakan</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={`${entry.kecamatan}-${entry.stream}-${entry.accountType}`}
                      className="border-b border-ink/15"
                    >
                      <td className="py-2.5 pr-4 font-bold">{entry.kecamatan}</td>
                      <td className="py-2.5 pr-4">{formatStreamLabelId(entry.stream)}</td>
                      <td className="py-2.5 pr-4">{entry.accountType}</td>
                      <td className="py-2.5 pr-4">{formatScheduleDaysId(entry.days)}</td>
                      <td className="py-2.5 pr-4">
                        {entry.window ? `${entry.window.start}–${entry.window.end}` : 'On-request'}
                        {entry.nextPickup ? ` (berikutnya: ${entry.nextPickup})` : ''}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold">
                        {entry.basis.liters} L ({entry.basis.reports} laporan)
                      </td>
                      <td className="py-2.5">
                        <Badge
                          className={
                            entry.stream === 'B3'
                              ? 'vector-pill bg-coral text-alert'
                              : 'vector-pill bg-sky text-ink'
                          }
                        >
                          {entry.feasibility}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>
      )}

      {/* Petugas Timetable Leeway Window Cards */}
      <section className="vector-card p-5 grid gap-4" aria-label="Toleransi leeway jadwal petugas">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-1.5">
              <MaterialIcon name="schedule" className="text-primary" />
              Kelonggaran (Leeway) Armada Petugas ({kecamatan || activeAccount?.kecamatan || 'Denpasar Barat'})
            </h2>
            <p className="text-xs font-bold text-ink">
              Batas muatan per penjemputan dan cadangan kapasitas saat terjadi lonjakan hari raya/upacara.
            </p>
          </div>
          {isPetugas ? (
            <Button asChild variant="secondary">
              <Link href="/petugas#leeway-manager">
                <MaterialIcon name="edit_calendar" size="sm" />
                Ubah Leeway di Portal Petugas
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {filteredTimetable.map((slot) => (
            <div key={slot.id} className="vector-card-soft bg-bg p-3.5 grid gap-1 text-xs">
              <div className="flex items-center justify-between font-extrabold text-sm">
                <span className="uppercase">{slot.stream}</span>
                <span>{formatSlotDaysId(slot.days)}</span>
              </div>
              <p className="font-bold text-primary">
                Jam: {slot.windowStart}–{slot.windowEnd} WITA (±{slot.leewayMinutes} mnt leeway)
              </p>
              <p className="font-semibold">
                Muatan normal: {slot.maxLitersPerPickup} L · Toleransi lonjakan: +{slot.surgeTolerancePct}%
              </p>
              <p className="text-ink font-semibold">{slot.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="vector-card p-5 grid gap-3" aria-label="Panduan pemilahan sumber">
        <h2 className="text-xl font-extrabold">
          Panduan Pemilahan 5 Jenis Sumber ke 4 Aliran Pengangkutan (
          {sortingGuide[0]?.citation})
        </h2>
        <p className="text-sm text-ink/80">
          Pengelompokan 5 jenis sampah dari sumber menjadi 4 aliran pengangkutan merupakan
          pemetaan logistik aplikasi (bukan taksonomi hukum baru). Sampah yang dapat diguna
          ulang dan didaur ulang digabung ke aliran <strong>anorganik</strong>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sortingGuide.map((card) => (
            <Card key={card.sourceType} className="vector-card-soft bg-bg grid gap-2 p-4">
              <Badge
                className={
                  card.stream === 'B3'
                    ? 'vector-pill bg-coral text-alert w-fit'
                    : 'vector-pill bg-mint text-ink w-fit'
                }
              >
                {card.stream}
              </Badge>
              <h3 className="text-sm font-extrabold">{card.titleId}</h3>
              <p className="text-xs font-bold text-ink">{card.titleEn}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
