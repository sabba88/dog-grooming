'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ClientForm } from '@/components/client/ClientForm'
import { ClientNotes } from '@/components/client/ClientNotes'
import { ArrowLeft, Pencil } from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'long',
})

interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  createdAt: Date | null
}

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

interface ClientDetailProps {
  client: Client
  notes: Note[]
}

export function ClientDetail({ client, notes }: ClientDetailProps) {
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
        <span className="text-sm font-medium text-foreground">
          {client.firstName} {client.lastName}
        </span>
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
            <p className="text-xs text-muted-foreground mb-1">Nome</p>
            <p className="text-sm text-foreground">{client.firstName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cognome</p>
            <p className="text-sm text-foreground">{client.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Telefono</p>
            <p className="text-sm text-foreground">{client.phone}</p>
          </div>
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

      {/* Cani Associati — placeholder per Story 3.2 */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Cani Associati</h2>
        <p className="text-sm text-muted-foreground">
          Nessun cane associato — I cani verranno gestiti nella prossima funzionalità
        </p>
      </div>

      <Separator className="my-6" />

      {/* Note */}
      <div className="mb-6">
        <ClientNotes clientId={client.id} notes={notes} />
      </div>

      <Separator className="my-6" />

      {/* Storico Appuntamenti — placeholder per Epica 4 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Storico Appuntamenti</h2>
        <p className="text-sm text-muted-foreground">Nessun appuntamento registrato</p>
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        client={client}
      />
    </>
  )
}
