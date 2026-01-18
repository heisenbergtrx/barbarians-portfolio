import { type ClassValue, clsx } from 'clsx'

// Simple cn function without tailwind-merge (to reduce dependencies)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Number formatting
export function formatCurrency(
  value: number,
  currency: 'TRY' | 'USD' = 'TRY',
  compact = false
): string {
  if (compact && Math.abs(value) >= 1000) {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }
    return new Intl.NumberFormat('tr-TR', options).format(value)
  }
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  return new Intl.NumberFormat('tr-TR', options).format(value)
}

export function formatNumber(
  value: number,
  decimals = 2,
  compact = false
): string {
  if (compact && Math.abs(value) >= 1000) {
    const options: Intl.NumberFormatOptions = {
      notation: 'compact',
      maximumFractionDigits: 1,
    }
    return new Intl.NumberFormat('tr-TR', options).format(value)
  }
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }
  return new Intl.NumberFormat('tr-TR', options).format(value)
}

export function formatPercent(value: number, includeSign = true): string {
  const formatted = `${Math.abs(value).toFixed(2)}%`
  if (includeSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return formatted
}

// Date formatting
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Az önce'
  if (diffMins < 60) return `${diffMins} dk önce`
  if (diffHours < 24) return `${diffHours} saat önce`
  if (diffDays < 7) return `${diffDays} gün önce`
  
  return formatDate(d)
}

// Asset type labels
export const assetTypeLabels: Record<string, string> = {
  tefas: 'TEFAS',
  stock: 'ABD Hisse',
  crypto: 'Kripto',
  cash: 'Nakit',
}

export const assetTypeColors: Record<string, string> = {
  tefas: '#f59e0b',     // amber
  stock: '#3b82f6',     // blue
  crypto: '#8b5cf6',    // purple
  cash: '#22c55e',      // green
}

// Category labels for pie chart grouping
export const categoryLabels: Record<string, string> = {
  cash_reserve: 'Nakit Rezerv',
  us_equity: 'ABD Hisse',
  crypto: 'Kripto',
}

export const categoryColors: Record<string, string> = {
  cash_reserve: '#22c55e',  // green
  us_equity: '#3b82f6',     // blue
  crypto: '#8b5cf6',        // purple
}

// Validation
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9.-]+$/.test(symbol.toUpperCase())
}

// Calculate portfolio metrics
export function calculateProfitLoss(
  currentValue: number,
  totalCost: number
): { amount: number; percent: number } {
  const amount = currentValue - totalCost
  const percent = totalCost > 0 ? (amount / totalCost) * 100 : 0
  return { amount, percent }
}
