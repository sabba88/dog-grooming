import { db } from '@/lib/db'
import { appointments, clients, dogs, services, stations, users } from '@/lib/db/schema'
import { eq, and, gte, lt, asc, isNull, isNotNull } from 'drizzle-orm'

export async function getAppointmentById(id: string, tenantId: string) {
  const [result] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      price: appointments.price,
      notes: appointments.notes,
      userId: appointments.userId,
      stationId: appointments.stationId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      dogName: dogs.name,
      serviceName: services.name,
      serviceId: services.id,
      userName: users.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .limit(1)

  return result ?? null
}

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

export async function getAppointmentsByDateAndLocationGroupedByUser(
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
      userId: appointments.userId,
      stationId: appointments.stationId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      dogName: dogs.name,
      serviceName: services.name,
      serviceId: services.id,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        isNotNull(appointments.userId),
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
  _dayOfWeek: number,
  tenantId: string
) {
  // TODO: Story 4.x — riscrittura agenda per persone
  // Gli orari delle postazioni sono stati rimossi (CC-2026-03-14).
  // Restituisce tutte le postazioni della sede con orari default.
  const stationRows = await db
    .select({
      id: stations.id,
      name: stations.name,
    })
    .from(stations)
    .where(and(eq(stations.locationId, locationId), eq(stations.tenantId, tenantId)))
    .orderBy(asc(stations.name))

  return stationRows.map((station) => ({
    ...station,
    openTime: '08:00',
    closeTime: '20:00',
  }))
}
