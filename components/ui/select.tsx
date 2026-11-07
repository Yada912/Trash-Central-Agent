import * as React from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-md border-2 border-ink [border-bottom-width:3px] bg-card px-3 py-2 text-base font-medium text-ink focus:border-primary',
        className,
      )}
      {...props}
    />
  )
}
