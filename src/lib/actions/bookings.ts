'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createBookingSchema,
  updateBookingSchema,
  moveBookingSchema,
  getBookingDayQuerySchema,
} from '@/lib/validations/bookings'
import { getBookingsByDateAndLocation, getStationCount } from '@/lib/queries/bookings'
import { getLocationBusinessHours } from '@/lib/queries/locations'
import { getStaffStatusForDate } from '@/lib/queries/staff'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Dati della giornata per il calendario di prenotazione.
 *
 * `stationCount` serve solo a disegnare le corsie: in prenotazione non c'e'
 * nessun vincolo di capacita' (decisione CC-2026-10-23), quindi un numero piu'
 * alto di appuntamenti in contemporanea e' ammesso e si vede a colpo d'occhio.
 */
export const getBookingDayData = authActionClient
  .schema(getBookingDayQuerySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date } = parsedInput

    const [bookings, stationCount, businessHours, staff] = await Promise.all([
      getBookingsByDateAndLocation(locationId, date, ctx.tenantId),
      getStationCount(locationId, ctx.tenantId),
      getLocationBusinessHours(locationId, ctx.tenantId),
      // Chi prenota non assegna il collaboratore, ma sapere chi c'e' quel giorno
      // aiuta a capire quanto si puo' riempire la giornata.
      getStaffStatusForDate(locationId, date, ctx.tenantId),
    ])

    return { bookings, stationCount, businessHours, staff }
  })

/**
 * Crea una prenotazione.
 *
 * Nessun controllo di sovrapposizione, di turno o di servizio abilitato: quelle
 * regole riguardano postazione e collaboratore, che qui non sono ancora stati
 * decisi. Chi prenota non deve ragionare sui turni del personale.
 */
export const createBooking = authActionClient
  .schema(createBookingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date, time, duration, clientId, dogId, serviceId, price, notes } = parsedInput

    // Stessa convenzione del resto dell'applicazione: UTC "nudo", senza conversioni.
    const startTime = new Date(`${date}T${time}:00.000Z`)
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    const [created] = await db
      .insert(appointments)
      .values({
        clientId,
        dogId,
        locationId,
        serviceId: serviceId ?? null,
        userId: null,
        stationId: null,
        startTime,
        endTime,
        price: price ?? null,
        notes: notes?.trim() ? notes.trim() : null,
        tenantId: ctx.tenantId,
      })
      .returning()

    return { appointment: created }
  })

/** Modifica orario, durata, cliente/cane o dettagli di una prenotazione. */
export const updateBooking = authActionClient
  .schema(updateBookingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, date, time, duration, clientId, dogId, serviceId, price, notes } = parsedInput

    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, ctx.tenantId)))
      .limit(1)

    if (!existing) throw new Error('Appuntamento non trovato')

    const startTime = new Date(`${date}T${time}:00.000Z`)
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    await db
      .update(appointments)
      .set({
        clientId,
        dogId,
        serviceId: serviceId ?? null,
        startTime,
        endTime,
        price: price ?? null,
        notes: notes?.trim() ? notes.trim() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, ctx.tenantId)))

    return { success: true }
  })

/**
 * Sposta una prenotazione a un altro orario conservandone la durata.
 * Come createBooking, nessun controllo di sovrapposizione: la capacita' non vincola.
 */
export const moveBooking = authActionClient
  .schema(moveBookingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, date, time } = parsedInput

    const [existing] = await db
      .select({ startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, ctx.tenantId)))
      .limit(1)

    if (!existing) throw new Error('Appuntamento non trovato')

    const durationMs = existing.endTime.getTime() - existing.startTime.getTime()
    const startTime = new Date(`${date}T${time}:00.000Z`)

    await db
      .update(appointments)
      .set({
        startTime,
        endTime: new Date(startTime.getTime() + durationMs),
        updatedAt: new Date(),
      })
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, ctx.tenantId)))

    return { success: true }
  })

export const deleteBooking = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))
      .limit(1)

    if (!existing) throw new Error('Appuntamento non trovato')

    await db
      .delete(appointments)
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))

    return { success: true }
  })
