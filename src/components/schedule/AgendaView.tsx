'use client'

import { useState } from 'react'
import { format, getDay, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { DateNavigation } from './DateNavigation'
import { DateStrip } from './DateStrip'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleTimeline } from './ScheduleTimeline'
import { WeeklyScheduleView } from './WeeklyScheduleView'
import { AppointmentForm } from '@/components/appointment/AppointmentForm'
import { AppointmentDetail } from '@/components/appointment/AppointmentDetail'
import {
  getAgendaData,
  fetchAppointmentDetail,
  moveAppointment as moveAppointmentAction,
  deleteAppointment,
  fetchWeeklyAgendaData,
} from '@/lib/actions/appointments'
import { computeAgendaRange } from '@/lib/utils/schedule'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

type ContextAction = 'detail' | 'add-note' | 'move' | 'delete'

export function AgendaView({ locations }: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [appointmentSlot, setAppointmentSlot] = useState<{
    userId: string
    userName: string
    date: string
    time: string
    locationId: string
  } | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [autoFocusNotes, setAutoFocusNotes] = useState(false)
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null)
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
          businessHours: result.data.businessHours,
        }
      }
      return null
    },
    enabled: !!selectedLocationId && isHydrated,
  })

  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['agenda-weekly', selectedLocationId, weekStartStr],
    queryFn: async () => {
      if (!selectedLocationId) return null
      const result = await fetchWeeklyAgendaData({
        locationId: selectedLocationId,
        weekStart: weekStartStr,
      })
      if (!result?.data) return null
      return {
        staff: result.data.staff,
        staffShifts: result.data.staffShifts,
        appointments: result.data.appointments,
      }
    },
    enabled: !!selectedLocationId && isHydrated && viewMode === 'week',
  })

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  )
  const currentWeekLabel = `${format(weekStart, 'd MMM', { locale: it })}–${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: it })}`

  const { execute: executeQuickDelete } = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Appuntamento cancellato')
      setDeletingAppointmentId(null)
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
    },
    onError: () => {
      toast.error('Errore durante la cancellazione')
    },
  })

  if (!isHydrated) return null

  const appointments = data?.appointments ?? []
  const staff = data?.staff ?? []
  const dayOfWeek = (getDay(selectedDate) + 6) % 7
  const { globalOpen, globalClose } = data?.businessHours
    ? computeAgendaRange(data.businessHours, dayOfWeek)
    : { globalOpen: '08:00', globalClose: '20:00' }

  const handleAppointmentClick = (id: string) => {
    if (movingAppointment) return
    setAutoFocusNotes(false)
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

  const handleDetailClose = () => {
    setSelectedAppointmentId(null)
    setAutoFocusNotes(false)
  }

  const handleContextAction = (action: ContextAction, id: string) => {
    switch (action) {
      case 'detail':
        setAutoFocusNotes(false)
        setSelectedAppointmentId(id)
        break
      case 'add-note':
        setAutoFocusNotes(true)
        setSelectedAppointmentId(id)
        break
      case 'move':
        handleMoveStart(id)
        break
      case 'delete':
        setDeletingAppointmentId(id)
        break
    }
  }

  const handleDayClick = (date: string) => {
    setSelectedDate(parseISO(date))
    setViewMode('day')
  }

  const handlePrevWeek = () => {
    setWeekStart(prev => subWeeks(prev, 1))
  }

  const handleNextWeek = () => {
    setWeekStart(prev => addWeeks(prev, 1))
  }

  const handleSwitchToWeek = () => {
    setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }))
    setMovingAppointment(null)
    setViewMode('week')
  }

  const toggleGroup = (
    <div className="flex items-center gap-1">
      <Button
        variant={viewMode === 'day' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('day')}
      >
        {isMobile ? 'G' : 'Giorno'}
      </Button>
      <Button
        variant={viewMode === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={handleSwitchToWeek}
      >
        {isMobile ? 'S' : 'Settimana'}
      </Button>
    </div>
  )

  // No staff assigned (day mode only)
  if (viewMode === 'day' && isHydrated && selectedLocationId && data && staff.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          {isMobile ? (
            <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
          ) : (
            <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
          )}
          {toggleGroup}
        </div>
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
      {/* Banner spostamento — solo in modalità giornaliera */}
      {viewMode === 'day' && movingAppointment && (
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

      {/* Header navigazione + toggle */}
      {viewMode === 'day' && (
        <div className="flex items-center justify-between gap-2">
          {isMobile ? (
            <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
          ) : (
            <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
          )}
          {toggleGroup}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="flex items-center justify-end gap-2">
          {toggleGroup}
        </div>
      )}

      {/* Griglia giornaliera */}
      {viewMode === 'day' && (
        isMobile ? (
          <ScheduleTimeline
            staff={staff}
            appointments={appointments}
            dateString={dateString}
            globalOpen={globalOpen}
            globalClose={globalClose}
            onAppointmentClick={handleAppointmentClick}
            onEmptySlotClick={handleEmptySlotClick}
            movingAppointmentId={movingAppointment?.id}
            onContextAction={handleContextAction}
          />
        ) : (
          <ScheduleGrid
            staff={staff}
            appointments={appointments}
            selectedDate={selectedDate}
            dateString={dateString}
            globalOpen={globalOpen}
            globalClose={globalClose}
            onAppointmentClick={handleAppointmentClick}
            onEmptySlotClick={handleEmptySlotClick}
            movingAppointmentId={movingAppointment?.id}
            onContextAction={handleContextAction}
          />
        )
      )}

      {/* Vista settimanale */}
      {viewMode === 'week' && (
        <WeeklyScheduleView
          weekDates={weekDates}
          staff={weeklyData?.staff ?? []}
          staffShifts={weeklyData?.staffShifts ?? {}}
          appointments={weeklyData?.appointments ?? {}}
          onDayClick={handleDayClick}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          currentWeekLabel={currentWeekLabel}
          isLoading={isWeeklyLoading}
        />
      )}

      {/* Dettaglio appuntamento — Dialog desktop / Sheet mobile */}
      {isMobile ? (
        <Sheet open={!!selectedAppointmentId} onOpenChange={(open) => { if (!open) handleDetailClose() }}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Dettaglio Appuntamento</SheetTitle>
            </SheetHeader>
            {selectedAppointmentId && (
              <AppointmentDetail
                appointmentId={selectedAppointmentId}
                onClose={handleDetailClose}
                onMove={handleMoveStart}
                onDeleted={handleAppointmentDeleted}
                autoFocusNotes={autoFocusNotes}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedAppointmentId} onOpenChange={(open) => { if (!open) handleDetailClose() }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dettaglio Appuntamento</DialogTitle>
            </DialogHeader>
            {selectedAppointmentId && (
              <AppointmentDetail
                appointmentId={selectedAppointmentId}
                onClose={handleDetailClose}
                onMove={handleMoveStart}
                onDeleted={handleAppointmentDeleted}
                autoFocusNotes={autoFocusNotes}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog cancellazione rapida da context menu */}
      <AlertDialog
        open={deletingAppointmentId !== null}
        onOpenChange={(open) => { if (!open) setDeletingAppointmentId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare l&apos;appuntamento?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAppointmentId) {
                  executeQuickDelete({ id: deletingAppointmentId })
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancella
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
