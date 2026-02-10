'use server'

import { authActionClient } from '@/lib/actions/client'
import { createUserSchema, updateUserSchema } from '@/lib/validations/users'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const createUser = authActionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const hashedPassword = await bcrypt.hash(parsedInput.password, 10)

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          name: parsedInput.name,
          email: parsedInput.email,
          password: hashedPassword,
          role: parsedInput.role,
          tenantId: ctx.tenantId,
          isActive: true,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        })

      return { user: newUser }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new Error('Email gia\' in uso')
      }
      throw error
    }
  })

export const updateUser = authActionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const updateData: Record<string, unknown> = {
      name: parsedInput.name,
      email: parsedInput.email,
      role: parsedInput.role,
      updatedAt: new Date(),
    }

    if (parsedInput.password && parsedInput.password.length > 0) {
      updateData.password = await bcrypt.hash(parsedInput.password, 10)
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(
          and(eq(users.id, parsedInput.id), eq(users.tenantId, ctx.tenantId))
        )
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        })

      if (!updatedUser) {
        throw new Error('Utente non trovato')
      }

      return { user: updatedUser }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new Error('Email gia\' in uso')
      }
      throw error
    }
  })

const userIdSchema = z.object({
  userId: z.string().uuid(),
})

export const deactivateUser = authActionClient
  .schema(userIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    if (parsedInput.userId === ctx.userId) {
      throw new Error('Non puoi disattivare il tuo stesso account')
    }

    const [deactivated] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(users.id, parsedInput.userId),
          eq(users.tenantId, ctx.tenantId)
        )
      )
      .returning({
        id: users.id,
        name: users.name,
        isActive: users.isActive,
      })

    if (!deactivated) {
      throw new Error('Utente non trovato')
    }

    return { user: deactivated }
  })

export const reactivateUser = authActionClient
  .schema(userIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [reactivated] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(
          eq(users.id, parsedInput.userId),
          eq(users.tenantId, ctx.tenantId)
        )
      )
      .returning({
        id: users.id,
        name: users.name,
        isActive: users.isActive,
      })

    if (!reactivated) {
      throw new Error('Utente non trovato')
    }

    return { user: reactivated }
  })
