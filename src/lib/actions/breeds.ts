'use server'

import { authActionClient } from '@/lib/actions/client'
import { createBreedSchema, updateBreedSchema, deleteBreedSchema } from '@/lib/validations/breeds'
import { breeds, serviceBreedPrices } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// NOTA: driver neon-http non supporta db.transaction() — operazioni sequenziali (pattern da locations.ts)

export const createBreed = authActionClient
  .schema(createBreedSchema)
  .action(async ({ parsedInput: { name, servicePrices }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [breed] = await db
      .insert(breeds)
      .values({ name, tenantId: ctx.tenantId })
      .returning({ id: breeds.id })

    const pricesToInsert = servicePrices.filter(p => p.price !== undefined)
    if (pricesToInsert.length > 0) {
      await db.insert(serviceBreedPrices).values(
        pricesToInsert.map(p => ({
          serviceId: p.serviceId,
          breedId: breed.id,
          price: p.price!,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { breed }
  })

export const updateBreed = authActionClient
  .schema(updateBreedSchema)
  .action(async ({ parsedInput: { id, name, servicePrices }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(breeds)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId)))

    // Replace strategy: elimina tutti i prezzi, poi reinserisce quelli valorizzati
    await db.delete(serviceBreedPrices).where(
      and(eq(serviceBreedPrices.breedId, id), eq(serviceBreedPrices.tenantId, ctx.tenantId))
    )

    const pricesToInsert = servicePrices.filter(p => p.price !== undefined)
    if (pricesToInsert.length > 0) {
      await db.insert(serviceBreedPrices).values(
        pricesToInsert.map(p => ({
          serviceId: p.serviceId,
          breedId: id,
          price: p.price!,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { breedId: id }
  })

export const fetchBreedWithPrices = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id }, ctx }) => {
    const [breed] = await db
      .select({ id: breeds.id, name: breeds.name })
      .from(breeds)
      .where(and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId)))
      .limit(1)

    if (!breed) return { breed: null }

    const prices = await db
      .select({
        serviceId: serviceBreedPrices.serviceId,
        price: serviceBreedPrices.price,
      })
      .from(serviceBreedPrices)
      .where(and(
        eq(serviceBreedPrices.breedId, id),
        eq(serviceBreedPrices.tenantId, ctx.tenantId),
      ))

    return { breed: { ...breed, servicePrices: prices } }
  })

export const deleteBreed = authActionClient
  .schema(deleteBreedSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    // service_breed_prices eliminati per CASCADE; dogs.breedId → null per SET NULL (Story 3.3)
    await db.delete(breeds).where(
      and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId))
    )
    return { deletedId: id }
  })
