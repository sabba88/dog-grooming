'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { DateNavigation } from './DateNavigation'
import { DateStrip } from './DateStrip'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleTimeline } from './ScheduleTimeline'
import { AppointmentForm } from '@/components/appointment/AppointmentForm'
import { getAgendaData } from '@/lib/actions/appointments'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Settings } from 'lucide-react'
import Link from 'next/link'

interface Location {
  id: string
  name: string
  address: string
}

interface AgendaViewProps {
  locations: Location[]
}

export function AgendaView({ locations }: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [appointmentSlot, setAppointmentSlot] = useState<{
    userId: string
    userName: string
    date: string
    time: string
  } | null>(null)
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const { selectedLocationId, isHydrated } = useLocationSelector(locations)

  const dateString = format(selectedDate, 'yyyy-MM-dd')

  const { data } = useQuery({
    queryKey: ['appointments', selectedLocationId, dateString],
    queryFn: async () => {
      if (!selectedLocationId) return null
      const result = await getAgendaData({ locationId: selectedLocationId, date: dateString })
      if (result?.data) {
        // Enrich staff with locationName for "elsewhere" persons
        const enrichedStaff = result.data.staff.map((person) => {
          let locationName: string | undefined
          if (person.status === 'elsewhere' && person.assignment) {
            const loc = locations.find((l) => l.id === person.assignment!.locationId)
            locationName = loc?.name
          }
          return { ...person, locationName }
        })

        return {
          appointments: result.data.appointments.map((a) => ({
            ...a,
            startTime: new Date(a.startTime),
            endTime: new Date(a.endTime),
          })),
          staff: enrichedStaff,
        }
      }
      return null
    },
    enabled: !!selectedLocationId && isHydrated,
  })

  if (!isHydrated) return null

  const appointments = data?.appointments ?? []
  const staff = data?.staff ?? []

  const handleEmptySlotClick = (slotData: { userId: string; userName: string; date: string; time: string }) => {
    setAppointmentSlot(slotData)
  }

  const handleAppointmentCreated = () => {
    setAppointmentSlot(null)
    queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
  }

  // No staff assigned
  if (isHydrated && selectedLocationId && data && staff.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {isMobile ? (
          <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
        ) : (
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Settings className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Nessun collaboratore assegnato a questa sede per oggi
          </p>
          <Link
            href="/settings/staff"
            className="text-sm text-primary hover:underline"
          >
            Vai a Impostazioni per configurare le assegnazioni
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {isMobile ? (
        <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
      ) : (
        <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}

      {isMobile ? (
        <ScheduleTimeline
          staff={staff}
          appointments={appointments}
          dateString={dateString}
          onEmptySlotClick={handleEmptySlotClick}
        />
      ) : (
        <ScheduleGrid
          staff={staff}
          appointments={appointments}
          selectedDate={selectedDate}
          dateString={dateString}
          onEmptySlotClick={handleEmptySlotClick}
        />
      )}

      {/* Form appuntamento — Dialog desktop / Sheet mobile */}
      {isMobile ? (
        <Sheet open={!!appointmentSlot} onOpenChange={() => setAppointmentSlot(null)}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nuovo Appuntamento</SheetTitle>
            </SheetHeader>
            {appointmentSlot && (
              <AppointmentForm
                prefilledSlot={appointmentSlot}
                onSuccess={handleAppointmentCreated}
                onCancel={() => setAppointmentSlot(null)}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!appointmentSlot} onOpenChange={() => setAppointmentSlot(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuovo Appuntamento</DialogTitle>
            </DialogHeader>
            {appointmentSlot && (
              <AppointmentForm
                prefilledSlot={appointmentSlot}
                onSuccess={handleAppointmentCreated}
                onCancel={() => setAppointmentSlot(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
