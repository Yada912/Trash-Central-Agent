'use client'

import Link from 'next/link'
import { useAccount } from '@/components/account/use-account'
import { ActionBar } from '@/components/report/ActionBar'
import { ClassificationEditor } from '@/components/report/ClassificationEditor'
import { ClassificationStatus } from '@/components/report/ClassificationStatus'
import { ConfidenceAlert } from '@/components/report/ConfidenceAlert'
import { DemoBadge } from '@/components/report/DemoBadge'
import { DescriptionField } from '@/components/report/DescriptionField'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { HazardWarning } from '@/components/report/HazardWarning'
import { LocationPicker } from '@/components/report/LocationPicker'
import { PhotoUploader } from '@/components/report/PhotoUploader'
import { ResidentApproval } from '@/components/report/ResidentApproval'
import {
  classifierHeading,
  demoMockLabel,
  storedRecordLabel,
} from '@/components/report/report-labels'
import { HAZARDOUS_LABEL, isSeparateHazard } from '@/components/report/hazard-policy'
import { useReportFlow } from '@/components/report/use-report-flow'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Select } from '@/components/ui/select'

const STEPS = ['1. Foto, Suara & Kondisi', '2. Takaran & Konfirmasi', '3. Titik Jemput & Kirim'] as const

export function ReportFlow() {
  const flow = useReportFlow()
  const { activeAccount, optimization } = useAccount()

  function applyProfileDefaults() {
    if (!activeAccount) return
    flow.setLat(activeAccount.lat.toFixed(6))
    flow.setLng(activeAccount.lng.toFixed(6))
    flow.setAccountType(activeAccount.accountType)
    if (activeAccount.wasteProfile && !flow.text.trim()) {
      flow.setText(activeAccount.wasteProfile.conditionNote)
    }
  }

  if (flow.success) {
    const hazardous = isSeparateHazard(flow.success.classification)
    return (
      <main id="main" className="grid gap-4">
        <DemoBadge mode={flow.mode} />
        <section
          role="status"
          className="vector-card bg-mint/35 p-6 grid gap-3"
        >
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary flex items-center gap-1.5">
            <MaterialIcon name="check_circle" size="sm" />
            Laporan tersimpan
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Laporan terkirim</h1>
          <p className="font-bold">Laporan {flow.success.id}</p>
          <p data-testid="stored-record" className="text-sm">
            {storedRecordLabel({
              isDemo: flow.success.isDemo,
              source: flow.success.classification.source,
              mode: flow.mode,
            })}
          </p>
          {hazardous ? <p className="font-bold text-alert">{HAZARDOUS_LABEL}</p> : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/dashboard" className="btn-tactile bg-primary text-white">
              Lihat dasbor
            </Link>
            <Link href="/schedule" className="btn-tactile bg-card text-ink">
              Lihat jadwal pengangkutan
            </Link>
            <Button variant="secondary" onClick={flow.reset}>
              Laporkan tumpukan lain
            </Button>
          </div>
        </section>
      </main>
    )
  }

  const stepIndex = !flow.hasDraft ? 0 : flow.locationOk && flow.reviewed ? 2 : 1
  const heading =
    flow.source === 'manual'
      ? 'Pengisian manual'
      : flow.shown
        ? classifierHeading(flow.mode, flow.model)
        : 'Klasifikasi'
  const qualityFlagWithoutPhoto =
    flow.classifierFlags.includes('low_image_quality') && !flow.photo

  return (
    <main id="main" className="grid gap-6">
      <div className="vector-card bg-card p-6 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="vector-pill bg-mint text-ink tilt-left">
              <MaterialIcon name="add_a_photo" size="sm" />
              Laporan warga
            </span>
            <DemoBadge mode={flow.mode} />
          </div>
          {activeAccount ? (
            <Button variant="secondary" className="min-h-9 py-1 text-xs" onClick={applyProfileDefaults}>
              <MaterialIcon name="person_pin_circle" size="sm" />
              Gunakan Alamat & Kondisi Profil ({activeAccount.name})
            </Button>
          ) : null}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">
          Anda yang menentukan apa yang dikirim.
        </h1>

        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={
                index === stepIndex
                  ? 'vector-card bg-primary text-white px-3 py-2 text-sm font-extrabold'
                  : 'vector-card-soft bg-bg px-3 py-2 text-sm font-bold text-ink/75'
              }
            >
              0{index + 1} · {label}
            </li>
          ))}
        </ol>

        {optimization ? (
          <div className="vector-card-soft bg-amber/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <MaterialIcon name="schedule" className="text-primary" />
              <span>
                Profil Mingguan Anda ({activeAccount?.kecamatan}): <strong>{optimization.totalWeeklyLiters} L/minggu</strong> — {optimization.headline}
              </span>
            </div>
            <Link href="/akun" className="font-extrabold text-primary underline">
              Ubah Profil Mingguan & Acara
            </Link>
          </div>
        ) : null}
      </div>

      <ErrorNotice message={flow.error} />

      <section
        className="vector-card p-6 grid gap-5"
        aria-labelledby="describe-heading"
      >
        <h2 id="describe-heading" className="text-xl font-extrabold flex items-center gap-2">
          <MaterialIcon name="camera_enhance" className="text-primary" />
          Foto, Suara, dan Kondisi Sampah Sekarang
        </h2>
        <PhotoUploader
          previewUrl={flow.photo?.previewUrl ?? null}
          error={flow.photoError}
          onFile={flow.onPhoto}
          onClear={flow.clearPhoto}
        />
        <DescriptionField value={flow.text} onChange={flow.setText} />
        <ActionBar
          actions={[
            {
              label:
                flow.busy === 'classify' ? 'Mengklasifikasi…' : 'Klasifikasi',
              onClick: flow.classify,
              disabled: !flow.canClassify,
            },
            {
              label: 'Isi detail secara manual',
              onClick: flow.enterManually,
              disabled: Boolean(flow.busy),
              variant: 'secondary',
            },
            ...(flow.error
              ? [
                  {
                    label: 'Coba lagi',
                    onClick: flow.classify,
                    disabled: !flow.canClassify,
                    variant: 'secondary' as const,
                  },
                ]
              : []),
          ]}
        />
      </section>

      {flow.notTrashReason || flow.insufficient || flow.shown ? (
        <>
          <ClassificationStatus
            busy={flow.busy === 'classify'}
            heading={heading}
            demoLabel={demoMockLabel(flow.mode)}
            notTrashReason={flow.notTrashReason}
            insufficient={flow.insufficient}
            classification={flow.shown}
          />
          <ConfidenceAlert
            needsReview={Boolean(flow.draft?.needsReview)}
            reasons={flow.draft?.reviewReasons ?? []}
            textLength={flow.text.trim().length}
            hasImage={Boolean(flow.photo)}
          />
          {qualityFlagWithoutPhoto ? (
            <p className="text-sm">
              Pengklasifikasi menyetel low_image_quality. Tidak ada foto yang dilampirkan,
              sehingga tanda tersebut tidak dimasukkan ke klasifikasi terkonfirmasi.
            </p>
          ) : null}
        </>
      ) : null}

      {flow.hasDraft ? (
        <>
          {demoMockLabel(flow.mode) ? (
            <p className="text-sm font-semibold">{demoMockLabel(flow.mode)}</p>
          ) : null}
          <ClassificationEditor
            percents={flow.percents}
            liters={flow.liters}
            urgency={flow.urgency}
            onPercent={flow.setPercent}
            onLiters={flow.setLiters}
            onUrgency={flow.setUrgency}
          />
          <HazardWarning
            checked={flow.hazardChecked}
            hazardousPercent={flow.percents.hazardous}
            classifierFlag={flow.classifierFlags.includes('hazardous_present')}
            onChange={flow.setHazardChecked}
          />
          {flow.draft ? (
            <p className="text-sm font-semibold">
              Bendera terkonfirmasi:{' '}
              {flow.draft.flags.length > 0 ? flow.draft.flags.join(', ') : 'none'}
            </p>
          ) : (
            <p className="text-sm font-semibold text-alert">
              Keenam persentase harus berjumlah 100 sebelum flag terkonfirmasi dapat disimpan.
            </p>
          )}
          <div className="vector-card bg-mint/40 p-5 grid gap-2">
            <h2 className="text-xl font-extrabold flex items-center gap-1.5">
              <MaterialIcon name="fact_check" className="text-primary" />
              Konfirmasi Anda
            </h2>
            <p className="text-sm">
              Periksa jenis, volume, urgensi, foto, dan pin lokasi. Mengubah salah satu nilai
              tersebut akan mereset centang konfirmasi ini.
            </p>
            <ResidentApproval
              checked={flow.reviewed}
              onChange={flow.setReviewed}
              disabled={flow.percentTotal !== 100}
            />
          </div>
          <label className="grid gap-2 text-sm font-extrabold">
            Jenis akun
            <Select
              aria-label="Jenis akun"
              value={flow.accountType}
              onChange={(event) =>
                flow.setAccountType(
                  event.target.value === 'company' ? 'company' : 'household',
                )
              }
            >
              <option value="household">Rumah tangga (household)</option>
              <option value="company">Perusahaan / Usaha (company)</option>
            </Select>
          </label>
          <LocationPicker
            lat={flow.lat}
            lng={flow.lng}
            onLat={flow.setLat}
            onLng={flow.setLng}
            onGeolocate={flow.useMyLocation}
            geoMessage={flow.geoMessage}
          />
          {!flow.locationOk && (flow.lat !== '' || flow.lng !== '') ? (
            <p className="text-sm font-semibold text-alert">
              Titik tersebut berada di luar wilayah Denpasar.
            </p>
          ) : null}
          <ActionBar
            actions={[
              {
                label: flow.busy === 'submit' ? 'Mengirim…' : 'Kirim laporan',
                onClick: flow.submit,
                disabled: !flow.canSubmit,
              },
            ]}
          />
        </>
      ) : null}
    </main>
  )
}
