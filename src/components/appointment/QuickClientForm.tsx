'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createClientSchema, type CreateClientFormData } from '@/lib/validations/clients'
import { createClient } from '@/lib/actions/clients'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface QuickClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (client: { id: string; firstName: string; lastName: string }) => void
}

export function QuickClientForm({ open, onOpenChange, onCreated }: QuickClientFormProps) {
  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      consent: false,
    },
  })

  const { execute, isPending } = useAction(createClient, {
    onSuccess: ({ data }) => {
      if (data?.client) {
        toast.success('Cliente creato')
        form.reset()
        onCreated(data.client)
      }
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  function onSubmit(data: CreateClientFormData) {
    execute(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="qc-firstName">Nome</Label>
            <Input id="qc-firstName" {...form.register('firstName')} autoFocus />
            {form.formState.errors.firstName && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="qc-lastName">Cognome</Label>
            <Input id="qc-lastName" {...form.register('lastName')} />
            {form.formState.errors.lastName && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.lastName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="qc-phone">Telefono</Label>
            <Input id="qc-phone" type="tel" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-destructive mt-1 text-xs">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="qc-consent"
              checked={form.watch('consent')}
              onCheckedChange={(checked) => form.setValue('consent', checked === true, { shouldValidate: true })}
            />
            <Label htmlFor="qc-consent" className="text-xs leading-tight">
              Acconsento al trattamento dei dati personali
            </Label>
          </div>
          {form.formState.errors.consent && (
            <p className="text-destructive text-xs">{form.formState.errors.consent.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creazione...
              </>
            ) : (
              'Crea cliente'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
