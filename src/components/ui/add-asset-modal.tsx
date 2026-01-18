'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { Input, Select } from './input'
import { Asset } from '@/types'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (asset: Omit<Asset, 'id' | 'currentPrice'>) => Promise<void>
  editAsset?: Asset | null
}

const typeOptions = [
  { value: 'stock', label: 'ABD Hisse' },
  { value: 'tefas', label: 'TEFAS Fon' },
  { value: 'crypto', label: 'Kripto' },
  { value: 'cash', label: 'Nakit' },
]

const categoryOptions = [
  { value: 'us_equity', label: 'ABD Hisse' },
  { value: 'cash_reserve', label: 'Nakit Rezerv' },
  { value: 'crypto', label: 'Kripto' },
]

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'TRY', label: 'TRY' },
]

export function AddAssetModal({ isOpen, onClose, onAdd, editAsset }: AddAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    symbol: editAsset?.symbol || '',
    name: editAsset?.name || '',
    type: editAsset?.type || 'stock',
    category: editAsset?.category || 'us_equity',
    quantity: editAsset?.quantity?.toString() || '',
    averageCost: editAsset?.averageCost?.toString() || '',
    currency: editAsset?.currency || 'USD',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onAdd({
        symbol: form.symbol.toUpperCase(),
        name: form.name,
        type: form.type as Asset['type'],
        category: form.category as Asset['category'],
        quantity: parseFloat(form.quantity),
        averageCost: parseFloat(form.averageCost),
        currency: form.currency as Asset['currency'],
      })
      onClose()
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
    } catch (error) {
      console.error('Error adding asset:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-barbar-card border border-barbar-border rounded-xl w-full max-w-md mx-4 p-6 animate-slide-up">
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sembol"
              placeholder="AAPL"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              required
            />
            <Select
              label="Para Birimi"
              options={currencyOptions}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as 'TRY' | 'USD' })}
            />
          </div>

          <Input
            label="İsim"
            placeholder="Apple Inc."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tip"
              options={typeOptions}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Select
              label="Kategori"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            >
              {editAsset ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
