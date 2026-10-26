'use client'

import { useEffect, useRef, useState } from 'react'
import { addWeeks, format, getDay, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { DateNavigation } from '@/components/schedule/DateNavigation'
import { DateStrip } from '@/components/schedule/DateStrip'
import { BookingBlock } from './BookingBlock'
import { BookingForm, type BookingInitialValues } from './BookingForm'
import { BookingWeekGrid } from './BookingWeekGrid'
import { getBookingDayData, getBookingWeekData, deleteBooking, moveBooking } from '@/lib/actions/bookings'
import {
  computeOverlapLanes,
  generateTimeSlots,
  getUserColor,
  minutesToTime,
  timeToMinutes,
  utcMinutesOfDay,
  MINUTES_PER_SLOT,
  SLOT_HEIGHT_PX,
} from '@/lib/utils/schedule'
import { isDaPianificare } from '@/lib/utils/appointment'
import { getCoOwners } from '@/lib/utils/formatting'
import type { StaffStatus, ShiftInfo } from '@/lib/queries/staff'
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
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
}

interface Person {
  id: string
  name: string
  color: string | null
  overallStatus: StaffStatus
  shifts: ShiftInfo[]
}

interface BookingCalendarProps {
  locations: Location[]
}

// Fascia sempre renderizzata, indipendente dagli orari del negozio: prenotare
// fuori orario e' ammesso e non deve far sparire la griglia (backlog Maurizio, punto 12).
const DAY_START = '07:00'
const DAY_END = '22:00'

// Soglia oltre la quale un pointerdown diventa un trascinamento e non un click.
const DRAG_THRESHOLD_PX = 4

const STAFF_COLORS = [
  { bg: 'rgba(219,234,254,0.85)', border: '#60a5fa' },
  { bg: 'rgba(209,250,229,0.85)', border: '#34d399' },
  { bg: 'rgba(237,233,254,0.85)', border: '#a78bfa' },
  { bg: 'rgba(254,243,199,0.85)', border: '#fbbf24' },
  { bg: 'rgba(254,226,226,0.85)', border: '#f87171' },
]

