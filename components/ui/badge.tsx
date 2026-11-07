import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md border border-gold bg-card px-2 py-1 text-sm font-semibold text-ink', className)}
      {...props}
    />
  )
}
