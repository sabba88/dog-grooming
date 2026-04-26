'use server'

import { authActionClient } from '@/lib/actions/client'
import { getAppointmentsQuerySchema, createAppointmentSchema, deleteAppointmentSchema, moveAppointmentSchema, saveAppointmentNoteSchema, fetchServiceNotesByDogSchema } from '@/lib/validations/appointments'
import { getAppointmentsByDateAndLocationGroupedByUser, getAppointmentById, getServiceNotesByDog } from '@/lib/queries/appointments'
import { getStaffStatusForDate } from '@/lib/queries/staff'
import { getLocationBusinessHours } from '@/lib/queries/locations'
import { getDogsByClient } from '@/lib/queries/dogs'
import { getStationsByLocation, getServicesForStation } from '@/lib/queries/stations'
import { getServices } from '@/lib/queries/services'
import { timeToMinutes } from '@/lib/utils/schedule'
import { z } from 'zod'
import { db } from '@/lib/db'
import { appointments, stationServices, userLocationAssignments } from '@/lib/db/schema'
import { eq, and, lt, gt, gte, asc, ne } from 'drizzle-orm'

export const getAgendaData = authActionClient
  .schema(getAppointmentsQuerySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date } = parsedInput
    const [appts, staff, businessHours] = await Promise.all([
      getAppointmentsByDateAndLocationGroupedByUser(date, ctx.tenantId),
      getStaffStatusForDate(locationId, date, ctx.tenantId),
      getLocationBusinessHours(locationId, ctx.tenantId),
    ])

    return { appointments: appts, staff, businessHours }
  })

async function findAlternativeSlots(
  userId: string,
  date: string,
  durationMinutes: number,
  tenantId: string
): Promise<string[]> {
  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  const openMinutes = timeToMinutes('08:00')
  const closeMinutes = timeToMinutes('20:00')

  const existing = await db
    .select({
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        eq(appointments.tenantId, tenantId),
        gte(appointments.startTime, dayStart),
        lt(appointments.startTime, dayEnd)
      )
    )
    .orderBy(asc(appointments.startTime))

  const occupied = existing.map((a) => ({
    start: a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes(),
    end: a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes(),
  }))

  const alternatives: string[] = []
  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += 30) {
    const slotEnd = m + durationMinutes
    const hasConflict = occupied.some((o) => m < o.end && slotEnd > o.start)
    if (!hasConflict) {
      const h = Math.floor(m / 60)
      const min = m % 60
      alternatives.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    }
    if (alternatives.length >= 3) break
  }

  return alternatives
}

export const fetchStationsForLocation = authActionClient
  .schema(z.object({ locationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const stations = await getStationsByLocation(parsedInput.locationId, ctx.tenantId)
    return { stations: stations.map((s) => ({ id: s.id, name: s.name })) }
  })

export const fetchDogsForClient = authActionClient
  .schema(z.object({ clientId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const dogs = await getDogsByClient(parsedInput.clientId, ctx.tenantId)
    return { dogs }
  })

export const fetchServicesForStation = authActionClient
  .schema(z.object({ stationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const services = await getServicesForStation(parsedInput.stationId, ctx.tenantId)
    return { services }
  })

export const fetchAllServices = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const allServices = await getServices(ctx.tenantId)
    return { services: allServices }
  })

export const createAppointment = authActionClient
  .schema(createAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, stationId, date, time, clientId, dogId, serviceId, duration, price } = parsedInput

    // 1. Calcola startTime e endTime
    const startTime = new Date(`${date}T${time}:00.000Z`)
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    // 2. Validare servizio abilitato sulla postazione (solo se stationId fornito)
    if (stationId) {
      const [stationService] = await db
        .select({ serviceId: stationServices.serviceId })
        .from(stationServices)
        .where(
          and(
            eq(stationServices.stationId, stationId),
            eq(stationServices.serviceId, serviceId),
            eq(stationServices.tenantId, ctx.tenantId)
          )
        )
        .limit(1)

      if (!stationService) {
        throw new Error('Servizio non abilitato su questa postazione')
      }
    }

    // 3. Verifica non-sovrapposizione per persona (userId)
    const conflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.tenantId, ctx.tenantId),
          lt(appointments.startTime, endTime),
          gt(appointments.endTime, startTime)
        )
      )
      .limit(1)

    if (conflicts.length > 0) {
      const alternatives = await findAlternativeSlots(userId, date, duration, ctx.tenantId)
      return {
        error: {
          code: 'SLOT_OCCUPIED' as const,
          message: "Lo slot e' gia' occupato",
          alternatives,
        },
      }
    }

    // 4. Validazione turno persona (per data specifica)
    const shiftsForDate = await db
      .select({ startTime: userLocationAssignments.startTime, endTime: userLocationAssignments.endTime })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, userId),
        eq(userLocationAssignments.date, date),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    if (shiftsForDate.length > 0) {
      const appointmentStartMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes()
      const appointmentEndMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes()
      const coveringShift = shiftsForDate.find(s => {
        const shiftStart = timeToMinutes(s.startTime)
        const shiftEnd = timeToMinutes(s.endTime)
        return appointmentStartMinutes >= shiftStart && appointmentStartMinutes < shiftEnd
      })
      if (coveringShift && appointmentEndMinutes > timeToMinutes(coveringShift.endTime)) {
        return {
          error: {
            code: 'EXCEEDS_SHIFT_TIME' as const,
            message: "L'appuntamento supera la fine del turno",
            shiftEndTime: coveringShift.endTime,
          },
        }
      }
    }

    // 5. INSERT
    const [created] = await db
      .insert(appointments)
      .values({
        clientId,
        dogId,
        serviceId,
        userId,
        stationId: stationId ?? null,
        startTime,
        endTime,
        price,
        tenantId: ctx.tenantId,
      })
      .returning()

    return { appointment: created }
  })

