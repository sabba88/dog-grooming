'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  assignUserToLocationSchema,
  updateAssignmentSchema,
  removeAssignmentSchema,
  saveDayShiftsSchema,
  upsertShiftSchema,
  deleteShiftSchema,
  copyWeekShiftsSchema,
  upsertRecurringShiftSchema,
  deleteRecurringShiftSchema,
  applyTemplateToWeekSchema,
} from '@/lib/validations/staff'
import { db } from '@/lib/db'
import { userLocationAssignments, users, locations, userRecurringSchedules } from '@/lib/db/schema'
import { eq, and, gte, lte, ne } from 'drizzle-orm'
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

export const upsertShift = authActionClient
  .schema(upsertShiftSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

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

    const existingForDate = await db
      .select({ id: userLocationAssignments.id, startTime: userLocationAssignments.startTime, endTime: userLocationAssignments.endTime })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, parsedInput.userId),
        eq(userLocationAssignments.date, parsedInput.date),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    const others = parsedInput.id
      ? existingForDate.filter(s => s.id !== parsedInput.id)
      : existingForDate

    const hasOverlap = others.some(
      s => parsedInput.startTime < s.endTime && parsedInput.endTime > s.startTime
    )
    if (hasOverlap) throw new Error('Fascia oraria sovrapposta a un turno esistente')

    if (parsedInput.id) {
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
      return { shift: { id: updated.id } }
    } else {
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
      return { shift: { id: result.id } }
    }
  })

export const deleteShift = authActionClient
  .schema(deleteShiftSchema)
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

export const copyWeekShifts = authActionClient
  .schema(copyWeekShiftsSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const { sourceWeekStart, targetWeekStart } = parsedInput

    const sourceStartMs = new Date(sourceWeekStart).getTime()
    const sourceEnd = new Date(sourceStartMs + 6 * 86400000).toISOString().slice(0, 10)

    const targetStartMs = new Date(targetWeekStart).getTime()
    const targetEnd = new Date(targetStartMs + 6 * 86400000).toISOString().slice(0, 10)

    const sourceShifts = await db
      .select()
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.tenantId, ctx.tenantId),
        gte(userLocationAssignments.date, sourceWeekStart),
        lte(userLocationAssignments.date, sourceEnd),
      ))

    if (sourceShifts.length === 0) {
      throw new Error('Nessun turno nella settimana sorgente da copiare')
    }

    const targetExisting = await db
      .select({
        userId: userLocationAssignments.userId,
        date: userLocationAssignments.date,
        startTime: userLocationAssignments.startTime,
        locationId: userLocationAssignments.locationId,
      })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.tenantId, ctx.tenantId),
        gte(userLocationAssignments.date, targetWeekStart),
        lte(userLocationAssignments.date, targetEnd),
      ))

    const existingKeys = new Set(
      targetExisting.map(s => `${s.userId}|${s.date}|${s.startTime}|${s.locationId}`)
    )

    const toInsert = sourceShifts
      .map(s => {
        const offset = Math.round((new Date(s.date).getTime() - sourceStartMs) / 86400000)
        const targetDate = new Date(targetStartMs + offset * 86400000).toISOString().slice(0, 10)
        return {
          userId: s.userId,
          locationId: s.locationId,
          date: targetDate,
          startTime: s.startTime,
          endTime: s.endTime,
          tenantId: ctx.tenantId,
        }
      })
      .filter(s => !existingKeys.has(`${s.userId}|${s.date}|${s.startTime}|${s.locationId}`))

    if (toInsert.length > 0) {
      await db.insert(userLocationAssignments).values(toInsert)
    }

    return { copied: toInsert.length, skipped: sourceShifts.length - toInsert.length }
  })

