'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
import { createBreed, updateBreed } from '@/lib/actions/breeds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Breed {
  id: string
  name: string
  coatType: string | null
  sizeType: string | null
}

interface BreedFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  breed?: Breed | null
}

export function BreedForm({ open, onOpenChange, onSuccess, breed }: BreedFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!breed

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [coatType, setCoatType] = useState<string>('')
  const [sizeType, setSizeType] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setNameError('')
    setName(isEditing && breed ? breed.name : '')
    setCoatType(isEditing && breed ? breed.coatType ?? '' : '')
    setSizeType(isEditing && breed ? breed.sizeType ?? '' : '')
  }, [open, breed, isEditing])

  const { execute: executeCreate, isPending: isCreating } = useAction(createBreed, {
    onSuccess: () => {
      toast.success('Razza creata')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateBreed, {
    onSuccess: () => {
      toast.success('Razza aggiornata')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'aggiornamento')
    },
  })

  const isPending = isCreating || isUpdating

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Il nome è obbligatorio')
      return
    }
    setNameError('')

    if (isEditing && breed) {
      executeUpdate({
        id: breed.id,
        name: name.trim(),
        coatType: (coatType || undefined) as 'short' | 'medium' | 'long' | undefined,
        sizeType: (sizeType || undefined) as 'toy' | 'small' | 'medium' | 'large' | 'giant' | undefined,
      })
    } else {
      executeCreate({
        name: name.trim(),
        coatType: (coatType || undefined) as 'short' | 'medium' | 'long' | undefined,
        sizeType: (sizeType || undefined) as 'toy' | 'small' | 'medium' | 'large' | 'giant' | undefined,
      })
    }
  }

  const title = isEditing ? 'Modifica Razza' : 'Nuova Razza'

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="breed-name">Nome razza</Label>
        <Input
          id="breed-name"
          placeholder="Es. Labrador Retriever"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!nameError}
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="breed-coat-type">Tipo di Pelo (opzionale)</Label>
        <Select value={coatType} onValueChange={setCoatType}>
          <SelectTrigger id="breed-coat-type">
            <SelectValue placeholder="Seleziona tipo di pelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nessuno</SelectItem>
            <SelectItem value="short">Corto</SelectItem>
            <SelectItem value="medium">Medio</SelectItem>
            <SelectItem value="long">Lungo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="breed-size-type">Taglia (opzionale)</Label>
        <Select value={sizeType} onValueChange={setSizeType}>
          <SelectTrigger id="breed-size-type">
            <SelectValue placeholder="Seleziona taglia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nessuno</SelectItem>
            <SelectItem value="toy">Toy</SelectItem>
            <SelectItem value="small">Piccola</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="giant">Gigante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Razza'}
      </Button>
    </form>
  )

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
