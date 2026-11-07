import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white',
        secondary: 'border border-ink/15 bg-card text-ink',
        alert: 'border border-alert bg-card text-alert',
        ghost: 'bg-transparent text-ink',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, asChild = false, type = 'button', ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant }), className)
  if (asChild) return <Slot className={classes} {...props} />
  return <button className={classes} type={type} {...props} />
}
