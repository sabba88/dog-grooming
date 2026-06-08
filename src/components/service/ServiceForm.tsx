'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceFormData,
  type UpdateServiceFormData,
} from '@/lib/validations/services'
import { createService, updateService, fetchServicePriceMatrix } from '@/lib/actions/services'
import { fetchPricingSurcharges } from '@/lib/actions/settings'
import { COAT_TYPES, COAT_LABELS, SIZE_TYPES, SIZE_LABELS, type CoatType, type SizeType } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
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

interface Surcharge {
  dimension: string
  valueKey: string
  surchargePercent: number
}

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  service?: {
    id: string
    name: string
    price: number
    duration: number
    durationSurchargePer30min: number
  } | null
}

export function ServiceForm({ open, onOpenChange, onSuccess, service }: ServiceFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!service
  const [matrixCells, setMatrixCells] = useState<Record<string, number>>({})
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])

  function calcMatrixFromBase(basePriceCents: number) {
    if (basePriceCents <= 0 || surcharges.length === 0) return
    const coatMap: Record<string, number> = {}
    const sizeMap: Record<string, number> = {}
    for (const s of surcharges) {
      if (s.dimension === 'coat') coatMap[s.valueKey] = s.surchargePercent
      if (s.dimension === 'size') sizeMap[s.valueKey] = s.surchargePercent
    }
    const newCells: Record<string, number> = {}
    for (const coat of COAT_TYPES) {
      for (const size of SIZE_TYPES) {
        const coatPct = coatMap[coat] ?? 0
        const sizePct = sizeMap[size] ?? 0
        newCells[`${coat}_${size}`] = Math.round(basePriceCents * (1 + (coatPct + sizePct) / 100))
      }
    }
    setMatrixCells(newCells)
  }

  const { execute: executeFetchSurcharges } = useAction(fetchPricingSurcharges, {
    onSuccess: ({ data }) => {
      if (data?.surcharges) setSurcharges(data.surcharges)
    },
  })

  const { execute: executeFetchMatrix } = useAction(fetchServicePriceMatrix, {
    onSuccess: ({ data }) => {
      if (data?.cells) {
        const cellMap: Record<string, number> = {}
        for (const cell of data.cells) {
          cellMap[`${cell.coatType}_${cell.sizeType}`] = cell.price
        }
        setMatrixCells(cellMap)
      }
    },
  })

  useEffect(() => {
    if (open) {
      executeFetchSurcharges({})
      if (isEditing && service) {
        executeFetchMatrix({ serviceId: service.id })
        form.reset({
          id: service.id,
          name: service.name,
          price: service.price / 100,
          duration: service.duration,
          durationSurchargePer30min: service.durationSurchargePer30min / 100,
        })
      } else {
        setMatrixCells({})
        form.reset({ name: '', price: 0, duration: 0, durationSurchargePer30min: 0 })
      }
    }
    if (!open) {
      setMatrixCells({})
    }
  }, [open, isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<CreateServiceFormData | UpdateServiceFormData>({
    resolver: zodResolver(isEditing ? updateServiceSchema : createServiceSchema),
    defaultValues: isEditing
      ? {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          durationSurchargePer30min: service.durationSurchargePer30min,
        }
      : { name: '', price: 0, duration: 0, durationSurchargePer30min: 0 },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createService, {
    onSuccess: () => {
      toast.success('Servizio creato')
      form.reset()
      setMatrixCells({})
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateService, {
    onSuccess: () => {
      toast.success('Servizio aggiornato')
      form.reset()
      setMatrixCells({})
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento")
    },
  })

  const isPending = isCreating || isUpdating

  const priceRegistration = form.register('price', { valueAsNumber: true })

  function setCellPrice(coatType: string, sizeType: string, eurValue: string) {
    const cents = Math.round((parseFloat(eurValue) || 0) * 100)
    setMatrixCells(prev => ({ ...prev, [`${coatType}_${sizeType}`]: cents }))
  }

  function onSubmit(data: CreateServiceFormData | UpdateServiceFormData) {
    const cells = COAT_TYPES.flatMap(coat =>
      SIZE_TYPES.map(size => ({
        coatType: coat,
        sizeType: size,
        price: matrixCells[`${coat}_${size}`] ?? 0,
      }))
    )
    const payload = {
      ...data,
      price: Math.round((data.price as number) * 100),
      durationSurchargePer30min: Math.round(((data.durationSurchargePer30min as number) ?? 0) * 100),
      matrixCells: cells,
    }
    if (isEditing) {
      executeUpdate(payload as UpdateServiceFormData)
    } else {
      executeCreate(payload as CreateServiceFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Nome */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Es. Taglio e piega"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Tariffa base */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="price">Tariffa base (EUR)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Es. 25.00"
          {...priceRegistration}
          onChange={(e) => {
            priceRegistration.onChange(e)
            const cents = Math.round((parseFloat(e.target.value) || 0) * 100)
            if (cents > 0) calcMatrixFromBase(cents)
          }}
          aria-invalid={!!form.formState.errors.price}
        />
        <p className="text-xs text-muted-foreground">
          Modifica la tariffa base per ricalcolare automaticamente i prezzi pela/taglia.
        </p>
        {form.formState.errors.price && (
          <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
        )}
      </div>

      {/* Durata */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="duration">Durata (minuti)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          step="1"
          placeholder="Es. 30"
          {...form.register('duration', { valueAsNumber: true })}
          aria-invalid={!!form.formState.errors.duration}
        />
        {form.formState.errors.duration && (
          <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>
        )}
      </div>

      {/* Maggiorazione 30min */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="durationSurchargePer30min">Maggiorazione 30min (EUR)</Label>
        <Input
          id="durationSurchargePer30min"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register('durationSurchargePer30min', { valueAsNumber: true })}
          aria-invalid={!!form.formState.errors.durationSurchargePer30min}
        />
        <p className="text-xs text-muted-foreground">
          Importo aggiunto per ogni 30 minuti oltre la durata base. 0 = nessuna maggiorazione.
        </p>
        {form.formState.errors.durationSurchargePer30min && (
          <p className="text-sm text-destructive">{form.formState.errors.durationSurchargePer30min.message}</p>
        )}
      </div>

      {/* Matrice prezzi 3×5 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Prezzi per Pelo/Taglia (EUR)</Label>
          <p className="text-xs text-muted-foreground">
            Calcolati automaticamente dalla tariffa base e dalle <a href="/settings/surcharges" target="_blank" className="text-primary underline">tabelle maggiorazione</a>
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-2 text-left font-medium text-muted-foreground w-20"></th>
                {SIZE_TYPES.map(size => (
                  <th key={size} className="p-2 text-center font-medium text-muted-foreground min-w-[80px]">
                    {SIZE_LABELS[size as SizeType]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COAT_TYPES.map((coat, coatIdx) => (
                <tr key={coat} className={coatIdx > 0 ? 'border-t border-border' : ''}>
                  <td className="p-2 font-medium text-muted-foreground bg-muted/30">
                    {COAT_LABELS[coat as CoatType]}
                  </td>
                  {SIZE_TYPES.map(size => {
                    const cellKey = `${coat}_${size}`
                    const cents = matrixCells[cellKey] ?? 0
                    return (
                      <td key={size} className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-8 text-center px-1"
                          value={cents > 0 ? (cents / 100).toFixed(2) : ''}
                          onChange={e => setCellPrice(coat, size, e.target.value)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Celle a 0 usano la tariffa base. Modifica i singoli valori per personalizzare.
        </p>
      </div>

      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Crea Servizio'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Servizio' : 'Nuovo Servizio'

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
