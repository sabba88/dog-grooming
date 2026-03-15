export const SLOT_HEIGHT_PX = 60
export const MINUTES_PER_SLOT = 30

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
