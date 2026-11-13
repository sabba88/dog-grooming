import { db } from '@/lib/db'
import { clients, locations, phoneMessages } from '@/lib/db/schema'
import { and, count, desc, eq, isNull } from 'drizzle-orm'

/**
 * Messaggi lasciati all'assistente vocale (POC 12/11/2026): prima quelli da leggere,
 * poi gli ultimi letti. Il limite tiene la pagina leggera: i vecchi letti non servono.
 */
export async function getPhoneMessages(tenantId: string, limit = 200) {
  return db
    .select({
      id: phoneMessages.id,
      createdAt: phoneMessages.createdAt,
      readAt: phoneMessages.readAt,
      name: phoneMessages.name,
      phone: phoneMessages.phone,
      message: phoneMessages.message,
      clientId: phoneMessages.clientId,
      clientNominativo: clients.nominativo,
      locationName: locations.name,
    })
    .from(phoneMessages)
    .leftJoin(clients, eq(phoneMessages.clientId, clients.id))
    .leftJoin(locations, eq(phoneMessages.locationId, locations.id))
    .where(eq(phoneMessages.tenantId, tenantId))
    // NULLS FIRST: i non letti in cima, poi dal piu' recente.
    .orderBy(desc(isNull(phoneMessages.readAt)), desc(phoneMessages.createdAt))
    .limit(limit)
}

/** Quanti messaggi aspettano di essere letti: il numero accanto alla voce di menu. */
export async function countUnreadPhoneMessages(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(phoneMessages)
    .where(and(eq(phoneMessages.tenantId, tenantId), isNull(phoneMessages.readAt)))
  return row?.value ?? 0
}
