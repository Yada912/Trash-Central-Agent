export type ExplanationMeta = {
  mode: 'live' | 'demo' | null
  model?: string
  modelFieldPresent: boolean
}

/**
 * Label only fields that were actually returned.
 * Persisted explanation.provenance.source wins over response meta.
 * The summary string is not used as proof of a live or template source.
 * The heading never uses the words "AI-generated".
 */
export function readStoredExplanation(explanation: object | null | undefined): {
  source: 'gemini' | 'template' | null
  model: string | null
  persisted: boolean
} {
  if (!explanation || typeof explanation !== 'object') return { source: null, model: null, persisted: false }
  const record = explanation as Record<string, unknown>
  const provenance = record.provenance
  if (provenance && typeof provenance === 'object') {
    const nested = provenance as Record<string, unknown>
    const source = nested.source === 'gemini' || nested.source === 'template' ? nested.source : null
    const model = typeof nested.model === 'string' && nested.model.length > 0 ? nested.model : null
    if (source || model) return { source, model, persisted: true }
  }
  const source = record.source === 'gemini' || record.source === 'template' ? record.source : null
  const model = typeof record.model === 'string' && record.model.length > 0 ? record.model : null
  return { source, model, persisted: false }
}

/** Extra label when the stored explanation source is template. Does not change the heading. */
export function templateTextLabel(explanation?: object | null): string | null {
  return readStoredExplanation(explanation).source === 'template' ? 'Template text' : null
}

export function explanationHeading(meta: ExplanationMeta | null, explanation?: object | null): string {
  const stored = readStoredExplanation(explanation)
  if (stored.source === 'template') {
    return stored.model ? `Template explanation · source template · model ${stored.model}` : 'Template explanation · source template'
  }
  if (stored.source === 'gemini') {
    return stored.model ? `AI explanation · source gemini · model ${stored.model}` : 'AI explanation · source gemini'
  }
  if (!meta) return 'Explanation'
  if (!meta.modelFieldPresent) {
    const mode = meta.mode ?? 'unknown'
    return `Saved explanation · mode ${mode} · model not included`
  }
  const model = meta.model && meta.model.length > 0 ? meta.model : 'unknown'
  if (model === 'demo-mock' || meta.mode === 'demo') return `Demo template explanation · model ${model}`
  if (meta.mode === 'live') return `AI explanation · model ${model}`
  return `Explanation · model ${model}`
}

export function explanationMetaFrom(meta: { mode: 'live' | 'demo'; model?: string }): ExplanationMeta {
  return {
    mode: meta.mode,
    model: meta.model,
    modelFieldPresent: typeof meta.model === 'string' && meta.model.length > 0,
  }
}

export function explanationFieldLine(meta: ExplanationMeta | null, explanation?: object | null): string {
  const stored = readStoredExplanation(explanation)
  const source = stored.source
    ? stored.persisted
      ? `explanation.provenance.source ${stored.source}`
      : `explanation.source ${stored.source}`
    : 'explanation.provenance.source not included'
  if (!meta) return `Response fields: no explanation response yet. ${source}.`
  if (!meta.modelFieldPresent) return `Response fields: mode ${meta.mode ?? 'unknown'}, model not included. ${source}.`
  return `Response fields: mode ${meta.mode ?? 'unknown'}, model ${meta.model}. ${source}.`
}
