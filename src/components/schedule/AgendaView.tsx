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
import { ScheduleGrid, type AppointmentDropData } from './ScheduleGrid'
import { ScheduleTimeline } from './ScheduleTimeline'
import { WeeklyScheduleView } from './WeeklyScheduleView'
import { AppointmentForm } from '@/components/appointment/AppointmentForm'
import { AppointmentDetail } from '@/components/appointment/AppointmentDetail'
import { ExceedsShiftDialog } from '@/components/appointment/ExceedsShiftDialog'
import { OverlapDialog } from '@/components/appointment/OverlapDialog'
import {
  getAgendaData,
  fetchAppointmentDetail,
  moveAppointment as moveAppointmentAction,
  deleteAppointment,
  fetchWeeklyAgendaData,
} from '@/lib/actions/appointments'
import { computeAgendaRange, timeToMinutes } from '@/lib/utils/schedule'
import { useAgendaGroupBy } from '@/hooks/useAgendaGroupBy'
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
import { LayoutGrid, Settings, Users, X } from 'lucide-react'
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

type MovePayload = {
  id: string
  // Assente = il server mantiene il collaboratore attuale.
  userId?: string | null
  date: string
  time: string
  stationId?: string | null
  allowExceedShift?: boolean
  allowOverlap?: boolean
}

