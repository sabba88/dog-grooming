'use client'

import { addDays, format, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { generateTimeSlots, timeToMinutes, utcMinutesOfDay, weekSlotState } from '@/lib/utils/schedule'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface WeekBooking {
  id: string
  startTime: Date
  endTime: Date
}

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

/** Un turno pianificato in questa sede: chi, che giorno, da che ora a che ora. */
interface StaffShift {
  userId: string
  date: string
  startTime: string
  endTime: string
}

interface BookingWeekGridProps {
  weekStart: Date
  bookings: WeekBooking[]
  stationCount: number
  businessHours: BusinessHour[]
  staffShifts: StaffShift[]
  isLoading?: boolean
  onSlotClick: (date: string, time: string) => void
  onDayClick: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

// Righe piu' basse che nella vista giornaliera: qui una cella non contiene testo,
// solo il colore, e servono sette colonne invece di tre.
const WEEK_SLOT_HEIGHT_PX = 20

// Usato solo se la sede non ha orari di apertura configurati.
const FALLBACK_OPEN = '08:00'
const FALLBACK_CLOSE = '20:00'

/** Estremi della griglia: dall'apertura piu' mattiniera alla chiusura piu' tarda della settimana. */
function computeWeekRange(businessHours: BusinessHour[]): { from: string; to: string } {
  if (businessHours.length === 0) return { from: FALLBACK_OPEN, to: FALLBACK_CLOSE }
  const from = businessHours.reduce((min, h) => (h.openTime < min ? h.openTime : min), '23:59')
  const to = businessHours.reduce((max, h) => (h.closeTime > max ? h.closeTime : max), '00:00')
  return { from, to }
}

export function BookingWeekGrid({
  weekStart,
  bookings,
  stationCount,
  businessHours,
  staffShifts,
  isLoading,
  onSlotClick,
  onDayClick,
  onPrevWeek,
  onNextWeek,
}: BookingWeekGridProps) {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const { from, to } = computeWeekRange(businessHours)
  const slots = generateTimeSlots(from, to)

  // Gli orari sono UTC "nudi": la giornata di un appuntamento si legge in UTC,
  // come fanno le query che li filtrano per data.
  const perDay = new Map<string, { start: number; end: number }[]>()
  for (const b of bookings) {
    const key = b.startTime.toISOString().slice(0, 10)
    const list = perDay.get(key) ?? []
    list.push({ start: utcMinutesOfDay(b.startTime), end: utcMinutesOfDay(b.endTime) })
    perDay.set(key, list)
  }

  const openIntervalsByDow = new Map<number, { start: number; end: number }[]>()
  for (const h of businessHours) {
    const list = openIntervalsByDow.get(h.dayOfWeek) ?? []
    list.push({ start: timeToMinutes(h.openTime), end: timeToMinutes(h.closeTime) })
    openIntervalsByDow.set(h.dayOfWeek, list)
  }

  // Turni del giorno, per contare quanti collaboratori sono presenti in un quarto d'ora.
  const shiftsByDay = new Map<string, { userId: string; start: number; end: number }[]>()
  for (const s of staffShifts) {
    const list = shiftsByDay.get(s.date) ?? []
    list.push({ userId: s.userId, start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) })
    shiftsByDay.set(s.date, list)
  }

  // Se in tutta la settimana non c'e' nemmeno un turno, la sede non usa la pianificazione
  // del personale: colorare tutto di giallo direbbe solo che i turni non sono stati inseriti.
  const staffKnown = staffShifts.length > 0

  // Senza postazioni configurate non si puo' dire se un quarto d'ora sia pieno.
  const capacityKnown = stationCount > 0

  const label = `${format(weekStart, 'd MMM', { locale: it })}–${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: it })}`
  const gridCols = `56px repeat(7, minmax(0, 1fr))`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevWeek} aria-label="Settimana precedente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[180px] text-center text-sm font-medium">{label}</span>
          <Button variant="outline" size="icon" onClick={onNextWeek} aria-label="Settimana successiva">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Legenda: senza, i colori vanno indovinati */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-emerald-400" /> posti liberi
          </span>
          {staffKnown && (
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-amber-400" /> posti liberi, collaboratori
              occupati
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-red-400" /> tutto occupato
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted-foreground/25" /> chiuso
          </span>
        </div>
      </div>

      {!capacityKnown && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Nessuna postazione configurata per questa sede: non si pu&ograve; sapere quando
          &egrave; tutto occupato. Le celle mostrano solo quante prenotazioni ci sono.
        </p>
      )}

      <div className="overflow-auto rounded-lg border">
        {/* Intestazione: i giorni della settimana */}
        <div className="sticky top-0 z-10 grid border-b bg-card" style={{ gridTemplateColumns: gridCols }}>
          <div className="p-2 text-xs font-medium text-muted-foreground">Orario</div>
          {weekDates.map((date) => {
            const key = format(date, 'yyyy-MM-dd')
            const count = (perDay.get(key) ?? []).length
            return (
              <button
                key={key}
                onClick={() => onDayClick(key)}
                className={cn(
                  'border-l p-2 text-left transition-colors hover:bg-primary/5',
                  isToday(date) && 'bg-primary/5'
                )}
                title="Apri la giornata"
              >
                <span className="block text-xs font-medium capitalize">
                  {format(date, 'EEE d/MM', { locale: it })}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {count === 0 ? '—' : `${count} pren.`}
                </span>
              </button>
            )
          })}
        </div>

        {/* Righe: un quarto d'ora ciascuna */}
        {slots.map((slot) => {
          const slotMinutes = timeToMinutes(slot)
          const isHour = slot.endsWith(':00')
          return (
            <div
              key={slot}
              className="grid"
              style={{ gridTemplateColumns: gridCols, height: `${WEEK_SLOT_HEIGHT_PX}px` }}
            >
              <div
                className={cn(
                  'flex items-center justify-end pr-1.5 text-[10px] leading-none',
                  isHour ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  isHour ? 'border-t border-border' : 'border-t border-border/25'
                )}
              >
                {slot}
              </div>

              {weekDates.map((date) => {
                const key = format(date, 'yyyy-MM-dd')
                const dayOfWeek = (date.getDay() + 6) % 7
                const intervals = openIntervalsByDow.get(dayOfWeek) ?? []
                const isOpen = intervals.some((iv) => slotMinutes >= iv.start && slotMinutes < iv.end)

                const occupied = (perDay.get(key) ?? []).filter(
                  (b) => slotMinutes >= b.start && slotMinutes < b.end
                ).length
                const free = stationCount - occupied

                // Quante persone diverse sono in turno qui in questo quarto d'ora: un
                // collaboratore con due turni spezzati resta una persona sola.
                const staffCount = staffKnown
                  ? new Set(
                      (shiftsByDay.get(key) ?? [])
                        .filter((s) => slotMinutes >= s.start && slotMinutes < s.end)
                        .map((s) => s.userId)
                    ).size
                  : null

                const state = weekSlotState({ isOpen, occupied, stationCount, staffCount })

                const collaboratori =
                  staffCount === null
                    ? ''
                    : ` · ${Math.max(staffCount - occupied, 0)} di ${staffCount} ${staffCount === 1 ? 'collaboratore libero' : 'collaboratori liberi'}`

                const titolo = !isOpen
                  ? `${slot} · chiuso${occupied > 0 ? ` · ${occupied} prenotate` : ''}`
                  : capacityKnown
                    ? `${slot} · ${Math.max(free, 0)} di ${stationCount} libere${collaboratori}`
                    : `${slot} · ${occupied} prenotate${collaboratori}`

                return (
                  <button
                    key={key}
                    onClick={() => onSlotClick(key, slot)}
                    title={titolo}
                    aria-label={`Prenota ${format(date, 'EEEE d MMMM', { locale: it })} alle ${slot}`}
                    className={cn(
                      'border-l transition-opacity hover:opacity-70',
                      isHour ? 'border-t border-t-border' : 'border-t border-t-border/25',
                      state === 'chiuso' && 'bg-muted-foreground/20',
                      state === 'capacita_ignota' && (occupied > 0 ? 'bg-sky-300' : 'bg-sky-100'),
                      state === 'pieno' && 'bg-red-400',
                      // Giallo: la postazione ci sarebbe, ma i collaboratori in turno
                      // sono gia' tutti impegnati (3 postazioni, 2 in turno, 2 prenotazioni).
                      state === 'senza_collaboratori' && 'bg-amber-400',
                      state === 'libero' && 'bg-emerald-400',
                      // Piu' si riempie, piu' il verde si scurisce: il colpo d'occhio
                      // distingue "quasi pieno" da "vuoto" senza leggere il tooltip.
                      state === 'libero' && occupied > 0 && 'opacity-60'
                    )}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Caricamento settimana...
        </p>
      )}
    </div>
  )
}
