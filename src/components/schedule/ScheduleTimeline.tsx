'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import { generateTimeSlots, getServiceColor } from '@/lib/utils/schedule'
import type { StaffStatus, ShiftInfo } from '@/lib/queries/staff'

interface Person {
  id: string
  name: string
  role: 'admin' | 'collaborator'
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

interface ScheduleTimelineProps {
  staff: Person[]
  appointments: Appointment[]
  dateString: string
  globalOpen: string
  globalClose: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { userId: string; userName: string; date: string; time: string }) => void
  movingAppointmentId?: string
  onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void
}

const STATUS_DOT_COLOR: Record<StaffStatus, string> = {
  active: '#22C55E',
  elsewhere: '#EAB308',
  unassigned: '#9CA3AF',
}

function PersonTimeline({
  person,
  appointments,
  allServiceIds,
  dateString,
  globalOpen,
  globalClose,
  onAppointmentClick,
  onEmptySlotClick,
  movingAppointmentId,
  onContextAction,
}: {
  person: Person
  appointments: Appointment[]
  allServiceIds: string[]
  dateString: string
  globalOpen: string
  globalClose: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { userId: string; userName: string; date: string; time: string }) => void
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

        // Only show the appointment block on its first slot
        if (appt) {
          const apptStartMinutes = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
          if (slotMinutes !== apptStartMinutes) return null

          const color = getServiceColor(appt.serviceId, allServiceIds)

          return (
            <div key={slot} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
              <div className="flex-1">
                <AppointmentBlock
                  id={appt.id}
                  clientName={appt.clientNominativo}
                  dogName={appt.dogName}
                  serviceName={appt.serviceName}
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

        return (
          <div key={slot} className="flex gap-3 items-start">
            <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
            <div className="flex-1">
              <EmptySlot
                userId={person.id}
                userName={person.name}
                date={dateString}
                time={slot}
                variant="timeline"
                onClick={onEmptySlotClick}
                isMovingTarget={!!movingAppointmentId && person.overallStatus === 'active'}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScheduleTimeline({
  staff,
  appointments,
  dateString,
  globalOpen,
  globalClose,
  onAppointmentClick,
  onEmptySlotClick,
  movingAppointmentId,
  onContextAction,
}: ScheduleTimelineProps) {
  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full overflow-x-auto">
        <TabsTrigger value="all">Tutte</TabsTrigger>
        {staff.map((person) => (
          <TabsTrigger key={person.id} value={person.id} className="gap-1.5">
            <span
              className="size-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: STATUS_DOT_COLOR[person.overallStatus] }}
            />
            {person.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="flex flex-col gap-6">
          {staff.map((person) => {
            const personAppointments = appointments.filter(
              (a) => a.userId === person.id
            )
            return (
              <div key={person.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="size-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: STATUS_DOT_COLOR[person.overallStatus] }}
                  />
                  <h3 className="text-sm font-semibold text-foreground">{person.name}</h3>
                </div>
                <PersonTimeline
                  person={person}
                  appointments={personAppointments}
                  allServiceIds={allServiceIds}
                  dateString={dateString}
                  globalOpen={globalOpen}
                  globalClose={globalClose}
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

      {staff.map((person) => {
        const personAppointments = appointments.filter(
          (a) => a.userId === person.id
        )
        return (
          <TabsContent key={person.id} value={person.id} className="mt-4">
            <PersonTimeline
              person={person}
              appointments={personAppointments}
              allServiceIds={allServiceIds}
              dateString={dateString}
              globalOpen={globalOpen}
              globalClose={globalClose}
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