export function AgendaView({ locations }: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const { groupBy, setGroupBy } = useAgendaGroupBy()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [appointmentSlot, setAppointmentSlot] = useState<{
    stationId?: string | null
    stationName?: string | null
    userId?: string
    userName?: string
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
    userId: string
    stationId: string | null
  } | null>(null)
  const [pendingMove, setPendingMove] = useState<MovePayload | null>(null)
  const [exceedsShiftOpen, setExceedsShiftOpen] = useState(false)
  const [exceedsShiftEndTime, setExceedsShiftEndTime] = useState<string | undefined>(undefined)
  const [overlapOpen, setOverlapOpen] = useState(false)
  const [overlapAlternatives, setOverlapAlternatives] = useState<string[] | undefined>(undefined)
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
          stations: result.data.stations,
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
        stations: result.data.stations,
        appointmentsByStation: result.data.appointmentsByStation,
        appointmentsByPerson: result.data.appointmentsByPerson,
        businessHours: result.data.businessHours,
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
      queryClient.invalidateQueries({ queryKey: ['agenda-weekly'] })
    },
    onError: () => {
      toast.error('Errore durante la cancellazione')
    },
  })

  if (!isHydrated) return null

  const appointments = data?.appointments ?? []
  const staff = data?.staff ?? []
  const stations = data?.stations ?? []
  const dayOfWeek = (getDay(selectedDate) + 6) % 7
  const { globalOpen, globalClose } = data?.businessHours
    ? computeAgendaRange(data.businessHours, dayOfWeek)
    : { globalOpen: '08:00', globalClose: '20:00' }
  const openIntervals = (data?.businessHours ?? [])
    .filter(h => h.dayOfWeek === dayOfWeek)
    .map(h => ({ start: timeToMinutes(h.openTime), end: timeToMinutes(h.closeTime) }))

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
      setMovingAppointment({ id: appointmentId, duration, serviceName: appt.serviceName, userId: appt.userId ?? '', stationId: appt.stationId ?? null })
      setSelectedAppointmentId(null)
    }
  }

  const runMove = async (payload: MovePayload) => {
    const result = await moveAppointmentAction(payload)

    if (result?.data?.error) {
      const error = result.data.error
      if (error.code === 'SLOT_OCCUPIED') {
        // Non bloccante: gli appuntamenti in contemporanea sono ammessi previa conferma.
        setPendingMove(payload)
        setOverlapAlternatives(error.alternatives)
        setOverlapOpen(true)
      } else if (error.code === 'EXCEEDS_SHIFT_TIME') {
        // Non bloccante: si chiede conferma e si rilancia con allowExceedShift.
        setPendingMove(payload)
        setExceedsShiftEndTime(error.shiftEndTime)
        setExceedsShiftOpen(true)
      }
      return
    }

    if (result?.data?.success) {
      toast.success('Appuntamento spostato')
      setMovingAppointment(null)
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
      queryClient.invalidateQueries({ queryKey: ['agenda-weekly'] })
    }
  }

  const handleMoveSlotClick = async (userId: string, date: string, time: string, stationId?: string | null) => {
    if (!movingAppointment) return

    await runMove({
      id: movingAppointment.id,
      userId,
      date,
      time,
      ...(stationId !== undefined && { stationId }),
    })
  }

  const handleExceedsShiftOpenChange = (open: boolean) => {
    setExceedsShiftOpen(open)
    if (!open) setPendingMove(null)
  }

  const handleOverlapOpenChange = (open: boolean) => {
    setOverlapOpen(open)
    if (!open) setPendingMove(null)
  }

  const handleConfirmOverlap = () => {
    if (!pendingMove) return
    const payload = pendingMove
    setPendingMove(null)
    void runMove({ ...payload, allowOverlap: true })
  }

  const handleConfirmExceedsShift = () => {
    if (!pendingMove) return
    const payload = pendingMove
    setPendingMove(null)
    void runMove({ ...payload, allowExceedShift: true })
  }

  const handleMoveCancel = () => {
    setMovingAppointment(null)
  }

  const handleEmptySlotClick = (slotData: { stationId?: string; stationName?: string; userId?: string; userName?: string; date: string; time: string }) => {
    if (movingAppointment) {
      // "Da assegnare" non e' una destinazione valida: moveAppointment esige un userId.
      if (groupBy === 'person' && !slotData.userId) return
      // In vista persone la colonna di destinazione riassegna il collaboratore e
      // lascia invariata la postazione (stationId undefined = non toccare).
      handleMoveSlotClick(
        slotData.userId ?? movingAppointment.userId,
        slotData.date,
        slotData.time,
        groupBy === 'person' ? undefined : (slotData.stationId ?? null),
      )
      return
    }
    setAppointmentSlot({ ...slotData, locationId: selectedLocationId! })
  }

  // Drag & drop nella griglia giornaliera: la colonna di destinazione determina
  // la postazione (vista postazioni) o il collaboratore (vista persone).
  const handleAppointmentDrop = (data: AppointmentDropData) => {
    void runMove(data)
  }

  const handleAppointmentCreated = () => {
    setAppointmentSlot(null)
    queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
    queryClient.invalidateQueries({ queryKey: ['agenda-weekly'] })
  }

  const handleAppointmentDeleted = () => {
    setSelectedAppointmentId(null)
    queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
    queryClient.invalidateQueries({ queryKey: ['agenda-weekly'] })
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

  const groupByToggle = (
    <div className="flex items-center gap-1">
      <Button
        variant={groupBy === 'station' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setGroupBy('station')}
        title="Vista per postazioni"
      >
        {isMobile ? <LayoutGrid className="size-4" /> : 'Postazioni'}
      </Button>
      <Button
        variant={groupBy === 'person' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setGroupBy('person')}
        title="Vista per persone"
      >
        {isMobile ? <Users className="size-4" /> : 'Persone'}
      </Button>
    </div>
  )

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

  const dayHeader = (
    <div className="flex items-center justify-between gap-2">
      {/* Postazioni/Persone a sinistra, Giorno/Settimana a destra: i due switch
          restano ben separati e non si confondono tra loro. */}
      <div className="flex items-center gap-2 min-w-0">
        {groupByToggle}
        {isMobile ? (
          <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
        ) : (
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
      </div>
      {toggleGroup}
    </div>
  )

  const dayDataReady = viewMode === 'day' && isHydrated && selectedLocationId && data
  const hasActiveStaff = staff.some(p => p.overallStatus === 'active')
  const hasUnassignedAppointments = appointments.some(a => a.userId === null)

  // No stations configured (day mode only) — in vista persone le colonne sono le persone
  if (dayDataReady && groupBy === 'station' && stations.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {dayHeader}
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Settings className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Nessuna postazione configurata per questa sede
          </p>
          <Link
            href="/settings/locations"
            className="text-sm text-primary hover:underline"
          >
            Vai a Impostazioni per configurare le postazioni
          </Link>
        </div>
      </div>
    )
  }

  // Nessuna colonna da mostrare in vista persone: nessuno in turno e nulla da assegnare
  if (dayDataReady && groupBy === 'person' && !hasActiveStaff && !hasUnassignedAppointments) {
    return (
      <div className="flex flex-col gap-4">
        {dayHeader}
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Users className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Nessuna persona in turno in questa sede in questa giornata
          </p>
          <Link href="/staff" className="text-sm text-primary hover:underline">
            Vai a Personale per assegnare i turni
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
      {viewMode === 'day' && dayHeader}

      {viewMode === 'week' && (
        <div className="flex items-center justify-between gap-2">
          {groupByToggle}
          {toggleGroup}
        </div>
      )}

      {/* Griglia giornaliera */}
      {viewMode === 'day' && (
        isMobile ? (
          <ScheduleTimeline
            groupBy={groupBy}
            stations={stations}
            staff={staff}
            appointments={appointments}
            dateString={dateString}
            globalOpen={globalOpen}
            globalClose={globalClose}
            openIntervals={openIntervals}
            onAppointmentClick={handleAppointmentClick}
            onEmptySlotClick={handleEmptySlotClick}
            movingAppointmentId={movingAppointment?.id}
            onContextAction={handleContextAction}
          />
        ) : (
          <ScheduleGrid
            groupBy={groupBy}
            onAppointmentDrop={handleAppointmentDrop}
            stations={stations}
            staff={staff}
            appointments={appointments}
            selectedDate={selectedDate}
            dateString={dateString}
            globalOpen={globalOpen}
            globalClose={globalClose}
            openIntervals={openIntervals}
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
          stations={weeklyData?.stations ?? []}
          appointmentsByStation={weeklyData?.appointmentsByStation ?? {}}
          appointmentsByPerson={weeklyData?.appointmentsByPerson ?? {}}
          businessHours={weeklyData?.businessHours ?? []}
          groupBy={groupBy}
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
                locationId={selectedLocationId!}
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
                locationId={selectedLocationId!}
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

      <OverlapDialog
        open={overlapOpen}
        onOpenChange={handleOverlapOpenChange}
        onConfirm={handleConfirmOverlap}
        alternatives={overlapAlternatives}
      />

      <ExceedsShiftDialog
        open={exceedsShiftOpen}
        onOpenChange={handleExceedsShiftOpenChange}
        onConfirm={handleConfirmExceedsShift}
        shiftEndTime={exceedsShiftEndTime}
      />

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
                availableStaff={staff.filter(p => p.overallStatus === 'active').map(p => ({ id: p.id, name: p.name }))}
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
                availableStaff={staff.filter(p => p.overallStatus === 'active').map(p => ({ id: p.id, name: p.name }))}
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
