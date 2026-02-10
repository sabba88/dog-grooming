'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/lib/validations/users'
import { createUser, updateUser } from '@/lib/actions/users'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user?: {
    id: string
    name: string
    email: string
    role: 'admin' | 'collaborator'
  } | null
}

export function UserForm({ open, onOpenChange, onSuccess, user }: UserFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!user
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing
      ? { id: user.id, name: user.name, email: user.email, role: user.role, password: '' }
      : { name: '', email: '', password: '', role: 'collaborator' as const },
  })

  const { execute: executeCreate, isPending: isCreating } = useAction(createUser, {
    onSuccess: () => {
      toast.success('Utente creato')
      form.reset()
      setServerError(null)
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      const message = error.error?.serverError || 'Errore durante la creazione'
      if (message.includes('Email')) {
        setServerError(message)
      } else {
        toast.error(message)
      }
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateUser, {
    onSuccess: () => {
      toast.success('Utente aggiornato')
      form.reset()
      setServerError(null)
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      const message = error.error?.serverError || 'Errore durante l\'aggiornamento'
      if (message.includes('Email')) {
        setServerError(message)
      } else {
        toast.error(message)
      }
    },
  })

  const isPending = isCreating || isUpdating

  function onSubmit(data: CreateUserFormData | UpdateUserFormData) {
    setServerError(null)
    if (isEditing) {
      executeUpdate(data as UpdateUserFormData)
    } else {
      executeCreate(data as CreateUserFormData)
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Nome completo"
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@esempio.it"
          {...form.register('email')}
          aria-invalid={!!form.formState.errors.email || !!serverError}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">
          Password{isEditing && ' (lascia vuoto per non modificare)'}
        </Label>
        <Input
          id="password"
          type="password"
          placeholder={isEditing ? 'Nuova password (opzionale)' : 'Minimo 6 caratteri'}
          {...form.register('password')}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Ruolo</Label>
        <Select
          defaultValue={isEditing ? user.role : 'collaborator'}
          onValueChange={(value) =>
            form.setValue('role', value as 'admin' | 'collaborator')
          }
        >
          <SelectTrigger id="role" aria-label="Seleziona ruolo">
            <SelectValue placeholder="Seleziona ruolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Amministratore</SelectItem>
            <SelectItem value="collaborator">Collaboratore</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.role && (
          <p className="text-sm text-destructive">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      {isEditing && <input type="hidden" {...form.register('id')} />}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? 'Salvataggio...'
          : isEditing
            ? 'Salva Modifiche'
            : 'Crea Utente'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Modifica Utente' : 'Nuovo Utente'

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
