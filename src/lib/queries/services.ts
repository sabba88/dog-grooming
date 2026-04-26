import { db } from '@/lib/db'
import { services, serviceBreedPrices, breeds } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getServices(tenantId: string) {
  return db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(eq(services.tenantId, tenantId))
    .orderBy(asc(services.name))
}

export async function getServiceById(serviceId: string, tenantId: string) {
  const [service] = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
    .limit(1)

  return service ?? null
}

export async function getServiceWithBreedPrices(serviceId: string, tenantId: string) {
  return db
    .select({
      breedId: serviceBreedPrices.breedId,
      breedName: breeds.name,
      price: serviceBreedPrices.price,
    })
    .from(serviceBreedPrices)
    .innerJoin(breeds, eq(breeds.id, serviceBreedPrices.breedId))
    .where(and(
      eq(serviceBreedPrices.serviceId, serviceId),
      eq(serviceBreedPrices.tenantId, tenantId),
    ))
    .orderBy(asc(breeds.name))
}
