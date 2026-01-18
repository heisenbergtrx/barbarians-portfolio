'use client'

import { Plus, Wallet } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  onAddClick: () => void
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-barbar-border/50 flex items-center justify-center mb-4">
        <Wallet className="w-8 h-8 text-barbar-muted" />
      </div>
      <h3 className="text-lg font-medium text-barbar-text mb-2">
        Portföyünüz Boş
      </h3>
      <p className="text-barbar-muted text-center mb-6 max-w-sm">
        Hisse, fon, kripto veya nakit varlıklarınızı ekleyerek portföyünüzü oluşturmaya başlayın.
      </p>
      <Button variant="primary" onClick={onAddClick}>
        <Plus className="w-4 h-4" />
        İlk Varlığı Ekle
      </Button>
    </div>
  )
}
