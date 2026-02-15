'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LocationForm } from '@/components/location/LocationForm'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Settings2 } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  createdAt: Date | null
}

interface LocationListProps {
  locations: Location[]
}

export function LocationList({ locations }: LocationListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  function handleNew() {
    setEditingLocation(null)
    setFormOpen(true)
  }

  function handleEdit(location: Location) {
    setEditingLocation(location)
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Gestione Sedi</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Sede
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessuna sede configurata</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi la prima sede
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
                  <TableHead>Indirizzo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.address}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          aria-label={`Modifica ${location.name}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/settings/locations/${location.id}`)}
                          aria-label={`Gestisci postazioni di ${location.name}`}
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Postazioni
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
            {locations.map((location) => (
              <div
                key={location.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{location.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{location.address}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(location)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/settings/locations/${location.id}`)}
                    className="flex-1"
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Postazioni
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <LocationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        location={editingLocation}
      />
    </>
  )
}
