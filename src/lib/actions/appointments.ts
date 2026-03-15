'use server'

import { authActionClient } from '@/lib/actions/client'
import { getAppointmentsQuerySchema, createAppointmentSchema } from '@/lib/validations/appointments'
import { getAppointmentsByDateAndLocationGroupedByUser } from '@/lib/queries/appointments'
import { getStaffStatusForDate } from '@/lib/queries/staff'
import { getDogsByClient } from '@/lib/queries/dogs'
import { getServicesForStation } from '@/lib/queries/stations'
import { timeToMinutes } from '@/lib/utils/schedule'
import { z } from 'zod'
import { db } from '@/lib/db'
import { appointments, stationServices } from '@/lib/db/schema'
import { eq, and, lt, gt, gte, asc } from 'drizzle-orm'

export const getAgendaData = authActionClient
  .schema(getAppointmentsQuerySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date } = parsedInput
    const dateObj = new Date(date + 'T00:00:00.000Z')

    const [appts, staff] = await Promise.all([
      getAppointmentsByDateAndLocationGroupedByUser(date, ctx.tenantId),
      getStaffStatusForDate(locationId, dateObj, ctx.tenantId),
    ])

    return { appointments: appts, staff }
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

    // 4. INSERT
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
