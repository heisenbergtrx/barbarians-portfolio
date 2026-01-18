'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Spinner } from './loading'
import { formatCurrency } from '@/lib/utils'
import { AssetWithCalculations } from '@/types'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Target, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Snapshot {
  id: string
  total_value_try: number
  week_number: number
  created_at: string
  assets: any[]
}

interface PortfolioAnalyticsProps {
  assets: AssetWithCalculations[]
  totalValue: number
  totalCost: number
}

export function PortfolioAnalytics({ assets, totalValue, totalCost }: PortfolioAnalyticsProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSnapshots = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(52) // Last year

      if (!error && data) {
        setSnapshots(data)
      }
      setLoading(false)
    }

    fetchSnapshots()
  }, [supabase])

  // Calculate metrics
  const metrics = calculateMetrics(assets, totalValue, totalCost, snapshots)

  // Chart data
  const chartData = snapshots.map((s, i) => ({
    week: `H${s.week_number}`,
    value: s.total_value_try,
    date: new Date(s.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
  }))

  // Add current value as last point if we have snapshots
  if (chartData.length > 0) {
    chartData.push({
      week: 'Şimdi',
      value: totalValue,
      date: 'Bugün',
    })
  }

  // Top performers
  const sortedByPerformance = [...assets].sort((a, b) => b.profitLossPercent - a.profitLossPercent)
  const topPerformers = sortedByPerformance.slice(0, 3)
  const worstPerformers = sortedByPerformance.slice(-3).reverse()

  // Concentration analysis
  const topHolding = assets.reduce((max, a) => a.weight > max.weight ? a : max, assets[0])
  const top3Weight = assets
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .reduce((sum, a) => sum + a.weight, 0)

  if (loading) {
    return (
      <Card variant="bordered">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Portföy Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111113',
                      border: '1px solid #1f1f23',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value, 'TRY'), 'Değer']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#valueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-barbar-muted">
              <p>Henüz yeterli veri yok.</p>
              <p className="text-sm mt-1">Haftalık snapshot&apos;lar otomatik kaydedilecek.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Toplam Getiri"
          value={`${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`}
          subtitle={formatCurrency(totalValue - totalCost, 'TRY', true)}
          trend={metrics.totalReturn >= 0 ? 'up' : 'down'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          title="Haftalık Değişim"
          value={`${metrics.weeklyChange >= 0 ? '+' : ''}${metrics.weeklyChange.toFixed(2)}%`}
          subtitle={snapshots.length > 0 ? 'Son 7 gün' : 'Veri yok'}
          trend={metrics.weeklyChange >= 0 ? 'up' : 'down'}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <MetricCard
          title="Diversifikasyon"
          value={metrics.diversificationScore}
          subtitle={`${assets.length} farklı varlık`}
          trend="neutral"
          icon={<Shield className="w-4 h-4" />}
        />
        <MetricCard
          title="Konsantrasyon"
          value={`${top3Weight.toFixed(0)}%`}
          subtitle="İlk 3 varlık"
          trend={top3Weight > 70 ? 'warning' : 'neutral'}
          icon={<Target className="w-4 h-4" />}
        />
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              En İyi Performans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((asset, i) => (
              <div key={asset.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-barbar-muted text-sm w-4">{i + 1}.</span>
                  <div>
                    <p className="font-medium text-barbar-text">{asset.symbol}</p>
                    <p className="text-xs text-barbar-muted">{asset.name}</p>
                  </div>
                </div>
                <span className="text-green-500 font-medium tabular-nums">
                  +{asset.profitLossPercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Worst Performers */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              En Düşük Performans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {worstPerformers.map((asset, i) => (
              <div key={asset.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-barbar-muted text-sm w-4">{i + 1}.</span>
                  <div>
                    <p className="font-medium text-barbar-text">{asset.symbol}</p>
                    <p className="text-xs text-barbar-muted">{asset.name}</p>
                  </div>
                </div>
                <span className={`font-medium tabular-nums ${asset.profitLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.profitLossPercent >= 0 ? '+' : ''}{asset.profitLossPercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Risk Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-barbar-muted mb-1">En Büyük Pozisyon</p>
              <p className="text-lg font-medium text-barbar-text">{topHolding?.symbol}</p>
              <p className="text-sm text-amber-500">{topHolding?.weight.toFixed(1)}% ağırlık</p>
            </div>
            <div>
              <p className="text-sm text-barbar-muted mb-1">USD Maruziyeti</p>
              <p className="text-lg font-medium text-barbar-text">
                {assets.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.weight, 0).toFixed(1)}%
              </p>
              <p className="text-sm text-barbar-muted">Dolar bazlı varlıklar</p>
            </div>
            <div>
              <p className="text-sm text-barbar-muted mb-1">Nakit Rezerv Oranı</p>
              <p className="text-lg font-medium text-barbar-text">
                {assets.filter(a => a.category === 'cash_reserve').reduce((sum, a) => sum + a.weight, 0).toFixed(1)}%
              </p>
              <p className="text-sm text-barbar-muted">Likit varlıklar</p>
            </div>
          </div>

          {/* Warnings */}
          {top3Weight > 70 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-500">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Yüksek konsantrasyon: İlk 3 varlık portföyün %{top3Weight.toFixed(0)}&apos;ini oluşturuyor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon 
}: { 
  title: string
  value: string
  subtitle: string
  trend: 'up' | 'down' | 'neutral' | 'warning'
  icon: React.ReactNode
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-barbar-muted',
    warning: 'text-amber-500',
  }

  return (
    <div className="bg-barbar-card border border-barbar-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-barbar-muted uppercase tracking-wider">{title}</span>
        <span className={trendColors[trend]}>{icon}</span>
      </div>
      <p className={`text-xl font-semibold ${trendColors[trend]} tabular-nums`}>{value}</p>
      <p className="text-xs text-barbar-muted mt-1">{subtitle}</p>
    </div>
  )
}

// Calculate portfolio metrics
function calculateMetrics(
  assets: AssetWithCalculations[],
  totalValue: number,
  totalCost: number,
  snapshots: Snapshot[]
) {
  // Total return
  const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0

  // Weekly change (from last snapshot)
  let weeklyChange = 0
  if (snapshots.length > 0) {
    const lastSnapshot = snapshots[snapshots.length - 1]
    weeklyChange = lastSnapshot.total_value_try > 0 
      ? ((totalValue - lastSnapshot.total_value_try) / lastSnapshot.total_value_try) * 100 
      : 0
  }

  // Diversification score (based on number of assets and weight distribution)
  const assetCount = assets.length
  const weights = assets.map(a => a.weight / 100)
  const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0)
  const effectiveAssets = herfindahlIndex > 0 ? 1 / herfindahlIndex : 0
  
  let diversificationScore = 'Düşük'
  if (effectiveAssets >= 8) diversificationScore = 'Yüksek'
  else if (effectiveAssets >= 5) diversificationScore = 'Orta'
  else if (effectiveAssets >= 3) diversificationScore = 'Düşük'
  else diversificationScore = 'Çok Düşük'

  return {
    totalReturn,
    weeklyChange,
    diversificationScore,
  }
}
