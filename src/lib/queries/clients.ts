import { db } from '@/lib/db'
import { clients, clientNotes, users, dogs, appointments, services } from '@/lib/db/schema'
import { eq, and, asc, desc, isNull, ilike, or, count, max, min, gt } from 'drizzle-orm'

export async function getClients(tenantId: string) {
  const now = new Date()

  const lastAppt = db
    .select({
      clientId: appointments.clientId,
      lastAt: max(appointments.startTime).as('last_at'),
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId)))
    .groupBy(appointments.clientId)
    .as('last_appt')

  const nextAppt = db
    .select({
      clientId: appointments.clientId,
      nextAt: min(appointments.startTime).as('next_at'),
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), gt(appointments.startTime, now)))
    .groupBy(appointments.clientId)
    .as('next_appt')

  return db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      email: clients.email,
      createdAt: clients.createdAt,
      dogsCount: count(dogs.id),
      lastAppointmentAt: lastAppt.lastAt,
      nextAppointmentAt: nextAppt.nextAt,
    })
    .from(clients)
    .leftJoin(dogs, eq(dogs.clientId, clients.id))
    .leftJoin(lastAppt, eq(lastAppt.clientId, clients.id))
    .leftJoin(nextAppt, eq(nextAppt.clientId, clients.id))
    .where(and(eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
    .groupBy(
      clients.id,
      clients.nominativo,
      clients.phone,
      clients.email,
      clients.createdAt,
      lastAppt.lastAt,
      nextAppt.nextAt,
    )
    .orderBy(asc(clients.nominativo))
}

export async function getClientById(clientId: string, tenantId: string) {
  const [client] = await db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      email: clients.email,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .limit(1)

  return client ?? null
}

export async function getClientNotes(clientId: string, tenantId: string) {
  return db
    .select({
      id: clientNotes.id,
      content: clientNotes.content,
      createdAt: clientNotes.createdAt,
      authorName: users.name,
    })
    .from(clientNotes)
    .innerJoin(users, eq(clientNotes.authorId, users.id))
    .where(
      and(
        eq(clientNotes.clientId, clientId),
        eq(clientNotes.tenantId, tenantId)
      )
    )
    .orderBy(desc(clientNotes.createdAt))
}

export async function getClientAppointments(clientId: string, tenantId: string) {
  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      price: appointments.price,
      notes: appointments.notes,
      dogName: dogs.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.clientId, clientId), eq(appointments.tenantId, tenantId)))
    .orderBy(desc(appointments.startTime))
}

export async function searchClients(query: string, tenantId: string) {
  const searchPattern = `%${query}%`
  return db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      email: clients.email,
    })
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        isNull(clients.deletedAt),
        or(
          ilike(clients.nominativo, searchPattern),
          ilike(clients.phone, searchPattern)
        )
      )
    )
    .orderBy(asc(clients.nominativo))
    .limit(10)
}
