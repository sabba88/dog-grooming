'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ClientForm } from '@/components/client/ClientForm'
import { MissingValue } from '@/components/client/MissingValue'
import { AlertTriangle, Plus, Search, X } from 'lucide-react'
import { COAT_LABELS, SIZE_LABELS } from '@/lib/types'
import type { ClientDogSummary } from '@/lib/queries/clients'
import { isMissingValue } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils'

// Le tre caratteristiche del cane che contano: la razza per riconoscerlo,
// pelo e taglia perche' da quelli dipende il prezzo del servizio.
function dogDetailParts(dog: ClientDogSummary): { label: string; missing: boolean }[] {
  return [
    { label: dog.breedName ?? 'Razza', missing: !dog.breedName },
    {
      label: dog.coatType
        ? `Pelo ${COAT_LABELS[dog.coatType as keyof typeof COAT_LABELS] ?? dog.coatType}`
        : 'Pelo',
      missing: !dog.coatType,
    },
    {
      label: dog.sizeType
        ? `Taglia ${SIZE_LABELS[dog.sizeType as keyof typeof SIZE_LABELS] ?? dog.sizeType}`
        : 'Taglia',
      missing: !dog.sizeType,
    },
  ]
}

function formatDogDetails(dog: ClientDogSummary): string {
  return dogDetailParts(dog)
    .map((p) => (p.missing ? `${p.label} mancante` : p.label))
    .join(' · ')
}

/**
 * Elenco in italiano dei dati mancanti del cliente, per l'avviso in riga.
 * Si ferma a cio' che blocca il lavoro: contatti per richiamarlo, pelo e taglia
 * dei cani perche' senza quelli il prezzo del servizio non si calcola.
 */
function missingClientData(client: Client): string[] {
  const missing: string[] = []
  if (isMissingValue(client.nominativo)) missing.push('nominativo')
  if (isMissingValue(client.phone)) missing.push('telefono')
  for (const dog of client.dogs) {
    for (const part of dogDetailParts(dog)) {
      if (part.missing) missing.push(`${part.label.toLowerCase()} di ${dog.name}`)
    }
  }
  return missing
}

function MissingDataWarning({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-destructive"
      title={`Dati mancanti: ${missing.join(', ')}`}
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{missing.length}</span>
    </span>
  )
}

function DogDetails({ dog }: { dog: ClientDogSummary }) {
  return (
    <span className="text-xs text-muted-foreground">
      {dogDetailParts(dog).map((part, i) => (
        <span key={part.label}>
          {i > 0 && ' · '}
          <span className={part.missing ? 'font-medium text-destructive' : undefined}>
            {part.missing ? `${part.label} mancante` : part.label}
          </span>
        </span>
      ))}
    </span>
  )
}

function getInitials(nominativo: string): string {
  const parts = nominativo.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return nominativo.substring(0, 2).toUpperCase()
}

function formatLastAppointment(date: Date | null | string): { label: string; days: string } | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const days = Math.floor(diffMs / 86_400_000)
  const label = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  let daysLabel: string
  if (days === 0) daysLabel = 'oggi'
  else if (days === 1) daysLabel = 'ieri'
  else if (days < 7) daysLabel = `${days} giorni fa`
  else if (days < 14) daysLabel = '1 settimana fa'
  else if (days < 60) daysLabel = `${Math.floor(days / 7)} settimane fa`
  else daysLabel = `${Math.floor(days / 30)} mesi fa`
  return { label, days: daysLabel }
}

function formatNextAppointment(date: Date | null | string): { label: string; days: string } | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = d.getTime() - Date.now()
  const days = Math.ceil(diffMs / 86_400_000)
  const label = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  let daysLabel: string
  if (days <= 0) daysLabel = 'oggi'
  else if (days === 1) daysLabel = 'domani'
  else if (days < 7) daysLabel = `tra ${days} giorni`
  else if (days < 14) daysLabel = 'tra 1 settimana'
  else if (days < 60) daysLabel = `tra ${Math.floor(days / 7)} settimane`
  else daysLabel = `tra ${Math.floor(days / 30)} mesi`
  return { label, days: daysLabel }
}

interface Client {
  id: string
  nominativo: string
  phone: string
  email: string | null
  createdAt: Date | null
  dogNames: string
  dogs: ClientDogSummary[]
  lastAppointmentAt: Date | null | string
  nextAppointmentAt: Date | null | string
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [filterNome, setFilterNome] = useState('')
  const [filterTelefono, setFilterTelefono] = useState('')
  const [filterCane, setFilterCane] = useState('')
  const [soloDatiMancanti, setSoloDatiMancanti] = useState(false)

  const missingByClient = new Map(clients.map(c => [c.id, missingClientData(c)]))
  const clientiConDatiMancanti = clients.filter(c => (missingByClient.get(c.id) ?? []).length > 0).length

  const filteredClients = clients.filter(c => {
    if (soloDatiMancanti && (missingByClient.get(c.id) ?? []).length === 0) return false
    if (filterNome.trim() && !c.nominativo.toLowerCase().includes(filterNome.toLowerCase())) return false
    if (filterTelefono.trim() && !c.phone.includes(filterTelefono.trim())) return false
    if (filterCane.trim() && !c.dogNames.toLowerCase().includes(filterCane.toLowerCase())) return false
    return true
  })

