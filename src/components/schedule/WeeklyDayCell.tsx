'use client'

import { computeGaps, minutesToHoursLabel, timeToMinutes, TimeInterval } from '@/lib/utils/schedule'

interface Shift {
  startTime: string
  endTime: string
}

interface Appointment {
  startTime: Date
  endTime: Date
}

interface WeeklyDayCellProps {
  shifts: Shift[]
  appointments: Appointment[]
  date: string
  onClick: () => void
}

type BarSegment = { type: 'covered' | 'gap'; duration: number }

function buildBarSegments(
  shifts: Shift[],
  appointments: Appointment[]
): { segments: BarSegment[]; totalMinutes: number; gapMinutes: number } {
  const shiftIntervals: TimeInterval[] = shifts
    .map(s => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }))
    .sort((a, b) => a.start - b.start)

  const apptIntervals: TimeInterval[] = appointments
    .map(a => ({
      start: a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes(),
      end: a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes(),
    }))
    .sort((a, b) => a.start - b.start)

  const totalMinutes = shiftIntervals.reduce((sum, s) => sum + (s.end - s.start), 0)
  const allGaps = computeGaps(shiftIntervals, apptIntervals)
  const gapMinutes = allGaps.reduce((sum, g) => sum + (g.end - g.start), 0)

  const segments: BarSegment[] = []
  for (const shift of shiftIntervals) {
    const shiftGaps = allGaps.filter(g => g.start >= shift.start && g.end <= shift.end)
    let cursor = shift.start
    for (const gap of shiftGaps) {
      if (cursor < gap.start) {
        segments.push({ type: 'covered', duration: gap.start - cursor })
      }
      segments.push({ type: 'gap', duration: gap.end - gap.start })
      cursor = gap.end
    }
    if (cursor < shift.end) {
      segments.push({ type: 'covered', duration: shift.end - cursor })
    }
  }

  return { segments, totalMinutes, gapMinutes }
}

export function formatDayHeader(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

export function WeeklyDayCell({ shifts, appointments, onClick }: WeeklyDayCellProps) {
  if (shifts.length === 0) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-muted text-muted-foreground text-xs text-center py-2 rounded cursor-pointer hover:bg-muted/80 transition-colors"
      >
        Non asseg.
      </button>
    )
  }

  const { segments, totalMinutes, gapMinutes } = buildBarSegments(shifts, appointments)

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex w-full overflow-hidden rounded" style={{ height: '40px' }}>
        {segments.map((seg, i) => {
          const widthPct = totalMinutes > 0 ? (seg.duration / totalMinutes) * 100 : 0
          if (seg.type === 'covered') {
            return (
              <div
                key={i}
                className="bg-gray-700 h-full flex-shrink-0"
                style={{ width: `${widthPct}%` }}
              />
            )
          }
          return (
            <div
              key={i}
              className="h-full flex-shrink-0 border border-dashed"
              style={{
                width: `${widthPct}%`,
                backgroundColor: '#E5F7F9',
                borderColor: '#4BBFC8',
              }}
            />
          )
        })}
      </div>
      <span
        className={`text-xs font-medium ${gapMinutes === 0 ? 'text-muted-foreground' : 'text-primary'}`}
      >
        {minutesToHoursLabel(gapMinutes)} non pianificate
      </span>
    </button>
  )
}
