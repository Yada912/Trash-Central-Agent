import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'btn-tactile disabled:cursor-not-allowed disabled:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white border-ink disabled:bg-ink/15 disabled:text-ink/50',
        secondary: 'bg-card text-ink border-ink hover:bg-amber/40 disabled:opacity-50',
        alert: 'bg-alert text-white border-ink disabled:opacity-50',
        gold: 'bg-gold text-ink border-ink disabled:opacity-50',
        ghost: 'border-transparent bg-transparent text-ink hover:bg-ink/5 disabled:opacity-50 [border-bottom-width:2px]',
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
