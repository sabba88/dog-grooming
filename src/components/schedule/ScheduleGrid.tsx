'use client'

import { useEffect, useRef, useState } from 'react'
import { isToday } from 'date-fns'
import { AppointmentBlock } from './AppointmentBlock'
import { getCoOwners } from '@/lib/utils/formatting'
import { EmptySlot } from './EmptySlot'
import { PersonHeader } from './PersonHeader'
import {
  generateTimeSlots,
  getAppointmentPosition,
  getServiceColor,
  getUserColor,
  timeToMinutes,
  minutesToTime,
  utcMinutesOfDay,
  computeOverlapLanes,
  SLOT_HEIGHT_PX,
  MINUTES_PER_SLOT,
  UNASSIGNED_KEY,
  UNASSIGNED_LABEL,
} from '@/lib/utils/schedule'
import type { StaffStatus, ShiftInfo } from '@/lib/queries/staff'

interface Station {
  id: string
  name: string
}

interface Person {
  id: string
  name: string
  role: 'admin' | 'collaborator'
  color: string | null
  overallStatus: StaffStatus
  shifts: ShiftInfo[]
}

interface Appointment {
  id: string
  startTime: Date
  endTime: Date
  price: number
  notes: string | null
  userId: string | null
  stationId: string | null
  clientNominativo: string
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
  dogName: string
  breedName: string | null
  serviceName: string
  serviceId: string
}

// Una colonna della griglia: una postazione, una persona, oppure la colonna "Da assegnare".
type Column = { key: string; name: string; person?: Person }

export type AppointmentDropData = {
  id: string
  date: string
  time: string
  stationId?: string | null
  userId?: string | null
}

// Soglia oltre la quale un pointerdown diventa un trascinamento e non un click.
const DRAG_THRESHOLD_PX = 4

// Striscia sempre cliccabile sul bordo destro di ogni colonna: permette di creare
// un appuntamento in parallelo anche su un orario gia' occupato, dove lo slot
// libero a piena larghezza non viene renderizzato.
const PARALLEL_STRIP_PX = 14

type DragInfo = {
  id: string
  durationMinutes: number
  /** Distanza dal bordo superiore del blocco al puntatore, per non farlo "saltare". */
  pointerOffsetY: number
  originColumnKey: string
  originStartMinutes: number
  startClientX: number
  startClientY: number
  moved: boolean
  targetColumnIndex: number
  targetStartMinutes: number
}

interface ScheduleGridProps {
  groupBy: 'station' | 'person'
  stations: Station[]
  staff: Person[]
  appointments: Appointment[]
  selectedDate: Date
  dateString: string
  globalOpen: string
  globalClose: string
  // Open intervals for the selected day in minutes (start inclusive, end exclusive)
  openIntervals: { start: number; end: number }[]
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { stationId?: string; stationName?: string; userId?: string; userName?: string; date: string; time: string }) => void
  onAppointmentDrop?: (data: AppointmentDropData) => void
  movingAppointmentId?: string
  onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void
}

