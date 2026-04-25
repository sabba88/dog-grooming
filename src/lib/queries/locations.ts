import { db } from '@/lib/db'
import { locations, locationBusinessHours } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getLocations(tenantId: string) {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      address: locations.address,
      createdAt: locations.createdAt,
    })
    .from(locations)
    .where(eq(locations.tenantId, tenantId))
    .orderBy(asc(locations.name))
}

export async function getLocationById(locationId: string, tenantId: string) {
  const [location] = await db
    .select({
      id: locations.id,
      name: locations.name,
      address: locations.address,
      createdAt: locations.createdAt,
    })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1)

  return location ?? null
}

export async function getLocationBusinessHours(locationId: string, tenantId: string) {
  return db.select({
    dayOfWeek: locationBusinessHours.dayOfWeek,
    openTime: locationBusinessHours.openTime,
    closeTime: locationBusinessHours.closeTime,
  })
  .from(locationBusinessHours)
  .where(and(
    eq(locationBusinessHours.locationId, locationId),
    eq(locationBusinessHours.tenantId, tenantId),
  ))
  .orderBy(asc(locationBusinessHours.dayOfWeek), asc(locationBusinessHours.openTime))
}
