'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Input, Select } from './input'
import { Asset } from '@/types'

interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (asset: Omit<Asset, 'id' | 'currentPrice'>) => Promise<void>
  editAsset?: Asset | null
}

const categoryOptions = [
  { value: 'us_equity', label: 'ABD Hisse' },
  { value: 'cash_reserve', label: 'Nakit Rezerv' },
  { value: 'crypto', label: 'Kripto' },
]

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'TRY', label: 'TRY' },
]

export function AddAssetModal({ isOpen, onClose, onSave, editAsset }: AssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    type: 'stock' as Asset['type'],
    category: 'us_equity' as Asset['category'],
    quantity: '',
    averageCost: '',
    currency: 'USD' as Asset['currency'],
  })

  // Load edit asset data
  useEffect(() => {
    if (editAsset) {
      setForm({
        symbol: editAsset.symbol,
        name: editAsset.name,
        type: editAsset.type,
        category: editAsset.category,
        quantity: editAsset.quantity.toString(),
        averageCost: editAsset.averageCost.toString(),
        currency: editAsset.currency,
      })
      setSearchQuery(editAsset.symbol)
    } else {
      // Reset form
      setForm({
        symbol: '',
        name: '',
        type: 'stock',
        category: 'us_equity',
        quantity: '',
        averageCost: '',
        currency: 'USD',
      })
      setSearchQuery('')
    }
  }, [editAsset, isOpen])

  // Search debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1 || editAsset) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, editAsset])

  // Close results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    setForm({
      ...form,
      symbol: result.symbol,
      name: result.name,
      type: result.type === 'crypto' ? 'crypto' : 'stock',
      category: result.type === 'crypto' ? 'crypto' : 'us_equity',
      currency: 'USD',
    })
    setSearchQuery(result.symbol)
    setShowResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave({
        symbol: form.symbol.toUpperCase(),
        name: form.name,
        type: form.type,
        category: form.category,
        quantity: parseFloat(form.quantity),
        averageCost: parseFloat(form.averageCost),
        currency: form.currency,
      })
      onClose()
    } catch (error) {
      console.error('Error saving asset:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manual entry for TEFAS/Cash
  const handleManualEntry = () => {
    setForm({
      ...form,
      symbol: searchQuery.toUpperCase(),
      name: '',
      type: 'tefas',
      category: 'cash_reserve',
      currency: 'TRY',
    })
    setShowResults(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-barbar-card border border-barbar-border rounded-xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-barbar-text">
            {editAsset ? 'Varlık Düzenle' : 'Yeni Varlık Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="text-barbar-muted hover:text-barbar-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Field */}
          <div ref={searchRef} className="relative">
            <label className="block text-sm font-medium text-barbar-muted mb-1.5">
              Sembol Ara
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="AAPL, GOOGL, BTC..."
                className="w-full px-4 py-2.5 pl-10 bg-barbar-bg border border-barbar-border rounded-lg text-barbar-text placeholder:text-barbar-muted/50 focus:outline-none focus:border-amber-500"
                disabled={!!editAsset}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-barbar-muted">
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-barbar-card border border-barbar-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-barbar-border/50 transition-colors border-b border-barbar-border/50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-barbar-text">{result.symbol}</span>
                      <span className="text-xs text-barbar-muted">{result.exchange}</span>
                    </div>
                    <p className="text-sm text-barbar-muted truncate">{result.name}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="w-full px-4 py-3 text-left hover:bg-barbar-border/50 transition-colors text-amber-500 text-sm"
                >
                  &quot;{searchQuery.toUpperCase()}&quot; manuel olarak ekle (TEFAS/Nakit için)
                </button>
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.length > 0 && !searching && (
              <div className="absolute z-10 w-full mt-1 bg-barbar-card border border-barbar-border rounded-lg shadow-xl p-4">
                <p className="text-barbar-muted text-sm mb-2">Sonuç bulunamadı</p>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="text-amber-500 text-sm hover:underline"
                >
                  &quot;{searchQuery.toUpperCase()}&quot; manuel olarak ekle
                </button>
              </div>
            )}
          </div>

          {/* Selected Asset Info */}
          {form.symbol && (
            <>
              <div className="p-3 bg-barbar-bg rounded-lg border border-barbar-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-500">{form.symbol}</span>
                  <span className="text-xs text-barbar-muted">{form.type === 'stock' ? 'Hisse' : form.type === 'crypto' ? 'Kripto' : 'TEFAS/Nakit'}</span>
                </div>
                {form.name && <p className="text-sm text-barbar-muted mt-1">{form.name}</p>}
              </div>

              {/* Name (editable for manual entries) */}
              {form.type === 'tefas' || form.type === 'cash' ? (
                <Input
                  label="İsim"
                  placeholder="Fon veya hesap adı"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Kategori"
                  options={categoryOptions}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Asset['category'] })}
                />
                <Select
                  label="Para Birimi"
                  options={currencyOptions}
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as Asset['currency'] })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Miktar"
                  type="number"
                  step="any"
                  placeholder="100"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
                <Input
                  label="Ortalama Maliyet"
                  type="number"
                  step="any"
                  placeholder="150.00"
                  value={form.averageCost}
                  onChange={(e) => setForm({ ...form, averageCost: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                  disabled={!form.symbol || !form.quantity || !form.averageCost}
                >
                  {editAsset ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
