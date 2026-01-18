'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StatCard,
  AssetRow,
  AssetRowHeader,
  AllocationChart,
  Spinner,
} from '@/components/ui'
import {
  formatCurrency,
  formatRelativeTime,
  categoryColors,
  categoryLabels,
} from '@/lib/utils'
import {
  Wallet,
  TrendingUp,
  PieChart,
  RefreshCw,
  LogOut,
  Plus,
  DollarSign,
} from 'lucide-react'
import { Asset, AssetWithCalculations, CachedPrices, AllocationData } from '@/types'

// Your actual portfolio - will be moved to Supabase later
const PORTFOLIO_ASSETS: Asset[] = [
  // US Equities
  { id: '1', symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', category: 'us_equity', quantity: 400, averageCost: 85, currentPrice: 120, currency: 'USD' },
  { id: '2', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', category: 'us_equity', quantity: 200, averageCost: 56, currentPrice: 195, currency: 'USD' },
  { id: '3', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', category: 'us_equity', quantity: 100, averageCost: 250, currentPrice: 430, currency: 'USD' },
  { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', category: 'us_equity', quantity: 251, averageCost: 120, currentPrice: 225, currency: 'USD' },
  { id: '5', symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', category: 'us_equity', quantity: 80, averageCost: 180, currentPrice: 620, currency: 'USD' },
  { id: '6', symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', category: 'us_equity', quantity: 100, averageCost: 350, currentPrice: 530, currency: 'USD' },
  { id: '7', symbol: 'SPGI', name: 'S&P Global Inc.', type: 'stock', category: 'us_equity', quantity: 100, averageCost: 380, currentPrice: 505, currency: 'USD' },
  { id: '8', symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', category: 'us_equity', quantity: 100, averageCost: 400, currentPrice: 950, currency: 'USD' },
  
  // Cash Reserve (TEFAS + USD Cash + USDT)
  { id: '9', symbol: 'DLY', name: 'Deniz Portfoy Para Piyasasi', type: 'tefas', category: 'cash_reserve', quantity: 100000, averageCost: 1, currentPrice: 1.05, currency: 'TRY' },
  { id: '10', symbol: 'DIP', name: 'Deniz Portfoy Kisa Vadeli', type: 'tefas', category: 'cash_reserve', quantity: 50000, averageCost: 1, currentPrice: 1.03, currency: 'TRY' },
  { id: '11', symbol: 'USD', name: 'USD Nakit (IBKR)', type: 'cash', category: 'cash_reserve', quantity: 37100, averageCost: 1, currentPrice: 1, currency: 'USD' },
  { id: '12', symbol: 'USDT', name: 'Tether USD', type: 'crypto', category: 'cash_reserve', quantity: 30400, averageCost: 1, currentPrice: 1, currency: 'USD' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [prices, setPrices] = useState<CachedPrices | null>(null)
  const [assets, setAssets] = useState<Asset[]>(PORTFOLIO_ASSETS)
  const supabase = createClient()
  const router = useRouter()

  // USD/TRY rate
  const usdTry = prices?.usdTry || 34.5

  // Calculate asset values
  const assetsWithCalculations: AssetWithCalculations[] = assets.map((asset) => {
    const priceData = prices?.prices[asset.symbol]
    const currentPrice = priceData?.price || asset.currentPrice
    
    const totalCost = asset.quantity * asset.averageCost
    const currentValue = asset.quantity * currentPrice
    const currentValueTRY = asset.currency === 'USD' ? currentValue * usdTry : currentValue
    const totalCostTRY = asset.currency === 'USD' ? totalCost * usdTry : totalCost
    const profitLoss = currentValueTRY - totalCostTRY
    const profitLossPercent = totalCostTRY > 0 ? (profitLoss / totalCostTRY) * 100 : 0

    return {
      ...asset,
      currentPrice,
      totalCost,
      currentValue,
      currentValueTRY,
      profitLoss,
      profitLossPercent,
      weight: 0, // Will be calculated after total
    }
  })

  // Calculate totals
  const totalValueTRY = assetsWithCalculations.reduce((sum, a) => sum + a.currentValueTRY, 0)
  const totalCostTRY = assetsWithCalculations.reduce((sum, a) => {
    const costTRY = a.currency === 'USD' ? a.totalCost * usdTry : a.totalCost
    return sum + costTRY
  }, 0)
  const totalProfitLoss = totalValueTRY - totalCostTRY
  const totalProfitLossPercent = totalCostTRY > 0 ? (totalProfitLoss / totalCostTRY) * 100 : 0

  // Update weights
  assetsWithCalculations.forEach((a) => {
    a.weight = totalValueTRY > 0 ? (a.currentValueTRY / totalValueTRY) * 100 : 0
  })

  // Allocation by category (Nakit Rezerv, ABD Hisse, Kripto)
  const allocationByCategory: AllocationData[] = Object.keys(categoryLabels).map((category) => {
    const categoryAssets = assetsWithCalculations.filter((a) => a.category === category)
    const value = categoryAssets.reduce((sum, a) => sum + a.currentValueTRY, 0)
    return {
      name: categoryLabels[category],
      value,
      color: categoryColors[category],
    }
  }).filter((d) => d.value > 0)

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  // Fetch prices
  const fetchPrices = useCallback(async (force = false) => {
    setRefreshing(true)
    try {
      const method = force ? 'POST' : 'GET'
      const res = await fetch('/api/prices', { method })
      const data = await res.json()
      if (data.data) {
        setPrices(data.data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-barbar-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-barbar-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-barbar-bg/80 backdrop-blur-xl border-b border-barbar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <span className="text-lg font-bold text-barbar-bg">B</span>
              </div>
              <span className="font-semibold text-barbar-text hidden sm:block">
                Barbarians Portfolio
              </span>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchPrices(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Yenile</span>
              </Button>

              <div className="flex items-center gap-3">
                {user?.user_metadata?.avatar_url && (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-barbar-muted hidden sm:block">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last updated */}
        {prices?.lastUpdated && (
          <p className="text-sm text-barbar-muted mb-6">
            Son güncelleme: {formatRelativeTime(prices.lastUpdated)}
            {' · '}
            <span className="text-amber-500">USD/TRY: {usdTry.toFixed(2)}</span>
          </p>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Toplam Değer"
            value={formatCurrency(totalValueTRY, 'TRY')}
            icon={<Wallet className="w-5 h-5" />}
          />
          <StatCard
            title="Toplam Maliyet"
            value={formatCurrency(totalCostTRY, 'TRY')}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Kar/Zarar"
            value={formatCurrency(Math.abs(totalProfitLoss), 'TRY')}
            change={totalProfitLossPercent}
            trend={totalProfitLoss >= 0 ? 'up' : 'down'}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Varlık Sayısı"
            value={assets.length.toString()}
            changeLabel="farklı pozisyon"
            icon={<PieChart className="w-5 h-5" />}
          />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets list */}
          <div className="lg:col-span-2">
            <Card variant="bordered">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Varlıklar</CardTitle>
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  Ekle
                </Button>
              </CardHeader>
              <div className="overflow-x-auto">
                <AssetRowHeader />
                {assetsWithCalculations.map((asset) => (
                  <AssetRow key={asset.id} asset={asset} />
                ))}
              </div>
            </Card>
          </div>

          {/* Allocation chart */}
          <div className="lg:col-span-1">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Dağılım</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationChart
                  data={allocationByCategory}
                  totalValue={totalValueTRY}
                />
              </CardContent>
            </Card>

            {/* Quick stats by category */}
            <Card variant="bordered" className="mt-6">
              <CardHeader>
                <CardTitle>Kategori Bazlı Özet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocationByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-barbar-muted">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-barbar-text tabular-nums">
                      {formatCurrency(item.value, 'TRY', true)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
