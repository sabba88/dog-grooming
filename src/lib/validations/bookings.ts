import { z } from 'zod'

// CC-2026-10-23 — La prenotazione chiede il minimo: giorno, ora, durata, cliente, cane.
// Servizio, prezzo e note sono facoltativi: chi sa gia' cosa serve li compila subito,
// chi ha fretta li lascia alla pianificazione.

export const BOOKING_DURATION_PRESETS = [60, 90, 120] as const
export const DEFAULT_BOOKING_DURATION = 60

export const createBookingSchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato ora non valido (HH:mm)'),
  duration: z.number().int().min(15, 'Minimo 15 minuti').max(600, 'Massimo 10 ore'),
  clientId: z.string().uuid(),
  dogId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  price: z.number().int().min(0).optional(),
  notes: z.string().trim().max(2000, 'La nota non può superare 2000 caratteri').optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const updateBookingSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(15).max(600),
  clientId: z.string().uuid(),
  dogId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  price: z.number().int().min(0).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>

// Trascinamento nel calendario: cambia solo quando, non chi ne' cosa.
export const moveBookingSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

export const getBookingDayQuerySchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
})