type DragInfo = {
  id: string
  durationMinutes: number
  /** Distanza dal bordo superiore del blocco al puntatore, per non farlo "saltare". */
  pointerOffsetY: number
  originStartMinutes: number
  startClientX: number
  startClientY: number
  moved: boolean
  targetStartMinutes: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function BookingCalendar({ locations }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [newSlotTime, setNewSlotTime] = useState<string | null>(null)
  const [editing, setEditing] = useState<BookingInitialValues | null>(null)
  const [editingTime, setEditingTime] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const { selectedLocationId, isHydrated } = useLocationSelector(locations)

  const dateString = format(selectedDate, 'yyyy-MM-dd')
  const queryKey = ['bookings', selectedLocationId, dateString]

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!selectedLocationId) return null
      const result = await getBookingDayData({ locationId: selectedLocationId, date: dateString })
      if (!result?.data) return null
      return {
        bookings: result.data.bookings.map((b) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        })),
        stationCount: result.data.stationCount,
        businessHours: result.data.businessHours,
        staff: result.data.staff as Person[],
      }
    },
    enabled: !!selectedLocationId && isHydrated,
  })

  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const { data: weekData, isLoading: isWeekLoading } = useQuery({
    queryKey: ['bookings-week', selectedLocationId, weekStartStr],
    queryFn: async () => {
      if (!selectedLocationId) return null
      const result = await getBookingWeekData({
        locationId: selectedLocationId,
        weekStart: weekStartStr,
      })
      if (!result?.data) return null
      return {
        bookings: result.data.bookings.map((b) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        })),
        stationCount: result.data.stationCount,
        businessHours: result.data.businessHours,
      }
    },
    enabled: !!selectedLocationId && isHydrated && viewMode === 'week',
  })

  const { execute: executeDelete } = useAction(deleteBooking, {
    onSuccess: () => {
      toast.success('Prenotazione cancellata')
      setDeletingId(null)
      setEditing(null)
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['bookings-week'] })
    },
    onError: () => toast.error('Errore durante la cancellazione'),
  })

  const { execute: executeMove } = useAction(moveBooking, {
    onSuccess: () => {
      toast.success('Prenotazione spostata')
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['bookings-week'] })
      queryClient.invalidateQueries({ queryKey: ['agenda-unplanned'] })
    },
    onError: () => toast.error('Errore durante lo spostamento'),
  })

  // --- Trascinamento -------------------------------------------------------
  // Stessa impostazione di ScheduleGrid: i listener restano su window per tutta
  // la durata del gesto, e geomRef tiene aggiornato cio' che cambia a ogni render.
  const bodyRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragInfo | null>(null)
  const didDragRef = useRef(false)
  // La durata viaggia nello stato insieme all'orario: leggerla da dragRef durante
  // il render sarebbe un accesso a un ref in fase di render.
  const [dragPreview, setDragPreview] = useState<{ startMinutes: number; durationMinutes: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const dayStartMinutes = timeToMinutes(DAY_START)
  const totalMinutes = timeToMinutes(DAY_END) - dayStartMinutes

  const geomRef = useRef({ dateString, dayStartMinutes, totalMinutes, executeMove })
  useEffect(() => {
    geomRef.current = { dateString, dayStartMinutes, totalMinutes, executeMove }
  })

  const handlersRef = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
    cancel: () => void
    key: (e: KeyboardEvent) => void
  } | null>(null)

  function detachListeners() {
    const h = handlersRef.current
    if (!h) return
    window.removeEventListener('pointermove', h.move)
    window.removeEventListener('pointerup', h.up)
    window.removeEventListener('pointercancel', h.cancel)
    window.removeEventListener('keydown', h.key)
    handlersRef.current = null
  }

  function resetDrag() {
    detachListeners()
    dragRef.current = null
    setDragPreview(null)
    setDraggingId(null)
  }

  // Se il componente sparisce a trascinamento in corso i listener resterebbero appesi.
  useEffect(() => detachListeners, [])

  function handleBlockPointerDown(e: React.PointerEvent, booking: { id: string; startTime: Date; endTime: Date }) {
    // Da touch il gesto serve a scorrere la pagina: li' si sposta aprendo la scheda.
    if (e.pointerType === 'touch' || e.button !== 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const startMinutes = utcMinutesOfDay(booking.startTime)
    dragRef.current = {
      id: booking.id,
      durationMinutes: utcMinutesOfDay(booking.endTime) - startMinutes,
      pointerOffsetY: e.clientY - rect.top,
      originStartMinutes: startMinutes,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      targetStartMinutes: startMinutes,
    }

    const move = (ev: PointerEvent) => {
      const drag = dragRef.current
      const body = bodyRef.current
      const g = geomRef.current
      if (!drag || !body) return

      if (!drag.moved) {
        const dx = Math.abs(ev.clientX - drag.startClientX)
        const dy = Math.abs(ev.clientY - drag.startClientY)
        if (dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) return
        drag.moved = true
        setDraggingId(drag.id)
      }

      // Nel calendario di prenotazione le colonne non significano nulla (la postazione
      // si assegna in pianificazione): conta solo la posizione verticale, cioe' l'ora.
      const blockTopPx = ev.clientY - body.getBoundingClientRect().top - drag.pointerOffsetY
      const rawMinutes = g.dayStartMinutes + (blockTopPx / SLOT_HEIGHT_PX) * MINUTES_PER_SLOT
      const snapped = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
      const lastStart = g.dayStartMinutes + g.totalMinutes - drag.durationMinutes
      const target = clamp(snapped, g.dayStartMinutes, Math.max(lastStart, g.dayStartMinutes))

      drag.targetStartMinutes = target
      setDragPreview({ startMinutes: target, durationMinutes: drag.durationMinutes })
    }

    const up = () => {
      const drag = dragRef.current
      const g = geomRef.current
      resetDrag()
      if (!drag || !drag.moved) return

      // Sopprime il click che il browser emette al termine del trascinamento.
      didDragRef.current = true
      setTimeout(() => { didDragRef.current = false }, 0)

      if (drag.targetStartMinutes === drag.originStartMinutes) return
      g.executeMove({
        id: drag.id,
        date: g.dateString,
        time: minutesToTime(drag.targetStartMinutes),
      })
    }

    const cancel = () => resetDrag()
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') resetDrag() }

    handlersRef.current = { move, up, cancel, key }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', key)
  }
  // -------------------------------------------------------------------------

  if (!isHydrated) return null

  const bookings = data?.bookings ?? []
  const stationCount = data?.stationCount ?? 0
  const staff = data?.staff ?? []
  const activeStaff = staff.filter((p) => p.overallStatus === 'active')
  const dayOfWeek = (getDay(selectedDate) + 6) % 7
  const openIntervals = (data?.businessHours ?? [])
    .filter((h) => h.dayOfWeek === dayOfWeek)
    .map((h) => ({ start: timeToMinutes(h.openTime), end: timeToMinutes(h.closeTime) }))

  const slots = generateTimeSlots(DAY_START, DAY_END)
  const totalHeight = slots.length * SLOT_HEIGHT_PX

  const laidOut = computeOverlapLanes(bookings)
  // Le corsie disegnate sono almeno quante le postazioni: se gli appuntamenti in
  // contemporanea sono di piu', le corsie crescono e le colonne si stringono.
  // E' un segnale visivo, non un blocco (decisione CC-2026-10-23).
  const maxLanes = laidOut.reduce((max, item) => Math.max(max, item.lanes), 0)
  const columns = Math.max(stationCount, maxLanes, 1)
  const isOverCapacity = stationCount > 0 && maxLanes > stationCount

  // Pannello dei turni: una colonnina per collaboratore in turno quel giorno.
  const showStaffPanel = activeStaff.length > 0
  const staffPanelWidth = showStaffPanel ? Math.max(64, activeStaff.length * 32) : 0

  const handleSuccess = () => {
    setNewSlotTime(null)
    setEditing(null)
    setEditingTime(null)
    queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['bookings-week'] })
  }

  const handleBlockClick = (id: string) => {
    if (didDragRef.current) return
    const booking = bookings.find((b) => b.id === id)
    if (!booking) return
    const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / 60000
    setEditingTime(minutesToTime(utcMinutesOfDay(booking.startTime)))
    setEditing({
      id: booking.id,
      clientId: booking.clientId,
      clientNominativo: booking.clientNominativo,
      dogId: booking.dogId,
      duration,
      serviceId: booking.serviceId,
      price: booking.price,
      notes: booking.notes,
    })
  }

  const viewToggle = (
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
        onClick={() => {
          setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }))
          setViewMode('week')
        }}
      >
        {isMobile ? 'S' : 'Settimana'}
      </Button>
    </div>
  )

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {viewToggle}
        {isMobile ? (
          <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
        ) : (
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {bookings.length} {bookings.length === 1 ? 'prenotazione' : 'prenotazioni'}
        </span>
        {activeStaff.length > 0 && (
          <span>
            {activeStaff.length} in turno
          </span>
        )}
        {stationCount > 0 && (
          <span className={cn(isOverCapacity && 'font-medium text-amber-700')}>
            {isOverCapacity
              ? `fino a ${maxLanes} in contemporanea su ${stationCount} postazioni`
              : `${stationCount} ${stationCount === 1 ? 'postazione' : 'postazioni'}`}
          </span>
        )}
      </div>
    </div>
  )

  const formBody = (time: string, initial?: BookingInitialValues) => (
    <div className="flex flex-col gap-3">
      <BookingForm
        locationId={selectedLocationId!}
        date={dateString}
        time={time}
        mode={initial ? 'edit' : 'create'}
        initialValues={initial}
        onSuccess={handleSuccess}
        onCancel={() => {
          setNewSlotTime(null)
          setEditing(null)
        }}
      />
      {initial && (
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeletingId(initial.id)}
        >
          <Trash2 className="mr-2 size-4" />
          Cancella prenotazione
        </Button>
      )}
    </div>
  )

  const openTime = editing ? editingTime : newSlotTime
  const isFormOpen = openTime !== null

  return (
    <div className="flex flex-col gap-4">
      {viewMode === 'week' ? (
        <div className="flex items-center justify-between gap-2">
          {viewToggle}
        </div>
      ) : (
        header
      )}

      {viewMode === 'week' && (
        <BookingWeekGrid
          weekStart={weekStart}
          bookings={weekData?.bookings ?? []}
          stationCount={weekData?.stationCount ?? 0}
          businessHours={weekData?.businessHours ?? []}
          isLoading={isWeekLoading}
          onSlotClick={(date, time) => {
            // Si prenota direttamente dalla settimana: la scheda si apre sul
            // giorno e l'ora della cella, senza passare dalla vista giornaliera.
            setSelectedDate(parseISO(date))
            setNewSlotTime(time)
          }}
          onDayClick={(date) => {
            setSelectedDate(parseISO(date))
            setViewMode('day')
          }}
          onPrevWeek={() => setWeekStart((prev) => subWeeks(prev, 1))}
          onNextWeek={() => setWeekStart((prev) => addWeeks(prev, 1))}
        />
      )}

      {viewMode === 'day' && (
      <div className="overflow-auto rounded-lg border">
        <div className="flex" style={{ height: `${totalHeight}px` }}>
          {/* Colonna degli orari: ogni passo di 15 minuti e' etichettato */}
          <div className="w-16 shrink-0 border-r bg-muted/30">
            {slots.map((slot) => {
              const isHour = slot.endsWith(':00')
              return (
                <div
                  key={slot}
                  className={cn(
                    'flex items-start justify-end pr-1.5 text-[10px] leading-none',
                    isHour ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                  style={{ height: `${SLOT_HEIGHT_PX}px`, paddingTop: '2px' }}
                >
                  {slot}
                </div>
              )
            })}
          </div>

          {/* Pannello dei turni: chi lavora quel giorno e in che fascia */}
          {showStaffPanel && (
            <div
              className="relative shrink-0 border-r bg-card"
              style={{ width: `${staffPanelWidth}px`, height: `${totalHeight}px` }}
            >
              {slots.map((slot, i) => (
                <div
                  key={slot}
                  className={cn(
                    'absolute inset-x-0 border-t',
                    slot.endsWith(':00') ? 'border-border' : 'border-border/30'
                  )}
                  style={{ top: `${i * SLOT_HEIGHT_PX}px` }}
                />
              ))}
              {activeStaff.map((person, personIdx) => {
                const color = person.color
                  ? getUserColor(person.color)
                  : STAFF_COLORS[personIdx % STAFF_COLORS.length]
                const barLeft = (personIdx / activeStaff.length) * 100
                const barWidth = 100 / activeStaff.length
                const shortName = person.name.split(' ')[0].slice(0, 4)
                return person.shifts
                  .filter((s) => s.status === 'active')
                  .map((shift, shiftIdx) => {
                    const shiftStart = Math.max(timeToMinutes(shift.startTime), dayStartMinutes)
                    const shiftEnd = Math.min(timeToMinutes(shift.endTime), dayStartMinutes + totalMinutes)
                    if (shiftEnd <= shiftStart) return null
                    const top = ((shiftStart - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                    const height = ((shiftEnd - shiftStart) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                    return (
                      <div
                        key={`${person.id}-${shiftIdx}`}
                        className="absolute flex flex-col overflow-hidden rounded-sm"
                        style={{
                          left: `${barLeft + 1}%`,
                          width: `${barWidth - 2}%`,
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color.bg,
                          borderLeft: `2px solid ${color.border}`,
                        }}
                        title={`${person.name}: ${shift.startTime}–${shift.endTime}`}
                      >
                        <span
                          className="truncate px-0.5 text-[9px] font-semibold leading-tight"
                          style={{ color: color.border }}
                        >
                          {shortName}
                        </span>
                      </div>
                    )
                  })
              })}
            </div>
          )}

          {/* Area appuntamenti */}
          <div ref={bodyRef} className="relative flex-1" style={{ minWidth: `${columns * 120}px` }}>
            {/* Sfondo: una colonna per postazione, riferimento visivo della capacità */}
            <div className="pointer-events-none absolute inset-0 flex">
              {Array.from({ length: columns }, (_, i) => (
                <div
                  key={i}
                  className={cn('flex-1', i < columns - 1 && 'border-r border-border/40')}
                />
              ))}
            </div>

            {/* Righe cliccabili: aprono il form all'ora della riga */}
            {slots.map((slot, i) => {
              const slotMinutes = timeToMinutes(slot)
              const isOpen = openIntervals.some(
                (interval) => slotMinutes >= interval.start && slotMinutes < interval.end
              )
              return (
                <button
                  key={slot}
                  onClick={() => setNewSlotTime(slot)}
                  className={cn(
                    'absolute inset-x-0 transition-colors hover:bg-primary/5',
                    slot.endsWith(':00') ? 'border-b border-border/60' : 'border-b border-border/25',
                    !isOpen && 'bg-muted/60'
                  )}
                  style={{ top: `${i * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
                  aria-label={`Prenota alle ${slot}`}
                />
              )
            })}

            {/* Anteprima del trascinamento */}
            {dragPreview && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 rounded-md border-2 border-dashed border-primary bg-primary/10"
                style={{
                  top: `${((dragPreview.startMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                  height: `${(dragPreview.durationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                }}
              >
                <span className="px-1.5 text-xs font-medium text-primary">
                  {minutesToTime(dragPreview.startMinutes)}
                </span>
              </div>
            )}

            {/* Prenotazioni */}
            {laidOut.map(({ appointment: booking, lane }) => {
              const startMinutes = utcMinutesOfDay(booking.startTime)
              const endMinutes = utcMinutesOfDay(booking.endTime)
              const top = ((startMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
              const height = Math.max(
                ((endMinutes - startMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX,
                44
              )
              // Larghezza su `columns`, non su `lanes`: cosi' i blocchi si allineano
              // alle colonne delle postazioni anche quando in quella fascia sono pochi.
              const width = 100 / columns
              return (
                <div
                  key={booking.id}
                  className={cn('absolute cursor-grab', draggingId === booking.id && 'opacity-40')}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${lane * width}%`,
                    width: `${width}%`,
                  }}
                  onPointerDownCapture={(e) => handleBlockPointerDown(e, booking)}
                >
                  <BookingBlock
                    id={booking.id}
                    clientName={booking.clientNominativo}
                    coOwners={getCoOwners(booking)}
                    dogName={booking.dogName}
                    breedName={booking.breedName}
                    serviceName={booking.serviceName}
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    daPianificare={isDaPianificare(booking)}
                    style={{ top: 0, bottom: 0 }}
                    onClick={handleBlockClick}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      )}

      {/* Form — Dialog su desktop, Sheet su mobile */}
      {isMobile ? (
        <Sheet
          open={isFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setNewSlotTime(null)
              setEditing(null)
            }
          }}
        >
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editing ? 'Modifica prenotazione' : 'Nuova prenotazione'}</SheetTitle>
            </SheetHeader>
            {openTime && formBody(openTime, editing ?? undefined)}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setNewSlotTime(null)
              setEditing(null)
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifica prenotazione' : 'Nuova prenotazione'}</DialogTitle>
            </DialogHeader>
            {openTime && formBody(openTime, editing ?? undefined)}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare la prenotazione?</AlertDialogTitle>
            <AlertDialogDescription>L&apos;azione è irreversibile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) executeDelete({ id: deletingId })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancella
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
