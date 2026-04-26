import { db } from '@/lib/db'
import { breeds, serviceBreedPrices } from '@/lib/db/schema'
import { eq, and, asc, sql } from 'drizzle-orm'

export async function getBreeds(tenantId: string) {
  return db
    .select({
      id: breeds.id,
      name: breeds.name,
      priceCount: sql<number>`count(${serviceBreedPrices.id})::int`,
    })
    .from(breeds)
    .leftJoin(serviceBreedPrices, eq(serviceBreedPrices.breedId, breeds.id))
    .where(eq(breeds.tenantId, tenantId))
    .groupBy(breeds.id, breeds.name)
    .orderBy(asc(breeds.name))
}

export async function getBreedWithPrices(breedId: string, tenantId: string) {
  const [breed] = await db
    .select({ id: breeds.id, name: breeds.name })
    .from(breeds)
    .where(and(eq(breeds.id, breedId), eq(breeds.tenantId, tenantId)))
    .limit(1)

  if (!breed) return null

  const prices = await db
    .select({
      serviceId: serviceBreedPrices.serviceId,
      price: serviceBreedPrices.price,
    })
    .from(serviceBreedPrices)
    .where(and(
      eq(serviceBreedPrices.breedId, breedId),
      eq(serviceBreedPrices.tenantId, tenantId),
    ))

  return { ...breed, servicePrices: prices }
}
