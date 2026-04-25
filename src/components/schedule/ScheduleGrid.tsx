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
  globalOpen: string
  globalClose: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { userId: string; userName: string; date: string; time: string }) => void
  movingAppointmentId?: string
}

export function ScheduleGrid({
  staff,
  appointments,
  selectedDate,
  dateString,
  globalOpen,
  globalClose,
  onAppointmentClick,
  onEmptySlotClick,
  movingAppointmentId,
}: ScheduleGridProps) {
  if (staff.length === 0) return null

  const timeSlots = generateTimeSlots(globalOpen, globalClose)
  const dayStartMinutes = timeToMinutes(globalOpen)
  const totalMinutes = timeToMinutes(globalClose) - dayStartMinutes
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
              overallStatus={person.overallStatus}
              shifts={person.shifts}
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

          const isDimmed = person.overallStatus !== 'active'

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

              {/* Shift bands: active (green) and elsewhere (amber) */}
              {person.shifts.map((shift, i) => {
                const shiftStart = timeToMinutes(shift.startTime)
                const shiftEnd = timeToMinutes(shift.endTime)
                return (
                  <div
                    key={i}
                    className="absolute inset-x-0"
                    style={{
                      top: `${((shiftStart - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                      height: `${((shiftEnd - shiftStart) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                      backgroundColor: shift.status === 'active' ? '#E8F0ED' : '#FEF3C7',
                    }}
                  />
                )
              })}

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
                    isMovingTarget={!!movingAppointmentId && person.overallStatus === 'active'}
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
                    isMoving={movingAppointmentId === appt.id}
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
