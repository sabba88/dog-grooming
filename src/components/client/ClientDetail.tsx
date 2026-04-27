'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ClientForm } from '@/components/client/ClientForm'
import { ClientNotes } from '@/components/client/ClientNotes'
import { DogList } from '@/components/dog/DogList'
import { ArrowLeft, Pencil, Calendar, Clock } from 'lucide-react'

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
  price: number
  notes: string | null
  dogName: string
  serviceName: string
}

interface ClientDetailProps {
  client: Client
  notes: Note[]
  dogs: Dog[]
  breeds: { id: string; name: string }[]
  appointments: Appointment[]
  userRole: 'admin' | 'collaborator'
}

export function ClientDetail({ client, notes, dogs, breeds, appointments, userRole }: ClientDetailProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Clienti
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{client.nominativo}</span>
      </div>

      {/* Dati Anagrafici */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Dati Anagrafici</h2>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Modifica
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nominativo</p>
            <p className="text-sm text-foreground">{client.nominativo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Telefono</p>
            <p className="text-sm text-foreground">{client.phone}</p>
          </div>
          {(client.owner2 || client.phone2) && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Proprietario 2</p>
                <p className="text-sm text-foreground">{client.owner2 || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefono 2</p>
                <p className="text-sm text-foreground">{client.phone2 || '—'}</p>
              </div>
            </>
          )}
          {(client.owner3 || client.phone3) && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Proprietario 3</p>
                <p className="text-sm text-foreground">{client.owner3 || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefono 3</p>
                <p className="text-sm text-foreground">{client.phone3 || '—'}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm text-foreground">{client.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Data registrazione</p>
            <p className="text-sm text-foreground">
              {client.createdAt ? dateFormatter.format(new Date(client.createdAt)) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Cani Associati */}
      <DogList clientId={client.id} dogs={dogs} breeds={breeds} userRole={userRole} />

      <Separator className="my-6" />

      {/* Note */}
      <div className="mb-6">
        <ClientNotes clientId={client.id} notes={notes} />
      </div>

      <Separator className="my-6" />

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
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-brand-primary" />
                <h2 className="text-lg font-semibold text-foreground">Prossimi Appuntamenti</h2>
              </div>
              {future.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun appuntamento futuro</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {future.map(a => (
                    <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {a.dogName} — {a.serviceName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {dateTimeFormatter.format(new Date(a.startTime))}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-brand-primary shrink-0">
                          {(a.price / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Storico appuntamenti */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Storico Appuntamenti</h2>
              </div>
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun appuntamento registrato</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {past.map(a => (
                    <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {a.dogName} — {a.serviceName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {dateTimeFormatter.format(new Date(a.startTime))}
                          </p>
                          {a.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{a.notes}</p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {(a.price / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        client={client}
      />
    </>
  )
}
