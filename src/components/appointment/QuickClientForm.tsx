'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createClientSchema, type CreateClientFormData } from '@/lib/validations/clients'
import { createClient } from '@/lib/actions/clients'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MissingContactDialog } from '@/components/client/MissingContactDialog'
import { Loader2, ArrowLeft } from 'lucide-react'

interface QuickClientFormProps {
  onCreated: (client: { id: string; nominativo: string }) => void
  onCancel: () => void
}

export function QuickClientForm({ onCreated, onCancel }: QuickClientFormProps) {
  const [missingContactOpen, setMissingContactOpen] = useState(false)
  const [pendingCreate, setPendingCreate] = useState<CreateClientFormData | null>(null)

  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      nominativo: '',
      phone: '',
      owner2: '',
      phone2: '',
      owner3: '',
      phone3: '',
      email: '',
      notes: '',
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
    if (!data.nominativo.trim() || !data.phone.trim()) {
      setPendingCreate(data)
      setMissingContactOpen(true)
      return
    }

    execute(data)
  }

  function onConfirmMissingContact() {
    if (pendingCreate) {
      execute(pendingCreate)
      setPendingCreate(null)
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={onCancel}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">Nuovo cliente</span>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Label htmlFor="qc-nominativo">Nominativo</Label>
          <Input id="qc-nominativo" {...form.register('nominativo')} autoFocus />
          {form.formState.errors.nominativo && (
            <p className="text-destructive mt-1 text-xs">{form.formState.errors.nominativo.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="qc-phone">Telefono</Label>
          <Input id="qc-phone" type="tel" {...form.register('phone')} />
          {form.formState.errors.phone && (
            <p className="text-destructive mt-1 text-xs">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="qc-owner2">Proprietario 2 (opzionale)</Label>
            <Input id="qc-owner2" placeholder="Nome" {...form.register('owner2')} />
          </div>
          <div>
            <Label htmlFor="qc-phone2">Telefono 2 (opzionale)</Label>
            <Input id="qc-phone2" type="tel" placeholder="Numero" {...form.register('phone2')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="qc-owner3">Proprietario 3 (opzionale)</Label>
            <Input id="qc-owner3" placeholder="Nome" {...form.register('owner3')} />
          </div>
          <div>
            <Label htmlFor="qc-phone3">Telefono 3 (opzionale)</Label>
            <Input id="qc-phone3" type="tel" placeholder="Numero" {...form.register('phone3')} />
          </div>
        </div>
        <div>
          <Label htmlFor="qc-notes">Note (opzionale)</Label>
          <Textarea
            id="qc-notes"
            placeholder="Indicazioni utili sul cliente..."
            rows={2}
            maxLength={2000}
            {...form.register('notes')}
          />
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
      <MissingContactDialog
        open={missingContactOpen}
        onOpenChange={setMissingContactOpen}
        onConfirm={onConfirmMissingContact}
      />
    </div>
  )
}
