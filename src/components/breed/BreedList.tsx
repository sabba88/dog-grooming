'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { BreedForm } from '@/components/breed/BreedForm'
import { deleteBreed } from '@/lib/actions/breeds'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Breed {
  id: string
  name: string
  priceCount: number
}

interface Service {
  id: string
  name: string
  price: number
}

interface BreedListProps {
  breeds: Breed[]
  services: Service[]
}

export function BreedList({ breeds, services }: BreedListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Breed | null>(null)

  const { execute: execDelete, isPending: isDeleting } = useAction(deleteBreed, {
    onSuccess: () => {
      toast.success('Razza eliminata')
      setDeleteTarget(null)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'eliminazione')
      setDeleteTarget(null)
    },
  })

  function handleNew() {
    setEditingBreed(null)
    setFormOpen(true)
  }

  function handleEdit(breed: Breed) {
    setEditingBreed(breed)
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Razze</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Razza
        </Button>
      </div>

      {breeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessuna razza configurata</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi la prima razza
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prezzi configurati</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breeds.map((breed) => (
                  <TableRow key={breed.id}>
                    <TableCell className="font-medium">{breed.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.priceCount === 0
                        ? 'Nessun prezzo specifico'
                        : `${breed.priceCount} ${breed.priceCount === 1 ? 'prezzo' : 'prezzi'} configurati`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(breed)}
                          aria-label={`Modifica ${breed.name}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(breed)}
                          disabled={isDeleting}
                          aria-label={`Elimina ${breed.name}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {breeds.map((breed) => (
              <div key={breed.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{breed.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {breed.priceCount === 0
                      ? 'Nessun prezzo'
                      : `${breed.priceCount} prezzi`}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(breed)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteTarget(breed)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Elimina
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <BreedForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        services={services}
        breed={editingBreed}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminare la razza {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              I cani associati perderanno la razza. I prezzi specifici verranno eliminati.
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
