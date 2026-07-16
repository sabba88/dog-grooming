'use client'

import { isToday } from 'date-fns'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import {
  generateTimeSlots,
  getAppointmentPosition,
  getServiceColor,
  getUserColor,
  timeToMinutes,
  SLOT_HEIGHT_PX,
  MINUTES_PER_SLOT,
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
  userId: string
  stationId: string | null
  clientNominativo: string
  dogName: string
  serviceName: string
  serviceId: string
}

interface ScheduleGridProps {
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
  movingAppointmentId?: string
  onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void
}

function isInOpenHours(slotMinutes: number, openIntervals: { start: number; end: number }[]): boolean {
  return openIntervals.some(iv => slotMinutes >= iv.start && slotMinutes < iv.end)
}

export function ScheduleGrid({
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
  movingAppointmentId,
  onContextAction,
}: ScheduleGridProps) {
  if (stations.length === 0) return null

  const timeSlots = generateTimeSlots(globalOpen, globalClose)
  const dayStartMinutes = timeToMinutes(globalOpen)
  const totalMinutes = timeToMinutes(globalClose) - dayStartMinutes
  const totalHeight = (totalMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]
  const activeStaff = staff.filter(p => p.overallStatus === 'active')
  const showStaffPanel = activeStaff.length > 0
  const staffPanelWidth = showStaffPanel ? Math.max(64, activeStaff.length * 32) : 0

  const STAFF_COLORS = [
    { bg: 'rgba(219,234,254,0.85)', border: '#60a5fa' },
    { bg: 'rgba(209,250,229,0.85)', border: '#34d399' },
    { bg: 'rgba(237,233,254,0.85)', border: '#a78bfa' },
    { bg: 'rgba(254,243,199,0.85)', border: '#fbbf24' },
    { bg: 'rgba(254,226,226,0.85)', border: '#f87171' },
  ]

  const now = new Date()
  const showCurrentTime = isToday(selectedDate)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentTimeInRange = currentMinutes >= dayStartMinutes && currentMinutes <= dayStartMinutes + totalMinutes
  const currentTimeTop = ((currentMinutes - dayStartMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

  const gridCols = showStaffPanel
    ? `60px ${staffPanelWidth}px repeat(${stations.length}, 1fr)`
    : `60px repeat(${stations.length}, 1fr)`

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
        {stations.map((station) => (
          <div key={station.id} className="border-l border-border px-2 py-1.5 bg-card">
            <span className="text-sm font-medium truncate">{station.name}</span>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: gridCols }}
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

        {/* Station columns */}
        {stations.map((station) => {
          const stationAppointments = appointments.filter(a => a.stationId === station.id)

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

              {/* Empty / closed slots */}
              {timeSlots.map((slot) => {
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
                    stationName={station.name}
                    date={dateString}
                    time={slot}
                    variant="grid"
                    closed={!isInOpenHours(slotMinutes, openIntervals)}
                    style={{ top: `${top}px`, height: `${SLOT_HEIGHT_PX}px` }}
                    onClick={onEmptySlotClick}
                    isMovingTarget={!!movingAppointmentId}
                  />
                )
              })}

              {/* Appointment blocks */}
              {stationAppointments.map((appt) => {
                const position = getAppointmentPosition(appt.startTime, appt.endTime, dayStartMinutes)
                const staffMember = staff.find(p => p.id === appt.userId)
                const color = staffMember?.color ? getUserColor(staffMember.color) : getServiceColor(appt.serviceId, allServiceIds)
                return (
                  <AppointmentBlock
                    key={appt.id}
                    id={appt.id}
                    clientName={appt.clientNominativo}
                    dogName={appt.dogName}
                    serviceName={appt.serviceName}
                    staffName={staffMember?.name ?? ''}
                    price={appt.price}
                    startTime={appt.startTime}
                    endTime={appt.endTime}
                    color={color}
                    variant="grid"
                    style={{ top: `${position.top}px`, height: `${position.height}px` }}
                    onClick={onAppointmentClick}
                    isMoving={movingAppointmentId === appt.id}
                    onContextAction={onContextAction}
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
