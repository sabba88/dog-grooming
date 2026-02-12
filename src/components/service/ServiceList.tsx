'use client'

import { useState } from 'react'
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
import { ServiceForm } from '@/components/service/ServiceForm'
import { deleteService } from '@/lib/actions/services'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  price: number
  duration: number
  createdAt: Date | null
}

interface ServiceListProps {
  services: Service[]
  role: 'admin' | 'collaborator'
}

export function ServiceList({ services, role }: ServiceListProps) {
  const router = useRouter()
  const isAdmin = role === 'admin'
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)

  const { execute: execDelete, isPending: isDeleting } = useAction(
    deleteService,
    {
      onSuccess: () => {
        toast.success('Servizio eliminato')
        setDeleteTarget(null)
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.error?.serverError || 'Errore durante l\'eliminazione')
        setDeleteTarget(null)
      },
    }
  )

  function handleNew() {
    setEditingService(null)
    setFormOpen(true)
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Servizi</h1>
        {isAdmin && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Servizio
          </Button>
        )}
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessun servizio configurato</p>
          {isAdmin && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo servizio
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tariffa</TableHead>
                  <TableHead>Durata</TableHead>
                  {isAdmin && <TableHead className="text-right">Azioni</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{formatPrice(service.price)}</TableCell>
                    <TableCell>{formatDuration(service.duration)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            aria-label={`Modifica ${service.name}`}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(service)}
                            disabled={isDeleting}
                            aria-label={`Elimina ${service.name}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="font-semibold text-foreground">{formatPrice(service.price)}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatDuration(service.duration)}</p>
                {isAdmin && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifica
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(service)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Elimina
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isAdmin && (
        <ServiceForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleSuccess}
          service={editingService}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminare il servizio {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Il servizio verra&apos; rimosso dal listino.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  execDelete({ id: deleteTarget.id })
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
