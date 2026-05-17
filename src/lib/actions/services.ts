'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from '@/lib/validations/services'
import { getServicePriceMatrixCells } from '@/lib/queries/services'
import { db } from '@/lib/db'
import { services, servicePriceMatrix } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

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
        durationSurchargePer30min: parsedInput.durationSurchargePer30min,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
        durationSurchargePer30min: services.durationSurchargePer30min,
      })

    const nonZeroCells = parsedInput.matrixCells?.filter(c => c.price > 0) ?? []
    if (nonZeroCells.length > 0) {
      await db.insert(servicePriceMatrix).values(
        nonZeroCells.map(c => ({
          serviceId: newService.id,
          coatType: c.coatType,
          sizeType: c.sizeType,
          price: c.price,
          tenantId: ctx.tenantId,
        }))
      )
    }

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
        durationSurchargePer30min: parsedInput.durationSurchargePer30min,
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
        durationSurchargePer30min: services.durationSurchargePer30min,
      })

    if (!updatedService) {
      throw new Error('Servizio non trovato')
    }

    await db.delete(servicePriceMatrix)
      .where(and(
        eq(servicePriceMatrix.serviceId, parsedInput.id),
        eq(servicePriceMatrix.tenantId, ctx.tenantId)
      ))

    const nonZeroCells = parsedInput.matrixCells?.filter(c => c.price > 0) ?? []
    if (nonZeroCells.length > 0) {
      await db.insert(servicePriceMatrix).values(
        nonZeroCells.map(c => ({
          serviceId: parsedInput.id,
          coatType: c.coatType,
          sizeType: c.sizeType,
          price: c.price,
          tenantId: ctx.tenantId,
        }))
      )
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

export const fetchServicePriceMatrix = authActionClient
  .schema(z.object({ serviceId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const cells = await getServicePriceMatrixCells(parsedInput.serviceId, ctx.tenantId)
    return { cells }
  })
