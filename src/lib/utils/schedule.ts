export interface TimeInterval {
  start: number
  end: number
}

export function computeGaps(
  shifts: TimeInterval[],
  appointments: TimeInterval[]
): TimeInterval[] {
  const gaps: TimeInterval[] = []

  for (const shift of shifts) {
    const covered = [...appointments]
      .filter(a => a.end > shift.start && a.start < shift.end)
      .map(a => ({
        start: Math.max(a.start, shift.start),
        end: Math.min(a.end, shift.end),
      }))
      .sort((a, b) => a.start - b.start)

    let cursor = shift.start
    for (const segment of covered) {
      if (cursor < segment.start) {
        gaps.push({ start: cursor, end: segment.start })
      }
      cursor = Math.max(cursor, segment.end)
    }
    if (cursor < shift.end) {
      gaps.push({ start: cursor, end: shift.end })
    }
  }

  return gaps
}

export function minutesToHoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}

export const SLOT_HEIGHT_PX = 30
export const MINUTES_PER_SLOT = 15

// Chiave della colonna/riga che raccoglie gli appuntamenti senza collaboratore (userId null).
export const UNASSIGNED_KEY = '__unassigned__'
export const UNASSIGNED_LABEL = 'Da assegnare'

// Inverso di timeToMinutes: 570 -> "09:30".
export function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

