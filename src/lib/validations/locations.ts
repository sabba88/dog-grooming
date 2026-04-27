import { z } from 'zod'

export const locationBusinessHoursSlotSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm richiesto"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm richiesto"),
}).refine(d => d.closeTime > d.openTime, { message: "L'ora di chiusura deve essere dopo l'apertura" })

export const upsertLocationBusinessHoursSchema = z.object({
  locationId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  slots: z.array(locationBusinessHoursSlotSchema).max(2, "Massimo 2 fasce per giorno"),
})

export const createLocationSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  address: z.string().min(5, "L'indirizzo deve avere almeno 5 caratteri"),
})

export type CreateLocationFormData = z.infer<typeof createLocationSchema>

export const updateLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  address: z.string().min(5, "L'indirizzo deve avere almeno 5 caratteri"),
})

export type UpdateLocationFormData = z.infer<typeof updateLocationSchema>
