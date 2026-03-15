'use client'

import { isToday } from 'date-fns'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import { PersonHeader } from './PersonHeader'
import {
  generateTimeSlots,
  getAppointmentPosition,
  getServiceColor,
  timeToMinutes,
  SLOT_HEIGHT_PX,
  MINUTES_PER_SLOT,
} from '@/lib/utils/schedule'
import type { StaffStatus } from '@/lib/queries/staff'

interface Person {
  id: string
  name: string
  role: 'admin' | 'collaborator'
  status: StaffStatus
  assignment: {
    startTime: string
    endTime: string
    locationId: string
  } | null
}

interface Appointment {
  id: string
  startTime: Date
  endTime: Date
  price: number
  notes: string | null
  userId: string
  stationId: string | null
  clientFirstName: string
  clientLastName: string
  dogName: string
  serviceName: string
  serviceId: string
}

interface ScheduleGridProps {
  staff: Person[]
  appointments: Appointment[]
  selectedDate: Date
  dateString: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { userId: string; userName: string; date: string; time: string }) => void
}

const GLOBAL_OPEN = '00:00'
const GLOBAL_CLOSE = '23:30'

export function ScheduleGrid({
  staff,
  appointments,
  selectedDate,
  dateString,
  onAppointmentClick,
  onEmptySlotClick,
}: ScheduleGridProps) {
  if (staff.length === 0) return null

  const timeSlots = generateTimeSlots(GLOBAL_OPEN, GLOBAL_CLOSE)
  const dayStartMinutes = timeToMinutes(GLOBAL_OPEN)
  const totalMinutes = timeToMinutes(GLOBAL_CLOSE) - dayStartMinutes
  const totalHeight = (totalMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]

  // Current time indicator
  const now = new Date()
  const showCurrentTime = isToday(selectedDate)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentTimeInRange = currentMinutes >= dayStartMinutes && currentMinutes <= dayStartMinutes + totalMinutes
  const currentTimeTop = ((currentMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  return (
    <div className="overflow-auto">
      {/* Header row */}
      <div
        className="grid sticky top-0 z-20 border-b border-border"
        style={{
          gridTemplateColumns: `60px repeat(${staff.length}, 1fr)`,
        }}
      >
        <div className="p-2 text-xs text-muted-foreground font-medium bg-card">Orario</div>
        {staff.map((person) => (
          <div key={person.id} className="border-l border-border">
            <PersonHeader
              name={person.name}
              role={person.role}
              status={person.status}
              locationName={person.status === 'elsewhere' && person.assignment ? undefined : undefined}
              startTime={person.status === 'active' && person.assignment ? person.assignment.startTime : undefined}
              endTime={person.status === 'active' && person.assignment ? person.assignment.endTime : undefined}
            />
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `60px repeat(${staff.length}, 1fr)`,
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

        {/* Person columns */}
        {staff.map((person) => {
          const personAppointments = appointments.filter(
            (a) => a.userId === person.id
          )

          const isDimmed = person.status === 'elsewhere' || person.status === 'unassigned'

          // Active person shift range
          const shiftStart = person.status === 'active' && person.assignment
            ? timeToMinutes(person.assignment.startTime)
            : null
          const shiftEnd = person.status === 'active' && person.assignment
            ? timeToMinutes(person.assignment.endTime)
            : null

          return (
            <div
              key={person.id}
              className="relative border-l border-border"
              style={{
                height: `${totalHeight}px`,
                opacity: isDimmed ? 0.5 : 1,
              }}
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

              {/* Out-of-shift areas for active persons */}
              {shiftStart !== null && shiftEnd !== null && (
                <>
                  {shiftStart > dayStartMinutes && (
                    <div
                      className="absolute inset-x-0 bg-muted/20"
                      style={{
                        top: 0,
                        height: `${((shiftStart - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                      }}
                    />
                  )}
                  {shiftEnd < dayStartMinutes + totalMinutes && (
                    <div
                      className="absolute inset-x-0 bg-muted/20"
                      style={{
                        top: `${((shiftEnd - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                        height: `${((dayStartMinutes + totalMinutes - shiftEnd) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                      }}
                    />
                  )}
                </>
              )}

              {/* Empty slots */}
              {timeSlots.map((slot) => {
                const slotMinutes = timeToMinutes(slot)
                const isOccupied = personAppointments.some((appt) => {
                  const apptStart = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
                  const apptEnd = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes()
                  return slotMinutes >= apptStart && slotMinutes < apptEnd
                })

                if (isOccupied) return null

                const offsetMinutes = slotMinutes - dayStartMinutes
                const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

                return (
                  <EmptySlot
                    key={`${person.id}-${slot}`}
                    userId={person.id}
                    userName={person.name}
                    date={dateString}
                    time={slot}
                    variant="grid"
                    style={{
                      top: `${top}px`,
                      height: `${SLOT_HEIGHT_PX}px`,
                    }}
                    onClick={onEmptySlotClick}
                  />
                )
              })}

              {/* Appointment blocks */}
              {personAppointments.map((appt) => {
                const position = getAppointmentPosition(
                  appt.startTime,
                  appt.endTime,
                  dayStartMinutes
                )
                const color = getServiceColor(appt.serviceId, allServiceIds)

                return (
                  <AppointmentBlock
                    key={appt.id}
                    id={appt.id}
                    clientName={`${appt.clientFirstName} ${appt.clientLastName}`}
                    dogName={appt.dogName}
                    serviceName={appt.serviceName}
                    price={appt.price}
                    startTime={appt.startTime}
                    endTime={appt.endTime}
                    color={color}
                    variant="grid"
                    style={{
                      top: `${position.top}px`,
                      height: `${position.height}px`,
                    }}
                    onClick={onAppointmentClick}
                  />
                )
              })}
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
