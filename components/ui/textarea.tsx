import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-32 w-full rounded-md border-2 border-ink [border-bottom-width:3px] bg-card px-3 py-2 text-base font-medium text-ink placeholder:text-ink/45 focus:border-primary',
        className,
      )}
      {...props}
    />
  )
}
