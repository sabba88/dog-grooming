import { db } from '@/lib/db'
import { appointments, clients, dogs, services, stations, stationSchedules } from '@/lib/db/schema'
import { eq, and, gte, lt, asc, isNull } from 'drizzle-orm'

export async function getAppointmentsByDateAndLocation(
  locationId: string,
  date: string,
  tenantId: string
) {
  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      price: appointments.price,
      notes: appointments.notes,
      stationId: appointments.stationId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      dogName: dogs.name,
      serviceName: services.name,
      serviceId: services.id,
    })
    .from(appointments)
    .innerJoin(stations, eq(appointments.stationId, stations.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(stations.locationId, locationId),
        gte(appointments.startTime, dayStart),
        lt(appointments.startTime, dayEnd),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))
}

export async function getStationsWithScheduleForDay(
  locationId: string,
  dayOfWeek: number,
  tenantId: string
) {
  const stationRows = await db
    .select({
      id: stations.id,
      name: stations.name,
    })
    .from(stations)
    .where(and(eq(stations.locationId, locationId), eq(stations.tenantId, tenantId)))
    .orderBy(asc(stations.name))

  const result = await Promise.all(
    stationRows.map(async (station) => {
      const [schedule] = await db
        .select({
          openTime: stationSchedules.openTime,
          closeTime: stationSchedules.closeTime,
        })
        .from(stationSchedules)
        .where(
          and(
            eq(stationSchedules.stationId, station.id),
            eq(stationSchedules.dayOfWeek, dayOfWeek),
            eq(stationSchedules.tenantId, tenantId)
          )
        )
        .limit(1)

      if (!schedule) return null

      return {
        ...station,
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
      }
    })
  )

  return result.filter((s): s is NonNullable<typeof s> => s !== null)
}
