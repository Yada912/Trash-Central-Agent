import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('min-h-32 w-full rounded-md border border-ink/15 bg-card px-3 py-2 text-base text-ink', className)}
      {...props}
    />
  )
}
