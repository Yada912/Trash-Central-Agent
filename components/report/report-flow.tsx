'use client'

import { ActionBar } from '@/components/report/ActionBar'
import { ClassificationEditor } from '@/components/report/ClassificationEditor'
import { ClassificationStatus } from '@/components/report/ClassificationStatus'
import { ConfidenceAlert } from '@/components/report/ConfidenceAlert'
import { DemoBadge } from '@/components/report/DemoBadge'
import { DescriptionField } from '@/components/report/DescriptionField'
import { ErrorNotice } from '@/components/report/ErrorNotice'
import { LocationPicker } from '@/components/report/LocationPicker'
import { PhotoUploader } from '@/components/report/PhotoUploader'
import { ResidentApproval } from '@/components/report/ResidentApproval'
import { useReportFlow } from '@/components/report/use-report-flow'
import { Button } from '@/components/ui/button'
import { HAZARDOUS_DEMO_TEXT, HAZARDOUS_HANDLING_TEXT } from '@/lib/copy'
import { isHazardousClassification } from '@/lib/schemas'
import Link from 'next/link'

export function ReportFlow() {
  const flow = useReportFlow()
  if (flow.success) {
    const hazardous = isHazardousClassification(flow.success.classification)
    return (
      <main id="main" className="grid gap-4">
        <DemoBadge mode={flow.mode} />
        <section role="status" className="grid gap-3 rounded-lg border border-ink/10 bg-card p-4">
          <h1 className="text-2xl font-semibold">Report submitted</h1>
          <p>Report {flow.success.id}</p>
          <p>{flow.mode === 'demo' || flow.success.isDemo ? 'Demo data' : 'Not demo data'}</p>
          {hazardous ? (
            <p>
              {HAZARDOUS_HANDLING_TEXT} <span className="font-semibold">{HAZARDOUS_DEMO_TEXT}</span>
            </p>
          ) : null}
          <Link href="/dashboard">View the dashboard</Link>
          <Button variant="secondary" onClick={flow.reset}>
            Report another pile
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main id="main" className="grid gap-6">
      <div className="grid gap-2">
        <DemoBadge mode={flow.mode} />
        <h1 className="text-2xl font-semibold">Report a pile</h1>
        <ol className="list-decimal pl-5 text-sm">
          <li>Photo and description</li>
          <li>Classification</li>
          <li>Location</li>
          <li>Submit</li>
        </ol>
      </div>
      <p className="text-sm">A photo and location are only used to plan pickups, and this is a demo.</p>
      <ErrorNotice message={flow.error} />
      <PhotoUploader previewUrl={flow.photo?.previewUrl ?? null} error={flow.photoError} onFile={flow.onPhoto} onClear={flow.clearPhoto} />
      <DescriptionField value={flow.text} onChange={flow.setText} />
      <ActionBar
        actions={[
          { label: flow.busy === 'classify' ? 'Classifying…' : 'Classify', onClick: flow.classify, disabled: !flow.canClassify },
          { label: 'Enter details manually', onClick: flow.enterManually, disabled: Boolean(flow.busy), variant: 'secondary' },
          ...(flow.error ? [{ label: 'Retry', onClick: flow.classify, disabled: !flow.canClassify, variant: 'secondary' as const }] : []),
        ]}
      />
      {flow.notTrashReason || flow.insufficient || flow.shown ? (
        <>
          <ClassificationStatus
            busy={flow.busy === 'classify'}
            notTrashReason={flow.notTrashReason}
            insufficient={flow.insufficient}
            classification={flow.shown}
          />
          <ConfidenceAlert needsReview={Boolean(flow.draft?.needsReview)} reasons={flow.draft?.reviewReasons ?? []} />
        </>
      ) : null}
      {flow.hasDraft ? (
        <>
          <ClassificationEditor
            percents={flow.percents}
            liters={flow.liters}
            urgency={flow.urgency}
            onPercent={flow.setPercent}
            onLiters={flow.setLiters}
            onUrgency={flow.setUrgency}
          />
          <ResidentApproval checked={flow.reviewed} onChange={flow.setReviewed} disabled={flow.percentTotal !== 100} />
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
