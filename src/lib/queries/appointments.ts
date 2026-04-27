import { db } from '@/lib/db'
import { appointments, clients, dogs, services, stations, users } from '@/lib/db/schema'
import { eq, and, gte, lt, asc, isNull, isNotNull, ne, desc } from 'drizzle-orm'

export async function getAppointmentById(id: string, tenantId: string) {
  const [result] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      price: appointments.price,
      notes: appointments.notes,
      userId: appointments.userId,
      dogId: appointments.dogId,
      clientId: appointments.clientId,
      stationId: appointments.stationId,
      clientNominativo: clients.nominativo,
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
      clientNominativo: clients.nominativo,
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
      clientNominativo: clients.nominativo,
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

export async function getWeeklyAppointmentsByPerson(
  weekStart: string,
  weekEnd: string,
  tenantId: string
): Promise<{ id: string; userId: string; startTime: Date; endTime: Date }[]> {
  const start = new Date(weekStart + 'T00:00:00.000Z')
  const end = new Date(weekEnd + 'T23:59:59.999Z')

  return db
    .select({
      id: appointments.id,
      userId: appointments.userId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(
      and(
        isNotNull(appointments.userId),
        gte(appointments.startTime, start),
        lt(appointments.startTime, end),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))
}

export async function getServiceNotesByDog(
  dogId: string,
  excludeAppointmentId: string | null,
  tenantId: string
) {
  const conditions = [
    eq(appointments.dogId, dogId),
    eq(appointments.tenantId, tenantId),
    isNotNull(appointments.notes),
    ne(appointments.notes, ''),
  ]
  if (excludeAppointmentId) {
    conditions.push(ne(appointments.id, excludeAppointmentId))
  }

  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      serviceName: services.name,
      notes: appointments.notes,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.startTime))
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
