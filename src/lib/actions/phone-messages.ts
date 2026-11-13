'use server'

import { authActionClient } from '@/lib/actions/client'
import { db } from '@/lib/db'
import { phoneMessages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

/** Segna un messaggio dal telefono come letto, o di nuovo da leggere. */
export const setPhoneMessageRead = authActionClient
  .schema(z.object({ id: z.string().uuid(), read: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(phoneMessages)
      .set({ readAt: parsedInput.read ? new Date() : null })
      .where(and(eq(phoneMessages.id, parsedInput.id), eq(phoneMessages.tenantId, ctx.tenantId)))
    return { success: true }
  })
