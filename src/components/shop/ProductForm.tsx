'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
import { createProduct, updateProduct } from '@/lib/actions/products'
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
  price: number
  stock: number
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  product?: Product | null
}

export function ProductForm({ open, onOpenChange, onSuccess, product }: ProductFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!product

  const [name, setName] = useState('')
  const [priceEur, setPriceEur] = useState('')
  const [stock, setStock] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (product) {
      setName(product.name)
      setPriceEur((product.price / 100).toFixed(2))
      setStock(String(product.stock))
    } else {
      setName('')
      setPriceEur('')
      setStock('0')
    }
  }, [open, product])

  const { execute: executeCreate, isPending: isCreating } = useAction(createProduct, {
    onSuccess: () => {
      toast.success('Prodotto creato')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toast.error(e.error?.serverError || 'Errore durante la creazione'),
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateProduct, {
    onSuccess: () => {
      toast.success('Prodotto aggiornato')
      onOpenChange(false)
      onSuccess()
    },
    onError: (e) => toast.error(e.error?.serverError || 'Errore durante l\'aggiornamento'),
  })

  const isPending = isCreating || isUpdating

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Il nome è obbligatorio'
    const priceVal = parseFloat(priceEur.replace(',', '.'))
    if (isNaN(priceVal) || priceVal < 0) errs.price = 'Prezzo non valido'
    const stockVal = parseInt(stock)
    if (!isEditing && (isNaN(stockVal) || stockVal < 0)) errs.stock = 'Scorte non valide'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const priceCents = Math.round(parseFloat(priceEur.replace(',', '.')) * 100)

    if (isEditing && product) {
      executeUpdate({ id: product.id, name: name.trim(), price: priceCents })
    } else {
      executeCreate({ name: name.trim(), price: priceCents, stock: parseInt(stock) })
    }
  }

  const title = isEditing ? 'Modifica Prodotto' : 'Nuovo Prodotto'

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="product-name">Nome</Label>
        <Input
          id="product-name"
          placeholder="Es. Shampoo antiparassitario"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-price">Prezzo (€)</Label>
        <Input
          id="product-price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={priceEur}
          onChange={(e) => setPriceEur(e.target.value)}
          aria-invalid={!!errors.price}
        />
        {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
      </div>

      {!isEditing && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-stock">Scorte iniziali</Label>
          <Input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            aria-invalid={!!errors.stock}
          />
          {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Prodotto'}
      </Button>
    </form>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
