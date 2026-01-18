'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500'
    if (trend === 'down') return 'text-red-500'
    return 'text-barbar-muted'
  }

  return (
    <div
      className={cn(
        `
        relative overflow-hidden
        bg-barbar-card rounded-xl
        border border-barbar-border
        p-6
        transition-all duration-300
        hover:border-amber-500/30
        group
        `,
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-barbar-muted">{title}</span>
          {icon && (
            <span className="text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity">
              {icon}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-semibold text-barbar-text tabular-nums tracking-tight">
            {value}
          </p>

          {(change !== undefined || changeLabel) && (
            <div className={cn('flex items-center gap-1.5 text-sm', getTrendColor())}>
              {trend && getTrendIcon()}
              {change !== undefined && (
                <span className="tabular-nums">
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </span>
              )}
              {changeLabel && (
                <span className="text-barbar-muted">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
