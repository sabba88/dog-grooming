'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from '@/lib/validations/services'
import { db } from '@/lib/db'
import { services } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const createService = authActionClient
  .schema(createServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [newService] = await db
      .insert(services)
      .values({
        name: parsedInput.name,
        price: parsedInput.price,
        duration: parsedInput.duration,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
      })

    return { service: newService }
  })

export const updateService = authActionClient
  .schema(updateServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [updatedService] = await db
      .update(services)
      .set({
        name: parsedInput.name,
        price: parsedInput.price,
        duration: parsedInput.duration,
        updatedAt: new Date(),
      })
      .where(
        and(eq(services.id, parsedInput.id), eq(services.tenantId, ctx.tenantId))
      )
      .returning({
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
      })

    if (!updatedService) {
      throw new Error('Servizio non trovato')
    }

    return { service: updatedService }
  })

export const deleteService = authActionClient
  .schema(deleteServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [deletedService] = await db
      .delete(services)
      .where(
        and(eq(services.id, parsedInput.id), eq(services.tenantId, ctx.tenantId))
      )
      .returning({
        id: services.id,
        name: services.name,
      })

    if (!deletedService) {
      throw new Error('Servizio non trovato')
    }

    return { service: deletedService }
  })
