'use client'

import { computeGaps, minutesToHoursLabel, timeToMinutes, TimeInterval, MINUTES_PER_SLOT } from '@/lib/utils/schedule'

interface Station {
  id: string
  name: string
}

interface Shift {
  startTime: string
  endTime: string
}

interface Appointment {
  startTime: Date
  endTime: Date
}

type SegmentType = 'covered' | 'gap-available' | 'gap-understaffed'
type StationSegment = { type: SegmentType; duration: number }

interface WeeklyStationRowProps {
  station: Station
  weekDates: string[]
  appointmentsPerDate: Record<string, Appointment[]>
  // date → Set<number> delle ore understaffed per questa postazione
  understaffedHoursPerDate: Record<string, Set<number>>
  businessHoursPerDate: Record<string, Shift[]>
  onDayClick: (date: string) => void
  isMobile: boolean
}

function getDayAbbr(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' })
    .format(date)
    .slice(0, 2)
    .toUpperCase()
}

// Costruisce i segmenti del bar con granularità ora per colorare solo
// le fasce gialle dove lo staff è davvero esaurito.
function buildStationSegments(
  shifts: Shift[],
  appointments: Appointment[],
  understaffedHours: Set<number>
): { segments: StationSegment[]; totalMinutes: number; gapMinutes: number } {
  const shiftIntervals = shifts
    .map(s => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }))
    .sort((a, b) => a.start - b.start)

  const apptIntervals = appointments
    .map(a => ({
      start: a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes(),
      end: a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes(),
    }))

  const totalMinutes = shiftIntervals.reduce((sum, s) => sum + (s.end - s.start), 0)
  const segments: StationSegment[] = []
  let gapMinutes = 0

  for (const shift of shiftIntervals) {
    // Raccoglie tutti i punti di cambio all'interno di questa fascia:
    // inizio/fine appuntamenti + confini di slot da 15 min
    const points = new Set<number>([shift.start, shift.end])
    for (const a of apptIntervals) {
      if (a.end <= shift.start || a.start >= shift.end) continue
      points.add(Math.max(a.start, shift.start))
      points.add(Math.min(a.end, shift.end))
    }
    // Confini di slot (ogni 15 min) interni alla fascia
    const slotStart = Math.ceil(shift.start / MINUTES_PER_SLOT)
    const slotEnd = Math.floor(shift.end / MINUTES_PER_SLOT)
    for (let s = slotStart; s <= slotEnd; s++) {
      const sMin = s * MINUTES_PER_SLOT
      if (sMin > shift.start && sMin < shift.end) points.add(sMin)
    }

    const sortedPoints = [...points].sort((a, b) => a - b)

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const t1 = sortedPoints[i]
      const t2 = sortedPoints[i + 1]
      const duration = t2 - t1
      const mid = (t1 + t2) / 2

      const isCovered = apptIntervals.some(a => a.start <= mid && a.end > mid)
      if (isCovered) {
        segments.push({ type: 'covered', duration })
      } else {
        const slotMin = Math.floor(mid / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
        const type = understaffedHours.has(slotMin) ? 'gap-understaffed' : 'gap-available'
        segments.push({ type, duration })
        gapMinutes += duration
      }
    }
  }

  return { segments, totalMinutes, gapMinutes }
}

function computeGapMinutes(shifts: Shift[], appointments: Appointment[]): number {
  if (shifts.length === 0) return 0
  const shiftIntervals: TimeInterval[] = shifts.map(s => ({
    start: timeToMinutes(s.startTime),
    end: timeToMinutes(s.endTime),
  }))
  const apptIntervals: TimeInterval[] = appointments.map(a => ({
    start: a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes(),
    end: a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes(),
  }))
  return computeGaps(shiftIntervals, apptIntervals).reduce((sum, g) => sum + (g.end - g.start), 0)
}

