'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './loading'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-barbar-bg
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: `
        bg-amber-500 text-barbar-bg
        hover:bg-amber-400
        active:bg-amber-600
      `,
      secondary: `
        bg-barbar-card text-barbar-text
        border border-barbar-border
        hover:bg-barbar-border hover:border-barbar-muted
        active:bg-barbar-bg
      `,
      ghost: `
        text-barbar-muted
        hover:text-barbar-text hover:bg-barbar-card
        active:bg-barbar-border
      `,
      danger: `
        bg-red-500/10 text-red-500
        border border-red-500/20
        hover:bg-red-500/20
        active:bg-red-500/30
      `,
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : icon ? (
          <span className="w-4 h-4">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
