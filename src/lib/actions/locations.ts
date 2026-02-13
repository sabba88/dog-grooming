'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createLocationSchema,
  updateLocationSchema,
} from '@/lib/validations/locations'
import { db } from '@/lib/db'
import { locations } from '@/lib/db/schema'
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
