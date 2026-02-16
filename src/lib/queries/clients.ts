import { db } from '@/lib/db'
import { clients, clientNotes, users, dogs } from '@/lib/db/schema'
import { eq, and, asc, desc, isNull, ilike, or, count } from 'drizzle-orm'

export async function getClients(tenantId: string) {
  return db
    .select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      phone: clients.phone,
      email: clients.email,
      createdAt: clients.createdAt,
      dogsCount: count(dogs.id),
    })
    .from(clients)
    .leftJoin(dogs, eq(dogs.clientId, clients.id))
    .where(and(eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
    .groupBy(
      clients.id,
      clients.firstName,
      clients.lastName,
      clients.phone,
      clients.email,
      clients.createdAt
    )
    .orderBy(asc(clients.lastName), asc(clients.firstName))
}

export async function getClientById(clientId: string, tenantId: string) {
  const [client] = await db
    .select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      phone: clients.phone,
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

export async function searchClients(query: string, tenantId: string) {
  const searchPattern = `%${query}%`
  return db
    .select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      phone: clients.phone,
      email: clients.email,
    })
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        isNull(clients.deletedAt),
        or(
          ilike(clients.firstName, searchPattern),
          ilike(clients.lastName, searchPattern),
          ilike(clients.phone, searchPattern)
        )
      )
    )
    .orderBy(asc(clients.lastName), asc(clients.firstName))
    .limit(10)
}
