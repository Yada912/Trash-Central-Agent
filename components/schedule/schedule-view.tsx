'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { Select } from '@/components/ui/select'
import { messageForApiError, requestJson } from '@/lib/client/api'
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
  const [kecamatan, setKecamatan] = useState<Kecamatan | ''>('')
  const [stream, setStream] = useState<WasteStream | ''>('')
  const [accountType, setAccountType] = useState<AccountType>('household')
  const [viewRole, setViewRole] = useState<'resident' | 'officer'>('resident')
  const [checkedAvailability, setCheckedAvailability] = useState(false)
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [mode, setMode] = useState<ApiMode | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        params.set('weekStart', '2026-11-02')
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
  }, [loadSchedule])

  const entries = data?.entries ?? []
  const streamSummary = groupScheduleByStream(entries)
  const sortingGuide = sourceSortingCards()

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Denpasar · Jadwal Pengangkutan Simulasi (R02 &amp; O05)
          </p>
          <h1 className="text-3xl font-bold">Jadwal Pengangkutan Sampah</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={mode} />
          <Button
            variant={viewRole === 'resident' ? 'primary' : 'secondary'}
            onClick={() => setViewRole('resident')}
          >
            Tampilan Warga (R02)
          </Button>
          <Button
            variant={viewRole === 'officer' ? 'primary' : 'secondary'}
            onClick={() => setViewRole('officer')}
          >
            Tabel Area Petugas (O05)
          </Button>
        </div>
      </div>

      <Card className="grid gap-2 border-gold/50 bg-gold/10 text-sm">
        <p className="font-semibold">
          {data?.disclaimer ??
            'Simulated demo schedule derived from reports; not an official DLH Denpasar schedule.'}
        </p>
        <p className="text-ink/80">
          Sumber data: <code>{data?.generatedFrom ?? 'seed+reports'}</code> — Jadwal ini adalah
          simulasi demonstrasi berdasarkan laporan terkonfirmasi, bukan jadwal resmi DLHK Kota
          Denpasar dan bukan jaminan ketersediaan truk.
        </p>
      </Card>

      <Card className="grid gap-4 sm:grid-cols-4">
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
            <span>Simulasikan ketersediaan truk mingguan (solver_checked)</span>
          </label>
          <Button variant="secondary" onClick={() => void loadSchedule()} disabled={busy}>
            {busy ? 'Memuat…' : 'Muat ulang jadwal'}
          </Button>
        </div>
      </Card>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-alert bg-card px-3 py-2 text-sm font-semibold text-alert"
        >
          {error}
        </p>
      ) : null}

      {viewRole === 'resident' ? (
        <section className="grid gap-4" aria-label="Kartu jadwal warga">
          <h2 className="text-xl font-semibold">
            Jadwal Pengangkutan Saya (
            {accountType === 'household' ? 'Rumah Tangga' : 'Perusahaan'})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {streamSummary.map((item) => (
              <Card
                key={item.stream}
                className={
                  item.stream === 'B3'
                    ? 'grid gap-2 border-alert/40 bg-alert/10'
                    : 'grid gap-2'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{item.label}</h3>
                  <Badge
                    className={
                      item.stream === 'B3'
                        ? 'border-alert text-alert'
                        : 'border-primary text-primary'
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
                  <p className="text-sm font-semibold text-primary">
                    Pengangkutan simulasi berikutnya: {item.nextPickup}
                  </p>
                ) : null}
                <p className="text-xs text-ink/80">
                  Basis laporan terkonfirmasi: {item.totalReports} laporan · {item.totalLiters} L
                </p>
                {item.stream === 'B3' ? (
                  <p className="text-xs font-semibold text-alert">
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
          <h2 className="text-xl font-semibold">
            Tabel Jadwal Pengangkutan per Kecamatan (O05)
          </h2>
          <Card className="overflow-x-auto">
            {entries.length === 0 ? (
              <p className="text-sm">Tidak ada entri jadwal untuk filter yang dipilih.</p>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/15">
                    <th className="py-2 pr-4 font-semibold">Kecamatan</th>
                    <th className="py-2 pr-4 font-semibold">Aliran</th>
                    <th className="py-2 pr-4 font-semibold">Akun</th>
                    <th className="py-2 pr-4 font-semibold">Hari</th>
                    <th className="py-2 pr-4 font-semibold">Waktu (WITA)</th>
                    <th className="py-2 pr-4 font-semibold">Volume &amp; Laporan</th>
                    <th className="py-2 font-semibold">Status Kelayakan</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={`${entry.kecamatan}-${entry.stream}-${entry.accountType}`}
                      className="border-b border-ink/10"
                    >
                      <td className="py-2 pr-4 font-medium">{entry.kecamatan}</td>
                      <td className="py-2 pr-4">{formatStreamLabelId(entry.stream)}</td>
                      <td className="py-2 pr-4">{entry.accountType}</td>
                      <td className="py-2 pr-4">{formatScheduleDaysId(entry.days)}</td>
                      <td className="py-2 pr-4">
                        {entry.window ? `${entry.window.start}–${entry.window.end}` : 'On-request'}
                        {entry.nextPickup ? ` (berikutnya: ${entry.nextPickup})` : ''}
                      </td>
                      <td className="py-2 pr-4">
                        {entry.basis.liters} L ({entry.basis.reports} laporan)
                      </td>
                      <td className="py-2">
                        <Badge
                          className={
                            entry.stream === 'B3'
                              ? 'border-alert text-alert'
                              : 'border-ink/30 text-ink'
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

      <section className="grid gap-3" aria-label="Panduan pemilahan sumber">
        <h2 className="text-xl font-semibold">
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
            <Card key={card.sourceType} className="grid gap-2 p-4">
              <Badge
                className={
                  card.stream === 'B3'
                    ? 'border-alert text-alert'
                    : 'border-primary text-primary'
                }
              >
                {card.stream}
              </Badge>
              <h3 className="text-sm font-semibold">{card.titleId}</h3>
              <p className="text-xs text-ink/70">{card.titleEn}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
