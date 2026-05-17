'use client'

import { useForm, Controller, useWatch } from 'react-hook-form'
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
import { BreedCombobox } from '@/components/dog/BreedCombobox'

interface DogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clientId: string
  breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]
  userRole: 'admin' | 'collaborator'
  dog?: {
    id: string
    name: string
    breedId: string | null
    coatType: string | null
    sizeType: string | null
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

export function DogForm({ open, onOpenChange, onSuccess, clientId, breeds, userRole, dog }: DogFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!dog

  const form = useForm<CreateDogFormData | UpdateDogFormData>({
    resolver: zodResolver(isEditing ? updateDogSchema : createDogSchema),
    defaultValues: isEditing
      ? {
          id: dog.id,
          name: dog.name,
          breedId: dog.breedId || null,
          coatType: (dog.coatType as 'short' | 'medium' | 'long') || '',
          sizeType: (dog.sizeType as 'toy' | 'small' | 'medium' | 'large' | 'giant') || '',
          size: (dog.size as 'piccola' | 'media' | 'grande') || '',
          dateOfBirth: formatDateForInput(dog.dateOfBirth),
          sex: (dog.sex as 'maschio' | 'femmina') || '',
          sterilized: dog.sterilized,
        }
      : { name: '', breedId: null, coatType: '', sizeType: '', size: '', dateOfBirth: '', sex: '', sterilized: false, clientId },
  })

  const watchedBreedId = useWatch({ control: form.control, name: 'breedId' })
  const watchedCoatType = useWatch({ control: form.control, name: 'coatType' })
  const watchedSizeType = useWatch({ control: form.control, name: 'sizeType' })

  const selectedBreed = breeds.find(b => b.id === watchedBreedId)
  const coatFromBreed = !!selectedBreed?.coatType && watchedCoatType === selectedBreed.coatType
  const sizeFromBreed = !!selectedBreed?.sizeType && watchedSizeType === selectedBreed.sizeType

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
        <Label>Razza (opzionale)</Label>
        <Controller
          name="breedId"
          control={form.control}
          render={({ field }) => (
            <BreedCombobox
              value={field.value}
              onChange={(newBreedId) => {
                field.onChange(newBreedId)
                if (newBreedId) {
                  const breed = breeds.find(b => b.id === newBreedId)
                  if (breed?.coatType) form.setValue('coatType', breed.coatType as 'short' | 'medium' | 'long')
                  if (breed?.sizeType) form.setValue('sizeType', breed.sizeType as 'toy' | 'small' | 'medium' | 'large' | 'giant')
                }
              }}
              breeds={breeds}
              isAdmin={userRole === 'admin'}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="coatType">Tipo di Pelo (opzionale)</Label>
        <Controller
          name="coatType"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
              <SelectTrigger id="coatType">
                <SelectValue placeholder="Seleziona tipo di pelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nessuno</SelectItem>
                <SelectItem value="short">Corto</SelectItem>
                <SelectItem value="medium">Medio</SelectItem>
                <SelectItem value="long">Lungo</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {coatFromBreed && (
          <p className="text-xs text-muted-foreground">Valore ereditato dalla razza — puoi modificarlo</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sizeType">Taglia (opzionale)</Label>
        <Controller
          name="sizeType"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
              <SelectTrigger id="sizeType">
                <SelectValue placeholder="Seleziona taglia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nessuno</SelectItem>
                <SelectItem value="toy">Toy</SelectItem>
                <SelectItem value="small">Piccola</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
                <SelectItem value="giant">Gigante</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {sizeFromBreed && (
          <p className="text-xs text-muted-foreground">Valore ereditato dalla razza — puoi modificarlo</p>
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
