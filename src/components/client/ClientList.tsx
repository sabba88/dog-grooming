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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  createdAt: Date | null
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
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(client.firstName, client.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left w-full hover:bg-muted/50"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(client.firstName, client.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">
                    {client.firstName} {client.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">{client.phone}</span>
                </div>
              </button>
            ))}
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
