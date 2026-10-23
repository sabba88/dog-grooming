import { db } from '@/lib/db'
import { appointments, breeds, clients, dogs, services, stations } from '@/lib/db/schema'
import { eq, and, gte, lt, asc, isNull, count } from 'drizzle-orm'

/**
 * Appuntamenti di una giornata in una sede, come li vede chi prenota: niente
 * postazione, niente collaboratore, solo chi viene e quando.
 *
 * Il filtro e' su `appointments.locationId`: in prenotazione la postazione non
 * esiste ancora, quindi non puo' essere lei a dire di quale negozio si tratta.
 */
export async function getBookingsByDateAndLocation(
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
      clientId: appointments.clientId,
      dogId: appointments.dogId,
      userId: appointments.userId,
      stationId: appointments.stationId,
      serviceId: appointments.serviceId,
      price: appointments.price,
      notes: appointments.notes,
      clientNominativo: clients.nominativo,
      clientPhone: clients.phone,
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      dogName: dogs.name,
      breedName: breeds.name,
      serviceName: services.name,
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

/**
 * Quante postazioni ha la sede. Non e' un vincolo: e' il numero di corsie che il
 * calendario disegna come riferimento visivo della capacita' del negozio.
 */
export async function getStationCount(locationId: string, tenantId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(stations)
    .where(and(eq(stations.locationId, locationId), eq(stations.tenantId, tenantId)))

  return row?.value ?? 0
}
