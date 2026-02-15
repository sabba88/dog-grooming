import { db } from '@/lib/db'
import { stations, stationServices, stationSchedules, services } from '@/lib/db/schema'
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

      const scheduleRows = await db
        .select({
          dayOfWeek: stationSchedules.dayOfWeek,
          openTime: stationSchedules.openTime,
          closeTime: stationSchedules.closeTime,
        })
        .from(stationSchedules)
        .where(and(
          eq(stationSchedules.stationId, station.id),
          eq(stationSchedules.tenantId, tenantId)
        ))
        .orderBy(asc(stationSchedules.dayOfWeek))

      return {
        ...station,
        servicesCount: stationServiceRows.length,
        schedulesCount: scheduleRows.length,
        schedules: scheduleRows,
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

export async function getStationSchedule(stationId: string, tenantId: string) {
  return db
    .select({
      id: stationSchedules.id,
      dayOfWeek: stationSchedules.dayOfWeek,
      openTime: stationSchedules.openTime,
      closeTime: stationSchedules.closeTime,
    })
    .from(stationSchedules)
    .where(and(
      eq(stationSchedules.stationId, stationId),
      eq(stationSchedules.tenantId, tenantId)
    ))
    .orderBy(asc(stationSchedules.dayOfWeek))
}
