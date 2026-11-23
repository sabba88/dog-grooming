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
import { Plus, Pencil, Settings2, MapPin } from 'lucide-react'

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestione Sedi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Le sedi del salone, con le loro postazioni e i loro orari
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="size-4 mr-2" />
          Nuova Sede
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Nessuna sede configurata</p>
            <p className="text-sm text-muted-foreground">
              Crea la prima sede per poterci aggiungere postazioni e orari di apertura
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Aggiungi la prima sede
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-medium text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Indirizzo</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium text-foreground">{location.name}</TableCell>
                    <TableCell className="text-muted-foreground">{location.address}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          aria-label={`Modifica ${location.name}`}
                        >
                          <Pencil className="size-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/settings/locations/${location.id}`)}
                          aria-label={`Gestisci postazioni di ${location.name}`}
                        >
                          <Settings2 className="size-4 mr-1" />
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
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-foreground">{location.name}</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(location)}
                    className="flex-1"
                  >
                    <Pencil className="size-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/settings/locations/${location.id}`)}
                    className="flex-1"
                  >
                    <Settings2 className="size-4 mr-1" />
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
    </div>
  )
}
