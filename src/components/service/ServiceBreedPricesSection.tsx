'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { fetchBreeds } from '@/lib/actions/breeds'
import { fetchServiceBreedPrices, upsertServiceBreedPrices } from '@/lib/actions/services'
import { formatPrice } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ServiceBreedPricesSectionProps {
  serviceId: string
  serviceBasePrice: number
}

export function ServiceBreedPricesSection({ serviceId, serviceBasePrice }: ServiceBreedPricesSectionProps) {
  const [priceMap, setPriceMap] = useState<Record<string, string>>({})

  const { data: breedsData } = useQuery({
    queryKey: ['breeds', 'list'],
    queryFn: async () => {
      const result = await fetchBreeds({})
      return result?.data?.breeds ?? []
    },
  })

  const { data: pricesData, refetch: refetchPrices } = useQuery({
    queryKey: ['serviceBreedPrices', serviceId],
    queryFn: async () => {
      const result = await fetchServiceBreedPrices({ serviceId })
      return result?.data?.prices ?? []
    },
  })

  // Sync price map when prices are loaded
  useEffect(() => {
    if (!pricesData) return
    const map: Record<string, string> = {}
    for (const p of pricesData) {
      map[p.breedId] = (p.price / 100).toFixed(2)
    }
    setPriceMap(map)
  }, [pricesData])

  const { execute: executeSave, isPending: isSaving } = useAction(upsertServiceBreedPrices, {
    onSuccess: () => {
      toast.success('Prezzi aggiornati')
      refetchPrices()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante il salvataggio')
    },
  })

  function handleSave() {
    const breedPrices = (breedsData ?? []).flatMap((b) => {
      const val = priceMap[b.id]
      if (!val || val.trim() === '') return [{ breedId: b.id }]
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) return [{ breedId: b.id }]
      return [{ breedId: b.id, price: Math.round(num * 100) }]
    })
    executeSave({ serviceId, breedPrices })
  }

  if (!breedsData || breedsData.length === 0) {
    return (
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">Prezzi per Razza</h3>
        <p className="text-sm text-muted-foreground">
          Nessuna razza configurata. Aggiungi razze dalla sezione <strong>Razze</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t border-border flex flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">Prezzi per Razza</h3>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {breedsData.map((breed) => (
          <div key={breed.id} className="flex items-center gap-3">
            <span className="flex-1 text-sm text-foreground truncate">{breed.name}</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              className="w-32"
              placeholder={`Usa prezzo base (${formatPrice(serviceBasePrice)})`}
              value={priceMap[breed.id] ?? ''}
              onChange={(e) =>
                setPriceMap((prev) => ({ ...prev, [breed.id]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Lascia vuoto per usare il prezzo base del servizio
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={handleSave}
        disabled={isSaving}
        className="self-start"
      >
        {isSaving ? 'Salvataggio...' : 'Salva Prezzi Razza'}
      </Button>
    </div>
  )
}
