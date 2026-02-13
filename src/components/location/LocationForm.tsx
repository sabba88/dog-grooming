'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createLocationSchema,
  updateLocationSchema,
  type CreateLocationFormData,
  type UpdateLocationFormData,
} from '@/lib/validations/locations'
import { createLocation, updateLocation } from '@/lib/actions/locations'
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

interface LocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  location?: {
    id: string
    name: string
    address: string
  } | null
}

export function LocationForm({ open, onOpenChange, onSuccess, location }: LocationFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!location

  const form = useForm<CreateLocationFormData | UpdateLocationFormData>({
    resolver: zodResolver(isEditing ? updateLocationSchema : createLocationSchema),
    defaultValues: isEditing
      ? {
          id: location.id,
          name: location.name,
          address: location.address,
        }
      : { name: '', address: '' },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createLocation, {
    onSuccess: () => {
      toast.success('Sede creata')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateLocation, {
    onSuccess: () => {
      toast.success('Sede aggiornata')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'aggiornamento')
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateLocationFormData | UpdateLocationFormData) {
    if (isEditing) {
      executeUpdate(data as UpdateLocationFormData)
    } else {
      executeCreate(data as CreateLocationFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Es. Sede Centrale"
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
        <Label htmlFor="address">Indirizzo</Label>
        <Input
          id="address"
          placeholder="Es. Via Roma 1, Milano"
          {...form.register('address')}
          aria-invalid={!!form.formState.errors.address}
        />
        {form.formState.errors.address && (
          <p className="text-sm text-destructive">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Crea Sede'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Sede' : 'Nuova Sede'

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
