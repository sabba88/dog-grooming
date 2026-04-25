'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createLocationSchema,
  updateLocationSchema,
  upsertLocationBusinessHoursSchema,
} from '@/lib/validations/locations'
import { db } from '@/lib/db'
import { locations, locationBusinessHours } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const createLocation = authActionClient
  .schema(createLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [newLocation] = await db
      .insert(locations)
      .values({
        name: parsedInput.name,
        address: parsedInput.address,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: locations.id,
        name: locations.name,
        address: locations.address,
      })

    return { location: newLocation }
  })

export const updateLocation = authActionClient
  .schema(updateLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [updatedLocation] = await db
      .update(locations)
      .set({
        name: parsedInput.name,
        address: parsedInput.address,
        updatedAt: new Date(),
      })
      .where(
        and(eq(locations.id, parsedInput.id), eq(locations.tenantId, ctx.tenantId))
      )
      .returning({
        id: locations.id,
        name: locations.name,
        address: locations.address,
      })

    if (!updatedLocation) {
      throw new Error('Sede non trovata')
    }

    return { location: updatedLocation }
  })

export const upsertLocationBusinessHours = authActionClient
  .schema(upsertLocationBusinessHoursSchema)
  .action(async ({ parsedInput: { locationId, dayOfWeek, slots }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    await db.transaction(async (tx) => {
      await tx.delete(locationBusinessHours).where(
        and(
          eq(locationBusinessHours.locationId, locationId),
          eq(locationBusinessHours.dayOfWeek, dayOfWeek),
          eq(locationBusinessHours.tenantId, ctx.tenantId)
        )
      )
      if (slots.length > 0) {
        await tx.insert(locationBusinessHours).values(
          slots.map(s => ({ ...s, locationId, dayOfWeek, tenantId: ctx.tenantId }))
        )
      }
    })
  })
