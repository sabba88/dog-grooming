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
  coatType: string | null
  sizeType: string | null
}

interface BreedListProps {
  breeds: Breed[]
}

export function BreedList({ breeds }: BreedListProps) {
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold leading-tight text-foreground">Razze</h1>
          <p className="text-sm text-muted-foreground">
            {breeds.length === 0
              ? 'Pelo e taglia della razza diventano il profilo prezzo dei cani'
              : `${breeds.length} ${breeds.length === 1 ? 'razza configurata' : 'razze configurate'}`}
          </p>
        </div>
        <Button onClick={handleNew} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Nuova razza
        </Button>
      </header>

      {breeds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nessuna razza configurata: senza razze, pelo e taglia vanno indicati cane per cane
          </p>
          <Button onClick={handleNew} className="mt-4">
            <Plus className="size-4 mr-2" />
            Aggiungi la prima razza
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: tabella */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pelo</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breeds.map((breed) => (
                  <TableRow key={breed.id}>
                    <TableCell className="font-medium">{breed.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.coatType === 'short' ? 'Corto' : breed.coatType === 'medium' ? 'Medio' : breed.coatType === 'long' ? 'Lungo' : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.sizeType === 'toy' ? 'Toy' : breed.sizeType === 'small' ? 'Piccola' : breed.sizeType === 'medium' ? 'Media' : breed.sizeType === 'large' ? 'Grande' : breed.sizeType === 'giant' ? 'Gigante' : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(breed)}
                          aria-label={`Modifica ${breed.name}`}
                        >
                          <Pencil className="size-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(breed)}
                          disabled={isDeleting}
                          aria-label={`Elimina ${breed.name}`}
                        >
                          <Trash2 className="size-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: schede */}
          <div className="flex flex-col gap-3 md:hidden">
            {breeds.map((breed) => (
              <div key={breed.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="font-medium text-foreground">{breed.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {breed.coatType || breed.sizeType ? (
                    <>
                      {breed.coatType && `Pelo ${breed.coatType === 'short' ? 'Corto' : breed.coatType === 'medium' ? 'Medio' : 'Lungo'}`}
                      {breed.coatType && breed.sizeType && ' · '}
                      {breed.sizeType && `Taglia ${breed.sizeType === 'toy' ? 'Toy' : breed.sizeType === 'small' ? 'Piccola' : breed.sizeType === 'medium' ? 'Media' : breed.sizeType === 'large' ? 'Grande' : 'Gigante'}`}
                    </>
                  ) : (
                    'Pelo e taglia non indicati'
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(breed)}
                    className="flex-1"
                  >
                    <Pencil className="size-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(breed)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4 mr-1" />
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
              I cani associati perderanno la razza.
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
