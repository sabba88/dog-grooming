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
import { AlertTriangle, Download, Plus, Search, X } from 'lucide-react'
import { buildCsv, csvDate, csvFilename, downloadCsv } from '@/lib/utils/csv'
import { getCoOwners } from '@/lib/utils/formatting'
import { COAT_LABELS, SIZE_LABELS } from '@/lib/types'
import type { ClientDogSummary } from '@/lib/queries/clients'
import { isMissingValue, matchesWordPrefix } from '@/lib/utils/formatting'
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
      className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-destructive"
      title={`Dati mancanti: ${missing.join(', ')}`}
    >
      <AlertTriangle className="size-3.5" />
      <span className="text-xs font-medium tabular-nums">{missing.length}</span>
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
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
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
    // Nomi per inizio di parola: cercando "ola" non deve uscire "Lola".
    // Il telefono resta per frammento, di un numero si ricorda spesso un pezzo.
    if (!matchesWordPrefix(c.nominativo, filterNome)) return false
    if (filterTelefono.trim() && !c.phone.includes(filterTelefono.trim())) return false
    if (!matchesWordPrefix(c.dogNames, filterCane)) return false
    return true
  })

  const hasFilter = filterNome.trim() || filterTelefono.trim() || filterCane.trim() || soloDatiMancanti

  function handleNew() {
    setFormOpen(true)
  }

  // Si esporta quello che si ha davanti: i filtri valgono anche per il file.
  function handleExport() {
    const headers = [
      'Nominativo', 'Telefono', 'Email',
      'Proprietario 2', 'Telefono 2', 'Proprietario 3', 'Telefono 3',
      'Cane', 'Razza', 'Pelo', 'Taglia',
      'Ultimo appuntamento', 'Prossimo appuntamento', 'Dati mancanti',
    ]
    const rows = filteredClients.flatMap((client) => {
      const coOwners = getCoOwners(client)
      const o2 = coOwners.find(o => o.slot === 2)
      const o3 = coOwners.find(o => o.slot === 3)
      const base = [
        client.nominativo, client.phone, client.email,
        o2?.name ?? '', o2?.phone ?? '', o3?.name ?? '', o3?.phone ?? '',
      ]
      const tail = [
        csvDate(client.lastAppointmentAt),
        csvDate(client.nextAppointmentAt),
        (missingByClient.get(client.id) ?? []).join(', '),
      ]
      // Una riga per cane, cosi' il file si filtra e si ordina anche per cane.
      if (client.dogs.length === 0) return [[...base, '', '', '', '', ...tail]]
      return client.dogs.map((dog) => {
        const [razza, pelo, taglia] = dogDetailParts(dog).map(p => (p.missing ? '' : p.label))
        return [...base, dog.name, razza, pelo.replace(/^Pelo /, ''), taglia.replace(/^Taglia /, ''), ...tail]
      })
    })
    downloadCsv(csvFilename('clienti'), buildCsv(headers, rows))
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold leading-tight text-foreground">Clienti</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length === 0
              ? 'Ancora nessuno in archivio'
              : hasFilter
                ? `${filteredClients.length} di ${clients.length} clienti`
                : `${clients.length} ${clients.length === 1 ? 'cliente' : 'clienti'}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredClients.length === 0}
            title="Scarica l'elenco filtrato in un file apribile con Excel"
          >
            <Download className="size-4 mr-2" />
            Esporta
          </Button>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Nuovo cliente
          </Button>
        </div>
      </header>

      {/* I filtri restano agganciati in alto: su elenchi lunghi scorrendo
          sparivano e per cambiare ricerca bisognava risalire in cima. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nome cliente..."
            value={filterNome}
            onChange={e => setFilterNome(e.target.value)}
            className="bg-card pl-9 pr-8"
          />
          {filterNome && (
            <button type="button" onClick={() => setFilterNome('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro nome">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Telefono..."
            value={filterTelefono}
            onChange={e => setFilterTelefono(e.target.value)}
            className="bg-card pl-9 pr-8"
          />
          {filterTelefono && (
            <button type="button" onClick={() => setFilterTelefono('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro telefono">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nome del cane..."
            value={filterCane}
            onChange={e => setFilterCane(e.target.value)}
            className="bg-card pl-9 pr-8"
          />
          {filterCane && (
            <button type="button" onClick={() => setFilterCane('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Rimuovi filtro cane">
              <X className="size-4" />
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
            <AlertTriangle className="size-4 mr-2" />
            Dati mancanti ({clientiConDatiMancanti})
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nessun cliente registrato: il primo si crea da qui
          </p>
          <Button onClick={handleNew} className="mt-4">
            <Plus className="size-4 mr-2" />
            Aggiungi il primo cliente
          </Button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nessun cliente corrisponde ai filtri impostati
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => { setFilterNome(''); setFilterTelefono(''); setFilterCane(''); setSoloDatiMancanti(false) }}
          >
            Rimuovi tutti i filtri
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: tabella */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
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
                      // Niente tinta sull'intera riga: nei dati reali quasi tutti i
                      // clienti hanno qualcosa di incompleto e l'elenco diventava
                      // tutto rosso, senza piu' nessun contrasto. Il segnale lo danno
                      // l'avviso accanto al nome e i campi mancanti in rosso.
                      className="cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
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
                      <TableCell className={cn('tabular-nums', isMissingValue(client.phone) && 'bg-destructive/10')}>
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
                            <span className="text-sm tabular-nums">{lastAppt.label}</span>
                            <span className="text-xs text-muted-foreground">{lastAppt.days}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {nextAppt ? (
                          <div className="flex flex-col">
                            <span className="text-sm tabular-nums">{nextAppt.label}</span>
                            <span className="text-xs font-medium text-primary">{nextAppt.days}</span>
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

          {/* Mobile: schede */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredClients.map((client) => {
              const lastAppt = formatLastAppointment(client.lastAppointmentAt)
              const nextAppt = formatNextAppointment(client.nextAppointmentAt)
              const missing = missingByClient.get(client.id) ?? []
              return (
                <button
                  key={client.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                      {getInitials(client.nominativo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      {isMissingValue(client.nominativo) ? (
                        <MissingValue className="self-start" />
                      ) : (
                        <span className="truncate font-medium text-foreground">{client.nominativo}</span>
                      )}
                      <MissingDataWarning missing={missing} />
                    </span>
                    {isMissingValue(client.phone) ? (
                      <MissingValue className="mt-0.5 self-start" />
                    ) : (
                      <span className="text-sm text-muted-foreground tabular-nums">{client.phone}</span>
                    )}
                    {client.dogs.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                        {client.dogs.map(dog => {
                          const details = formatDogDetails(dog)
                          return (
                            <span key={dog.id} className="truncate text-xs text-muted-foreground">
                              {dog.name}{details ? ` (${details})` : ''}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {(lastAppt || nextAppt) && (
                      <div className="mt-1 flex gap-3">
                        {lastAppt && (
                          <span className="text-xs text-muted-foreground tabular-nums">{lastAppt.label} ({lastAppt.days})</span>
                        )}
                        {nextAppt && (
                          <span className="text-xs font-medium text-primary tabular-nums">{nextAppt.label} ({nextAppt.days})</span>
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
    </div>
  )
}
