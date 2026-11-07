'use client'

import { useEffect, useState } from 'react'

export function ModeBadge({ mode: controlledMode }: { mode?: 'live' | 'demo' | null } = {}) {
  const [fetchedMode, setFetchedMode] = useState<'live' | 'demo' | null>(null)
  useEffect(() => {
    if (controlledMode === 'live' || controlledMode === 'demo') return
    let cancelled = false
    void fetch('/api/dashboard', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { meta?: { mode?: string } }) => {
        if (cancelled) return
        setFetchedMode(
          body.meta?.mode === 'live' ? 'live' : body.meta?.mode === 'demo' ? 'demo' : null,
        )
      })
      .catch(() => {
        if (!cancelled) setFetchedMode(null)
      })
    return () => {
      cancelled = true
    }
  }, [controlledMode])

  const mode =
    controlledMode === 'live' || controlledMode === 'demo' ? controlledMode : fetchedMode

  return (
    <p data-testid="mode-badge" className="text-xs font-semibold uppercase tracking-wide">
      Mode: {mode ?? '…'}
    </p>
  )
}
