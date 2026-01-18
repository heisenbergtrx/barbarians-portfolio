// Portfolio Types

export interface Asset {
  id: string
  symbol: string
  name: string
  type: 'tefas' | 'stock' | 'crypto' | 'cash'
  category: 'cash_reserve' | 'us_equity' | 'crypto' // For grouping in pie chart
  quantity: number
  averageCost: number
  currentPrice: number
  currency: 'TRY' | 'USD'
}

export interface AssetWithCalculations extends Asset {
  totalCost: number
  currentValue: number
  currentValueTRY: number
  profitLoss: number
  profitLossPercent: number
  weight: number
}

export interface PortfolioSummary {
  totalValueTRY: number
  totalCostTRY: number
  totalProfitLoss: number
  totalProfitLossPercent: number
  lastUpdated: string
}

export interface MarketData {
  symbol: string
  price: number
  change24h: number
  currency: string
  lastUpdated: string
}

export interface CachedPrices {
  prices: Record<string, MarketData>
  usdTry: number
  lastUpdated: string
  expiresAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  cached?: boolean
}

// Form Types
export interface AddAssetForm {
  symbol: string
  name: string
  type: Asset['type']
  category: Asset['category']
  quantity: number
  averageCost: number
  currency: Asset['currency']
}

// Chart Types
export interface AllocationData {
  name: string
  value: number
  color: string
}

export interface PerformanceData {
  date: string
  value: number
}

// Snapshot for weekly tracking
export interface PortfolioSnapshot {
  id: string
  user_id: string
  date: string
  total_value_try: number
  total_cost_try: number
  profit_loss: number
  profit_loss_percent: number
  assets_snapshot: Asset[]
  created_at: string
}
