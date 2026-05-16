import { db } from '@/lib/db'
import { breeds } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getBreedsForSelect(tenantId: string) {
  return db
    .select({ id: breeds.id, name: breeds.name, coatType: breeds.coatType, sizeType: breeds.sizeType })
    .from(breeds)
    .where(eq(breeds.tenantId, tenantId))
    .orderBy(asc(breeds.name))
}

export async function getBreeds(tenantId: string) {
  return db
    .select({
      id: breeds.id,
      name: breeds.name,
      coatType: breeds.coatType,
      sizeType: breeds.sizeType,
    })
    .from(breeds)
    .where(eq(breeds.tenantId, tenantId))
    .orderBy(asc(breeds.name))
}

export async function getBreedById(breedId: string, tenantId: string) {
  const [breed] = await db
    .select({ id: breeds.id, name: breeds.name, coatType: breeds.coatType, sizeType: breeds.sizeType })
    .from(breeds)
    .where(and(eq(breeds.id, breedId), eq(breeds.tenantId, tenantId)))
    .limit(1)

  return breed ?? null
}
