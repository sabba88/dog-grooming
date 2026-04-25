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
import { AppointmentDetail } from '@/components/appointment/AppointmentDetail'
import { getAgendaData, fetchAppointmentDetail, moveAppointment as moveAppointmentAction } from '@/lib/actions/appointments'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Settings, X } from 'lucide-react'
import { toast } from 'sonner'
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
    locationId: string
  } | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [movingAppointment, setMovingAppointment] = useState<{
    id: string
    duration: number
    serviceName: string
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
        return {
          appointments: result.data.appointments.map((a) => ({
            ...a,
            startTime: new Date(a.startTime),
            endTime: new Date(a.endTime),
          })),
          staff: result.data.staff,
        }
      }
      return null
    },
    enabled: !!selectedLocationId && isHydrated,
  })

  if (!isHydrated) return null

  const appointments = data?.appointments ?? []
  const staff = data?.staff ?? []

  const handleAppointmentClick = (id: string) => {
    if (movingAppointment) return // Ignorare click durante modalita' spostamento
    setSelectedAppointmentId(id)
  }

  const handleMoveStart = async (appointmentId: string) => {
    const result = await fetchAppointmentDetail({ id: appointmentId })
    if (result?.data?.appointment) {
      const appt = result.data.appointment
      const start = new Date(appt.startTime)
      const end = new Date(appt.endTime)
      const duration = (end.getTime() - start.getTime()) / (60 * 1000)
      setMovingAppointment({ id: appointmentId, duration, serviceName: appt.serviceName })
      setSelectedAppointmentId(null)
    }
  }

  const handleMoveSlotClick = async (userId: string, date: string, time: string) => {
    if (!movingAppointment) return

    const result = await moveAppointmentAction({
      id: movingAppointment.id,
      userId,
      date,
      time,
    })

    if (result?.data?.error) {
      const error = result.data.error
      if (error.code === 'SLOT_OCCUPIED') {
        toast.error("Lo slot non e' piu' disponibile")
        if (error.alternatives && error.alternatives.length > 0) {
          toast.info(`Slot alternativi: ${error.alternatives.join(', ')}`)
        }
      } else if (error.code === 'EXCEEDS_SHIFT_TIME') {
        toast.warning(`L'appuntamento supera la fine del turno (${error.shiftEndTime})`)
      }
      return
    }

    if (result?.data?.success) {
      toast.success('Appuntamento spostato')
      setMovingAppointment(null)
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
    }
  }

  const handleMoveCancel = () => {
    setMovingAppointment(null)
  }

  const handleEmptySlotClick = (slotData: { userId: string; userName: string; date: string; time: string }) => {
    if (movingAppointment) {
      handleMoveSlotClick(slotData.userId, slotData.date, slotData.time)
      return
    }
    setAppointmentSlot({ ...slotData, locationId: selectedLocationId! })
  }

  const handleAppointmentCreated = () => {
    setAppointmentSlot(null)
    queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
  }

  const handleAppointmentDeleted = () => {
    setSelectedAppointmentId(null)
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
      {/* Banner spostamento */}
      {movingAppointment && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Tocca un nuovo slot per spostare &quot;{movingAppointment.serviceName}&quot;
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMoveCancel}
            className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
          >
            <X className="size-4" />
            <span className="ml-1">Annulla</span>
          </Button>
        </div>
      )}

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
          onAppointmentClick={handleAppointmentClick}
          onEmptySlotClick={handleEmptySlotClick}
          movingAppointmentId={movingAppointment?.id}
        />
      ) : (
        <ScheduleGrid
          staff={staff}
          appointments={appointments}
          selectedDate={selectedDate}
          dateString={dateString}
          onAppointmentClick={handleAppointmentClick}
          onEmptySlotClick={handleEmptySlotClick}
          movingAppointmentId={movingAppointment?.id}
        />
      )}

      {/* Dettaglio appuntamento — Dialog desktop / Sheet mobile */}
      {isMobile ? (
        <Sheet open={!!selectedAppointmentId} onOpenChange={() => setSelectedAppointmentId(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Dettaglio Appuntamento</SheetTitle>
            </SheetHeader>
            {selectedAppointmentId && (
              <AppointmentDetail
                appointmentId={selectedAppointmentId}
                onClose={() => setSelectedAppointmentId(null)}
                onMove={handleMoveStart}
                onDeleted={handleAppointmentDeleted}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedAppointmentId} onOpenChange={() => setSelectedAppointmentId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dettaglio Appuntamento</DialogTitle>
            </DialogHeader>
            {selectedAppointmentId && (
              <AppointmentDetail
                appointmentId={selectedAppointmentId}
                onClose={() => setSelectedAppointmentId(null)}
                onMove={handleMoveStart}
                onDeleted={handleAppointmentDeleted}
              />
            )}
          </DialogContent>
        </Dialog>
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
