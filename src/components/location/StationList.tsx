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
import { StationScheduleForm } from '@/components/location/StationScheduleForm'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DAYS_OF_WEEK } from '@/lib/validations/stations'
import { Plus, Pencil, ListChecks, Clock } from 'lucide-react'

interface ScheduleEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

interface Station {
  id: string
  name: string
  locationId: string
  servicesCount: number
  schedulesCount: number
  schedules: ScheduleEntry[]
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

function formatScheduleSummary(schedules: ScheduleEntry[]): string {
  if (schedules.length === 0) return 'Nessun orario'
  if (schedules.length === 7) return 'Tutti i giorni'

  const dayLabels = schedules
    .map(s => DAYS_OF_WEEK[s.dayOfWeek]?.label.slice(0, 3))
    .join(', ')
  return dayLabels
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

  const [scheduleFormOpen, setScheduleFormOpen] = useState(false)
  const [scheduleStation, setScheduleStation] = useState<Station | null>(null)

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

  function handleSchedule(station: Station) {
    setScheduleStation(station)
    setScheduleFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  function isIncomplete(station: Station) {
    return station.servicesCount === 0 || station.schedulesCount === 0
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Postazioni di {locationName}
        </h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Postazione
        </Button>
      </div>

      {stations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nessuna postazione configurata</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi la prima postazione
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
                  <TableHead>Servizi</TableHead>
                  <TableHead>Orari</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {station.servicesCount} servizi
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatScheduleSummary(station.schedules)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isIncomplete(station) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50">
                                Incompleta
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Aggiungi servizi e orari per rendere la postazione prenotabile
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServices(station)}
                          aria-label={`Servizi ${station.name}`}
                        >
                          <ListChecks className="h-4 w-4 mr-1" />
                          Servizi
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSchedule(station)}
                          aria-label={`Orari ${station.name}`}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Orari
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
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{station.name}</p>
                  {isIncomplete(station) && (
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
                        Incompleta
                      </Badge>
                      <span className="text-[10px] text-amber-600">Aggiungi servizi e orari</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {station.servicesCount} servizi
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatScheduleSummary(station.schedules)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(station)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServices(station)}
                    className="flex-1"
                  >
                    <ListChecks className="h-4 w-4 mr-1" />
                    Servizi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSchedule(station)}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Orari
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
          open={servicesFormOpen}
          onOpenChange={setServicesFormOpen}
          onSuccess={handleSuccess}
          stationId={servicesStation.id}
          stationName={servicesStation.name}
          allServices={allServices}
          enabledServiceIds={stationEnabledServices[servicesStation.id] ?? []}
        />
      )}

      {scheduleStation && (
        <StationScheduleForm
          open={scheduleFormOpen}
          onOpenChange={setScheduleFormOpen}
          onSuccess={handleSuccess}
          stationId={scheduleStation.id}
          stationName={scheduleStation.name}
          existingSchedules={scheduleStation.schedules}
        />
      )}
    </>
  )
}
