'use client'

import { isToday } from 'date-fns'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import {
  generateTimeSlots,
  getGlobalTimeRange,
  getAppointmentPosition,
  getServiceColor,
  timeToMinutes,
  SLOT_HEIGHT_PX,
  MINUTES_PER_SLOT,
} from '@/lib/utils/schedule'

interface Station {
  id: string
  name: string
  openTime: string
  closeTime: string
}

interface Appointment {
  id: string
  startTime: Date
  endTime: Date
  price: number
  notes: string | null
  stationId: string
  clientFirstName: string
  clientLastName: string
  dogName: string
  serviceName: string
  serviceId: string
}

interface ScheduleGridProps {
  stations: Station[]
  appointments: Appointment[]
  selectedDate: Date
  dateString: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { stationId: string; date: string; time: string }) => void
}

export function ScheduleGrid({
  stations,
  appointments,
  selectedDate,
  dateString,
  onAppointmentClick,
  onEmptySlotClick,
}: ScheduleGridProps) {
  const timeRange = getGlobalTimeRange(stations)
  if (!timeRange) return null

  const { globalOpen, globalClose } = timeRange
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
        className="grid sticky top-0 z-20 bg-card border-b border-border"
        style={{
          gridTemplateColumns: `60px repeat(${stations.length}, 1fr)`,
        }}
      >
        <div className="p-2 text-xs text-muted-foreground font-medium">Orario</div>
        {stations.map((station) => (
          <div key={station.id} className="p-2 text-sm font-medium text-center border-l border-border">
            {station.name}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `60px repeat(${stations.length}, 1fr)`,
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

        {/* Station columns */}
        {stations.map((station) => {
          const stationAppointments = appointments.filter(
            (a) => a.stationId === station.id
          )

          // Generate empty slots for this station
          const stationSlots = generateTimeSlots(station.openTime, station.closeTime)
          const stationStartOffset = timeToMinutes(station.openTime) - dayStartMinutes
          const stationEndOffset = timeToMinutes(station.closeTime) - dayStartMinutes
          const stationHeight = ((stationEndOffset - stationStartOffset) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

          return (
            <div
              key={station.id}
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

              {/* Closed area (before station opens or after closes) */}
              {stationStartOffset > 0 && (
                <div
                  className="absolute inset-x-0 bg-muted/30"
                  style={{ top: 0, height: `${(stationStartOffset / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px` }}
                />
              )}
              {stationEndOffset < totalMinutes && (
                <div
                  className="absolute inset-x-0 bg-muted/30"
                  style={{
                    top: `${(stationEndOffset / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                    height: `${((totalMinutes - stationEndOffset) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
                  }}
                />
              )}

              {/* Empty slots (only during station open hours) */}
              {stationSlots.map((slot) => {
                const slotMinutes = timeToMinutes(slot)
                const isOccupied = stationAppointments.some((appt) => {
                  const apptStart = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
                  const apptEnd = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes()
                  return slotMinutes >= apptStart && slotMinutes < apptEnd
                })

                if (isOccupied) return null

                const offsetMinutes = slotMinutes - dayStartMinutes
                const top = (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

                return (
                  <EmptySlot
                    key={`${station.id}-${slot}`}
                    stationId={station.id}
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
              {stationAppointments.map((appt) => {
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
