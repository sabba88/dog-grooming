'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  assignUserToLocationSchema,
  updateAssignmentSchema,
  removeAssignmentSchema,
  saveDayShiftsSchema,
} from '@/lib/validations/staff'
import { db } from '@/lib/db'
import { userLocationAssignments, users, locations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { timeToMinutes } from '@/lib/utils/schedule'

export const assignUserToLocation = authActionClient
  .schema(assignUserToLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, parsedInput.userId), eq(users.tenantId, ctx.tenantId), eq(users.isActive, true)))
      .limit(1)

    if (!user) throw new Error('Utente non trovato')

    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, parsedInput.locationId), eq(locations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!location) throw new Error('Sede non trovata')

    // Check time overlap with existing shifts for same userId + date
    const existingForDate = await db
      .select({ startTime: userLocationAssignments.startTime, endTime: userLocationAssignments.endTime })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, parsedInput.userId),
        eq(userLocationAssignments.date, parsedInput.date),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    const hasOverlap = existingForDate.some(s =>
      parsedInput.startTime < s.endTime && parsedInput.endTime > s.startTime
    )
    if (hasOverlap) {
      throw new Error('Fascia oraria sovrapposta a un turno esistente')
    }

    const [result] = await db
      .insert(userLocationAssignments)
      .values({
        userId: parsedInput.userId,
        locationId: parsedInput.locationId,
        date: parsedInput.date,
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
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, parsedInput.locationId), eq(locations.tenantId, ctx.tenantId)))
      .limit(1)

    if (!location) throw new Error('Sede non trovata')

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

    if (!updated) throw new Error('Assegnazione non trovata')

    return { assignment: updated }
  })

export const removeAssignment = authActionClient
  .schema(removeAssignmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [deleted] = await db
      .delete(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.id, parsedInput.id),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))
      .returning({ id: userLocationAssignments.id })

    if (!deleted) throw new Error('Assegnazione non trovata')

    return { success: true }
  })

export const saveDayShifts = authActionClient
  .schema(saveDayShiftsSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, parsedInput.userId), eq(users.tenantId, ctx.tenantId), eq(users.isActive, true)))
      .limit(1)

    if (!user) throw new Error('Utente non trovato')

    if (parsedInput.shifts.length > 0) {
      const uniqueLocationIds = [...new Set(parsedInput.shifts.map(s => s.locationId))]
      const validLocations = await db
        .select({ id: locations.id })
        .from(locations)
        .where(eq(locations.tenantId, ctx.tenantId))

      const validLocationIds = new Set(validLocations.map(l => l.id))
      for (const locId of uniqueLocationIds) {
        if (!validLocationIds.has(locId)) throw new Error('Sede non trovata')
      }

      // Validate no overlap between shifts being saved
      for (let i = 0; i < parsedInput.shifts.length; i++) {
        for (let j = i + 1; j < parsedInput.shifts.length; j++) {
          const a = parsedInput.shifts[i]
          const b = parsedInput.shifts[j]
          if (timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(a.endTime) > timeToMinutes(b.startTime)) {
            throw new Error('Le fasce orarie non possono sovrapporsi')
          }
        }
      }
    }

    // Replace strategy: delete existing for userId+date, insert new
    await db.delete(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, parsedInput.userId),
        eq(userLocationAssignments.date, parsedInput.date),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    if (parsedInput.shifts.length > 0) {
      await db.insert(userLocationAssignments).values(
        parsedInput.shifts.map(s => ({
          userId: parsedInput.userId,
          locationId: s.locationId,
          date: parsedInput.date,
          startTime: s.startTime,
          endTime: s.endTime,
          tenantId: ctx.tenantId,
        }))
      )
    }

    return { success: true }
  })
