'use client'

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
import { classifierHeading, demoMockLabel, storedRecordLabel } from '@/components/report/report-labels'
import { HAZARDOUS_LABEL, isSeparateHazard } from '@/components/report/hazard-policy'
import { useReportFlow } from '@/components/report/use-report-flow'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import Link from 'next/link'

const STEPS = ['Describe', 'Review', 'Location and submit'] as const

export function ReportFlow() {
  const flow = useReportFlow()
  if (flow.success) {
    const hazardous = isSeparateHazard(flow.success.classification)
    return (
      <main id="main" className="grid gap-4">
        <DemoBadge mode={flow.mode} />
        <section role="status" className="grid gap-3 rounded-lg border border-ink/10 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Report saved</p>
          <h1 className="text-3xl font-semibold tracking-tight">Report submitted</h1>
          <p>Report {flow.success.id}</p>
          <p data-testid="stored-record">{storedRecordLabel({ isDemo: flow.success.isDemo, source: flow.success.classification.source, mode: flow.mode })}</p>
          {hazardous ? <p>{HAZARDOUS_LABEL}</p> : null}
          <Link href="/dashboard" className="font-semibold text-primary">
            View the dashboard
          </Link>
          <Button variant="secondary" onClick={flow.reset}>
            Report another pile
          </Button>
        </section>
      </main>
    )
  }

  const stepIndex = !flow.hasDraft ? 0 : flow.locationOk && flow.reviewed ? 2 : 1
  const heading =
    flow.source === 'manual' ? 'Manual entry' : flow.shown ? classifierHeading(flow.mode, flow.model) : 'Classification'
  const qualityFlagWithoutPhoto = flow.classifierFlags.includes('low_image_quality') && !flow.photo

  return (
    <main id="main" className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Resident report</p>
          <DemoBadge mode={flow.mode} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">You decide what gets sent.</h1>
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={
                index === stepIndex
                  ? 'rounded-md border border-primary/30 bg-card px-3 py-2 text-sm font-semibold text-primary'
                  : 'rounded-md border border-ink/10 bg-card px-3 py-2 text-sm'
              }
            >
              0{index + 1} · {label}
            </li>
          ))}
        </ol>
        <p className="text-sm">A photo and location are only used to plan pickups, and this is a demo.</p>
      </div>
      <ErrorNotice message={flow.error} />
      <section className="grid gap-4 rounded-lg border border-ink/10 bg-card p-4" aria-labelledby="describe-heading">
        <h2 id="describe-heading" className="text-xl font-semibold">
          Photo and description
        </h2>
        <PhotoUploader previewUrl={flow.photo?.previewUrl ?? null} error={flow.photoError} onFile={flow.onPhoto} onClear={flow.clearPhoto} />
        <DescriptionField value={flow.text} onChange={flow.setText} />
        <ActionBar
          actions={[
            { label: flow.busy === 'classify' ? 'Classifying…' : 'Classify', onClick: flow.classify, disabled: !flow.canClassify },
            { label: 'Enter details manually', onClick: flow.enterManually, disabled: Boolean(flow.busy), variant: 'secondary' },
            ...(flow.error ? [{ label: 'Retry', onClick: flow.classify, disabled: !flow.canClassify, variant: 'secondary' as const }] : []),
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
              The classifier set low_image_quality. No photo is attached, so that flag is left out of the confirmed classification.
            </p>
          ) : null}
        </>
      ) : null}
      {flow.hasDraft ? (
        <>
          {demoMockLabel(flow.mode) ? <p className="text-sm font-semibold">{demoMockLabel(flow.mode)}</p> : null}
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
            <p className="text-sm">Confirmed flags: {flow.draft.flags.length > 0 ? flow.draft.flags.join(', ') : 'none'}</p>
          ) : (
            <p className="text-sm font-semibold text-alert">The six percentages must sum to 100 before the confirmed flags can be saved.</p>
          )}
          <div className="grid gap-2 rounded-lg border border-primary/20 bg-primary/10 p-4">
            <h2 className="text-xl font-semibold">Your confirmation</h2>
            <p className="text-sm">Check the type, volume, urgency, photo, and pin. Editing any of them clears this confirmation.</p>
            <ResidentApproval checked={flow.reviewed} onChange={flow.setReviewed} disabled={flow.percentTotal !== 100} />
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Account type
            <Select
              aria-label="Account type"
              value={flow.accountType}
              onChange={(event) => flow.setAccountType(event.target.value === 'company' ? 'company' : 'household')}
            >
              <option value="household">Household</option>
              <option value="company">Company</option>
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
            <p className="text-sm font-semibold text-alert">That point is outside Denpasar.</p>
          ) : null}
          <ActionBar
            actions={[
              {
                label: flow.busy === 'submit' ? 'Submitting…' : 'Submit report',
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
