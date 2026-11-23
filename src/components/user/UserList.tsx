'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserForm } from '@/components/user/UserForm'
import { deactivateUser, reactivateUser } from '@/lib/actions/users'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Users } from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  role: 'admin' | 'collaborator'
  color: string | null
  isActive: boolean
  createdAt: Date | null
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)

  const { execute: execDeactivate, isPending: isDeactivating } = useAction(
    deactivateUser,
    {
      onSuccess: () => {
        toast.success('Utente disattivato')
        setDeactivateTarget(null)
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.error?.serverError || 'Errore durante la disattivazione')
        setDeactivateTarget(null)
      },
    }
  )

  const { execute: execReactivate, isPending: isReactivating } = useAction(
    reactivateUser,
    {
      onSuccess: () => {
        toast.success('Utente riattivato')
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.error?.serverError || 'Errore durante la riattivazione')
      },
    }
  )

  function handleNew() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function handleEdit(user: User) {
    setEditingUser(user)
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  const isActionPending = isDeactivating || isReactivating

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestione Utenze</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chi lavora in salone, con il colore che lo distingue in agenda
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="size-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-medium text-muted-foreground">Nome</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Username</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Ruolo</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Stato</TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {user.color && (
                      <span
                        className="inline-block size-2.5 rounded-full shrink-0 ring-1 ring-border"
                        style={{ backgroundColor: user.color }}
                        aria-hidden
                      />
                    )}
                    {user.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="outline" className="gap-1.5">
                      <span className="size-1.5 rounded-full bg-brand-success" aria-hidden />
                      Attivo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1.5 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden />
                      Disattivo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      aria-label={`Modifica ${user.name}`}
                    >
                      <Pencil className="size-4 mr-1" />
                      Modifica
                    </Button>
                    {user.id !== currentUserId && (
                      user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeactivateTarget(user)}
                          disabled={isActionPending}
                          aria-label={`Disattiva ${user.name}`}
                        >
                          Disattiva
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => execReactivate({ userId: user.id })}
                          disabled={isActionPending}
                          aria-label={`Riattiva ${user.name}`}
                        >
                          Riattiva
                        </Button>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                {user.color && (
                  <span
                    className="inline-block size-2.5 rounded-full shrink-0 mt-1.5 ring-1 ring-border"
                    style={{ backgroundColor: user.color }}
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Admin' : 'Collab.'}
                </Badge>
                {user.isActive ? (
                  <Badge variant="outline" className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand-success" aria-hidden />
                    Attivo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5 text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden />
                    Disattivo
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(user)}
                className="flex-1"
              >
                <Pencil className="size-4 mr-1" />
                Modifica
              </Button>
              {user.id !== currentUserId && (
                user.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeactivateTarget(user)}
                    disabled={isActionPending}
                  >
                    Disattiva
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => execReactivate({ userId: user.id })}
                    disabled={isActionPending}
                  >
                    Riattiva
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <Users className="size-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Nessun utente trovato</p>
            <p className="text-sm text-muted-foreground">
              Crea il primo utente per assegnare appuntamenti e turni
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Aggiungi il primo utente
          </Button>
        </div>
      )}

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        user={editingUser}
      />

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disattivare l&apos;utente {deactivateTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utente non potra&apos; piu&apos; accedere al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  execDeactivate({ userId: deactivateTarget.id })
                }
              }}
              disabled={isDeactivating}
            >
              {isDeactivating ? 'Disattivazione...' : 'Disattiva'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
