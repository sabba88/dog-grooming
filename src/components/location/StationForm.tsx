'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createStationSchema,
  updateStationSchema,
  type CreateStationFormData,
  type UpdateStationFormData,
} from '@/lib/validations/stations'
import { createStation, updateStation } from '@/lib/actions/stations'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { useAction } from 'next-safe-action/hooks'

interface StationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  locationId: string
  station?: {
    id: string
    name: string
  } | null
}

export function StationForm({ open, onOpenChange, onSuccess, locationId, station }: StationFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!station

  const form = useForm<CreateStationFormData | UpdateStationFormData>({
    resolver: zodResolver(isEditing ? updateStationSchema : createStationSchema),
    defaultValues: isEditing
      ? { id: station.id, name: station.name }
      : { name: '', locationId },
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
