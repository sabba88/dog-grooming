import { db } from '@/lib/db'
import { stations, stationServices, services } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getStationsByLocation(locationId: string, tenantId: string) {
  const stationRows = await db
    .select({
      id: stations.id,
      name: stations.name,
      locationId: stations.locationId,
      createdAt: stations.createdAt,
    })
    .from(stations)
    .where(and(eq(stations.locationId, locationId), eq(stations.tenantId, tenantId)))
    .orderBy(asc(stations.name))

  // For each station, get services count and schedules count
  const stationsWithDetails = await Promise.all(
    stationRows.map(async (station) => {
      const stationServiceRows = await db
        .select({ serviceId: stationServices.serviceId })
        .from(stationServices)
        .where(and(
          eq(stationServices.stationId, station.id),
          eq(stationServices.tenantId, tenantId)
        ))

      return {
        ...station,
        servicesCount: stationServiceRows.length,
      }
    })
  )

  return stationsWithDetails
}

export async function getStationById(stationId: string, tenantId: string) {
  const [station] = await db
    .select({
      id: stations.id,
      name: stations.name,
      locationId: stations.locationId,
      createdAt: stations.createdAt,
    })
    .from(stations)
    .where(and(eq(stations.id, stationId), eq(stations.tenantId, tenantId)))
    .limit(1)

  return station ?? null
}

export async function getStationServices(stationId: string, tenantId: string) {
  const rows = await db
    .select({
      serviceId: stationServices.serviceId,
      serviceName: services.name,
      servicePrice: services.price,
      serviceDuration: services.duration,
    })
    .from(stationServices)
    .innerJoin(services, eq(stationServices.serviceId, services.id))
    .where(and(
      eq(stationServices.stationId, stationId),
      eq(stationServices.tenantId, tenantId)
    ))
    .orderBy(asc(services.name))

  return rows
}

export async function getServicesForStation(stationId: string, tenantId: string) {
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
    })
    .from(stationServices)
    .innerJoin(services, eq(stationServices.serviceId, services.id))
    .where(and(
      eq(stationServices.stationId, stationId),
      eq(stationServices.tenantId, tenantId)
    ))
    .orderBy(asc(services.name))

  return rows
}

