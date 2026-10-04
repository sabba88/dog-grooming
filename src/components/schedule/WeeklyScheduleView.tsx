'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeeklyStationRow } from './WeeklyStationRow'
import { WeeklyPersonRow } from './WeeklyPersonRow'
import { formatDayHeader } from './WeeklyDayCell'
import { useIsMobile } from '@/hooks/use-mobile'
import { timeToMinutes, MINUTES_PER_SLOT, UNASSIGNED_KEY, UNASSIGNED_LABEL } from '@/lib/utils/schedule'

interface User {
  id: string
  name: string
  role: 'admin' | 'collaborator'
}

interface Station {
  id: string
  name: string
}

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

interface WeeklyScheduleViewProps {
  weekDates: string[]
  staff: User[]
  staffShifts: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>
  stations: Station[]
  appointmentsByStation: Record<string, { startTime: Date; endTime: Date }[]>
  appointmentsByPerson: Record<string, { startTime: Date; endTime: Date }[]>
  businessHours: BusinessHour[]
  groupBy: 'station' | 'person'
  onDayClick: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  currentWeekLabel: string
  isLoading?: boolean
}

// 0=Lun..6=Dom  (stesso sistema del progetto)
function dateToDayOfWeek(dateString: string): number {
  const [y, m, d] = dateString.split('-').map(Number)
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Dom
  return jsDay === 0 ? 6 : jsDay - 1
}

