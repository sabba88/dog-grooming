'use client'

import { WeeklyDayCell } from './WeeklyDayCell'
import { computeGaps, minutesToHoursLabel, timeToMinutes, TimeInterval } from '@/lib/utils/schedule'

interface Person {
  id: string
  name: string
  role: 'admin' | 'collaborator'
}

interface WeeklyPersonRowProps {
  person: Person
  weekDates: string[]
  shiftsPerDate: Record<string, { startTime: string; endTime: string }[]>
  appointmentsPerDate: Record<string, { startTime: Date; endTime: Date }[]>
  onDayClick: (date: string) => void
  isMobile: boolean
}

function getDayAbbreviation(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' })
    .format(date)
    .slice(0, 2)
    .toUpperCase()
}

function computeDayGapMinutes(
  shifts: { startTime: string; endTime: string }[],
  appointments: { startTime: Date; endTime: Date }[]
): number {
  if (shifts.length === 0) return 0
  const shiftIntervals: TimeInterval[] = shifts.map(s => ({
    start: timeToMinutes(s.startTime),
    end: timeToMinutes(s.endTime),
  }))
  const apptIntervals: TimeInterval[] = appointments.map(a => ({
    start: a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes(),
    end: a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes(),
  }))
  const gaps = computeGaps(shiftIntervals, apptIntervals)
  return gaps.reduce((sum, g) => sum + (g.end - g.start), 0)
}

export function WeeklyPersonRow({
  person,
  weekDates,
  shiftsPerDate,
  appointmentsPerDate,
  onDayClick,
  isMobile,
}: WeeklyPersonRowProps) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-1 py-2 border-b">
        <span className="text-sm font-medium px-2">{person.name}</span>
        <div className="flex gap-1 overflow-x-auto px-2 pb-1">
          {weekDates.map(date => {
            const shifts = shiftsPerDate[date] ?? []
            const appointments = appointmentsPerDate[date] ?? []
            const dayAbbr = getDayAbbreviation(date)
            const isUnassigned = shifts.length === 0
            const gapMinutes = computeDayGapMinutes(shifts, appointments)

            let badgeClass = 'flex-shrink-0 text-xs px-2 py-1 rounded border cursor-pointer '
            if (isUnassigned) {
              badgeClass += 'border-border text-muted-foreground bg-muted'
            } else if (gapMinutes > 0) {
              badgeClass += 'border-primary text-primary bg-transparent'
            } else {
              badgeClass += 'border-border text-muted-foreground bg-transparent'
            }

            return (
              <button
                key={date}
                onClick={() => onDayClick(date)}
                className={badgeClass}
              >
                {isUnassigned
                  ? dayAbbr
                  : `${dayAbbr} ${minutesToHoursLabel(gapMinutes)}`}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="contents">
      <div className="flex items-center px-3 py-2 text-sm font-medium border-b border-r bg-background sticky left-0 z-10 min-h-[72px]">
        <span className="truncate">{person.name}</span>
      </div>
      {weekDates.map(date => (
        <div key={date} className="p-2 border-b border-r min-h-[72px] flex items-center">
          <WeeklyDayCell
            shifts={shiftsPerDate[date] ?? []}
            appointments={appointmentsPerDate[date] ?? []}
            date={date}
            onClick={() => onDayClick(date)}
          />
        </div>
      ))}
    </div>
  )
}
