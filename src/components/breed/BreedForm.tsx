'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
import { createBreed, updateBreed, fetchBreedWithPrices } from '@/lib/actions/breeds'
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

interface Breed {
  id: string
  name: string
  priceCount: number
}

interface Service {
  id: string
  name: string
  price: number
}

interface BreedFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  services: Service[]
  breed?: Breed | null
}

export function BreedForm({ open, onOpenChange, onSuccess, services, breed }: BreedFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!breed

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  // Map serviceId → price in EUR as string (empty = no specific price)
  const [priceMap, setPriceMap] = useState<Record<string, string>>({})

  // Fetch existing prices when editing
  const { data: breedData } = useQuery({
    queryKey: ['breeds', 'withPrices', breed?.id],
    queryFn: async () => {
      if (!breed?.id) return null
      const result = await fetchBreedWithPrices({ id: breed.id })
      return result?.data?.breed ?? null
    },
    enabled: isEditing && open,
  })

  // Populate form when breed data is available or breed changes
  useEffect(() => {
    if (!open) return
    setNameError('')
    if (isEditing && breed) {
      setName(breed.name)
      if (breedData?.servicePrices) {
        const map: Record<string, string> = {}
        for (const sp of breedData.servicePrices) {
          map[sp.serviceId] = (sp.price / 100).toFixed(2)
        }
        setPriceMap(map)
      } else {
        setPriceMap({})
      }
    } else {
      setName('')
      setPriceMap({})
    }
  }, [open, breed, breedData, isEditing])

  const { execute: executeCreate, isPending: isCreating } = useAction(createBreed, {
    onSuccess: () => {
      toast.success('Razza creata')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateBreed, {
    onSuccess: () => {
      toast.success('Razza aggiornata')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'aggiornamento')
    },
  })

  const isPending = isCreating || isUpdating

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Il nome è obbligatorio')
      return
    }
    setNameError('')

    const servicePrices = services.flatMap((s) => {
      const val = priceMap[s.id]
      if (!val || val.trim() === '') return []
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) return []
      return [{ serviceId: s.id, price: Math.round(num * 100) }]
    })

    if (isEditing && breed) {
      executeUpdate({ id: breed.id, name: name.trim(), servicePrices })
    } else {
      executeCreate({ name: name.trim(), servicePrices })
    }
  }

  const title = isEditing ? 'Modifica Razza' : 'Nuova Razza'

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="breed-name">Nome razza</Label>
        <Input
          id="breed-name"
          placeholder="Es. Labrador Retriever"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!nameError}
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      {services.length > 0 && (
        <div className="flex flex-col gap-3">
          <Label>Prezzi per Servizio (opzionali)</Label>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-foreground truncate">{service.name}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-32"
                  placeholder="Usa prezzo base"
                  value={priceMap[service.id] ?? ''}
                  onChange={(e) =>
                    setPriceMap((prev) => ({ ...prev, [service.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Lascia vuoto per usare il prezzo base del servizio
          </p>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Razza'}
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