// Fasce di apertura del negozio per una data specifica, ordinate per orario
function getBusinessHoursForDate(
  dateString: string,
  businessHours: BusinessHour[]
): { startTime: string; endTime: string }[] {
  const dow = dateToDayOfWeek(dateString)
  return businessHours
    .filter(bh => bh.dayOfWeek === dow)
    .map(bh => ({ startTime: bh.openTime, endTime: bh.closeTime }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// Raggruppa gli appuntamenti di una postazione per data (chiave YYYY-MM-DD UTC)
function groupByDate(
  appts: { startTime: Date; endTime: Date }[]
): Record<string, { startTime: Date; endTime: Date }[]> {
  const result: Record<string, { startTime: Date; endTime: Date }[]> = {}
  for (const appt of appts) {
    const y = appt.startTime.getUTCFullYear()
    const m = String(appt.startTime.getUTCMonth() + 1).padStart(2, '0')
    const d = String(appt.startTime.getUTCDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    if (!result[key]) result[key] = []
    result[key].push(appt)
  }
  return result
}

// Per ogni postazione e ogni data: quali ore sono "understaffed"?
// (staff attivi in quell'ora < postazioni già prenotate in quell'ora,
//  e questa postazione non ha appuntamenti in quell'ora)
function computeUnderstaffedHours(
  weekDates: string[],
  staff: User[],
  staffShifts: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>,
  stations: Station[],
  appointmentsByStation: Record<string, { startTime: Date; endTime: Date }[]>
): Record<string, Record<string, Set<number>>> {
  const result: Record<string, Record<string, Set<number>>> = {}
  for (const s of stations) result[s.id] = {}

  for (const date of weekDates) {
    // Slot = multiplo di MINUTES_PER_SLOT (15 min), chiave = minuto di inizio slot
    const staffPerSlot: Record<number, number> = {}
    for (const person of staff) {
      const entry = staffShifts[person.id]?.find(e => e.date === date)
      for (const shift of entry?.shifts ?? []) {
        const sStart = Math.floor(timeToMinutes(shift.startTime) / MINUTES_PER_SLOT)
        const sEnd = Math.ceil(timeToMinutes(shift.endTime) / MINUTES_PER_SLOT)
        for (let s = sStart; s < sEnd; s++) {
          staffPerSlot[s * MINUTES_PER_SLOT] = (staffPerSlot[s * MINUTES_PER_SLOT] ?? 0) + 1
        }
      }
    }
    if (Object.keys(staffPerSlot).length === 0) continue

    const bookedPerSlot: Record<number, Set<string>> = {}
    for (const station of stations) {
      const appts = (appointmentsByStation[station.id] ?? []).filter(a => {
        const d = String(a.startTime.getUTCDate()).padStart(2, '0')
        const m = String(a.startTime.getUTCMonth() + 1).padStart(2, '0')
        const y = a.startTime.getUTCFullYear()
        return `${y}-${m}-${d}` === date
      })
      for (const appt of appts) {
        const aStart = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
        const aEnd = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes()
        const sStart = Math.floor(aStart / MINUTES_PER_SLOT)
        const sEnd = Math.ceil(aEnd / MINUTES_PER_SLOT)
        for (let s = sStart; s < sEnd; s++) {
          const key = s * MINUTES_PER_SLOT
          if (!bookedPerSlot[key]) bookedPerSlot[key] = new Set()
          bookedPerSlot[key].add(station.id)
        }
      }
    }

    for (const station of stations) {
      const slots = new Set<number>()
      for (const [keyStr, activeStaff] of Object.entries(staffPerSlot)) {
        const slotMin = parseInt(keyStr)
        const booked = bookedPerSlot[slotMin] ?? new Set()
        if (booked.size >= activeStaff && !booked.has(station.id)) {
          slots.add(slotMin)
        }
      }
      if (slots.size > 0) result[station.id][date] = slots
    }
  }
  return result
}

export function WeeklyScheduleView({
  weekDates,
  staff,
  staffShifts,
  stations,
  appointmentsByStation,
  appointmentsByPerson,
  businessHours,
  groupBy,
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

  // Orari negozio per ogni giorno della settimana (usati come finestra per rettangoli e heatmap)
  const businessHoursPerDate = Object.fromEntries(
    weekDates.map(date => [date, getBusinessHoursForDate(date, businessHours)])
  )

  const dayHeaderRow = (
    <>
      <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-r" />
      {weekDates.map(date => (
        <div
          key={date}
          className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground border-b border-r text-center capitalize"
        >
          {formatDayHeader(date)}
        </div>
      ))}
    </>
  )

  if (groupBy === 'person') {
    const unassignedAppts = appointmentsByPerson[UNASSIGNED_KEY] ?? []

    if (staff.length === 0 && unassignedAppts.length === 0) {
      return (
        <div className="flex flex-col gap-2">
          {navHeader}
          <p className="text-center text-muted-foreground py-8 text-sm">
            Nessuna persona in turno in questa sede questa settimana
          </p>
        </div>
      )
    }

    const personRows = staff.map(person => ({
      person,
      shiftsPerDate: Object.fromEntries(
        (staffShifts[person.id] ?? []).map(e => [e.date, e.shifts])
      ) as Record<string, { startTime: string; endTime: string }[]>,
      appointmentsPerDate: groupByDate(appointmentsByPerson[person.id] ?? []),
    }))

    if (unassignedAppts.length > 0) {
      personRows.push({
        person: { id: UNASSIGNED_KEY, name: UNASSIGNED_LABEL, role: 'collaborator' },
        // Nessun turno da mostrare: la finestra di riferimento sono gli orari del negozio.
        shiftsPerDate: businessHoursPerDate,
        appointmentsPerDate: groupByDate(unassignedAppts),
      })
    }

    const rows = personRows.map(row => (
      <WeeklyPersonRow
        key={row.person.id}
        person={row.person}
        weekDates={weekDates}
        shiftsPerDate={row.shiftsPerDate}
        appointmentsPerDate={row.appointmentsPerDate}
        onDayClick={onDayClick}
        isMobile={isMobile}
      />
    ))

    if (isMobile) {
      return (
        <div className="flex flex-col gap-0">
          {navHeader}
          <div className="flex flex-col">{rows}</div>
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
          {dayHeaderRow}
          {rows}
        </div>
      </div>
    )
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {navHeader}
        <p className="text-center text-muted-foreground py-8 text-sm">
          Nessuna postazione configurata per questa sede
        </p>
      </div>
    )
  }

  const understaffedHours = computeUnderstaffedHours(
    weekDates, staff, staffShifts, stations, appointmentsByStation
  )

  const apptPerDateByStation = Object.fromEntries(
    stations.map(s => [s.id, groupByDate(appointmentsByStation[s.id] ?? [])])
  )

  if (isMobile) {
    return (
      <div className="flex flex-col gap-0">
        {navHeader}
        <div className="flex flex-col">
          {stations.map(station => (
            <WeeklyStationRow
              key={station.id}
              station={station}
              weekDates={weekDates}
              appointmentsPerDate={apptPerDateByStation[station.id]}
              understaffedHoursPerDate={understaffedHours[station.id] ?? {}}
              businessHoursPerDate={businessHoursPerDate}
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
        {dayHeaderRow}

        {/* Station rows */}
        {stations.map(station => (
          <WeeklyStationRow
            key={station.id}
            station={station}
            weekDates={weekDates}
            appointmentsPerDate={apptPerDateByStation[station.id]}
            understaffedHoursPerDate={understaffedHours[station.id] ?? {}}
            businessHoursPerDate={businessHoursPerDate}
            onDayClick={onDayClick}
            isMobile={false}
          />
        ))}
      </div>
    </div>
  )
}
