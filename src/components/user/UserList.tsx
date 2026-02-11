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
import { Plus, Pencil } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
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
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Gestione Utenze</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                    {user.isActive ? 'Attivo' : 'Disattivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      aria-label={`Modifica ${user.name}`}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifica
                    </Button>
                    {user.id !== currentUserId && (
                      user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
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
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Admin' : 'Collab.'}
                </Badge>
                <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                  {user.isActive ? 'Attivo' : 'Disattivo'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(user)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Modifica
              </Button>
              {user.id !== currentUserId && (
                user.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessun utente trovato</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
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
    </>
  )
}
