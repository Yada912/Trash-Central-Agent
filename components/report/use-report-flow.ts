'use client'

import { useRef, useState } from 'react'
import { compressPhoto } from '@/components/report/compress-photo'
import { flagsForConfirmation } from '@/components/report/confirmed-flags'
import { isSeparateHazard } from '@/components/report/hazard-policy'
import { initialHazardWarning, nextHazardWarning, type HazardWarningState } from '@/components/report/hazard-warning-state'
import { nextIdempotencyState, reportPayloadFingerprint, type IdempotencyState } from '@/components/report/idempotency-key'
import { ApiError, messageForApiError, requestJson } from '@/lib/client/api'
import { isInsideDenpasar } from '@/lib/geo'
import { stampClassification } from '@/lib/review'
import {
  TRASH_TYPES,
  volumeLabelFor,
  type Classification,
  type ClassificationFlag,
  type InsufficientMissing,
  type ClassifyOutcome,
  type Report,
  type TrashType,
  type AccountType,
  type Urgency,
} from '@/lib/schemas'

type Mode = 'live' | 'demo'
type Source = 'ai' | 'manual'

const EMPTY_PERCENTS = (): Record<TrashType, number> => ({
  organic: 0,
  plastic: 0,
  paper: 0,
  metal: 0,
  residual: 0,
  hazardous: 0,
})

function sharesToPercents(classification: Classification): Record<TrashType, number> {
  const percents = EMPTY_PERCENTS()
  for (const entry of classification.types) percents[entry.type] = Math.round(entry.share * 100)
  let total = TRASH_TYPES.reduce((sum, type) => sum + percents[type], 0)
  if (total === 0) percents.residual = 100
  total = TRASH_TYPES.reduce((sum, type) => sum + percents[type], 0)
  if (total !== 100) {
    const largest = TRASH_TYPES.reduce((best, type) => (percents[type] > percents[best] ? type : best))
    percents[largest] += 100 - total
  }
  return percents
}

