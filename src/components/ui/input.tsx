'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-barbar-muted">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            `
            w-full px-4 py-2.5
            bg-barbar-bg
            border border-barbar-border rounded-lg
            text-barbar-text placeholder:text-barbar-muted/50
            transition-all duration-200
            focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            `,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="text-sm text-barbar-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-barbar-muted">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            `
            w-full px-4 py-2.5
            bg-barbar-bg
            border border-barbar-border rounded-lg
            text-barbar-text
            transition-all duration-200
            focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            `,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
