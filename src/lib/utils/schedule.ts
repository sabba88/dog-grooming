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

export const SERVICE_COLORS = [
  { bg: '#DBEAFE', border: '#93C5FD', label: 'Azzurro' },
  { bg: '#DCFCE7', border: '#86EFAC', label: 'Verde' },
  { bg: '#E8DEF8', border: '#C4B5FD', label: 'Lavanda' },
  { bg: '#FED7AA', border: '#FDBA74', label: 'Pesca' },
  { bg: '#F1F5F9', border: '#CBD5E1', label: 'Grigio' },
] as const

export function getServiceColor(serviceId: string, allServiceIds: string[]) {
  const sorted = [...allServiceIds].sort()
  const index = sorted.indexOf(serviceId)
  return SERVICE_COLORS[index % SERVICE_COLORS.length]
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
