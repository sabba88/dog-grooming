'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppointmentBlock } from './AppointmentBlock'
import { getCoOwners } from '@/lib/utils/formatting'
import { EmptySlot } from './EmptySlot'
import {
  generateTimeSlots,
  getServiceColor,
  getUserColor,
  timeToMinutes,
  utcMinutesOfDay,
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

// Un tab della timeline: una postazione, una persona, oppure "Da assegnare".
type Column = { key: string; name: string; person?: Person }

interface SlotData {
  stationId?: string
  stationName?: string
  userId?: string
  userName?: string
  date: string
  time: string
}

interface ScheduleTimelineProps {
  groupBy: 'station' | 'person'
  stations: Station[]
  staff: Person[]
  appointments: Appointment[]
  dateString: string
  globalOpen: string
  globalClose: string
  openIntervals: { start: number; end: number }[]
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: SlotData) => void
  movingAppointmentId?: string
  onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void
}

function isInOpenHours(slotMinutes: number, openIntervals: { start: number; end: number }[]): boolean {
  return openIntervals.some(iv => slotMinutes >= iv.start && slotMinutes < iv.end)
}

function ColumnTimeline({
  column,
  groupBy,
  appointments,
  allServiceIds,
  staff,
  dateString,
  globalOpen,
  globalClose,
  openIntervals,
  onAppointmentClick,
  onEmptySlotClick,
  movingAppointmentId,
  onContextAction,
}: {
  column: Column
  groupBy: 'station' | 'person'
  appointments: Appointment[]
  allServiceIds: string[]
  staff: Person[]
  dateString: string
  globalOpen: string
  globalClose: string
  openIntervals: { start: number; end: number }[]
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: SlotData) => void
  movingAppointmentId?: string
  onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void
}) {
  const timeSlots = generateTimeSlots(globalOpen, globalClose)
  const person = column.person
  // "Da assegnare" non e' una destinazione valida: moveAppointment esige un userId.
  const isMovingTarget = !!movingAppointmentId && !(groupBy === 'person' && !person)

  const slotIdentity: Partial<SlotData> = groupBy === 'station'
    ? { stationId: column.key, stationName: column.name }
    : person
      ? { userId: person.id, userName: person.name }
      : {}

  // Ogni appuntamento viene ancorato allo slot in cui inizia (o al primo slot visibile,
  // se inizia prima dell'apertura) e reso una sola volta. Piu' appuntamenti possono
  // cadere sullo stesso slot: nella timeline si impilano verticalmente.
  const firstSlotMinutes = timeSlots.length > 0 ? timeToMinutes(timeSlots[0]) : 0
  const apptsBySlot = new Map<number, Appointment[]>()
  for (const appt of [...appointments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())) {
    const anchored = Math.max(utcMinutesOfDay(appt.startTime), firstSlotMinutes)
    const slotMinutes =
      firstSlotMinutes +
      Math.floor((anchored - firstSlotMinutes) / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
    const bucket = apptsBySlot.get(slotMinutes)
    if (bucket) bucket.push(appt)
    else apptsBySlot.set(slotMinutes, [appt])
  }

  return (
    <div className="flex flex-col gap-2">
      {timeSlots.map((slot) => {
        const slotMinutes = timeToMinutes(slot)
        const startingHere = apptsBySlot.get(slotMinutes) ?? []

        if (startingHere.length > 0) {
          return (
            <div key={slot} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
              <div className="flex-1 flex flex-col gap-2">
                {startingHere.map((appt) => {
                  const staffMember = staff.find(p => p.id === appt.userId)
                  const color = staffMember?.color ? getUserColor(staffMember.color) : getServiceColor(appt.serviceId, allServiceIds)
                  return (
                    <AppointmentBlock
                      key={appt.id}
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
                      variant="timeline"
                      onClick={onAppointmentClick}
                      isMoving={movingAppointmentId === appt.id}
                      onContextAction={onContextAction}
                    />
                  )
                })}
              </div>
            </div>
          )
        }

        // Slot coperto da un appuntamento gia' reso in uno slot precedente
        const isCovered = appointments.some((a) =>
          slotMinutes >= utcMinutesOfDay(a.startTime) && slotMinutes < utcMinutesOfDay(a.endTime)
        )
        if (isCovered) return null

        const isClosed = !isInOpenHours(slotMinutes, openIntervals)

        return (
          <div key={slot} className={`flex gap-3 items-start${isClosed ? ' opacity-60' : ''}`}>
            <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
            <div className="flex-1">
              <EmptySlot
                {...slotIdentity}
                date={dateString}
                time={slot}
                variant="timeline"
                closed={isClosed}
                onClick={onEmptySlotClick}
                isMovingTarget={isMovingTarget}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScheduleTimeline({
  groupBy,
  stations,
  staff,
  appointments,
  dateString,
  globalOpen,
  globalClose,
  openIntervals,
  onAppointmentClick,
  onEmptySlotClick,
  movingAppointmentId,
  onContextAction,
}: ScheduleTimelineProps) {
  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]
  const activeStaff = staff.filter(p => p.overallStatus === 'active')

  // Il tab "Da assegnare" compare solo se ci sono davvero appuntamenti senza collaboratore.
  const hasUnassigned = appointments.some(a => a.userId === null)
  const columns: Column[] = groupBy === 'station'
    ? stations.map(s => ({ key: s.id, name: s.name }))
    : [
        ...activeStaff.map(p => ({ key: p.id, name: p.name, person: p })),
        ...(hasUnassigned ? [{ key: UNASSIGNED_KEY, name: UNASSIGNED_LABEL }] : []),
      ]

  const appointmentsFor = (column: Column) =>
    groupBy === 'station'
      ? appointments.filter(a => a.stationId === column.key)
      : appointments.filter(a => (a.userId ?? UNASSIGNED_KEY) === column.key)

  const timelineProps = {
    groupBy,
    allServiceIds,
    staff,
    dateString,
    globalOpen,
    globalClose,
    openIntervals,
    onAppointmentClick,
    onEmptySlotClick,
    movingAppointmentId,
    onContextAction,
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full overflow-x-auto">
        <TabsTrigger value="all">Tutte</TabsTrigger>
        {columns.map((column) => (
          <TabsTrigger key={column.key} value={column.key}>
            {column.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Legenda turni — ridondante in vista persone, dove i turni sono gia' i tab */}
      {groupBy === 'station' && activeStaff.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 py-2 px-1">
          {activeStaff.map((person) => {
            const shifts = person.shifts.filter(s => s.status === 'active')
            if (shifts.length === 0) return null
            return (
              <span key={person.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{person.name.split(' ')[0]}</span>
                {' '}{shifts.map(s => `${s.startTime}–${s.endTime}`).join(', ')}
              </span>
            )
          })}
        </div>
      )}

      <TabsContent value="all" className="mt-0">
        <div className="flex flex-col gap-6">
          {columns.map((column) => (
            <div key={column.key}>
              <h3 className="text-sm font-semibold mb-2">{column.name}</h3>
              <ColumnTimeline
                column={column}
                appointments={appointmentsFor(column)}
                {...timelineProps}
              />
            </div>
          ))}
        </div>
      </TabsContent>

      {columns.map((column) => (
        <TabsContent key={column.key} value={column.key} className="mt-4">
          <ColumnTimeline
            column={column}
            appointments={appointmentsFor(column)}
            {...timelineProps}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
