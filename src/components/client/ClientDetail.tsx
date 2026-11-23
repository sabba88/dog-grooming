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
import { ClientForm } from '@/components/client/ClientForm'
import { ClientNotes } from '@/components/client/ClientNotes'
import { MissingValue } from '@/components/client/MissingValue'
import { isMissingValue, formatPriceOrDash, formatServiceName } from '@/lib/utils/formatting'
import { DogList } from '@/components/dog/DogList'
import { deleteClient } from '@/lib/actions/clients'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, Calendar, Clock } from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'long',
})

const dateTimeFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface Client {
  id: string
  nominativo: string
  phone: string
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
  email: string | null
  createdAt: Date | null
}

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

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
  createdAt: Date | null
}

interface Appointment {
  id: string
  startTime: Date
  endTime: Date
  price: number | null
  notes: string | null
  dogName: string
  serviceName: string | null
}

interface ClientDetailProps {
  client: Client
  notes: Note[]
  dogs: Dog[]
  breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]
  appointments: Appointment[]
  userRole: 'admin' | 'collaborator'
}

/** Coppia etichetta/valore della scheda anagrafica. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function ClientDetail({ client, notes, dogs, breeds, appointments, userRole }: ClientDetailProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { execute: execDelete, isPending: isDeleting } = useAction(deleteClient, {
    onSuccess: () => {
      toast.success('Cliente eliminato')
      router.push('/clients')
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante l\'eliminazione')
    },
  })

  function handleSuccess() {
    router.refresh()
  }

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
        <span className="truncate font-medium text-foreground">{client.nominativo}</span>
      </nav>

      {/* Intestazione: chi e' il cliente e cosa si puo' fare su di lui */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-xl font-medium leading-tight text-foreground">
            {isMissingValue(client.nominativo) ? <MissingValue /> : client.nominativo}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMissingValue(client.phone) ? 'Telefono mancante' : client.phone}
            {dogs.length > 0
              ? ` · ${dogs.length} ${dogs.length === 1 ? 'cane' : 'cani'}`
              : ''}
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

      {/* Dati anagrafici */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Dati anagrafici</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nominativo">
            {isMissingValue(client.nominativo) ? <MissingValue /> : client.nominativo}
          </Field>
          <Field label="Telefono">
            {isMissingValue(client.phone) ? <MissingValue /> : client.phone}
          </Field>
          {(client.owner2 || client.phone2) && (
            <>
              <Field label="Proprietario 2">{client.owner2 || '—'}</Field>
              <Field label="Telefono 2">{client.phone2 || '—'}</Field>
            </>
          )}
          {(client.owner3 || client.phone3) && (
            <>
              <Field label="Proprietario 3">{client.owner3 || '—'}</Field>
              <Field label="Telefono 3">{client.phone3 || '—'}</Field>
            </>
          )}
          <Field label="Email">{client.email || '—'}</Field>
          <Field label="Data registrazione">
            {client.createdAt ? dateFormatter.format(new Date(client.createdAt)) : '—'}
          </Field>
        </div>
      </section>

      {/* Cani associati */}
      <DogList clientId={client.id} dogs={dogs} breeds={breeds} userRole={userRole} />

      {/* Note */}
      <ClientNotes clientId={client.id} notes={notes} />

      {/* Appuntamenti */}
      {(() => {
        const now = new Date()
        const future = appointments
          .filter(a => new Date(a.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        const past = appointments
          .filter(a => new Date(a.startTime) <= now)

        return (
          <div className="flex flex-col gap-6">
            {/* Prossimi appuntamenti */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calendar className="size-4 text-primary" />
                Prossimi appuntamenti
              </h2>
              {future.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nessun appuntamento in programma
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border">
                  {future.map(a => (
                    <li key={a.id} className="flex items-start justify-between gap-4 py-3 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {a.dogName} — {formatServiceName(a.serviceName)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                          <Clock className="size-3.5" />
                          {dateTimeFormatter.format(new Date(a.startTime))}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-primary tabular-nums">
                        {formatPriceOrDash(a.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Storico appuntamenti */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="size-4 text-muted-foreground" />
                Storico appuntamenti
              </h2>
              {past.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nessun appuntamento gia&apos; passato
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border">
                  {past.map(a => (
                    <li key={a.id} className="flex items-start justify-between gap-4 py-3 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {a.dogName} — {formatServiceName(a.serviceName)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                          <Clock className="size-3.5" />
                          {dateTimeFormatter.format(new Date(a.startTime))}
                        </p>
                        {a.notes && (
                          <p className="mt-1.5 rounded-md bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                            {a.notes}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {formatPriceOrDash(a.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )
      })()}

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        client={client}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {client.nominativo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno eliminati anche tutti i cani associati. Questa operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => execDelete({ id: client.id })}
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
