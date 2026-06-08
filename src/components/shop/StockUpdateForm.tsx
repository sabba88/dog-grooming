'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
import { updateProductStock } from '@/lib/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  stock: number
}

interface StockUpdateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  product: Product | null
}

export function StockUpdateForm({ open, onOpenChange, onSuccess, product }: StockUpdateFormProps) {
  const isMobile = useIsMobile()
  const [stock, setStock] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !product) return
    setError('')
    setStock(String(product.stock))
  }, [open, product])

  const { execute, isPending } = useAction(updateProductStock, {
    onSuccess: () => {
      toast.success('Scorte aggiornate')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toast.error(e.error?.serverError || 'Errore'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseInt(stock)
    if (isNaN(val) || val < 0) { setError('Valore non valido'); return }
    setError('')
    if (!product) return
    execute({ id: product.id, stock: val })
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="stock-value">Nuova quantità in magazzino</Label>
        <Input
          id="stock-value"
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-invalid={!!error}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Salvataggio...' : 'Aggiorna Scorte'}
      </Button>
    </form>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Scorte — {product?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scorte — {product?.name}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
