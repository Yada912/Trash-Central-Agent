'use client'

import dynamic from 'next/dynamic'
import type { DenpasarMapProps } from '@/components/map/denpasar-map'

const DenpasarMap = dynamic(() => import('@/components/map/denpasar-map'), {
  ssr: false,
  loading: () => <p className="rounded-lg border border-ink/10 bg-card p-4">Loading map…</p>,
})

export function CityMap(props: DenpasarMapProps) {
  return (
    <div role="region" aria-label="Map">
      <DenpasarMap {...props} />
    </div>
  )
}
