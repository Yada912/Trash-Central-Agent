import { describe, expect, it } from 'vitest'
import { nextIdempotencyState, reportPayloadFingerprint } from '@/components/report/idempotency-key'

const payload = {
  text: 'A leaking battery is beside the public path.',
  lat: -8.65,
  lng: 115.22,
  imageBase64: null,
  classification: { types: [{ type: 'plastic', share: 1 }], flags: ['no_image'] },
  aiClassification: { types: [{ type: 'hazardous', share: 1 }], flags: ['no_image', 'hazardous_present'] },
}

describe('report idempotency key', () => {
  it('keeps the same key when the payload is retried unchanged', () => {
    const fingerprint = reportPayloadFingerprint(payload)
    const first = nextIdempotencyState(null, fingerprint, 'key-a')
    const retry = nextIdempotencyState(first, fingerprint, 'key-b')
    expect(retry).toEqual({ key: 'key-a', fingerprint })
  })

  it('renews the key when the confirmed classification changes', () => {
    const firstPrint = reportPayloadFingerprint(payload)
    const first = nextIdempotencyState(null, firstPrint, 'key-a')
    const edited = reportPayloadFingerprint({
      ...payload,
      classification: { types: [{ type: 'plastic', share: 1 }], flags: ['no_image'] },
      text: 'A plastic pile is beside the public path.',
    })
    const second = nextIdempotencyState(first, edited, 'key-b')
    expect(second.key).toBe('key-b')
    expect(second.fingerprint).not.toBe(first.fingerprint)
  })

  it('treats the original classifier object as part of the payload', () => {
    const withOriginal = reportPayloadFingerprint(payload)
    const withoutFlag = reportPayloadFingerprint({
      ...payload,
      aiClassification: { types: [{ type: 'hazardous', share: 1 }], flags: ['no_image'] },
    })
    expect(withOriginal).not.toBe(withoutFlag)
  })
})
