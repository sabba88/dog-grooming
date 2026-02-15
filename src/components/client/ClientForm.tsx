'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientFormData,
  type UpdateClientFormData,
} from '@/lib/validations/clients'
import { createClient, updateClient } from '@/lib/actions/clients'
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

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  client?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string | null
  } | null
}

export function ClientForm({ open, onOpenChange, onSuccess, client }: ClientFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!client

  const form = useForm<CreateClientFormData | UpdateClientFormData>({
    resolver: zodResolver(isEditing ? updateClientSchema : createClientSchema),
    defaultValues: isEditing
      ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email || '',
        }
      : { firstName: '', lastName: '', phone: '', email: '', consent: false },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createClient, {
    onSuccess: () => {
      toast.success('Cliente creato')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateClient, {
    onSuccess: () => {
      toast.success('Cliente aggiornato')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento")
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateClientFormData | UpdateClientFormData) {
    if (isEditing) {
      executeUpdate(data as UpdateClientFormData)
    } else {
      executeCreate(data as CreateClientFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">Nome</Label>
        <Input
          id="firstName"
          placeholder="Es. Mario"
          {...form.register('firstName')}
          aria-invalid={!!form.formState.errors.firstName}
        />
        {form.formState.errors.firstName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.firstName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">Cognome</Label>
        <Input
          id="lastName"
          placeholder="Es. Rossi"
          {...form.register('lastName')}
          aria-invalid={!!form.formState.errors.lastName}
        />
        {form.formState.errors.lastName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.lastName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefono</Label>
        <Input
          id="phone"
          placeholder="Es. 333 1234567"
          {...form.register('phone')}
          aria-invalid={!!form.formState.errors.phone}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email (opzionale)</Label>
        <Input
          id="email"
          type="email"
          placeholder="Es. mario.rossi@email.com"
          {...form.register('email')}
          aria-invalid={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {!isEditing && (
        <div className="flex flex-col gap-2">
          <Controller
            name="consent"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={!!(form.formState.errors as Record<string, unknown>).consent}
                />
                <span className="text-sm text-foreground leading-tight">
                  Acconsento al trattamento dei dati personali
                </span>
              </label>
            )}
          />
          {(form.formState.errors as Record<string, { message?: string }>).consent && (
            <p className="text-sm text-destructive">
              {(form.formState.errors as Record<string, { message?: string }>).consent?.message}
            </p>
          )}
        </div>
      )}

      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Crea Cliente'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'

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
