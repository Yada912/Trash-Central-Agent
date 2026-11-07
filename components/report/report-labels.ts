export function storedRecordLabel(input: {
  isDemo: boolean
  source: string
  mode?: 'live' | 'demo' | null
}): string {
  const source = `classification source ${input.source}`
  if (input.isDemo || input.mode === 'demo') {
    const mode = input.mode ? ` · response mode ${input.mode}` : ''
    return `Demo data · ${source}${mode}`
  }
  if (input.mode === 'live') return `Stored resident report · ${source} · response mode live`
  return `Stored resident report · ${source}`
}

export const DEMO_MOCK_LABEL = 'Demo mock: keyword rules, not AI'

/** Shown beside a classification when the response mode is demo. Null in live mode. */
export function demoMockLabel(mode: 'live' | 'demo' | null): string | null {
  return mode === 'demo' ? DEMO_MOCK_LABEL : null
}

export function classifierHeading(mode: 'live' | 'demo' | null, model: string | null): string {
  if (model === 'demo-mock') return `Demo template result · model ${model}`
  if (mode === 'demo' && model) return `Demo result · model ${model}`
  if (mode === 'demo') return 'Demo result · model not included'
  if (mode === 'live' && model) return `AI classification · model ${model}`
  if (mode === 'live') return 'Classification · mode live · model not included'
  if (model) return `Classification · model ${model}`
  return 'Classification'
}

export function reasonSentence(reason: string, context: { textLength: number; hasImage: boolean }): string {
  if (reason === 'hazard_cleared_by_resident') return 'Hazard cleared by resident, needs check'
  if (reason === 'low_confidence') return 'confidence is under 0.5'
  if (reason === 'hazardous') return 'hazardous material is indicated'
  if (reason === 'contradictory') return 'the description and photo disagree'
  if (reason === 'low_image_quality') {
    return context.hasImage ? 'the photo is hard to read' : 'a low image-quality flag is set and no photo is attached'
  }
  if (reason === 'insufficient_text') {
    if (context.textLength < 10 && !context.hasImage) return 'the description is very short and there is no photo'
    if (context.textLength < 10) return 'the description is very short'
    return 'the classifier flagged the description'
  }
  return reason
}
