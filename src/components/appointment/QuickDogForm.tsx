'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { z } from 'zod'
import { createDog } from '@/lib/actions/dogs'
import { fetchBreeds } from '@/lib/actions/breeds'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BreedCombobox } from '@/components/dog/BreedCombobox'
import { Loader2, ArrowLeft } from 'lucide-react'

const quickDogSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  breedId: z.string().uuid().nullable().optional(),
})
type QuickDogFormData = z.infer<typeof quickDogSchema>

interface QuickDogFormProps {
  clientId: string
  onCreated: (dog: { id: string; name: string }) => void
  onCancel: () => void
}

export function QuickDogForm({ clientId, onCreated, onCancel }: QuickDogFormProps) {
  const [breedsList, setBreedsList] = useState<{ id: string; name: string }[]>([])

  const { execute: loadBreeds } = useAction(fetchBreeds, {
    onSuccess: ({ data }) => {
      if (data?.breeds) setBreedsList(data.breeds)
    },
  })

  useEffect(() => {
    loadBreeds({})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<QuickDogFormData>({
    resolver: zodResolver(quickDogSchema),
    defaultValues: { name: '', breedId: null },
  })

  const { execute, isPending } = useAction(createDog, {
    onSuccess: ({ data }) => {
      if (data?.dog) {
        toast.success('Cane aggiunto')
        onCreated(data.dog)
      }
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  function onSubmit(data: QuickDogFormData) {
    execute({
      name: data.name,
      breedId: data.breedId ?? null,
      sterilized: false,
      clientId,
    })
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" className="size-8 p-0" onClick={onCancel}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">Nuovo cane</span>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Label htmlFor="qd-name">Nome</Label>
          <Input id="qd-name" {...form.register('name')} autoFocus />
          {form.formState.errors.name && (
            <p className="text-destructive mt-1 text-xs">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Label>Razza (opzionale)</Label>
          <BreedCombobox
            value={form.watch('breedId') ?? null}
            onChange={(val) => form.setValue('breedId', val)}
            breeds={breedsList}
            isAdmin={false}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creazione...
            </>
          ) : (
            'Aggiungi cane'
          )}
        </Button>
      </form>
    </div>
  )
}
