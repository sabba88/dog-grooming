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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ClientForm } from '@/components/client/ClientForm'
import { ClientSearch } from '@/components/client/ClientSearch'
import { Plus } from 'lucide-react'

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
  lastAppointmentAt: Date | null | string
  nextAppointmentAt: Date | null | string
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleNew() {
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  function handleSelect(client: { id: string }) {
    router.push(`/clients/${client.id}`)
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

      <div className="mb-4">
        <ClientSearch onSelect={handleSelect} onCreateNew={handleNew} />
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessun cliente registrato</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi il primo cliente
          </Button>
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
                  <TableHead>Ultimo appuntamento</TableHead>
                  <TableHead>Prossimo appuntamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const lastAppt = formatLastAppointment(client.lastAppointmentAt)
                  const nextAppt = formatNextAppointment(client.nextAppointmentAt)
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(client.nominativo)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{client.nominativo}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email || '—'}
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
            {clients.map((client) => {
              const lastAppt = formatLastAppointment(client.lastAppointmentAt)
              const nextAppt = formatNextAppointment(client.nextAppointmentAt)
              return (
                <button
                  key={client.id}
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left w-full hover:bg-muted/50"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(client.nominativo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-foreground truncate">{client.nominativo}</span>
                    <span className="text-sm text-muted-foreground">{client.phone}</span>
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
