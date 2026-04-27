'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeeklyPersonRow } from './WeeklyPersonRow'
import { formatDayHeader } from './WeeklyDayCell'
import { useIsMobile } from '@/hooks/use-mobile'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
}

interface WeeklyScheduleViewProps {
  weekDates: string[]
  staff: User[]
  staffShifts: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>
  appointments: Record<string, { id: string; userId: string; startTime: Date; endTime: Date }[]>
  onDayClick: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  currentWeekLabel: string
  isLoading?: boolean
}

function getShiftsPerDate(
  userShifts: { date: string; shifts: { startTime: string; endTime: string }[] }[] | undefined
): Record<string, { startTime: string; endTime: string }[]> {
  if (!userShifts) return {}
  const result: Record<string, { startTime: string; endTime: string }[]> = {}
  for (const entry of userShifts) {
    result[entry.date] = entry.shifts
  }
  return result
}

function getAppointmentsPerDate(
  userAppts: { startTime: Date; endTime: Date }[] | undefined
): Record<string, { startTime: Date; endTime: Date }[]> {
  if (!userAppts) return {}
  const result: Record<string, { startTime: Date; endTime: Date }[]> = {}
  for (const appt of userAppts) {
    const d = appt.startTime.getUTCDate()
    const mo = appt.startTime.getUTCMonth() + 1
    const yr = appt.startTime.getUTCFullYear()
    const dateKey = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!result[dateKey]) result[dateKey] = []
    result[dateKey].push(appt)
  }
  return result
}

export function WeeklyScheduleView({
  weekDates,
  staff,
  staffShifts,
  appointments,
  onDayClick,
  onPrevWeek,
  onNextWeek,
  currentWeekLabel,
  isLoading = false,
}: WeeklyScheduleViewProps) {
  const isMobile = useIsMobile()

  const navHeader = (
    <div className="flex items-center justify-between gap-4 py-2">
      <Button variant="outline" size="sm" onClick={onPrevWeek}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-medium">{currentWeekLabel}</span>
      <Button variant="outline" size="sm" onClick={onNextWeek}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {navHeader}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {navHeader}
        <p className="text-center text-muted-foreground py-8 text-sm">
          Nessun collaboratore configurato per questa sede
        </p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-0">
        {navHeader}
        <div className="flex flex-col">
          {staff.map(person => (
            <WeeklyPersonRow
              key={person.id}
              person={person}
              weekDates={weekDates}
              shiftsPerDate={getShiftsPerDate(staffShifts[person.id])}
              appointmentsPerDate={getAppointmentsPerDate(appointments[person.id])}
              onDayClick={onDayClick}
              isMobile={true}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {navHeader}
      <div
        className="grid border-t border-l"
        style={{ gridTemplateColumns: `180px repeat(${weekDates.length}, 1fr)` }}
      >
        {/* Header row */}
        <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r" />
        {weekDates.map(date => (
          <div
            key={date}
            className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground border-b border-r text-center capitalize"
          >
            {formatDayHeader(date)}
          </div>
        ))}

        {/* Person rows */}
        {staff.map(person => (
          <WeeklyPersonRow
            key={person.id}
            person={person}
            weekDates={weekDates}
            shiftsPerDate={getShiftsPerDate(staffShifts[person.id])}
            appointmentsPerDate={getAppointmentsPerDate(appointments[person.id])}
            onDayClick={onDayClick}
            isMobile={false}
          />
        ))}
      </div>
    </div>
  )
}
