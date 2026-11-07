import { Suspense } from 'react'
import { PlannerView } from '@/components/planner/planner-view'

export default function PlannerPage() {
  return (
    <Suspense fallback={<p>Loading planner…</p>}>
      <PlannerView />
    </Suspense>
  )
}
