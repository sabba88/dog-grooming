'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createDogSchema,
  updateDogSchema,
  type CreateDogFormData,
  type UpdateDogFormData,
} from '@/lib/validations/dogs'
import { createDog, updateDog } from '@/lib/actions/dogs'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface DogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clientId: string
  dog?: {
    id: string
    name: string
    breed: string | null
    size: string | null
    dateOfBirth: Date | null
    sex: string | null
    sterilized: boolean
  } | null
}

function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

export function DogForm({ open, onOpenChange, onSuccess, clientId, dog }: DogFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!dog

  const form = useForm<CreateDogFormData | UpdateDogFormData>({
    resolver: zodResolver(isEditing ? updateDogSchema : createDogSchema),
    defaultValues: isEditing
      ? {
          id: dog.id,
          name: dog.name,
          breed: dog.breed || '',
          size: (dog.size as 'piccola' | 'media' | 'grande') || '',
          dateOfBirth: formatDateForInput(dog.dateOfBirth),
          sex: (dog.sex as 'maschio' | 'femmina') || '',
          sterilized: dog.sterilized,
        }
      : { name: '', breed: '', size: '', dateOfBirth: '', sex: '', sterilized: false, clientId },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createDog, {
    onSuccess: () => {
      toast.success('Cane aggiunto')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiunta")
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateDog, {
    onSuccess: () => {
      toast.success('Cane aggiornato')
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento")
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateDogFormData | UpdateDogFormData) {
    if (isEditing) {
      executeUpdate(data as UpdateDogFormData)
    } else {
      executeCreate(data as CreateDogFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Es. Fido"
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
        <Label htmlFor="breed">Razza (opzionale)</Label>
        <Input
          id="breed"
          placeholder="Es. Labrador"
          {...form.register('breed')}
          aria-invalid={!!form.formState.errors.breed}
        />
        {form.formState.errors.breed && (
          <p className="text-sm text-destructive">
            {form.formState.errors.breed.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="size">Taglia (opzionale)</Label>
        <Controller
          name="size"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || ''}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger id="size" aria-invalid={!!form.formState.errors.size}>
                <SelectValue placeholder="Seleziona taglia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piccola">Piccola</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.size && (
          <p className="text-sm text-destructive">
            {form.formState.errors.size.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dateOfBirth">Data di Nascita (opzionale)</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...form.register('dateOfBirth')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sex">Sesso (opzionale)</Label>
        <Controller
          name="sex"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || ''}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger id="sex">
                <SelectValue placeholder="Seleziona sesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maschio">Maschio</SelectItem>
                <SelectItem value="femmina">Femmina</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="sterilized"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              id="sterilized"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="sterilized" className="cursor-pointer">Sterilizzato</Label>
      </div>

      {!isEditing && <input type="hidden" {...form.register('clientId')} />}
      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Aggiungi Cane'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Cane' : 'Nuovo Cane'

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
