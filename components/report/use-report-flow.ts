'use client'

import { useRef, useState } from 'react'
import { compressPhoto } from '@/components/report/compress-photo'
import { ApiError, messageForApiError, requestJson } from '@/lib/client/api'
import { isInsideDenpasar } from '@/lib/geo'
import { stampClassification } from '@/lib/review'
import {
  isHazardousClassification,
  TRASH_TYPES,
  volumeLabelFor,
  type Classification,
  type InsufficientMissing,
  type ClassifyOutcome,
  type Report,
  type TrashType,
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
  const clientRequestId = useRef(crypto.randomUUID())
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<{ base64: string; mimeType: 'image/jpeg'; previewUrl: string } | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [aiClassification, setAiClassification] = useState<Classification | null>(null)
  const [shown, setShown] = useState<Classification | null>(null)
  const [notTrashReason, setNotTrashReason] = useState<string | null>(null)
  const [insufficient, setInsufficient] = useState<{ reason: string; missing: InsufficientMissing[] } | null>(null)
  const [percents, setPercents] = useState(EMPTY_PERCENTS)
  const [liters, setLiters] = useState('50')
  const [urgency, setUrgency] = useState<Urgency>('medium')
  const [reviewed, setReviewed] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [geoMessage, setGeoMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<'classify' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
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
    return stampClassification(
      {
        types,
        volume: { liters: litersNumber, label: volumeLabelFor(litersNumber) },
        urgency,
        confidence: base?.confidence ?? 0,
        rationale: base?.rationale ?? 'Entered manually by the resident.',
        flags: base?.flags ?? (photo ? [] : ['no_image']),
      },
      {
        text,
        hasImage: Boolean(photo),
        source: source === 'manual' ? 'manual' : 'mock',
      },
    )
  }

  const draft = workingClassification()

  function markEdited() {
    setReviewed(false)
  }

  async function onPhoto(file: File) {
    setPhotoError(null)
    try {
      const next = await compressPhoto(file)
      setPhoto((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl)
        return next
      })
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
  }

  function applyAi(classification: Classification) {
    setNotTrashReason(null)
    setInsufficient(null)
    setSource('ai')
    setAiClassification(classification)
    setShown(classification)
    setPercents(sharesToPercents(classification))
    setLiters(String(classification.volume.liters))
    setUrgency(classification.urgency)
    setReviewed(false)
    setNotTrashReason(null)
  }

  function enterManually() {
    setSource('manual')
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
    setLiters('50')
    setUrgency('medium')
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
      if (caught instanceof ApiError) setMode(null)
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
        setLat(position.coords.latitude.toFixed(6))
        setLng(position.coords.longitude.toFixed(6))
        setGeoMessage('Location filled from this device. You can still move the pin.')
      },
      () => {
        setGeoMessage('Location permission was denied. Enter a pin or coordinates instead.')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  }

  async function submit() {
    const classification = workingClassification()
    if (lock.current || !classification || !reviewed || !locationOk) return
    lock.current = true
    setBusy('submit')
    setError(null)
    try {
      const response = await requestJson<Report>('/api/reports', {
        method: 'POST',
        headers: { 'Idempotency-Key': clientRequestId.current },
        body: {
          text: text.trim(),
          lat: latNumber,
          lng: lngNumber,
          clientRequestId: clientRequestId.current,
          ...(photo ? { image: { base64: photo.base64, mimeType: photo.mimeType } } : {}),
          classification,
          ...(source === 'ai' && aiClassification ? { aiClassification } : {}),
        },
      })
      setMode(response.meta.mode)
      setSuccess(response.data)
    } catch (caught) {
      setError(messageForApiError(caught))
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  function reset() {
    clientRequestId.current = crypto.randomUUID()
    clearPhoto()
    setText('')
    setSource(null)
    setAiClassification(null)
    setShown(null)
    setNotTrashReason(null)
    setInsufficient(null)
    setPercents(EMPTY_PERCENTS())
    setLiters('50')
    setUrgency('medium')
    setReviewed(false)
    setLat('')
    setLng('')
    setGeoMessage(null)
    setError(null)
    setSuccess(null)
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
    reviewed,
    setReviewed,
    lat,
    lng,
    setLat,
    setLng,
    geoMessage,
    useMyLocation,
    busy,
    error,
    mode,
    success,
    percentTotal,
    locationOk,
    draft,
    hazardous: draft ? isHazardousClassification(draft) : false,
    confidence: shown?.confidence ?? null,
    canClassify: text.trim().length >= 1 && text.trim().length <= 1000 && !busy,
    canSubmit: Boolean(draft) && reviewed && locationOk && !busy && percentTotal === 100,
    classify,
    enterManually,
    submit,
    reset,
    setPercent: (type: TrashType, value: string) => {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) return
      setPercents((current) => ({ ...current, [type]: parsed }))
      markEdited()
    },
    setLiters: (value: string) => {
      if (value !== '' && !/^\d+$/.test(value)) return
      setLiters(value)
      markEdited()
    },
    setUrgency: (value: Urgency) => {
      setUrgency(value)
      markEdited()
    },
    hasDraft: source !== null,
  }
}
