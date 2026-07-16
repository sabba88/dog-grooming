'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import { generateTimeSlots, getServiceColor, getUserColor } from '@/lib/utils/schedule'
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
  userId: string
  stationId: string | null
  clientNominativo: string
  dogName: string
  serviceName: string
  serviceId: string
}

interface SlotData {
  stationId?: string
  stationName?: string
  userId?: string
  userName?: string
  date: string
  time: string
}

interface ScheduleTimelineProps {
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

function StationTimeline({
  station,
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
  station: Station
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

  return (
    <div className="flex flex-col gap-2">
      {timeSlots.map((slot) => {
        const [slotH, slotM] = slot.split(':').map(Number)
        const slotMinutes = slotH * 60 + slotM

        const appt = appointments.find((a) => {
          const startMinutes = a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes()
          const endMinutes = a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes()
          return slotMinutes >= startMinutes && slotMinutes < endMinutes
        })

        if (appt) {
          const apptStartMinutes = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
          if (slotMinutes !== apptStartMinutes) return null

          const staffMember = staff.find(p => p.id === appt.userId)
          const color = staffMember?.color ? getUserColor(staffMember.color) : getServiceColor(appt.serviceId, allServiceIds)
          return (
            <div key={slot} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
              <div className="flex-1">
                <AppointmentBlock
                  id={appt.id}
                  clientName={appt.clientNominativo}
                  dogName={appt.dogName}
                  serviceName={appt.serviceName}
                  staffName={staffMember?.name ?? ''}
                  price={appt.price}
                  startTime={appt.startTime}
                  endTime={appt.endTime}
                  color={color}
                  variant="timeline"
                  onClick={onAppointmentClick}
                  isMoving={movingAppointmentId === appt.id}
                  onContextAction={onContextAction}
                />
              </div>
            </div>
          )
        }

        const isClosed = !isInOpenHours(slotMinutes, openIntervals)

        return (
          <div key={slot} className={`flex gap-3 items-start${isClosed ? ' opacity-60' : ''}`}>
            <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
            <div className="flex-1">
              <EmptySlot
                stationId={station.id}
                stationName={station.name}
                date={dateString}
                time={slot}
                variant="timeline"
                closed={isClosed}
                onClick={onEmptySlotClick}
                isMovingTarget={!!movingAppointmentId}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScheduleTimeline({
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

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full overflow-x-auto">
        <TabsTrigger value="all">Tutte</TabsTrigger>
        {stations.map((station) => (
          <TabsTrigger key={station.id} value={station.id}>
            {station.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {activeStaff.length > 0 && (
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
          {stations.map((station) => {
            const stationAppts = appointments.filter(a => a.stationId === station.id)
            return (
              <div key={station.id}>
                <h3 className="text-sm font-semibold mb-2">{station.name}</h3>
                <StationTimeline
                  station={station}
                  appointments={stationAppts}
                  allServiceIds={allServiceIds}
                  staff={staff}
                  dateString={dateString}
                  globalOpen={globalOpen}
                  globalClose={globalClose}
                  openIntervals={openIntervals}
                  onAppointmentClick={onAppointmentClick}
                  onEmptySlotClick={onEmptySlotClick}
                  movingAppointmentId={movingAppointmentId}
                  onContextAction={onContextAction}
                />
              </div>
            )
          })}
        </div>
      </TabsContent>

      {stations.map((station) => {
        const stationAppts = appointments.filter(a => a.stationId === station.id)
        return (
          <TabsContent key={station.id} value={station.id} className="mt-4">
            <StationTimeline
              station={station}
              appointments={stationAppts}
              allServiceIds={allServiceIds}
              staff={staff}
              dateString={dateString}
              globalOpen={globalOpen}
              globalClose={globalClose}
              openIntervals={openIntervals}
              onAppointmentClick={onAppointmentClick}
              onEmptySlotClick={onEmptySlotClick}
              movingAppointmentId={movingAppointmentId}
              onContextAction={onContextAction}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
