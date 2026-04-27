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
    nominativo: string
    phone: string
    owner2: string | null
    phone2: string | null
    owner3: string | null
    phone3: string | null
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
          nominativo: client.nominativo,
          phone: client.phone,
          owner2: client.owner2 || '',
          phone2: client.phone2 || '',
          owner3: client.owner3 || '',
          phone3: client.phone3 || '',
          email: client.email || '',
        }
      : { nominativo: '', phone: '', owner2: '', phone2: '', owner3: '', phone3: '', email: '', consent: false },
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
        <Label htmlFor="nominativo">Nominativo</Label>
        <Input
          id="nominativo"
          placeholder="Es. Mario Rossi"
          {...form.register('nominativo')}
          aria-invalid={!!form.formState.errors.nominativo}
        />
        {form.formState.errors.nominativo && (
          <p className="text-sm text-destructive">
            {form.formState.errors.nominativo.message}
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="owner2">Proprietario 2 (opzionale)</Label>
          <Input
            id="owner2"
            placeholder="Nome"
            {...form.register('owner2')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone2">Telefono 2 (opzionale)</Label>
          <Input
            id="phone2"
            placeholder="Numero"
            {...form.register('phone2')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="owner3">Proprietario 3 (opzionale)</Label>
          <Input
            id="owner3"
            placeholder="Nome"
            {...form.register('owner3')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone3">Telefono 3 (opzionale)</Label>
          <Input
            id="phone3"
            placeholder="Numero"
            {...form.register('phone3')}
          />
        </div>
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
