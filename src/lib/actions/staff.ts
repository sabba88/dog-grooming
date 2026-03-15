'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  assignUserToLocationSchema,
  updateAssignmentSchema,
  removeAssignmentSchema,
  saveWeeklyCalendarSchema,
} from '@/lib/validations/staff'
import { db } from '@/lib/db'
import { userLocationAssignments, users, locations } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'

export const assignUserToLocation = authActionClient
  .schema(assignUserToLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che userId appartenga al tenant
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, parsedInput.userId), eq(users.tenantId, ctx.tenantId), eq(users.isActive, true)))
      .limit(1)

    if (!user) {
      throw new Error('Utente non trovato')
    }

    // Verifica che locationId appartenga al tenant
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, parsedInput.locationId), eq(locations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!location) {
      throw new Error('Sede non trovata')
    }

    // Verifica vincolo: utente non già assegnato a un'altra sede nello stesso giorno (AC #3)
    const [existingAssignment] = await db
      .select({ id: userLocationAssignments.id, locationId: userLocationAssignments.locationId })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, parsedInput.userId),
        eq(userLocationAssignments.dayOfWeek, parsedInput.dayOfWeek),
        eq(userLocationAssignments.tenantId, ctx.tenantId),
        ne(userLocationAssignments.locationId, parsedInput.locationId)
      ))
      .limit(1)

    if (existingAssignment) {
      // Recupera il nome della sede per il messaggio
      const [conflictLocation] = await db
        .select({ name: locations.name })
        .from(locations)
        .where(eq(locations.id, existingAssignment.locationId))
        .limit(1)

      throw new Error(`L'utente è già assegnato a ${conflictLocation?.name ?? 'un\'altra sede'} per questo giorno`)
    }

    const [result] = await db
      .insert(userLocationAssignments)
      .values({
        userId: parsedInput.userId,
        locationId: parsedInput.locationId,
        dayOfWeek: parsedInput.dayOfWeek,
        startTime: parsedInput.startTime,
        endTime: parsedInput.endTime,
        tenantId: ctx.tenantId,
      })
      .returning({ id: userLocationAssignments.id })

    return { assignment: result }
  })

export const updateAssignment = authActionClient
  .schema(updateAssignmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che locationId appartenga al tenant
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, parsedInput.locationId), eq(locations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!location) {
      throw new Error('Sede non trovata')
    }

    const [updated] = await db
      .update(userLocationAssignments)
      .set({
        locationId: parsedInput.locationId,
        startTime: parsedInput.startTime,
        endTime: parsedInput.endTime,
        updatedAt: new Date(),
      })
      .where(and(
        eq(userLocationAssignments.id, parsedInput.id),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))
      .returning({ id: userLocationAssignments.id })

    if (!updated) {
      throw new Error('Assegnazione non trovata')
    }

    return { assignment: updated }
  })

export const removeAssignment = authActionClient
  .schema(removeAssignmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [deleted] = await db
      .delete(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.id, parsedInput.id),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))
      .returning({ id: userLocationAssignments.id })

    if (!deleted) {
      throw new Error('Assegnazione non trovata')
    }

    return { success: true }
  })

export const saveWeeklyCalendar = authActionClient
  .schema(saveWeeklyCalendarSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    // Verifica che userId appartenga al tenant
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, parsedInput.userId), eq(users.tenantId, ctx.tenantId), eq(users.isActive, true)))
      .limit(1)

    if (!user) {
      throw new Error('Utente non trovato')
    }

    // Verifica che tutte le locationId appartengano al tenant
    const uniqueLocationIds = [...new Set(parsedInput.assignments.map(a => a.locationId))]
    if (uniqueLocationIds.length > 0) {
      const validLocations = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(
          eq(locations.tenantId, ctx.tenantId)
        ))

      const validLocationIds = new Set(validLocations.map(l => l.id))
      for (const locId of uniqueLocationIds) {
        if (!validLocationIds.has(locId)) {
          throw new Error('Sede non trovata')
        }
      }
    }

    // Verifica vincolo: un utente non può avere due sedi diverse nello stesso giorno
    const dayLocationMap = new Map<number, string>()
    for (const a of parsedInput.assignments) {
      const existing = dayLocationMap.get(a.dayOfWeek)
      if (existing && existing !== a.locationId) {
        throw new Error("Un utente non può essere assegnato a più sedi nello stesso giorno")
      }
      dayLocationMap.set(a.dayOfWeek, a.locationId)
    }

    // Replace strategy: delete all + insert new
    // Nota: neon-http non supporta transazioni native, usiamo delete + insert sequenziale
    await db.delete(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, parsedInput.userId),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    if (parsedInput.assignments.length > 0) {
      await db.insert(userLocationAssignments).values(
        parsedInput.assignments.map(a => ({
          userId: parsedInput.userId,
          locationId: a.locationId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { success: true }
  })
