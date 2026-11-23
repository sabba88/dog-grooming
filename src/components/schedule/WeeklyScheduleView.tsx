'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  generateTimeSlots,
  timeToMinutes,
  utcMinutesOfDay,
  weekSlotState,
} from '@/lib/utils/schedule'

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

// Una cella non contiene testo, solo il colore: la riga puo' stare bassa.
// Stessa altezza della griglia di prenotazione, cosi' le due schermate si somigliano.
const WEEK_SLOT_HEIGHT_PX = 20

// Usati solo se la sede non ha orari di apertura configurati.
const FALLBACK_OPEN = '08:00'
const FALLBACK_CLOSE = '20:00'

const SLOT_CLASS: Record<string, string> = {
  libero: 'bg-slot-free',
  senza_collaboratori: 'bg-slot-understaffed',
  pieno: 'bg-slot-full',
  chiuso: 'bg-slot-closed',
  capacita_ignota: 'bg-slot-unknown',
}

interface Interval {
  start: number
  end: number
}

/** Lunedi' = 0, come `location_business_hours` e `user_recurring_schedules`. */
function dateToDayOfWeek(dateString: string): number {
  const [y, m, d] = dateString.split('-').map(Number)
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Dom
  return jsDay === 0 ? 6 : jsDay - 1
}

