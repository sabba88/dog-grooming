'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createClientSchema,
  updateClientSchema,
  addClientNoteSchema,
} from '@/lib/validations/clients'
import { db } from '@/lib/db'
import { clients, clientNotes } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export const createClient = authActionClient
  .schema(createClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [newClient] = await db
      .insert(clients)
      .values({
        firstName: parsedInput.firstName,
        lastName: parsedInput.lastName,
        phone: parsedInput.phone,
        email: parsedInput.email || null,
        consentGivenAt: new Date(),
        consentVersion: '1.0',
        tenantId: ctx.tenantId,
      })
      .returning({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
      })

    return { client: newClient }
  })

export const updateClient = authActionClient
  .schema(updateClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [updatedClient] = await db
      .update(clients)
      .set({
        firstName: parsedInput.firstName,
        lastName: parsedInput.lastName,
        phone: parsedInput.phone,
        email: parsedInput.email || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, parsedInput.id),
          eq(clients.tenantId, ctx.tenantId),
          isNull(clients.deletedAt)
        )
      )
      .returning({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
      })

    if (!updatedClient) {
      throw new Error('Cliente non trovato')
    }

    return { client: updatedClient }
  })

export const addClientNote = authActionClient
  .schema(addClientNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Verify client exists and is not soft-deleted
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

    const [newNote] = await db
      .insert(clientNotes)
      .values({
        clientId: parsedInput.clientId,
        content: parsedInput.content,
        authorId: ctx.userId,
        tenantId: ctx.tenantId,
      })
      .returning({
        id: clientNotes.id,
        content: clientNotes.content,
        createdAt: clientNotes.createdAt,
      })

    return { note: newNote }
  })