export function useReportFlow() {
  const lock = useRef(false)
  const submitted = useRef(false)
  const idempotency = useRef<IdempotencyState | null>(null)
  const [text, setTextState] = useState('')
  const [photo, setPhoto] = useState<{ base64: string; mimeType: 'image/jpeg'; previewUrl: string } | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [aiClassification, setAiClassification] = useState<Classification | null>(null)
  const [shown, setShown] = useState<Classification | null>(null)
  const [notTrashReason, setNotTrashReason] = useState<string | null>(null)
  const [insufficient, setInsufficient] = useState<{ reason: string; missing: InsufficientMissing[] } | null>(null)
  const [percents, setPercents] = useState(EMPTY_PERCENTS)
  const [liters, setLitersState] = useState('50')
  const [urgency, setUrgencyState] = useState<Urgency>('medium')
  const [hazard, setHazard] = useState<HazardWarningState>({ checked: false, explicit: false })
  const [reviewed, setReviewed] = useState(false)
  const [accountType, setAccountTypeState] = useState<AccountType>('household')
  const [lat, setLatState] = useState('')
  const [lng, setLngState] = useState('')
  const [geoMessage, setGeoMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<'classify' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [success, setSuccess] = useState<Report | null>(null)

  const percentTotal = TRASH_TYPES.reduce((sum, type) => sum + percents[type], 0)
  const litersNumber = Number(liters)
  const latNumber = Number(lat)
  const lngNumber = Number(lng)
  const locationOk = lat !== '' && lng !== '' && Number.isFinite(latNumber) && Number.isFinite(lngNumber) && isInsideDenpasar(latNumber, lngNumber)

  function workingClassification(): Classification | null {
    if (!source || percentTotal !== 100 || !Number.isInteger(litersNumber) || litersNumber < 1) return null
    const types = TRASH_TYPES.map((type) => ({ type, share: percents[type] / 100 }))
      .filter((entry) => entry.share > 0)
      .sort((a, b) => b.share - a.share || a.type.localeCompare(b.type))
    const base = source === 'ai' ? aiClassification : null
    const baseFlags: readonly ClassificationFlag[] = base?.flags ?? []
    return stampClassification(
      {
        types,
        volume: { liters: litersNumber, label: volumeLabelFor(litersNumber) },
        urgency,
        confidence: base?.confidence ?? 0,
        rationale: base?.rationale ?? 'Entered manually by the resident.',
        flags: flagsForConfirmation({
          baseFlags,
          hasImage: Boolean(photo),
          includeHazardousPresent: hazard.checked,
          hazardousShare: percents.hazardous / 100,
        }),
      },
      {
        text,
        hasImage: Boolean(photo),
        source: source === 'manual' ? 'manual' : 'mock',
        ...(source === 'ai' && aiClassification ? { aiClassification } : {}),
      },
    )
  }

  const draft = workingClassification()

  function markEdited() {
    setReviewed(false)
  }

  function setText(value: string) {
    setTextState(value)
    markEdited()
  }

  async function onPhoto(file: File) {
    setPhotoError(null)
    try {
      const next = await compressPhoto(file)
      setPhoto((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl)
        return next
      })
      markEdited()
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : ''
      setPhotoError(
        reason === 'size'
          ? 'That photo is still over 3 MB after compression. Choose a smaller one.'
          : 'Use a JPEG, PNG, or WebP photo.',
      )
    }
  }

  function clearPhoto() {
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl)
      return null
    })
    setPhotoError(null)
    markEdited()
  }

  function applyAi(classification: Classification) {
    const nextPercents = sharesToPercents(classification)
    setNotTrashReason(null)
    setInsufficient(null)
    setSource('ai')
    setAiClassification(classification)
    setShown(classification)
    setPercents(nextPercents)
    setLitersState(String(classification.volume.liters))
    setUrgencyState(classification.urgency)
    setHazard(initialHazardWarning(classification.flags, nextPercents.hazardous))
    setReviewed(false)
  }

  function enterManually() {
    setSource('manual')
    setAiClassification(null)
    setShown(
      stampClassification(
        {
          types: [{ type: 'residual', share: 1 }],
          volume: { liters: 50, label: 'medium' },
          urgency: 'medium',
          confidence: 0,
          rationale: 'Entered manually by the resident.',
          flags: photo ? [] : ['no_image'],
        },
        { text, hasImage: Boolean(photo), source: 'manual' },
      ),
    )
    setPercents({ ...EMPTY_PERCENTS(), residual: 100 })
    setLitersState('50')
    setUrgencyState('medium')
    setHazard({ checked: false, explicit: false })
    setReviewed(false)
    setError(null)
  }

  async function classify() {
    if (lock.current || text.trim().length < 1 || text.trim().length > 1000) return
    lock.current = true
    setBusy('classify')
    setError(null)
    try {
      const response = await requestJson<ClassifyOutcome>('/api/reports/classify', {
        method: 'POST',
        body: {
          text: text.trim(),
          ...(photo ? { image: { base64: photo.base64, mimeType: photo.mimeType } } : {}),
        },
      })
      setMode(response.meta.mode)
      setModel(response.meta.model ?? null)
      if (response.data.kind === 'not_trash') {
        setNotTrashReason(response.data.reason)
        setInsufficient(null)
        setSource(null)
        setShown(null)
        return
      }
      if (response.data.kind === 'insufficient') {
        setInsufficient({ reason: response.data.reason, missing: response.data.missing })
        setNotTrashReason(null)
        setSource(null)
        setShown(null)
        return
      }
      applyAi(response.data.classification)
    } catch (caught) {
      setError(messageForApiError(caught))
      if (caught instanceof ApiError && !source) {
        setMode(null)
        setModel(null)
      }
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoMessage('Location services are not available in this browser. Enter a pin or coordinates instead.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatState(position.coords.latitude.toFixed(6))
        setLngState(position.coords.longitude.toFixed(6))
        setGeoMessage('Location filled from this device. You can still move the pin.')
        markEdited()
      },
      () => {
        setGeoMessage('Location permission was denied. Enter a pin or coordinates instead.')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  }

  async function submit() {
    const classification = workingClassification()
    if (lock.current || submitted.current || !classification || !reviewed || !locationOk) return
    const fingerprint = reportPayloadFingerprint({
      text: text.trim(),
      lat: latNumber,
      lng: lngNumber,
      imageBase64: photo?.base64 ?? null,
      classification,
      aiClassification: source === 'ai' ? aiClassification : null,
      accountType,
    })
    const issued = nextIdempotencyState(idempotency.current, fingerprint, crypto.randomUUID())
    idempotency.current = issued
    lock.current = true
    setBusy('submit')
    setError(null)
    try {
      const response = await requestJson<Report>('/api/reports', {
        method: 'POST',
        headers: { 'Idempotency-Key': issued.key },
        body: {
          text: text.trim(),
          lat: latNumber,
          lng: lngNumber,
          clientRequestId: issued.key,
          ...(photo ? { image: { base64: photo.base64, mimeType: photo.mimeType } } : {}),
          classification,
          accountType,
          ...(source === 'ai' && aiClassification ? { aiClassification } : {}),
        },
      })
      setMode(response.meta.mode)
      setSuccess(response.data)
      submitted.current = true
    } catch (caught) {
      setError(messageForApiError(caught))
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  function reset() {
    submitted.current = false
    idempotency.current = null
    clearPhoto()
    setMode(null)
    setTextState('')
    setSource(null)
    setAiClassification(null)
    setShown(null)
    setNotTrashReason(null)
    setInsufficient(null)
    setPercents(EMPTY_PERCENTS())
    setLitersState('50')
    setUrgencyState('medium')
    setHazard({ checked: false, explicit: false })
    setReviewed(false)
    setAccountTypeState('household')
    setLatState('')
    setLngState('')
    setGeoMessage(null)
    setError(null)
    setSuccess(null)
    setModel(null)
  }

  return {
    text,
    setText,
    photo,
    photoError,
    onPhoto,
    clearPhoto,
    shown,
    notTrashReason,
    insufficient,
    percents,
    liters,
    urgency,
    hazardChecked: hazard.checked,
    setHazardChecked: (checked: boolean) => {
      setHazard({ checked, explicit: true })
      markEdited()
    },
    classifierFlags: source === 'ai' ? (aiClassification?.flags ?? []) : [],
    reviewed,
    setReviewed,
    accountType,
    setAccountType: (value: AccountType) => {
      setAccountTypeState(value)
      markEdited()
    },
    lat,
    lng,
    setLat: (value: string) => {
      setLatState(value)
      markEdited()
    },
    setLng: (value: string) => {
      setLngState(value)
      markEdited()
    },
    geoMessage,
    useMyLocation,
    busy,
    error,
    mode,
    model,
    success,
    percentTotal,
    locationOk,
    draft,
    hazardous: draft ? isSeparateHazard(draft) : percents.hazardous > 0,
    confidence: shown?.confidence ?? null,
    canClassify: text.trim().length >= 1 && text.trim().length <= 1000 && !busy,
    canSubmit: Boolean(draft) && reviewed && locationOk && !busy && percentTotal === 100,
    classify,
    enterManually,
    submit,
    reset,
    source,
    setPercent: (type: TrashType, value: string) => {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) return
      setPercents((current) => ({ ...current, [type]: parsed }))
      if (type === 'hazardous') setHazard((current) => nextHazardWarning(current, parsed))
      markEdited()
    },
    setLiters: (value: string) => {
      if (value !== '' && !/^\d+$/.test(value)) return
      setLitersState(value)
      markEdited()
    },
    setUrgency: (value: Urgency) => {
      setUrgencyState(value)
      markEdited()
    },
    hasDraft: source !== null,
  }
}
