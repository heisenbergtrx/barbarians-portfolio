'use client'

import { useEffect, useState, useCallback } from 'react'
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
  formatPercent,
  formatRelativeTime,
  assetTypeColors,
  assetTypeLabels,
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

// Demo data - replace with Supabase data later
const DEMO_ASSETS: Asset[] = [
  { id: '1', symbol: 'TI2', name: 'TEB Portfoy Ikinci His. Fonu', type: 'tefas', quantity: 1000, averageCost: 15.5, currentPrice: 16.2, currency: 'TRY' },
  { id: '2', symbol: 'TMG', name: 'Tacirler Portfoy Birinci His.', type: 'tefas', quantity: 500, averageCost: 22.0, currentPrice: 24.5, currency: 'TRY' },
  { id: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', quantity: 15, averageCost: 56, currentPrice: 195, currency: 'USD' },
  { id: '4', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', quantity: 25, averageCost: 120, currentPrice: 185, currency: 'USD' },
  { id: '5', symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', quantity: 10, averageCost: 150, currentPrice: 880, currency: 'USD' },
  { id: '6', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', quantity: 0.5, averageCost: 25000, currentPrice: 97000, currency: 'USD' },
  { id: '7', symbol: 'ETH', name: 'Ethereum', type: 'crypto', quantity: 5, averageCost: 1800, currentPrice: 3200, currency: 'USD' },
  { id: '8', symbol: 'USD', name: 'ABD Dolari Nakit', type: 'cash', quantity: 5000, averageCost: 1, currentPrice: 1, currency: 'USD' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [prices, setPrices] = useState<CachedPrices | null>(null)
  const [assets, setAssets] = useState<Asset[]>(DEMO_ASSETS)
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

  // Allocation by type
  const allocationByType: AllocationData[] = Object.keys(assetTypeLabels).map((type) => {
    const typeAssets = assetsWithCalculations.filter((a) => a.type === type)
    const value = typeAssets.reduce((sum, a) => sum + a.currentValueTRY, 0)
    return {
      name: assetTypeLabels[type],
      value,
      color: assetTypeColors[type],
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
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
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
                  data={allocationByType}
                  totalValue={totalValueTRY}
                />
              </CardContent>
            </Card>

            {/* Quick stats by type */}
            <Card variant="bordered" className="mt-6">
              <CardHeader>
                <CardTitle>Tip Bazlı Özet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocationByType.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
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
