'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createStationSchema,
  updateStationSchema,
  type CreateStationFormData,
  type UpdateStationFormData,
} from '@/lib/validations/stations'
import { createStation, updateStation } from '@/lib/actions/stations'
import { SIZE_TYPES, SIZE_LABELS, type SizeType } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useAction } from 'next-safe-action/hooks'

interface StationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  locationId: string
  station?: {
    id: string
    name: string
    allowedSizes?: string[] | null
  } | null
}

export function StationForm({ open, onOpenChange, onSuccess, locationId, station }: StationFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!station

  const defaultSizes = [...SIZE_TYPES] as SizeType[]
  const initialSizes = station?.allowedSizes
    ? (station.allowedSizes as SizeType[])
    : defaultSizes

  const form = useForm<CreateStationFormData | UpdateStationFormData>({
    resolver: zodResolver(isEditing ? updateStationSchema : createStationSchema),
    defaultValues: isEditing
      ? { id: station.id, name: station.name, allowedSizes: initialSizes }
      : { name: '', locationId, allowedSizes: defaultSizes },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createStation, {
    onSuccess: () => {
      toast.success('Postazione creata')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateStation, {
    onSuccess: () => {
      toast.success('Postazione aggiornata')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento")
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateStationFormData | UpdateStationFormData) {
    if (isEditing) {
      executeUpdate(data as UpdateStationFormData)
    } else {
      executeCreate(data as CreateStationFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="station-name">Nome postazione</Label>
        <Input
          id="station-name"
          placeholder="Es. Postazione 1"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Taglie ammesse</Label>
        <p className="text-xs text-muted-foreground">
          Deseleziona le taglie troppo grandi per questa postazione
        </p>
        <Controller
          control={form.control}
          name="allowedSizes"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {SIZE_TYPES.map((size) => {
                const checked = (field.value as SizeType[] | undefined)?.includes(size) ?? true
                return (
                  <label key={size} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        const current = (field.value as SizeType[]) ?? [...SIZE_TYPES]
                        if (c) {
                          field.onChange([...current, size])
                        } else {
                          field.onChange(current.filter((s) => s !== size))
                        }
                      }}
                    />
                    <span className="text-sm">{SIZE_LABELS[size]}</span>
                  </label>
                )
              })}
            </div>
          )}
        />
        {form.formState.errors.allowedSizes && (
          <p className="text-sm text-destructive">
            {form.formState.errors.allowedSizes.message}
          </p>
        )}
      </div>

      {!isEditing && <input type="hidden" {...form.register('locationId')} />}
      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Crea Postazione'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Postazione' : 'Nuova Postazione'

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
