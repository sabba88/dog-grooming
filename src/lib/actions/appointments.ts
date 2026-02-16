'use server'

import { authActionClient } from '@/lib/actions/client'
import { getAppointmentsQuerySchema, createAppointmentSchema, deleteAppointmentSchema } from '@/lib/validations/appointments'
import { getAppointmentsByDateAndLocation } from '@/lib/queries/appointments'
import { getStationsWithScheduleForDay } from '@/lib/queries/appointments'
import { getDogsByClient } from '@/lib/queries/dogs'
import { getServicesForStation } from '@/lib/queries/stations'
import { toDayOfWeek, timeToMinutes } from '@/lib/utils/schedule'
import { getDay } from 'date-fns'
import { z } from 'zod'
import { db } from '@/lib/db'
import { appointments, stationServices, stationSchedules } from '@/lib/db/schema'
import { eq, and, lt, gt, gte, asc } from 'drizzle-orm'

export const getAgendaData = authActionClient
  .schema(getAppointmentsQuerySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date } = parsedInput
    const dateObj = new Date(date + 'T00:00:00.000Z')
    const dayOfWeek = toDayOfWeek(getDay(dateObj))

    const [appts, stations] = await Promise.all([
      getAppointmentsByDateAndLocation(locationId, date, ctx.tenantId),
      getStationsWithScheduleForDay(locationId, dayOfWeek, ctx.tenantId),
    ])

    return { appointments: appts, stations }
  })

async function findAlternativeSlots(
  stationId: string,
  date: string,
  durationMinutes: number,
  tenantId: string
): Promise<string[]> {
  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  const dayOfWeek = toDayOfWeek(getDay(dayStart))

  const [schedule] = await db
    .select({
      openTime: stationSchedules.openTime,
      closeTime: stationSchedules.closeTime,
    })
    .from(stationSchedules)
    .where(
      and(
        eq(stationSchedules.stationId, stationId),
        eq(stationSchedules.dayOfWeek, dayOfWeek),
        eq(stationSchedules.tenantId, tenantId)
      )
    )
    .limit(1)

  if (!schedule) return []

  const openMinutes = timeToMinutes(schedule.openTime)
  const closeMinutes = timeToMinutes(schedule.closeTime)

  const existing = await db
    .select({
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.stationId, stationId),
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

export const createAppointment = authActionClient
  .schema(createAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stationId, date, time, clientId, dogId, serviceId, duration, price } = parsedInput

    // 1. Calcola startTime e endTime
    const startTime = new Date(`${date}T${time}:00.000Z`)
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    // 2. Validare servizio abilitato sulla postazione
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

    // 3. Verifica non-sovrapposizione
    const conflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.stationId, stationId),
          eq(appointments.tenantId, ctx.tenantId),
          lt(appointments.startTime, endTime),
          gt(appointments.endTime, startTime)
        )
      )
      .limit(1)

    if (conflicts.length > 0) {
      const alternatives = await findAlternativeSlots(stationId, date, duration, ctx.tenantId)
      return {
        error: {
          code: 'SLOT_OCCUPIED' as const,
          message: "Lo slot e' gia' occupato",
          alternatives,
        },
      }
    }

    // 4. Verifica orario chiusura postazione
    const dayOfWeek = toDayOfWeek(getDay(new Date(date + 'T00:00:00.000Z')))
    const [schedule] = await db
      .select({
        closeTime: stationSchedules.closeTime,
      })
      .from(stationSchedules)
      .where(
        and(
          eq(stationSchedules.stationId, stationId),
          eq(stationSchedules.dayOfWeek, dayOfWeek),
          eq(stationSchedules.tenantId, ctx.tenantId)
        )
      )
      .limit(1)

    if (schedule) {
      const closeMinutes = timeToMinutes(schedule.closeTime)
      const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes()
      if (endMinutes > closeMinutes) {
        return {
          error: {
            code: 'EXCEEDS_CLOSING_TIME' as const,
            message: "L'appuntamento supera l'orario di chiusura",
            closingTime: schedule.closeTime,
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
        stationId,
        startTime,
        endTime,
        price,
        tenantId: ctx.tenantId,
      })
      .returning()

    return { appointment: created }
  })

export const deleteAppointment = authActionClient
  .schema(deleteAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { appointmentId } = parsedInput

    const deleted = await db
      .delete(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, ctx.tenantId)
        )
      )
      .returning({ id: appointments.id })

    if (deleted.length === 0) {
      throw new Error('Appuntamento non trovato')
    }

    return { success: true }
  })