export const upsertRecurringShift = authActionClient
  .schema(upsertRecurringShiftSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

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

    const existingForDow = await db
      .select({
        id: userRecurringSchedules.id,
        startTime: userRecurringSchedules.startTime,
        endTime: userRecurringSchedules.endTime,
      })
      .from(userRecurringSchedules)
      .where(and(
        eq(userRecurringSchedules.userId, parsedInput.userId),
        eq(userRecurringSchedules.dayOfWeek, parsedInput.dayOfWeek),
        eq(userRecurringSchedules.tenantId, ctx.tenantId),
        ...(parsedInput.id ? [ne(userRecurringSchedules.id, parsedInput.id)] : [])
      ))

    const hasOverlap = existingForDow.some(
      s => parsedInput.startTime < s.endTime && parsedInput.endTime > s.startTime
    )
    if (hasOverlap) throw new Error('Fascia oraria sovrapposta a un template esistente')

    if (parsedInput.id) {
      const [updated] = await db
        .update(userRecurringSchedules)
        .set({
          locationId: parsedInput.locationId,
          dayOfWeek: parsedInput.dayOfWeek,
          startTime: parsedInput.startTime,
          endTime: parsedInput.endTime,
          updatedAt: new Date(),
        })
        .where(and(
          eq(userRecurringSchedules.id, parsedInput.id),
          eq(userRecurringSchedules.tenantId, ctx.tenantId)
        ))
        .returning({ id: userRecurringSchedules.id })
      if (!updated) throw new Error('Template non trovato')
      return { recurringShift: { id: updated.id } }
    } else {
      const [result] = await db
        .insert(userRecurringSchedules)
        .values({
          userId: parsedInput.userId,
          locationId: parsedInput.locationId,
          dayOfWeek: parsedInput.dayOfWeek,
          startTime: parsedInput.startTime,
          endTime: parsedInput.endTime,
          tenantId: ctx.tenantId,
        })
        .returning({ id: userRecurringSchedules.id })
      return { recurringShift: { id: result.id } }
    }
  })

export const deleteRecurringShift = authActionClient
  .schema(deleteRecurringShiftSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [deleted] = await db
      .delete(userRecurringSchedules)
      .where(and(
        eq(userRecurringSchedules.id, parsedInput.id),
        eq(userRecurringSchedules.tenantId, ctx.tenantId)
      ))
      .returning({ id: userRecurringSchedules.id })

    if (!deleted) throw new Error('Template non trovato')
    return { success: true }
  })

export const applyTemplateToWeek = authActionClient
  .schema(applyTemplateToWeekSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const { weekStart } = parsedInput
    const weekStartMs = new Date(weekStart).getTime()
    const weekEnd = new Date(weekStartMs + 6 * 86400000).toISOString().slice(0, 10)

    const templates = await db
      .select()
      .from(userRecurringSchedules)
      .where(eq(userRecurringSchedules.tenantId, ctx.tenantId))

    if (templates.length === 0) {
      return { generated: 0, skipped: 0 }
    }

    const existingInWeek = await db
      .select({
        userId: userLocationAssignments.userId,
        date: userLocationAssignments.date,
        startTime: userLocationAssignments.startTime,
        locationId: userLocationAssignments.locationId,
      })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.tenantId, ctx.tenantId),
        gte(userLocationAssignments.date, weekStart),
        lte(userLocationAssignments.date, weekEnd),
      ))

    const existingKeys = new Set(
      existingInWeek.map(s => `${s.userId}|${s.date}|${s.startTime}|${s.locationId}`)
    )

    const toInsert = templates
      .map(t => {
        // dayOfWeek 0=Mon → +0 days from weekStart (Monday), 6=Sun → +6 days
        const targetDate = new Date(weekStartMs + t.dayOfWeek * 86400000).toISOString().slice(0, 10)
        return {
          userId: t.userId,
          locationId: t.locationId,
          date: targetDate,
          startTime: t.startTime,
          endTime: t.endTime,
          tenantId: ctx.tenantId,
        }
      })
      .filter(s => !existingKeys.has(`${s.userId}|${s.date}|${s.startTime}|${s.locationId}`))

    if (toInsert.length > 0) {
      await db.insert(userLocationAssignments).values(toInsert)
    }

    return { generated: toInsert.length, skipped: templates.length - toInsert.length }
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
