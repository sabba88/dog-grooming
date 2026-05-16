'use server'

import { authActionClient } from '@/lib/actions/client'
import { createBreedSchema, updateBreedSchema, deleteBreedSchema } from '@/lib/validations/breeds'
import { breeds } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const createBreed = authActionClient
  .schema(createBreedSchema)
  .action(async ({ parsedInput: { name, coatType, sizeType }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [breed] = await db
      .insert(breeds)
      .values({ name, coatType: coatType || null, sizeType: sizeType || null, tenantId: ctx.tenantId })
      .returning({ id: breeds.id })

    return { breed }
  })

export const updateBreed = authActionClient
  .schema(updateBreedSchema)
  .action(async ({ parsedInput: { id, name, coatType, sizeType }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(breeds)
      .set({ name, coatType: coatType || null, sizeType: sizeType || null, updatedAt: new Date() })
      .where(and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId)))

    return { breedId: id }
  })

export const fetchBreeds = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const result = await db
      .select({ id: breeds.id, name: breeds.name })
      .from(breeds)
      .where(eq(breeds.tenantId, ctx.tenantId))
      .orderBy(breeds.name)
    return { breeds: result }
  })

export const fetchBreedById = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id }, ctx }) => {
    const [breed] = await db
      .select({ id: breeds.id, name: breeds.name })
      .from(breeds)
      .where(and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId)))
      .limit(1)

    return { breed: breed ?? null }
  })

export const deleteBreed = authActionClient
  .schema(deleteBreedSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    // dogs.breedId → null per SET NULL (Story 3.3)
    await db.delete(breeds).where(
      and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId))
    )
    return { deletedId: id }
  })