  const hasFilter = filterNome.trim() || filterTelefono.trim() || filterCane.trim() || soloDatiMancanti

  function handleNew() {
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Clienti</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {/* I filtri restano agganciati in alto: su elenchi lunghi scorrendo
          sparivano e per cambiare ricerca bisognava risalire in cima. */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-2 border-b border-border bg-background px-4 py-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome cliente..."
            value={filterNome}
            onChange={e => setFilterNome(e.target.value)}
            className="pl-9 pr-8"
          />
          {filterNome && (
            <button type="button" onClick={() => setFilterNome('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro nome">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Telefono..."
            value={filterTelefono}
            onChange={e => setFilterTelefono(e.target.value)}
            className="pl-9 pr-8"
          />
          {filterTelefono && (
            <button type="button" onClick={() => setFilterTelefono('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro telefono">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome del cane..."
            value={filterCane}
            onChange={e => setFilterCane(e.target.value)}
            className="pl-9 pr-8"
          />
          {filterCane && (
            <button type="button" onClick={() => setFilterCane('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro cane">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {clientiConDatiMancanti > 0 && (
          <Button
            type="button"
            variant={soloDatiMancanti ? 'default' : 'outline'}
            onClick={() => setSoloDatiMancanti(v => !v)}
            title="Mostra solo i clienti a cui manca qualche dato"
            className="shrink-0"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Dati mancanti ({clientiConDatiMancanti})
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessun cliente registrato</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi il primo cliente
          </Button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2">Nessun cliente trovato con i filtri applicati</p>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => { setFilterNome(''); setFilterTelefono(''); setFilterCane(''); setSoloDatiMancanti(false) }}
          >
            Rimuovi tutti i filtri
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nominativo</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cani</TableHead>
                  <TableHead>Ultimo appuntamento</TableHead>
                  <TableHead>Prossimo appuntamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const lastAppt = formatLastAppointment(client.lastAppointmentAt)
                  const nextAppt = formatNextAppointment(client.nextAppointmentAt)
                  const missing = missingByClient.get(client.id) ?? []
                  return (
                    <TableRow
                      key={client.id}
                      className={cn('cursor-pointer', missing.length > 0 && 'bg-destructive/5')}
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(client.nominativo)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className={cn('font-medium', isMissingValue(client.nominativo) && 'bg-destructive/10')}>
                        <span className="flex items-center gap-2">
                          {isMissingValue(client.nominativo) ? <MissingValue /> : client.nominativo}
                          <MissingDataWarning missing={missing} />
                        </span>
                      </TableCell>
                      <TableCell className={cn(isMissingValue(client.phone) && 'bg-destructive/10')}>
                        {isMissingValue(client.phone) ? <MissingValue /> : client.phone}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email || '—'}
                      </TableCell>
                      <TableCell>
                        {client.dogs.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {client.dogs.map(dog => (
                              <div key={dog.id} className="flex items-baseline gap-1.5">
                                <Badge variant="secondary" className="font-normal">{dog.name}</Badge>
                                <DogDetails dog={dog} />
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {lastAppt ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{lastAppt.label}</span>
                            <span className="text-xs text-muted-foreground">{lastAppt.days}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {nextAppt ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{nextAppt.label}</span>
                            <span className="text-xs text-brand-primary font-medium">{nextAppt.days}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredClients.map((client) => {
              const lastAppt = formatLastAppointment(client.lastAppointmentAt)
              const nextAppt = formatNextAppointment(client.nextAppointmentAt)
              const missing = missingByClient.get(client.id) ?? []
              return (
                <button
                  key={client.id}
                  type="button"
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left w-full hover:bg-muted/50',
                    missing.length > 0 && 'border-destructive/40 bg-destructive/5'
                  )}
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(client.nominativo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="flex items-center gap-2 min-w-0">
                      {isMissingValue(client.nominativo) ? (
                        <MissingValue className="self-start" />
                      ) : (
                        <span className="font-medium text-foreground truncate">{client.nominativo}</span>
                      )}
                      <MissingDataWarning missing={missing} />
                    </span>
                    {isMissingValue(client.phone) ? (
                      <MissingValue className="mt-0.5 self-start" />
                    ) : (
                      <span className="text-sm text-muted-foreground">{client.phone}</span>
                    )}
                    {client.dogs.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        {client.dogs.map(dog => {
                          const details = formatDogDetails(dog)
                          return (
                            <span key={dog.id} className="text-xs text-muted-foreground truncate">
                              {dog.name}{details ? ` (${details})` : ''}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {(lastAppt || nextAppt) && (
                      <div className="flex gap-3 mt-1">
                        {lastAppt && (
                          <span className="text-xs text-muted-foreground">{lastAppt.label} ({lastAppt.days})</span>
                        )}
                        {nextAppt && (
                          <span className="text-xs text-brand-primary font-medium">{nextAppt.label} ({nextAppt.days})</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
