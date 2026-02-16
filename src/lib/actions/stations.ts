'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createStationSchema,
  updateStationSchema,
  updateStationServicesSchema,
  updateStationScheduleSchema,
} from '@/lib/validations/stations'
import { db } from '@/lib/db'
import { stations, stationServices, stationSchedules, locations, services } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export const createStation = authActionClient
  .schema(createStationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che la locationId appartenga al tenant dell'admin
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, parsedInput.locationId), eq(locations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!location) {
      throw new Error('Sede non trovata')
    }

    const [newStation] = await db
      .insert(stations)
      .values({
        name: parsedInput.name,
        locationId: parsedInput.locationId,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: stations.id,
        name: stations.name,
      })

    return { station: newStation }
  })

export const updateStation = authActionClient
  .schema(updateStationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [updatedStation] = await db
      .update(stations)
      .set({
        name: parsedInput.name,
        updatedAt: new Date(),
      })
      .where(
        and(eq(stations.id, parsedInput.id), eq(stations.tenantId, ctx.tenantId))
      )
      .returning({
        id: stations.id,
        name: stations.name,
      })

    if (!updatedStation) {
      throw new Error('Postazione non trovata')
    }

    return { station: updatedStation }
  })

export const updateStationServices = authActionClient
  .schema(updateStationServicesSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che la stazione appartenga al tenant
    const [station] = await db
      .select({ id: stations.id })
      .from(stations)
      .where(and(eq(stations.id, parsedInput.stationId), eq(stations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!station) {
      throw new Error('Postazione non trovata')
    }

    // Verifica che tutti i serviceId appartengano al tenant
    if (parsedInput.serviceIds.length > 0) {
      const validServices = await db
        .select({ id: services.id })
        .from(services)
        .where(and(
          inArray(services.id, parsedInput.serviceIds),
          eq(services.tenantId, ctx.tenantId)
        ))

      if (validServices.length !== parsedInput.serviceIds.length) {
        throw new Error('Uno o più servizi non validi')
      }
    }

    // Replace strategy: delete all + insert new
    await db.delete(stationServices)
      .where(and(
        eq(stationServices.stationId, parsedInput.stationId),
        eq(stationServices.tenantId, ctx.tenantId)
      ))

    if (parsedInput.serviceIds.length > 0) {
      await db.insert(stationServices).values(
        parsedInput.serviceIds.map(serviceId => ({
          stationId: parsedInput.stationId,
          serviceId,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { success: true }
  })

export const updateStationSchedule = authActionClient
  .schema(updateStationScheduleSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che la stazione appartenga al tenant
    const [station] = await db
      .select({ id: stations.id })
      .from(stations)
      .where(and(eq(stations.id, parsedInput.stationId), eq(stations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!station) {
      throw new Error('Postazione non trovata')
    }

    // Replace strategy: delete all + insert new
    await db.delete(stationSchedules)
      .where(and(
        eq(stationSchedules.stationId, parsedInput.stationId),
        eq(stationSchedules.tenantId, ctx.tenantId)
      ))

    if (parsedInput.schedules.length > 0) {
      await db.insert(stationSchedules).values(
        parsedInput.schedules.map(schedule => ({
          stationId: parsedInput.stationId,
          dayOfWeek: schedule.dayOfWeek,
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { success: true }
  })
