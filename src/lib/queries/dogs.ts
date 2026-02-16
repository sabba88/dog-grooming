import { db } from '@/lib/db'
import { dogs, dogNotes, clients, users } from '@/lib/db/schema'
import { eq, and, asc, desc, isNull } from 'drizzle-orm'

export async function getDogsByClient(clientId: string, tenantId: string) {
  return db
    .select({
      id: dogs.id,
      name: dogs.name,
      breed: dogs.breed,
      size: dogs.size,
      age: dogs.age,
      createdAt: dogs.createdAt,
    })
    .from(dogs)
    .innerJoin(
      clients,
      and(eq(dogs.clientId, clients.id), isNull(clients.deletedAt))
    )
    .where(and(eq(dogs.clientId, clientId), eq(dogs.tenantId, tenantId)))
    .orderBy(asc(dogs.name))
}

export async function getDogById(dogId: string, tenantId: string) {
  const [dog] = await db
    .select({
      id: dogs.id,
      name: dogs.name,
      breed: dogs.breed,
      size: dogs.size,
      age: dogs.age,
      clientId: dogs.clientId,
      createdAt: dogs.createdAt,
      updatedAt: dogs.updatedAt,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
    })
    .from(dogs)
    .innerJoin(
      clients,
      and(eq(dogs.clientId, clients.id), isNull(clients.deletedAt))
    )
    .where(and(eq(dogs.id, dogId), eq(dogs.tenantId, tenantId)))
    .limit(1)

  return dog ?? null
}

export async function getDogNotes(dogId: string, tenantId: string) {
  return db
    .select({
      id: dogNotes.id,
      content: dogNotes.content,
      createdAt: dogNotes.createdAt,
      authorName: users.name,
    })
    .from(dogNotes)
    .innerJoin(users, eq(dogNotes.authorId, users.id))
    .where(
      and(eq(dogNotes.dogId, dogId), eq(dogNotes.tenantId, tenantId))
    )
    .orderBy(desc(dogNotes.createdAt))
}
