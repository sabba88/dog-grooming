'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StationForm } from '@/components/location/StationForm'
import { StationServicesForm } from '@/components/location/StationServicesForm'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Pencil, ListChecks, LayoutGrid } from 'lucide-react'

interface Station {
  id: string
  name: string
  locationId: string
  servicesCount: number
  allowedSizes?: string[] | null
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface StationListProps {
  stations: Station[]
  locationId: string
  locationName: string
  allServices: Service[]
  stationEnabledServices: Record<string, string[]>
}

export function StationList({
  stations,
  locationId,
  locationName,
  allServices,
  stationEnabledServices,
}: StationListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)

  const [servicesFormOpen, setServicesFormOpen] = useState(false)
  const [servicesStation, setServicesStation] = useState<Station | null>(null)

  function handleNew() {
    setEditingStation(null)
    setFormOpen(true)
  }

  function handleEdit(station: Station) {
    setEditingStation(station)
    setFormOpen(true)
  }

  function handleServices(station: Station) {
    setServicesStation(station)
    setServicesFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  function isIncomplete(station: Station) {
    return station.servicesCount === 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Postazioni di {locationName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Una postazione diventa prenotabile quando ha almeno un servizio
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="size-4 mr-2" />
          Nuova Postazione
        </Button>
      </div>

      {stations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <LayoutGrid className="size-8 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Nessuna postazione configurata</p>
            <p className="text-sm text-muted-foreground">
              Senza postazioni questa sede non accetta appuntamenti
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Aggiungi la prima postazione
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
                  <TableHead className="text-xs font-medium text-muted-foreground">Servizi</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Stato</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium text-foreground">{station.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="tabular-nums">
                        {station.servicesCount} servizi
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isIncomplete(station) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="border-slot-understaffed bg-slot-understaffed/40 text-foreground hover:bg-slot-understaffed/40">
                                Incompleta
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Aggiungi servizi per rendere la postazione prenotabile
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">Prenotabile</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(station)}
                          aria-label={`Modifica ${station.name}`}
                        >
                          <Pencil className="size-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServices(station)}
                          aria-label={`Servizi ${station.name}`}
                        >
                          <ListChecks className="size-4 mr-1" />
                          Servizi
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
            {stations.map((station) => (
              <div
                key={station.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{station.name}</p>
                  <Badge variant="secondary" className="tabular-nums">
                    {station.servicesCount} servizi
                  </Badge>
                </div>
                {isIncomplete(station) && (
                  <div className="rounded-md border border-slot-understaffed bg-slot-understaffed/40 px-3 py-2">
                    <p className="text-xs font-medium text-foreground">Incompleta</p>
                    <p className="text-xs text-muted-foreground">
                      Aggiungi servizi per renderla prenotabile
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(station)}
                    className="flex-1"
                  >
                    <Pencil className="size-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServices(station)}
                    className="flex-1"
                  >
                    <ListChecks className="size-4 mr-1" />
                    Servizi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <StationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        locationId={locationId}
        station={editingStation}
      />

      {servicesStation && (
        <StationServicesForm
          key={servicesStation.id}
          open={servicesFormOpen}
          onOpenChange={setServicesFormOpen}
          onSuccess={handleSuccess}
          stationId={servicesStation.id}
          stationName={servicesStation.name}
          allServices={allServices}
          enabledServiceIds={stationEnabledServices[servicesStation.id] ?? []}
        />
      )}
    </div>
  )
}
