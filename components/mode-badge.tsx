'use client'

import { useEffect, useState } from 'react'

export function ModeBadge() {
  const [mode, setMode] = useState<'live' | 'demo' | null>(null)
  useEffect(() => {
    let cancelled = false
    void fetch('/api/dashboard', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { meta?: { mode?: string } }) => {
        if (cancelled) return
        setMode(body.meta?.mode === 'live' ? 'live' : body.meta?.mode === 'demo' ? 'demo' : null)
      })
      .catch(() => {
        if (!cancelled) setMode(null)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <p data-testid="mode-badge" className="text-xs font-semibold uppercase tracking-wide">
      Mode: {mode ?? '…'}
    </p>
  )
}
