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
        nominativo: parsedInput.nominativo,
        phone: parsedInput.phone,
        owner2: parsedInput.owner2 || null,
        phone2: parsedInput.phone2 || null,
        owner3: parsedInput.owner3 || null,
        phone3: parsedInput.phone3 || null,
        email: parsedInput.email || null,
        consentGivenAt: new Date(),
        consentVersion: '1.0',
        tenantId: ctx.tenantId,
      })
      .returning({
        id: clients.id,
        nominativo: clients.nominativo,
      })

    return { client: newClient }
  })

export const updateClient = authActionClient
  .schema(updateClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [updatedClient] = await db
      .update(clients)
      .set({
        nominativo: parsedInput.nominativo,
        phone: parsedInput.phone,
        owner2: parsedInput.owner2 || null,
        phone2: parsedInput.phone2 || null,
        owner3: parsedInput.owner3 || null,
        phone3: parsedInput.phone3 || null,
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
        nominativo: clients.nominativo,
      })

    if (!updatedClient) {
      throw new Error('Cliente non trovato')
    }

    return { client: updatedClient }
  })

export const addClientNote = authActionClient
  .schema(addClientNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
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