function formatDayHeader(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatDayLong(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

/** La data di oggi come chiave 'YYYY-MM-DD', per evidenziare la colonna. */
function todayKey(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** Gli orari degli appuntamenti sono UTC "nudi": la giornata si legge in UTC. */
function dateKeyOf(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}-${m}-${d}`
}

/** Estremi della griglia: dall'apertura piu' mattiniera alla chiusura piu' tarda della settimana. */
function computeWeekRange(businessHours: BusinessHour[]): { from: string; to: string } {
  if (businessHours.length === 0) return { from: FALLBACK_OPEN, to: FALLBACK_CLOSE }
  const from = businessHours.reduce((min, h) => (h.openTime < min ? h.openTime : min), '23:59')
  const to = businessHours.reduce((max, h) => (h.closeTime > max ? h.closeTime : max), '00:00')
  return { from, to }
}

function countCovering(intervals: Interval[], minutes: number): number {
  return intervals.filter(iv => minutes >= iv.start && minutes < iv.end).length
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
  const { from, to } = computeWeekRange(businessHours)
  const slots = generateTimeSlots(from, to)
  const gridCols = `56px repeat(${weekDates.length}, minmax(0, 1fr))`
  const oggi = todayKey()

  const navHeader = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevWeek} aria-label="Settimana precedente">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[180px] text-center text-sm font-medium">{currentWeekLabel}</span>
        <Button variant="outline" size="icon" onClick={onNextWeek} aria-label="Settimana successiva">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {!isLoading && (
        <span className="text-xs text-muted-foreground">
          {groupBy === 'station'
            ? `${stations.length} postazion${stations.length === 1 ? 'e' : 'i'}`
            : `${staff.length} collaborator${staff.length === 1 ? 'e' : 'i'}`}
        </span>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {navHeader}
        <div className="h-[420px] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  // Quanti appuntamenti sono in corso in un quarto d'ora: per il colore conta
  // il numero, non di chi sono. Le due mappe contengono gli stessi appuntamenti,
  // raggruppati diversamente, quindi si legge quella del raggruppamento scelto.
  const sourceMap = groupBy === 'station' ? appointmentsByStation : appointmentsByPerson
  const busyByDate = new Map<string, Interval[]>()
  for (const list of Object.values(sourceMap)) {
    for (const appt of list) {
      const key = dateKeyOf(appt.startTime)
      const arr = busyByDate.get(key) ?? []
      arr.push({ start: utcMinutesOfDay(appt.startTime), end: utcMinutesOfDay(appt.endTime) })
      busyByDate.set(key, arr)
    }
  }

  // Turni del giorno, per sapere quanti collaboratori sono presenti in un quarto d'ora.
  const shiftsByDate = new Map<string, Interval[]>()
  for (const person of staff) {
    for (const entry of staffShifts[person.id] ?? []) {
      const arr = shiftsByDate.get(entry.date) ?? []
      for (const shift of entry.shifts) {
        arr.push({ start: timeToMinutes(shift.startTime), end: timeToMinutes(shift.endTime) })
      }
      shiftsByDate.set(entry.date, arr)
    }
  }

  // Se in tutta la settimana non c'e' nemmeno un turno, la sede non usa la
  // pianificazione del personale: quel vincolo non si applica.
  const staffKnown = shiftsByDate.size > 0

  const openByDow = new Map<number, Interval[]>()
  for (const bh of businessHours) {
    const arr = openByDow.get(bh.dayOfWeek) ?? []
    arr.push({ start: timeToMinutes(bh.openTime), end: timeToMinutes(bh.closeTime) })
    openByDow.set(bh.dayOfWeek, arr)
  }

  function stateAt(date: string, minutes: number): string {
    const isOpen = countCovering(openByDow.get(dateToDayOfWeek(date)) ?? [], minutes) > 0
    const occupied = countCovering(busyByDate.get(date) ?? [], minutes)
    const onShift = countCovering(shiftsByDate.get(date) ?? [], minutes)
    // Per postazione il tetto sono le postazioni, e i collaboratori sono il
    // secondo vincolo; per collaboratore il tetto sono gia' loro.
    const capacity = groupBy === 'station' ? stations.length : onShift
    return weekSlotState({
      isOpen,
      occupied,
      stationCount: capacity,
      staffCount: groupBy === 'station' && staffKnown ? onShift : null,
    })
  }

  // Riepilogo per colonna: quanto e' pieno il giorno e quante fasce restano scoperte.
  const dayStats = weekDates.map(date => {
    let open = 0
    let taken = 0
    const understaffed: string[] = []
    let runStart: string | null = null

    for (const slot of slots) {
      const state = stateAt(date, timeToMinutes(slot))
      if (state !== 'chiuso') {
        open += 1
        if (state === 'pieno' || state === 'senza_collaboratori') taken += 1
      }
      if (state === 'senza_collaboratori') {
        if (runStart === null) runStart = slot
      } else if (runStart !== null) {
        understaffed.push(`${runStart}–${slot}`)
        runStart = null
      }
    }
    if (runStart !== null) understaffed.push(`${runStart}–${to}`)

    return {
      date,
      open,
      pct: open === 0 ? 0 : Math.round((taken / open) * 100),
      appointments: (busyByDate.get(date) ?? []).length,
      understaffed,
    }
  })

  const daCoprire = dayStats
    .flatMap(s => s.understaffed.map(range => ({ date: s.date, range })))
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-3">
      {navHeader}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-slot-free" />
          Posti liberi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-slot-understaffed" />
          Liberi, ma senza collaboratori
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-slot-full" />
          Pieno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-slot-closed" />
          Chiuso
        </span>
      </div>

      <div className="overflow-auto rounded-lg border bg-card">
        {/* Intestazione: i giorni della settimana */}
        <div className="sticky top-0 z-10 grid border-b bg-card" style={{ gridTemplateColumns: gridCols }}>
          <div className="p-2 text-xs font-medium text-muted-foreground">Orario</div>
          {dayStats.map(stat => (
            <button
              key={stat.date}
              onClick={() => onDayClick(stat.date)}
              title="Apri la giornata"
              className={cn(
                'border-l p-2 text-left transition-colors hover:bg-accent',
                stat.date === oggi && 'bg-accent/60'
              )}
            >
              <span className="block text-xs font-medium capitalize">{formatDayHeader(stat.date)}</span>
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn('block h-1 rounded-full', stat.pct >= 85 ? 'bg-slot-full' : 'bg-primary')}
                  style={{ width: `${stat.pct}%` }}
                />
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {stat.open === 0 ? 'chiuso' : `${stat.pct}% · ${stat.appointments} appunt.`}
              </span>
            </button>
          ))}
        </div>

        {/* Righe: un quarto d'ora ciascuna */}
        {slots.map(slot => {
          const minutes = timeToMinutes(slot)
          const isHour = slot.endsWith(':00')
          return (
            <div
              key={slot}
              className="grid"
              style={{ gridTemplateColumns: gridCols, height: `${WEEK_SLOT_HEIGHT_PX}px` }}
            >
              <div
                className={cn(
                  'flex items-center justify-end pr-1.5 text-[11px] leading-none',
                  isHour ? 'border-t border-border font-medium text-foreground' : 'border-t border-border/25 text-muted-foreground'
                )}
              >
                {isHour ? slot : ''}
              </div>

              {weekDates.map(date => {
                const state = stateAt(date, minutes)
                const titolo = `${formatDayHeader(date)} ${slot} · ${
                  {
                    libero: 'posti liberi',
                    senza_collaboratori: 'posti liberi ma collaboratori esauriti',
                    pieno: 'pieno',
                    chiuso: 'chiuso',
                    capacita_ignota: 'capacita non configurata',
                  }[state]
                }`
                return (
                  <button
                    key={date}
                    onClick={() => onDayClick(date)}
                    title={titolo}
                    aria-label={`Apri ${formatDayLong(date)}, ore ${slot}`}
                    className={cn(
                      'border-l transition-opacity hover:opacity-70',
                      isHour ? 'border-t border-t-border' : 'border-t border-t-border/25',
                      SLOT_CLASS[state]
                    )}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {daCoprire.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Da coprire</span>
          {daCoprire.map(({ date, range }) => (
            <button
              key={`${date}-${range}`}
              onClick={() => onDayClick(date)}
              className="rounded-md border border-slot-understaffed bg-slot-understaffed/40 px-2 py-1 text-xs capitalize transition-colors hover:bg-slot-understaffed/70"
            >
              {formatDayHeader(date)} · {range}
            </button>
          ))}
        </div>
      )}

      {groupBy === 'station' && stations.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nessuna postazione configurata per questa sede: senza capacita non si puo dire se un quarto
          d&apos;ora sia pieno.
        </p>
      )}
    </div>
  )
}