function StationDayBar({
  shifts,
  appointments,
  understaffedHours,
  onClick,
}: {
  shifts: Shift[]
  appointments: Appointment[]
  understaffedHours: Set<number>
  onClick: () => void
}) {
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

  const { segments, totalMinutes, gapMinutes } = buildStationSegments(shifts, appointments, understaffedHours)
  const hasUnderstaffing = segments.some(s => s.type === 'gap-understaffed')

  const timeLabel = shifts.map(s => `${s.startTime}–${s.endTime}`).join(' · ')
  const labelColor = gapMinutes === 0
    ? 'text-muted-foreground'
    : hasUnderstaffing
      ? 'text-red-600'
      : 'text-green-600'

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex w-full overflow-hidden rounded" style={{ height: '36px' }}>
        {segments.map((seg, i) => {
          const widthPct = totalMinutes > 0 ? (seg.duration / totalMinutes) * 100 : 0
          if (seg.type === 'covered') {
            return (
              <div
                key={i}
                className="bg-red-600 h-full flex-shrink-0"
                style={{ width: `${widthPct}%` }}
              />
            )
          }
          if (seg.type === 'gap-understaffed') {
            return (
              <div
                key={i}
                className="h-full flex-shrink-0 border border-dashed"
                style={{ width: `${widthPct}%`, backgroundColor: '#FEE2E2', borderColor: '#EF4444' }}
              />
            )
          }
          return (
            <div
              key={i}
              className="h-full flex-shrink-0 bg-green-100"
              style={{ width: `${widthPct}%` }}
            />
          )
        })}
      </div>
      <span className="text-[10px] text-muted-foreground leading-none truncate">
        {timeLabel}
      </span>
      <span className={`text-xs font-medium ${labelColor}`}>
        {minutesToHoursLabel(gapMinutes)} non pian.
      </span>
    </button>
  )
}

export function WeeklyStationRow({
  station,
  weekDates,
  appointmentsPerDate,
  understaffedHoursPerDate,
  businessHoursPerDate,
  onDayClick,
  isMobile,
}: WeeklyStationRowProps) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-1 py-2 border-b">
        <span className="text-sm font-medium px-2">{station.name}</span>
        <div className="flex gap-1 overflow-x-auto px-2 pb-1">
          {weekDates.map(date => {
            const shifts = businessHoursPerDate[date] ?? []
            const appointments = appointmentsPerDate[date] ?? []
            const understaffedHours = understaffedHoursPerDate[date] ?? new Set<number>()
            const dayAbbr = getDayAbbr(date)
            const isUnassigned = shifts.length === 0
            const gapMinutes = computeGapMinutes(shifts, appointments)
            const hasUnderstaffing = understaffedHours.size > 0

            let cls = 'flex-shrink-0 text-xs px-2 py-1 rounded border cursor-pointer '
            if (isUnassigned) {
              cls += 'border-border text-muted-foreground bg-muted'
            } else if (hasUnderstaffing && gapMinutes > 0) {
              cls += 'border-red-400 text-red-700 bg-red-50'
            } else if (gapMinutes > 0) {
              cls += 'border-green-400 text-green-700 bg-green-50'
            } else {
              cls += 'border-red-300 text-red-700 bg-red-50'
            }

            return (
              <button key={date} onClick={() => onDayClick(date)} className={cls}>
                {isUnassigned ? dayAbbr : `${dayAbbr} ${minutesToHoursLabel(gapMinutes)}`}
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
        <span className="truncate">{station.name}</span>
      </div>
      {weekDates.map(date => (
        <div key={date} className="p-2 border-b border-r min-h-[72px] flex items-center">
          <StationDayBar
            shifts={businessHoursPerDate[date] ?? []}
            appointments={appointmentsPerDate[date] ?? []}
            understaffedHours={understaffedHoursPerDate[date] ?? new Set()}
            onClick={() => onDayClick(date)}
          />
        </div>
      ))}
    </div>
  )
}
