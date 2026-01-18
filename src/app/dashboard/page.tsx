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
  AddAssetModal,
  EmptyState,
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
  Trash2,
  Camera,
} from 'lucide-react'
import { Asset, AssetWithCalculations, CachedPrices, AllocationData } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [prices, setPrices] = useState<CachedPrices | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  // USD/TRY rate
  const usdTry = prices?.usdTry || 34.5

  // Calculate asset values
  const assetsWithCalculations: AssetWithCalculations[] = assets.map((asset) => {
    const priceData = prices?.prices[asset.symbol]
    const currentPrice = priceData?.price || asset.currentPrice || asset.averageCost
    
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
      weight: 0,
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

  // Allocation by category
  const allocationByCategory: AllocationData[] = Object.keys(categoryLabels).map((category) => {
    const categoryAssets = assetsWithCalculations.filter((a) => a.category === category)
    const value = categoryAssets.reduce((sum, a) => sum + a.currentValueTRY, 0)
    return {
      name: categoryLabels[category],
      value,
      color: categoryColors[category],
    }
  }).filter((d) => d.value > 0)

  // Fetch user and assets
  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      // Fetch user's assets from Supabase
      const { data: assetsData, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching assets:', error)
      } else if (assetsData) {
        // Map database columns to our Asset interface
        const mappedAssets: Asset[] = assetsData.map((a: any) => ({
          id: a.id,
          symbol: a.symbol,
          name: a.name,
          type: a.type,
          category: a.category,
          quantity: parseFloat(a.quantity),
          averageCost: parseFloat(a.average_cost),
          currentPrice: parseFloat(a.average_cost), // Will be updated by price fetch
          currency: a.currency,
        }))
        setAssets(mappedAssets)
      }
      
      setLoading(false)
    }
    initialize()
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
    if (!loading && assets.length > 0) {
      fetchPrices()
    }
  }, [loading, assets.length, fetchPrices])

  // Add asset
  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'currentPrice'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        symbol: assetData.symbol,
        name: assetData.name,
        type: assetData.type,
        category: assetData.category,
        quantity: assetData.quantity,
        average_cost: assetData.averageCost,
        currency: assetData.currency,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding asset:', error)
      throw error
    }

    if (data) {
      const newAsset: Asset = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        category: data.category,
        quantity: parseFloat(data.quantity),
        averageCost: parseFloat(data.average_cost),
        currentPrice: parseFloat(data.average_cost),
        currency: data.currency,
      }
      setAssets([...assets, newAsset])
      
      // Refresh prices to get current price for new asset
      fetchPrices(true)
    }
  }

  // Delete asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Bu varlığı silmek istediğinizden emin misiniz?')) return

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)

    if (error) {
      console.error('Error deleting asset:', error)
      return
    }

    setAssets(assets.filter(a => a.id !== assetId))
  }

  // Save snapshot
  const handleSaveSnapshot = async () => {
    if (!user || assets.length === 0) return
    
    setSavingSnapshot(true)
    
    const now = new Date()
    const weekNumber = getWeekNumber(now)
    
    const { error } = await supabase
      .from('snapshots')
      .insert({
        user_id: user.id,
        total_value_try: totalValueTRY,
        assets: assetsWithCalculations,
        week_number: weekNumber,
      })

    if (error) {
      console.error('Error saving snapshot:', error)
      alert('Snapshot kaydedilemedi!')
    } else {
      alert('Portföy snapshot kaydedildi!')
    }
    
    setSavingSnapshot(false)
  }

  // Get week number of year
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

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
      <header className="sticky top-0 z-40 bg-barbar-bg/80 backdrop-blur-xl border-b border-barbar-border">
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

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchPrices(true)}
                disabled={refreshing}
                title="Fiyatları Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Yenile</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveSnapshot}
                disabled={savingSnapshot || assets.length === 0}
                title="Snapshot Kaydet"
              >
                <Camera className={`w-4 h-4 ${savingSnapshot ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">Snapshot</span>
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

              <Button variant="ghost" size="sm" onClick={handleLogout} title="Çıkış">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assets.length === 0 ? (
          <EmptyState onAddClick={() => setShowAddModal(true)} />
        ) : (
          <>
            {/* Last updated */}
            {prices?.lastUpdated && (
              <p className="text-sm text-barbar-muted mb-6">
                Son güncelleme: {formatRelativeTime(prices.lastUpdated)}
                {' · '}
                <span className="text-amber-500">USD/TRY: {usdTry.toFixed(2)}</span>
              </p>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                title="Toplam Değer"
                value={formatCurrency(totalValueTRY, 'TRY', true)}
                icon={<Wallet className="w-5 h-5" />}
              />
              <StatCard
                title="Toplam Maliyet"
                value={formatCurrency(totalCostTRY, 'TRY', true)}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                title="Kar/Zarar"
                value={formatCurrency(Math.abs(totalProfitLoss), 'TRY', true)}
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
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Ekle
                    </Button>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <AssetRowHeader />
                    {assetsWithCalculations.map((asset) => (
                      <div key={asset.id} className="group relative">
                        <AssetRow asset={asset} />
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                    {allocationByCategory.length > 0 ? (
                      <AllocationChart
                        data={allocationByCategory}
                        totalValue={totalValueTRY}
                      />
                    ) : (
                      <p className="text-barbar-muted text-center py-8">
                        Veri yok
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick stats by category */}
                {allocationByCategory.length > 0 && (
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
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingAsset(null)
        }}
        onAdd={handleAddAsset}
        editAsset={editingAsset}
      />
    </div>
  )
}