// Minuti dall'inizio della giornata, in UTC (gli orari sono salvati come UTC "nudo").
export function utcMinutesOfDay(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

export type LaidOutAppointment<T> = {
  appointment: T
  /** Indice della corsia occupata, da 0 a lanes-1. */
  lane: number
  /** Quante corsie affiancate servono al gruppo di sovrapposizioni. */
  lanes: number
}

/**
 * Affianca gli appuntamenti che si sovrappongono nel tempo, come fa un calendario.
 *
 * Gli appuntamenti vengono raggruppati in "cluster" di sovrapposizioni transitive; dentro
 * ogni cluster ognuno prende la prima corsia libera, e tutti gli appuntamenti dello stesso
 * cluster condividono lo stesso numero di corsie, cosi' i blocchi restano allineati.
 *
 * Serve ovunque due appuntamenti possano coesistere nella stessa colonna: due collaboratori
 * diversi sulla stessa postazione, oppure piu' appuntamenti "da assegnare" su postazioni
 * diverse che confluiscono tutti nella colonna "Da assegnare".
 */
export function computeOverlapLanes<T extends { startTime: Date; endTime: Date }>(
  appointments: T[]
): LaidOutAppointment<T>[] {
  const items = appointments
    .map(appointment => ({
      appointment,
      start: utcMinutesOfDay(appointment.startTime),
      end: utcMinutesOfDay(appointment.endTime),
    }))
    // Piu' presto prima; a parita' di inizio, prima il piu' lungo.
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const result: LaidOutAppointment<T>[] = []
  let cluster: { appointment: T; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const flushCluster = () => {
    const lanes = laneEnds.length
    for (const entry of cluster) {
      result.push({ appointment: entry.appointment, lane: entry.lane, lanes })
    }
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }

  for (const item of items) {
    // Non tocca nulla del cluster corrente: il cluster si chiude e se ne apre uno nuovo.
    if (cluster.length > 0 && item.start >= clusterEnd) flushCluster()

    let lane = laneEnds.findIndex(end => end <= item.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.end)
    } else {
      laneEnds[lane] = item.end
    }

    cluster.push({ appointment: item.appointment, lane })
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  if (cluster.length > 0) flushCluster()

  return result
}

/**
 * Un blocco appuntamento porta due colori, che dicono due cose diverse:
 * il riempimento e' il collaboratore, la spina da 4px a sinistra e' il servizio.
 * Le spine sono le stesse cinque tinte dei grafici del tema, sature abbastanza
 * da leggersi a quattro pixel di larghezza.
 */
export const SERVICE_SPINES = ['#0E8AA0', '#D9731A', '#7B5EA7', '#C2456B', '#2B5FA8'] as const

/** Senza servizio non c'e' nulla da distinguere: la spina resta neutra. */
export const UNPLANNED_SPINE = '#B3A699'

/** Riempimento di un blocco il cui collaboratore non e' ancora assegnato. */
export const UNASSIGNED_FILL = 'var(--muted)'

/** Ripiego per un collaboratore senza colore in scheda: tinte pallide della stessa famiglia. */
export const STAFF_FALLBACK_COLORS = [
  { bg: '#DCEEF2', border: '#0E8AA0' },
  { bg: '#F7E6D5', border: '#D9731A' },
  { bg: '#E8E2F2', border: '#7B5EA7' },
  { bg: '#F6DFE6', border: '#C2456B' },
  { bg: '#DEE7F5', border: '#2B5FA8' },
] as const

/**
 * Il colore di un servizio dipende solo dal servizio, mai da chi gli sta intorno.
 * Prima l'indice usciva dalla posizione fra i servizi presenti quel giorno: lo
 * stesso bagno era teal il lunedi' e arancio il martedi'. I servizi oltre il quinto
 * riprendono un colore gia' usato, percio' il nome sta sempre accanto al colore.
 */
export function getServiceSpine(serviceId: string | null): string {
  if (!serviceId) return UNPLANNED_SPINE
  let hash = 0
  for (let i = 0; i < serviceId.length; i++) {
    hash = (hash * 31 + serviceId.charCodeAt(i)) >>> 0
  }
  return SERVICE_SPINES[hash % SERVICE_SPINES.length]
}

export function getUserColor(hex: string): { bg: string; border: string } {
  return { bg: `${hex}33`, border: hex }
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number = MINUTES_PER_SLOT
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  const startMinutes = openH * 60 + openM
  const endMinutes = closeH * 60 + closeM

  for (let m = startMinutes; m < endMinutes; m += intervalMinutes) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }

  return slots
}

export function getGlobalTimeRange(
  stations: { openTime: string; closeTime: string }[]
): { globalOpen: string; globalClose: string } | null {
  if (stations.length === 0) return null

  let minOpen = stations[0].openTime
  let maxClose = stations[0].closeTime

  for (const station of stations) {
    if (station.openTime < minOpen) minOpen = station.openTime
    if (station.closeTime > maxClose) maxClose = station.closeTime
  }

  return { globalOpen: minOpen, globalClose: maxClose }
}

export function isSlotOccupied(
  slotTime: string,
  stationId: string,
  appointmentsForStation: { startTime: Date; endTime: Date }[]
): boolean {
  const [slotH, slotM] = slotTime.split(':').map(Number)
  const slotMinutes = slotH * 60 + slotM

  return appointmentsForStation.some((appt) => {
    const startMinutes = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
    const endMinutes = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes()
    return slotMinutes >= startMinutes && slotMinutes < endMinutes
  })
}

export function getAppointmentPosition(
  startTime: Date,
  endTime: Date,
  dayStartMinutes: number
) {
  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes()
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes()
  const offsetMinutes = startMinutes - dayStartMinutes
  const durationMinutes = endMinutes - startMinutes

  return {
    top: (offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX,
    height: Math.max((durationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX, 44),
  }
}

/**
 * Converte il giorno della settimana da date-fns (0=Domenica) al formato del progetto (0=Lunedi')
 */
export function toDayOfWeek(dateFnsDay: number): number {
  return dateFnsDay === 0 ? 6 : dateFnsDay - 1
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function subtractOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.max(0, h * 60 + m - 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(23 * 60 + 45, h * 60 + m + 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function computeAgendaRange(
  businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  dayOfWeek: number,
): { globalOpen: string; globalClose: string } {
  const todaySlots = businessHours.filter(h => h.dayOfWeek === dayOfWeek)
  if (todaySlots.length === 0) return { globalOpen: '08:00', globalClose: '20:00' }
  const minOpen = todaySlots.reduce((min, s) => s.openTime < min ? s.openTime : min, '23:59')
  const maxClose = todaySlots.reduce((max, s) => s.closeTime > max ? s.closeTime : max, '00:00')
  return { globalOpen: subtractOneHour(minOpen), globalClose: addOneHour(maxClose) }
}

/**
 * Stato di un quarto d'ora nella griglia settimanale delle prenotazioni.
 *
 * - `chiuso`: la sede non e' aperta in quel momento;
 * - `capacita_ignota`: la sede non ha postazioni configurate, non si puo' dire quando e' piena;
 * - `pieno`: le prenotazioni in corso hanno saturato le postazioni;
 * - `senza_collaboratori`: restano postazioni libere, ma i collaboratori in turno sono gia'
 *   tutti impegnati (3 postazioni, 2 collaboratori, 2 prenotazioni: c'e' spazio, non chi lavora);
 * - `libero`: c'e' sia una postazione sia un collaboratore.
 */
export type WeekSlotState =
  | 'chiuso'
  | 'capacita_ignota'
  | 'pieno'
  | 'senza_collaboratori'
  | 'libero'

export function weekSlotState(input: {
  isOpen: boolean
  /** Prenotazioni in corso in quel quarto d'ora. */
  occupied: number
  /** Postazioni della sede; 0 se non ne sono state configurate. */
  stationCount: number
  /**
   * Collaboratori in turno in quel quarto d'ora, oppure `null` se la sede non usa
   * la pianificazione dei turni: in quel caso il vincolo non si applica.
   */
  staffCount: number | null
}): WeekSlotState {
  const { isOpen, occupied, stationCount, staffCount } = input
  if (!isOpen) return 'chiuso'
  if (stationCount <= 0) return 'capacita_ignota'
  if (occupied >= stationCount) return 'pieno'
  if (staffCount !== null && occupied >= staffCount) return 'senza_collaboratori'
  return 'libero'
}

/** Lunedi' = 0, come `location_business_hours` e `user_recurring_schedules`. */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

export interface PlannedShift {
  userId: string
  date: string
  startTime: string
  endTime: string
}

/**
 * I turni che una sede ha davvero pianificati in una settimana.
 *
 * Stessa regola della pagina "Orario Settimanale": per ogni persona e per ogni giorno,
 * se esiste un turno inserito a mano quello vale, altrimenti vale il turno ricorrente
 * (il "fantasma" che la griglia dei turni mostra tratteggiato). Il turno inserito a mano
 * vince anche quando e' in un'altra sede: quel giorno la persona e' altrove, non qui.
 */
export function effectiveStaffShifts(input: {
  locationId: string
  /** I sette giorni della settimana, 'yyyy-MM-dd'. */
  weekDays: string[]
  /** Solo i collaboratori attivi: quelli disattivati non lavorano piu'. */
  userIds: string[]
  assignments: { userId: string; date: string; locationId: string; startTime: string; endTime: string }[]
  recurring: { userId: string; dayOfWeek: number; locationId: string; startTime: string; endTime: string }[]
}): PlannedShift[] {
  const { locationId, weekDays, userIds, assignments, recurring } = input
  const result: PlannedShift[] = []

  for (const userId of userIds) {
    for (const date of weekDays) {
      const suoi = assignments.filter((a) => a.userId === userId && a.date === date)
      if (suoi.length > 0) {
        for (const a of suoi) {
          if (a.locationId === locationId) {
            result.push({ userId, date, startTime: a.startTime, endTime: a.endTime })
          }
        }
        continue
      }
      const dow = weekdayIndex(date)
      for (const r of recurring) {
        if (r.userId === userId && r.dayOfWeek === dow && r.locationId === locationId) {
          result.push({ userId, date, startTime: r.startTime, endTime: r.endTime })
        }
      }
    }
  }

  return result
}
