import { Badge } from '@/components/ui/badge'

export function DemoBadge({ mode }: { mode?: 'live' | 'demo' | null }) {
  if (mode !== 'demo') return null
  return <Badge>Demo output</Badge>
}
