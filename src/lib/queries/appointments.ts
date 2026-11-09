import { db } from '@/lib/db'
import { appointments, breeds, clients, dogs, services, stations, users } from '@/lib/db/schema'
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
      locationId: appointments.locationId,
      clientNominativo: clients.nominativo,
      clientPhone: clients.phone,
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      dogName: dogs.name,
      // Servizio assente finche' non lo si sceglie in pianificazione.
      serviceName: services.name,
      serviceId: appointments.serviceId,
      userName: users.name,
      // Postazione assente finche' non la si assegna in pianificazione.
      stationName: stations.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.userId, users.id))
    .leftJoin(stations, eq(appointments.stationId, stations.id))
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
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      dogName: dogs.name,
      serviceName: services.name,
      serviceId: appointments.serviceId,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        // La sede e' sull'appuntamento: non si passa piu' dalla postazione,
        // che in prenotazione non c'e' ancora.
        eq(appointments.locationId, locationId),
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
  locationId: string,
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
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      dogName: dogs.name,
      breedName: breeds.name,
      serviceName: services.name,
      serviceId: appointments.serviceId,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .leftJoin(breeds, eq(dogs.breedId, breeds.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.locationId, locationId),
        gte(appointments.startTime, dayStart),
        lt(appointments.startTime, dayEnd),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))
}

export async function getWeeklyAppointmentsByStation(
  weekStart: string,
  weekEnd: string,
  locationId: string,
  tenantId: string
): Promise<{ id: string; stationId: string; startTime: Date; endTime: Date }[]> {
  const start = new Date(weekStart + 'T00:00:00.000Z')
  const end = new Date(weekEnd + 'T23:59:59.999Z')

  const rows = await db
    .select({
      id: appointments.id,
      stationId: appointments.stationId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(
      and(
        // Solo gli appuntamenti gia' assegnati a una postazione hanno una riga qui.
        isNotNull(appointments.stationId),
        eq(appointments.locationId, locationId),
        gte(appointments.startTime, start),
        lt(appointments.startTime, end),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))

  return rows.map(r => ({ ...r, stationId: r.stationId! }))
}

export async function getWeeklyAppointmentsByPerson(
  weekStart: string,
  weekEnd: string,
  locationId: string,
  tenantId: string
): Promise<{ id: string; userId: string | null; startTime: Date; endTime: Date }[]> {
  const start = new Date(weekStart + 'T00:00:00.000Z')
  const end = new Date(weekEnd + 'T23:59:59.999Z')

  // userId puo' essere null: gli appuntamenti "da assegnare" finiscono in una riga dedicata.
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
        eq(appointments.locationId, locationId),
        gte(appointments.startTime, start),
        lt(appointments.startTime, end),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))
}

/**
 * Appuntamenti della settimana ancora privi di postazione, collaboratore o servizio.
 * Alimenta il vassoio "Da pianificare" e il contatore in testata.
 */
export async function getUnplannedAppointments(
  weekStart: string,
  weekEnd: string,
  locationId: string,
  tenantId: string
) {
  const start = new Date(weekStart + 'T00:00:00.000Z')
  const end = new Date(weekEnd + 'T23:59:59.999Z')

  const rows = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      userId: appointments.userId,
      stationId: appointments.stationId,
      serviceId: appointments.serviceId,
      clientNominativo: clients.nominativo,
      dogName: dogs.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.locationId, locationId),
        gte(appointments.startTime, start),
        lt(appointments.startTime, end),
        eq(appointments.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .orderBy(asc(appointments.startTime))

  // Il filtro "incompleto" vive in `isDaPianificare`: tenerlo in SQL significherebbe
  // duplicare la regola in due posti e vederla divergere.
  return rows
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
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.startTime))
}

export interface LastDogVisit {
  id: string
  startTime: Date
  price: number | null
  serviceName: string | null
  userName: string | null
  stationName: string | null
}

/**
 * Ultima prestazione gia' avvenuta su questo cane: chi l'ha seguito, cosa gli e'
 * stato fatto e quanto e' stato pagato. Serve per riproporre la stessa persona in
 * un nuovo appuntamento e per avere un riferimento quando si conferma il prezzo.
 */
export async function getLastVisitForDog(
  dogId: string,
  tenantId: string,
  excludeAppointmentId?: string | null
): Promise<LastDogVisit | null> {
  const conditions = [
    eq(appointments.dogId, dogId),
    eq(appointments.tenantId, tenantId),
    // Solo cio' che e' gia' successo: un appuntamento futuro non dice chi l'ha fatto.
    lt(appointments.startTime, new Date()),
  ]
  if (excludeAppointmentId) {
    conditions.push(ne(appointments.id, excludeAppointmentId))
  }

  const [row] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      price: appointments.price,
      serviceName: services.name,
      userName: users.name,
      stationName: stations.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.userId, users.id))
    .leftJoin(stations, eq(appointments.stationId, stations.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.startTime))
    .limit(1)

  return row ?? null
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
