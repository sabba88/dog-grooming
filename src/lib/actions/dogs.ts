'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createDogSchema,
  updateDogSchema,
  addDogNoteSchema,
} from '@/lib/validations/dogs'
import { db } from '@/lib/db'
import { dogs, dogNotes, clients } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export const createDog = authActionClient
  .schema(createDogSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Verify client exists, belongs to tenant, and is not soft-deleted
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.id, parsedInput.clientId),
          eq(clients.tenantId, ctx.tenantId),
          isNull(clients.deletedAt)
        )
      )
      .limit(1)

    if (!client) {
      throw new Error('Cliente non trovato')
    }

    const [newDog] = await db
      .insert(dogs)
      .values({
        name: parsedInput.name,
        breed: parsedInput.breed || null,
        size: parsedInput.size || null,
        age: parsedInput.age || null,
        clientId: parsedInput.clientId,
        tenantId: ctx.tenantId,
      })
      .returning({ id: dogs.id, name: dogs.name })

    return { dog: newDog }
  })

export const updateDog = authActionClient
  .schema(updateDogSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [updatedDog] = await db
      .update(dogs)
      .set({
        name: parsedInput.name,
        breed: parsedInput.breed || null,
        size: parsedInput.size || null,
        age: parsedInput.age || null,
        updatedAt: new Date(),
      })
      .where(and(eq(dogs.id, parsedInput.id), eq(dogs.tenantId, ctx.tenantId)))
      .returning({ id: dogs.id, name: dogs.name })

    if (!updatedDog) {
      throw new Error('Cane non trovato')
    }

    return { dog: updatedDog }
  })

export const addDogNote = authActionClient
  .schema(addDogNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Verify dog exists and belongs to tenant
    const [dog] = await db
      .select({ id: dogs.id })
      .from(dogs)
      .where(
        and(eq(dogs.id, parsedInput.dogId), eq(dogs.tenantId, ctx.tenantId))
      )
      .limit(1)

    if (!dog) {
      throw new Error('Cane non trovato')
    }

    const [newNote] = await db
      .insert(dogNotes)
      .values({
        dogId: parsedInput.dogId,
        content: parsedInput.content,
        authorId: ctx.userId,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: dogNotes.id,
        content: dogNotes.content,
        createdAt: dogNotes.createdAt,
      })

    return { note: newNote }
  })
