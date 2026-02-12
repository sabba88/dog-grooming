'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceFormData,
  type UpdateServiceFormData,
} from '@/lib/validations/services'
import { createService, updateService } from '@/lib/actions/services'
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

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  service?: {
    id: string
    name: string
    price: number
    duration: number
  } | null
}

export function ServiceForm({ open, onOpenChange, onSuccess, service }: ServiceFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!service

  const form = useForm<CreateServiceFormData | UpdateServiceFormData>({
    resolver: zodResolver(isEditing ? updateServiceSchema : createServiceSchema),
    defaultValues: isEditing
      ? {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
        }
      : { name: '', price: 0, duration: 0 },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createService, {
    onSuccess: () => {
      toast.success('Servizio creato')
      form.reset()
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
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'aggiornamento')
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateServiceFormData | UpdateServiceFormData) {
    // Price arrives in cents from the form's valueAsNumber + manual conversion
    if (isEditing) {
      executeUpdate(data as UpdateServiceFormData)
    } else {
      executeCreate(data as CreateServiceFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Es. Taglio e piega"
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
        <Label htmlFor="price">Tariffa (EUR)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Es. 25.00"
          {...form.register('price', {
            setValueAs: (v: string) => {
              const num = parseFloat(v)
              if (isNaN(num)) return 0
              return Math.round(num * 100)
            },
          })}
          defaultValue={isEditing ? (service.price / 100).toFixed(2) : ''}
          aria-invalid={!!form.formState.errors.price}
        />
        {form.formState.errors.price && (
          <p className="text-sm text-destructive">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

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
          <p className="text-sm text-destructive">
            {form.formState.errors.duration.message}
          </p>
        )}
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
