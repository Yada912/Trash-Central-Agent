import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  filled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASSES = {
  sm: 'text-[18px]',
  md: 'text-[20px]',
  lg: 'text-[24px]',
  xl: 'text-[30px]',
} as const

export function MaterialIcon({ name, filled = false, size = 'md', className, style, ...props }: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-outlined select-none leading-none inline-flex items-center justify-center', SIZE_CLASSES[size], className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
      {...props}
    >
      {name}
    </span>
  )
}
