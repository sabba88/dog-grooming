'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { DogForm } from '@/components/dog/DogForm'
import { DogNotes } from '@/components/dog/DogNotes'
import { deleteDog } from '@/lib/actions/dogs'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { formatPriceOrDash, formatServiceName } from '@/lib/utils/formatting'
import type { LastDogVisit } from '@/lib/queries/appointments'

interface Dog {
  id: string
  name: string
  breedId: string | null
  breedName: string | null
  coatType: string | null
  sizeType: string | null
  breedCoatType: string | null
  breedSizeType: string | null
  size: string | null
  dateOfBirth: Date | null
  sex: string | null
  sterilized: boolean
  clientId: string
  createdAt: Date | null
  updatedAt: Date | null
  clientNominativo: string
}

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

interface ServiceNote {
  id: string
  startTime: Date
  serviceName: string | null
  notes: string | null
}

interface DogDetailProps {
  dog: Dog
  notes: Note[]
  breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]
  serviceNotes: ServiceNote[]
  /** Ultima prestazione gia' avvenuta: chi ha fatto il cane, con cosa e a quanto. */
  lastVisit: LastDogVisit | null
  userRole: 'admin' | 'collaborator'
}

const COAT_TYPE_LABELS: Record<string, string> = {
  short: 'Corto', medium: 'Medio', long: 'Lungo',
}
const SIZE_TYPE_LABELS: Record<string, string> = {
  toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante',
}

const sexLabel: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

/** Coppia etichetta/valore della scheda del cane. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function DogDetail({ dog, notes, breeds, serviceNotes, lastVisit, userRole }: DogDetailProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { execute: execDelete, isPending: isDeleting } = useAction(deleteDog, {
    onSuccess: () => {
      toast.success('Cane eliminato')
      router.push(`/clients/${dog.clientId}`)
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'eliminazione')
    },
  })

  function handleSuccess() {
    router.refresh()
  }

  const effectiveCoatType = dog.coatType ?? dog.breedCoatType ?? null
  const effectiveSizeType = dog.sizeType ?? dog.breedSizeType ?? null
  const coatFromBreed = !dog.coatType && !!dog.breedCoatType
  const sizeFromBreed = !dog.sizeType && !!dog.breedSizeType

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/clients')}
        >
          <ArrowLeft className="size-4 mr-1" />
          Clienti
        </Button>
        <span className="text-muted-foreground">/</span>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(`/clients/${dog.clientId}`)}
        >
          {dog.clientNominativo}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="truncate font-medium text-foreground">{dog.name}</span>
      </nav>

      {/* Intestazione: il cane, la sua razza, e le azioni su di lui */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-xl font-medium leading-tight text-foreground">{dog.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dog.breedName ?? 'Razza non indicata'} · {dog.clientNominativo}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="size-4 mr-1" />
            Modifica
          </Button>
          {userRole === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4 mr-1" />
              Elimina
            </Button>
          )}
        </div>
      </header>

      {/* Dati del cane */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Dati del cane</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome">{dog.name}</Field>
          <Field label="Razza">{dog.breedName || '—'}</Field>
          <Field label="Data di nascita">
            {dog.dateOfBirth ? dateFormatter.format(dog.dateOfBirth) : '—'}
          </Field>
          <Field label="Sesso">{dog.sex ? sexLabel[dog.sex] || dog.sex : '—'}</Field>
          <Field label="Sterilizzato">{dog.sterilized ? 'Si' : 'No'}</Field>

          {/* Profilo prezzo — pelo e taglia effettivi */}
          {(effectiveCoatType || effectiveSizeType) && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Profilo prezzo</p>
              <p className="mt-1 text-sm font-medium text-primary">
                {effectiveCoatType && (
                  <>
                    Pelo {COAT_TYPE_LABELS[effectiveCoatType]}
                    {coatFromBreed && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">(da razza)</span>
                    )}
                  </>
                )}
                {effectiveCoatType && effectiveSizeType && ' · '}
                {effectiveSizeType && (
                  <>
                    Taglia {SIZE_TYPE_LABELS[effectiveSizeType]}
                    {sizeFromBreed && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">(da razza)</span>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Avviso: senza pelo e taglia il prezzo non si calcola dalla matrice */}
          {!effectiveCoatType && !effectiveSizeType && (
            <div className="sm:col-span-2 rounded-md border border-slot-understaffed bg-slot-understaffed/40 px-3 py-2">
              <p className="text-sm font-medium text-brand-warning">
                Pelo e taglia non configurati
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Gli appuntamenti useranno il prezzo base del servizio
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Ultima prestazione: chi ha fatto il cane l'ultima volta */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Ultima prestazione</h2>
        {!lastVisit ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Questo cane non e&apos; ancora passato in toelettatura
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fatto da">
              <span className="font-medium">
                {lastVisit.userName ?? 'Collaboratore non registrato'}
              </span>
            </Field>
            <Field label="Quando">
              {format(new Date(lastVisit.startTime), 'd MMMM yyyy', { locale: it })}
            </Field>
            <Field label="Servizio">{formatServiceName(lastVisit.serviceName)}</Field>
            <Field label="Prezzo">
              <span className="tabular-nums">{formatPriceOrDash(lastVisit.price)}</span>
            </Field>
            {lastVisit.stationName && (
              <Field label="Postazione">{lastVisit.stationName}</Field>
            )}
          </div>
        )}
      </section>

      {/* Note sul cane */}
      <DogNotes dogId={dog.id} notes={notes} />

      {/* Storico note prestazione */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Note delle prestazioni</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Quello che e&apos; stato scritto volta per volta a fine lavoro
        </p>
        {serviceNotes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nessuna nota di prestazione registrata
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {serviceNotes.map((note) => (
              <li key={note.id} className="rounded-md border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(note.startTime), 'd MMM yyyy', { locale: it })} · {formatServiceName(note.serviceName)}
                </p>
                <p className="mt-1 text-sm text-foreground">{note.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        clientId={dog.clientId}
        breeds={breeds}
        userRole={userRole}
        dog={dog}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {dog.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Il cane verrà eliminato. Lo storico appuntamenti resterà invariato. Questa operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => execDelete({ id: dog.id })}
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