function isInOpenHours(slotMinutes: number, openIntervals: { start: number; end: number }[]): boolean {
  return openIntervals.some(iv => slotMinutes >= iv.start && slotMinutes < iv.end)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// "Da assegnare" non e' una destinazione valida: da li' si puo' solo assegnare qualcuno.
function isDroppableColumn(column: Column | undefined, mode: 'station' | 'person'): column is Column {
  return !!column && !(mode === 'person' && !column.person)
}

export function ScheduleGrid({
  groupBy,
  stations,
  staff,
  appointments,
  selectedDate,
  dateString,
  globalOpen,
  globalClose,
  openIntervals,
  onAppointmentClick,
  onEmptySlotClick,
  onAppointmentDrop,
  movingAppointmentId,
  onContextAction,
}: ScheduleGridProps) {
  const timeSlots = generateTimeSlots(globalOpen, globalClose)
  const dayStartMinutes = timeToMinutes(globalOpen)
  const totalMinutes = timeToMinutes(globalClose) - dayStartMinutes
  const totalHeight = (totalMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]
  const activeStaff = staff.filter(p => p.overallStatus === 'active')

  // La colonna "Da assegnare" compare solo se ci sono davvero appuntamenti senza collaboratore.
  const hasUnassigned = appointments.some(a => a.userId === null)
  const columns: Column[] = groupBy === 'station'
    ? stations.map(s => ({ key: s.id, name: s.name }))
    : [
        ...activeStaff.map(p => ({ key: p.id, name: p.name, person: p })),
        ...(hasUnassigned ? [{ key: UNASSIGNED_KEY, name: UNASSIGNED_LABEL }] : []),
      ]

  // Il pannello laterale dei turni serve solo in vista postazioni:
  // in vista persone i turni sono gia' le colonne stesse.
  const showStaffPanel = groupBy === 'station' && activeStaff.length > 0
  const staffPanelWidth = showStaffPanel ? Math.max(64, activeStaff.length * 32) : 0

  const STAFF_COLORS = [
    { bg: 'rgba(219,234,254,0.85)', border: '#60a5fa' },
    { bg: 'rgba(209,250,229,0.85)', border: '#34d399' },
    { bg: 'rgba(237,233,254,0.85)', border: '#a78bfa' },
    { bg: 'rgba(254,243,199,0.85)', border: '#fbbf24' },
    { bg: 'rgba(254,226,226,0.85)', border: '#f87171' },
  ]

  // --- Drag & drop ---------------------------------------------------------
  // I listener restano agganciati a window per tutta la durata del trascinamento.
  // geomRef tiene aggiornato cio' che cambia a ogni render, cosi' le closure
  // registrate all'inizio del drag leggono sempre valori freschi.
  const bodyRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragInfo | null>(null)
  const didDragRef = useRef(false)
  const [dragPreview, setDragPreview] = useState<{ columnIndex: number; startMinutes: number } | null>(null)
  const [dragActive, setDragActive] = useState<{ id: string; durationMinutes: number } | null>(null)

  const geomRef = useRef({
    columns, groupBy, dateString, dayStartMinutes, totalMinutes, staffPanelWidth, onAppointmentDrop,
  })
  useEffect(() => {
    geomRef.current = {
      columns, groupBy, dateString, dayStartMinutes, totalMinutes, staffPanelWidth, onAppointmentDrop,
    }
  })

  // Conserva le istanze esatte registrate su window, cosi' da poterle rimuovere
  // anche se le funzioni qui sotto cambiano identita' a ogni render.
  const handlersRef = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
    cancel: () => void
    key: (e: KeyboardEvent) => void
  } | null>(null)

  function computeTarget(clientX: number, clientY: number, drag: DragInfo) {
    const body = bodyRef.current
    const g = geomRef.current
    if (!body || g.columns.length === 0) return null

    const rect = body.getBoundingClientRect()
    const gutter = 60 + g.staffPanelWidth
    const columnWidth = (rect.width - gutter) / g.columns.length
    const columnIndex = clamp(
      Math.floor((clientX - rect.left - gutter) / columnWidth),
      0,
      g.columns.length - 1
    )

    const blockTopPx = clientY - rect.top - drag.pointerOffsetY
    const rawMinutes = g.dayStartMinutes + (blockTopPx / SLOT_HEIGHT_PX) * MINUTES_PER_SLOT
    const snapped = Math.round(rawMinutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
    const lastStart = g.dayStartMinutes + g.totalMinutes - drag.durationMinutes
    const startMinutes = clamp(snapped, g.dayStartMinutes, Math.max(lastStart, g.dayStartMinutes))

    return { columnIndex, startMinutes }
  }

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
    setDragActive(null)
  }

  function handleBlockPointerDown(e: React.PointerEvent, appt: Appointment, columnKey: string) {
    if (!geomRef.current.onAppointmentDrop) return
    // Il tocco resta riservato al long-press del menu contestuale; da mobile la
    // griglia non viene comunque usata (AgendaView passa a ScheduleTimeline).
    if (e.pointerType === 'touch' || e.button !== 0 || movingAppointmentId) return

    // Fase di capture: evita che il trigger del menu Radix si apra sul pointerdown.
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const startMinutes = utcMinutesOfDay(appt.startTime)
    dragRef.current = {
      id: appt.id,
      durationMinutes: utcMinutesOfDay(appt.endTime) - startMinutes,
      pointerOffsetY: e.clientY - rect.top,
      originColumnKey: columnKey,
      originStartMinutes: startMinutes,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      targetColumnIndex: 0,
      targetStartMinutes: startMinutes,
    }

    const move = (ev: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      if (!drag.moved) {
        const dx = Math.abs(ev.clientX - drag.startClientX)
        const dy = Math.abs(ev.clientY - drag.startClientY)
        if (dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) return
        drag.moved = true
        setDragActive({ id: drag.id, durationMinutes: drag.durationMinutes })
      }

      const target = computeTarget(ev.clientX, ev.clientY, drag)
      if (!target) return
      drag.targetColumnIndex = target.columnIndex
      drag.targetStartMinutes = target.startMinutes
      setDragPreview(target)
    }

    const up = () => {
      const drag = dragRef.current
      const g = geomRef.current
      resetDrag()
      if (!drag || !drag.moved) return

      // Sopprime il click che il browser emette al termine del trascinamento.
      didDragRef.current = true
      setTimeout(() => { didDragRef.current = false }, 0)

      const target = g.columns[drag.targetColumnIndex]
      if (!isDroppableColumn(target, g.groupBy)) return

      const unchanged =
        target.key === drag.originColumnKey && drag.targetStartMinutes === drag.originStartMinutes
      if (unchanged) return

      g.onAppointmentDrop?.({
        id: drag.id,
        date: g.dateString,
        time: minutesToTime(drag.targetStartMinutes),
        // Il campo non passato resta invariato lato server.
        ...(g.groupBy === 'station' ? { stationId: target.key } : { userId: target.key }),
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

  function handleBlockClick(id: string) {
    if (didDragRef.current) return
    onAppointmentClick?.(id)
  }

  // Se il componente sparisce a trascinamento in corso (cambio giorno, cambio vista)
  // i listener su window resterebbero appesi.
  useEffect(() => detachListeners, [])
  // ------------------------------------------------------------------------

  const now = new Date()
  const showCurrentTime = isToday(selectedDate)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentTimeInRange = currentMinutes >= dayStartMinutes && currentMinutes <= dayStartMinutes + totalMinutes
  const currentTimeTop = ((currentMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  const gridCols = showStaffPanel
    ? `60px ${staffPanelWidth}px repeat(${columns.length}, 1fr)`
    : `60px repeat(${columns.length}, 1fr)`

  if (columns.length === 0) return null

  const dragDurationMinutes = dragActive?.durationMinutes ?? MINUTES_PER_SLOT

  return (
    <div>
      {/* Header row */}
      <div
        className="grid sticky top-0 z-20 border-b border-border"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="p-2 text-xs text-muted-foreground font-medium bg-card">Orario</div>
        {showStaffPanel && (
          <div className="border-l border-border px-1 py-1.5 bg-card">
            <span className="text-[11px] text-muted-foreground font-medium">Personale</span>
          </div>
        )}
        {columns.map((column) => (
          <div key={column.key} className="border-l border-border bg-card">
            {column.person ? (
              <PersonHeader
                name={column.person.name}
                role={column.person.role}
                overallStatus={column.person.overallStatus}
                shifts={column.person.shifts}
              />
            ) : (
              <div className="px-2 py-1.5">
                <span
                  className={`text-sm font-medium truncate${groupBy === 'person' ? ' text-muted-foreground' : ''}`}
                >
                  {column.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div
        ref={bodyRef}
        className="grid relative"
        style={{
          gridTemplateColumns: gridCols,
          ...(dragActive ? { userSelect: 'none' as const, cursor: 'grabbing' } : {}),
        }}
      >
        {/* Time labels column */}
        <div className="relative" style={{ height: `${totalHeight}px` }}>
          {timeSlots.map((slot) => {
            const offsetMinutes = timeToMinutes(slot) - dayStartMinutes
            const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
            return (
              <div
                key={slot}
                className="absolute right-2 text-xs text-muted-foreground leading-none"
                style={{ top: `${top}px`, transform: 'translateY(-50%)' }}
              >
                {slot}
              </div>
            )
          })}
        </div>

        {/* Staff panel column */}
        {showStaffPanel && (
          <div className="relative border-l border-border" style={{ height: `${totalHeight}px` }}>
            {timeSlots.map((slot) => {
              const offsetMinutes = timeToMinutes(slot) - dayStartMinutes
              const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
              return (
                <div
                  key={slot}
                  className="absolute inset-x-0 border-t border-border"
                  style={{ top: `${top}px` }}
                />
              )
            })}
            {activeStaff.map((person, personIdx) => {
              const color = person.color
                ? getUserColor(person.color)
                : STAFF_COLORS[personIdx % STAFF_COLORS.length]
              const barLeft = (personIdx / activeStaff.length) * 100
              const barWidth = 100 / activeStaff.length
              const shortName = person.name.split(' ')[0].slice(0, 4)
              return person.shifts
                .filter(s => s.status === 'active')
                .map((shift, shiftIdx) => {
                  const shiftStartMin = timeToMinutes(shift.startTime)
                  const shiftEndMin = timeToMinutes(shift.endTime)
                  const clampedStart = Math.max(shiftStartMin, dayStartMinutes)
                  const clampedEnd = Math.min(shiftEndMin, dayStartMinutes + totalMinutes)
                  if (clampedEnd <= clampedStart) return null
                  const top = ((clampedStart - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                  const height = ((clampedEnd - clampedStart) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                  return (
                    <div
                      key={`${person.id}-${shiftIdx}`}
                      className="absolute overflow-hidden flex flex-col rounded-sm"
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
                        className="text-[9px] font-semibold px-0.5 leading-tight truncate"
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

        {/* Colonne: postazioni oppure persone */}
        {columns.map((column, columnIndex) => {
          const columnAppointments = groupBy === 'station'
            ? appointments.filter(a => a.stationId === column.key)
            : appointments.filter(a => (a.userId ?? UNASSIGNED_KEY) === column.key)

          const person = column.person
          const isUnassignedColumn = groupBy === 'person' && !person
          // "Da assegnare" non e' una destinazione valida per lo spostamento a click.
          const isMovingTarget = !!movingAppointmentId && !isUnassignedColumn

          const showPreview =
            dragPreview !== null &&
            dragPreview.columnIndex === columnIndex &&
            isDroppableColumn(column, groupBy)

          return (
            <div
              key={column.key}
              className="relative border-l border-border"
              style={{ height: `${totalHeight}px` }}
            >
              {/* Horizontal grid lines */}
              {timeSlots.map((slot) => {
                const offsetMinutes = timeToMinutes(slot) - dayStartMinutes
                const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                return (
                  <div
                    key={slot}
                    className="absolute inset-x-0 border-t border-border"
                    style={{ top: `${top}px` }}
                  />
                )
              })}

              {/* Fasce turno — solo colonne persona */}
              {person?.shifts.map((shift, i) => {
                const shiftStartMin = timeToMinutes(shift.startTime)
                const shiftEndMin = timeToMinutes(shift.endTime)
                const clampedStart = Math.max(shiftStartMin, dayStartMinutes)
                const clampedEnd = Math.min(shiftEndMin, dayStartMinutes + totalMinutes)
                if (clampedEnd <= clampedStart) return null
                const top = ((clampedStart - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                const height = ((clampedEnd - clampedStart) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                return (
                  <div
                    key={`${column.key}-shift-${i}`}
                    className="absolute inset-x-0 pointer-events-none"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: shift.status === 'active' ? '#E5F7F9' : '#FEF3C7',
                    }}
                  />
                )
              })}

              {/* Empty / closed slots */}
              {timeSlots.map((slot) => {
                const slotMinutes = timeToMinutes(slot)
                const isOccupied = columnAppointments.some((appt) => {
                  const apptStart = utcMinutesOfDay(appt.startTime)
                  const apptEnd = utcMinutesOfDay(appt.endTime)
                  return slotMinutes >= apptStart && slotMinutes < apptEnd
                })

                if (isOccupied) return null

                const offsetMinutes = slotMinutes - dayStartMinutes
                const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

                return (
                  <EmptySlot
                    key={`${column.key}-${slot}`}
                    {...(groupBy === 'station'
                      ? { stationId: column.key, stationName: column.name }
                      : person
                        ? { userId: person.id, userName: person.name }
                        : {})}
                    date={dateString}
                    time={slot}
                    variant="grid"
                    closed={!isInOpenHours(slotMinutes, openIntervals)}
                    style={{ top: `${top}px`, height: `${SLOT_HEIGHT_PX}px` }}
                    onClick={onEmptySlotClick}
                    isMovingTarget={isMovingTarget}
                  />
                )
              })}

              {/* Anteprima della destinazione durante il trascinamento */}
              {showPreview && (
                <div
                  className="absolute z-20 pointer-events-none rounded-md border-2 border-dashed border-primary bg-primary/10 px-1.5 py-1"
                  style={{
                    left: '2px',
                    right: `${(onEmptySlotClick ? PARALLEL_STRIP_PX : 0) + 2}px`,
                    top: `${((dragPreview.startMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                    height: `${Math.max((dragDurationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX, 44)}px`,
                  }}
                >
                  <span className="text-xs font-semibold text-primary">
                    {minutesToTime(dragPreview.startMinutes)}
                  </span>
                </div>
              )}

              {/* Striscia "+": crea un appuntamento in parallelo su un orario occupato */}
              {onEmptySlotClick && timeSlots.map((slot) => {
                const slotMinutes = timeToMinutes(slot)
                const isOccupied = columnAppointments.some((appt) =>
                  slotMinutes >= utcMinutesOfDay(appt.startTime) &&
                  slotMinutes < utcMinutesOfDay(appt.endTime)
                )
                // Sugli orari liberi c'e' gia' lo slot a piena larghezza.
                if (!isOccupied) return null

                const top = ((slotMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                return (
                  <button
                    key={`${column.key}-parallel-${slot}`}
                    type="button"
                    title={`Nuovo appuntamento in parallelo alle ${slot}`}
                    onClick={() => onEmptySlotClick({
                      ...(groupBy === 'station'
                        ? { stationId: column.key, stationName: column.name }
                        : person
                          ? { userId: person.id, userName: person.name }
                          : {}),
                      date: dateString,
                      time: slot,
                    })}
                    className="absolute right-0 flex items-center justify-center border-l border-dashed border-border/70 text-muted-foreground/0 transition-colors hover:bg-primary/10 hover:text-primary"
                    style={{
                      top: `${top}px`,
                      height: `${SLOT_HEIGHT_PX}px`,
                      width: `${PARALLEL_STRIP_PX}px`,
                      zIndex: 15,
                      // Durante un trascinamento la striscia non deve intercettare il rilascio.
                      pointerEvents: dragActive ? 'none' : undefined,
                    }}
                  >
                    <span className="text-[11px] font-semibold leading-none">+</span>
                  </button>
                )
              })}

              {/* Appointment blocks — affiancati quando si sovrappongono.
                  Il contenitore lascia scoperta la striscia "+" sul bordo destro. */}
              <div
                className="absolute top-0 bottom-0 left-0"
                style={{ right: `${onEmptySlotClick ? PARALLEL_STRIP_PX : 0}px` }}
              >
              {computeOverlapLanes(columnAppointments).map(({ appointment: appt, lane, lanes }) => {
                const position = getAppointmentPosition(appt.startTime, appt.endTime, dayStartMinutes)
                const staffMember = staff.find(p => p.id === appt.userId)
                const color = staffMember?.color ? getUserColor(staffMember.color) : getServiceColor(appt.serviceId, allServiceIds)
                // left + right (mai width) per non sovravincolare il posizionamento assoluto.
                const laneStyle = lanes > 1
                  ? {
                      left: `calc(${((lane / lanes) * 100).toFixed(4)}% + 2px)`,
                      right: `calc(${(((lanes - 1 - lane) / lanes) * 100).toFixed(4)}% + 2px)`,
                    }
                  : { left: '0px', right: '0px' }

                return (
                  <div
                    key={appt.id}
                    className={onAppointmentDrop ? 'absolute cursor-grab' : 'absolute'}
                    style={{ top: `${position.top}px`, height: `${position.height}px`, ...laneStyle }}
                    onPointerDownCapture={(e) => handleBlockPointerDown(e, appt, column.key)}
                  >
                    <AppointmentBlock
                      id={appt.id}
                      clientName={appt.clientNominativo}
                      coOwners={getCoOwners(appt)}
                      dogName={appt.dogName}
                      breedName={appt.breedName}
                      serviceName={appt.serviceName}
                      staffName={staffMember?.name ?? UNASSIGNED_LABEL}
                      price={appt.price}
                      startTime={appt.startTime}
                      endTime={appt.endTime}
                      color={color}
                      variant="grid"
                      style={{ top: 0, bottom: 0 }}
                      onClick={handleBlockClick}
                      isMoving={movingAppointmentId === appt.id || dragActive?.id === appt.id}
                      onContextAction={onContextAction}
                    />
                  </div>
                )
              })}
              </div>
            </div>
          )
        })}

        {/* Current time indicator */}
        {showCurrentTime && currentTimeInRange && (
          <div
            className="absolute left-0 right-0 z-30 pointer-events-none"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="flex items-center">
              <div className="size-2 rounded-full bg-destructive -ml-1" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
