'use client'

import { cn, formatCurrency, formatPercent, assetTypeLabels, assetTypeColors } from '@/lib/utils'
import { AssetWithCalculations } from '@/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AssetRowProps {
  asset: AssetWithCalculations
  onClick?: () => void
}

export function AssetRow({ asset, onClick }: AssetRowProps) {
  const isPositive = asset.profitLoss >= 0
  const typeColor = assetTypeColors[asset.type] || '#f59e0b'

  return (
    <div
      onClick={onClick}
      className={cn(
        `
        grid grid-cols-12 gap-4 items-center
        px-4 py-3
        border-b border-barbar-border/50
        transition-all duration-200
        hover:bg-barbar-border/20
        `,
        onClick && 'cursor-pointer'
      )}
    >
      {/* Symbol & Name */}
      <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
        <div
          className="w-2 h-8 rounded-full"
          style={{ backgroundColor: typeColor }}
        />
        <div className="min-w-0">
          <p className="font-medium text-barbar-text truncate">{asset.symbol}</p>
          <p className="text-xs text-barbar-muted truncate">{asset.name}</p>
        </div>
      </div>

      {/* Type badge - hidden on mobile */}
      <div className="hidden sm:flex col-span-2 items-center">
        <span
          className="px-2 py-0.5 text-xs rounded-full"
          style={{
            backgroundColor: `${typeColor}20`,
            color: typeColor,
          }}
        >
          {assetTypeLabels[asset.type]}
        </span>
      </div>

      {/* Quantity & Avg Cost - hidden on mobile */}
      <div className="hidden md:block col-span-2 text-right">
        <p className="text-sm text-barbar-text tabular-nums">
          {asset.quantity.toLocaleString('tr-TR')}
        </p>
        <p className="text-xs text-barbar-muted tabular-nums">
          @ {formatCurrency(asset.averageCost, asset.currency)}
        </p>
      </div>

      {/* Current Value */}
      <div className="col-span-4 sm:col-span-2 text-right">
        <p className="font-medium text-barbar-text tabular-nums">
          {formatCurrency(asset.currentValueTRY, 'TRY')}
        </p>
        <p className="text-xs text-barbar-muted tabular-nums">
          {asset.weight.toFixed(1)}%
        </p>
      </div>

      {/* P/L */}
      <div className="col-span-4 sm:col-span-3 text-right">
        <div
          className={cn(
            'flex items-center justify-end gap-1',
            isPositive ? 'text-green-500' : 'text-red-500'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium tabular-nums">
            {formatCurrency(Math.abs(asset.profitLoss), 'TRY')}
          </span>
        </div>
        <p
          className={cn(
            'text-xs tabular-nums',
            isPositive ? 'text-green-500/70' : 'text-red-500/70'
          )}
        >
          {formatPercent(asset.profitLossPercent)}
        </p>
      </div>
    </div>
  )
}

// Header row
export function AssetRowHeader() {
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-barbar-muted uppercase tracking-wider border-b border-barbar-border">
      <div className="col-span-4 sm:col-span-3">Varlik</div>
      <div className="hidden sm:block col-span-2">Tip</div>
      <div className="hidden md:block col-span-2 text-right">Miktar</div>
      <div className="col-span-4 sm:col-span-2 text-right">Deger</div>
      <div className="col-span-4 sm:col-span-3 text-right">K/Z</div>
    </div>
  )
}
