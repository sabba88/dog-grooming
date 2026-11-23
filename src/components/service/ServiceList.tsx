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
  durationSurchargePer30min: number
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
        toast.error(error.error?.serverError || "Errore durante l'eliminazione")
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Servizi</h1>
          {services.length > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {services.length === 1 ? '1 servizio' : `${services.length} servizi`}
            </span>
          )}
        </div>
        {isAdmin && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo servizio
          </Button>
        )}
      </header>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">Nessun servizio configurato</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Il listino e&apos; ancora vuoto: aggiungi un servizio per poterlo scegliere
            quando prendi un appuntamento.
          </p>
          {isAdmin && (
            <Button onClick={handleNew} className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo servizio
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Nome</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Tariffa base</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Durata</TableHead>
                  {isAdmin && (
                    <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
                      Azioni
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{service.name}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatPrice(service.price)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="tabular-nums">{formatDuration(service.duration)}</span>
                      {service.durationSurchargePer30min > 0 && (
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          +{formatPrice(service.durationSurchargePer30min)}/30min
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="shrink-0 font-semibold text-foreground tabular-nums">
                    {formatPrice(service.price)}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatDuration(service.duration)}
                  </p>
                  {service.durationSurchargePer30min > 0 && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      +{formatPrice(service.durationSurchargePer30min)}/30min
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-1 flex gap-2 border-t border-border pt-3">
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
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
              Il servizio verra&apos; rimosso dal listino insieme a tutti i prezzi pelo/taglia configurati.
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
    </div>
  )
}