export const fetchAppointmentDetail = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const appointment = await getAppointmentById(parsedInput.id, ctx.tenantId)
    if (!appointment) {
      throw new Error('Appuntamento non trovato')
    }
    return { appointment }
  })

export const deleteAppointment = authActionClient
  .schema(deleteAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, parsedInput.id),
          eq(appointments.tenantId, ctx.tenantId)
        )
      )
      .limit(1)

    if (!existing) {
      throw new Error('Appuntamento non trovato')
    }

    await db
      .delete(appointments)
      .where(
        and(
          eq(appointments.id, parsedInput.id),
          eq(appointments.tenantId, ctx.tenantId)
        )
      )

    return { success: true }
  })

export const saveAppointmentNote = authActionClient
  .schema(saveAppointmentNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))
      .limit(1)
    if (!existing) throw new Error('Appuntamento non trovato')
    await db
      .update(appointments)
      .set({ notes: parsedInput.notes || null, updatedAt: new Date() })
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))
    return { success: true }
  })

export const fetchServiceNotesByDog = authActionClient
  .schema(fetchServiceNotesByDogSchema)
  .action(async ({ parsedInput, ctx }) => {
    const serviceNotes = await getServiceNotesByDog(
      parsedInput.dogId,
      parsedInput.excludeAppointmentId ?? null,
      ctx.tenantId
    )
    return { serviceNotes }
  })

export const moveAppointment = authActionClient
  .schema(moveAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, userId, date, time } = parsedInput

    // 1. Caricare appuntamento esistente per calcolare durata
    const [existing] = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.tenantId, ctx.tenantId)
        )
      )
      .limit(1)

    if (!existing) {
      throw new Error('Appuntamento non trovato')
    }

    const durationMs = existing.endTime.getTime() - existing.startTime.getTime()
    const durationMinutes = durationMs / (60 * 1000)

    // 2. Calcolare nuovo startTime e endTime
    const newStartTime = new Date(`${date}T${time}:00.000Z`)
    const newEndTime = new Date(newStartTime.getTime() + durationMs)

    // 3. Validare sovrapposizione (escludere l'appuntamento stesso)
    const conflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.tenantId, ctx.tenantId),
          ne(appointments.id, id),
          lt(appointments.startTime, newEndTime),
          gt(appointments.endTime, newStartTime)
        )
      )
      .limit(1)

    if (conflicts.length > 0) {
      const alternatives = await findAlternativeSlots(userId, date, durationMinutes, ctx.tenantId)
      return {
        error: {
          code: 'SLOT_OCCUPIED' as const,
          message: "Lo slot non e' piu' disponibile",
          alternatives,
        },
      }
    }

    // 4. Validazione turno persona destinazione (per data specifica)
    const shiftsForMoveDate = await db
      .select({ startTime: userLocationAssignments.startTime, endTime: userLocationAssignments.endTime })
      .from(userLocationAssignments)
      .where(and(
        eq(userLocationAssignments.userId, userId),
        eq(userLocationAssignments.date, date),
        eq(userLocationAssignments.tenantId, ctx.tenantId)
      ))

    if (shiftsForMoveDate.length > 0) {
      const apptStartMinutes = newStartTime.getUTCHours() * 60 + newStartTime.getUTCMinutes()
      const apptEndMinutes = newEndTime.getUTCHours() * 60 + newEndTime.getUTCMinutes()
      const coveringShift = shiftsForMoveDate.find(s => {
        const shiftStart = timeToMinutes(s.startTime)
        const shiftEnd = timeToMinutes(s.endTime)
        return apptStartMinutes >= shiftStart && apptStartMinutes < shiftEnd
      })
      if (coveringShift && apptEndMinutes > timeToMinutes(coveringShift.endTime)) {
        return {
          error: {
            code: 'EXCEEDS_SHIFT_TIME' as const,
            message: "L'appuntamento supera la fine del turno",
            shiftEndTime: coveringShift.endTime,
          },
        }
      }
    }

    // 5. Aggiornare appuntamento
    await db
      .update(appointments)
      .set({
        userId,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.tenantId, ctx.tenantId)
        )
      )

    return { success: true }
  })
