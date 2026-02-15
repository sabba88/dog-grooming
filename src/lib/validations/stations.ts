import { z } from 'zod'

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunedì' },
  { value: 1, label: 'Martedì' },
  { value: 2, label: 'Mercoledì' },
  { value: 3, label: 'Giovedì' },
  { value: 4, label: 'Venerdì' },
  { value: 5, label: 'Sabato' },
  { value: 6, label: 'Domenica' },
] as const

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const createStationSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  locationId: z.string().uuid('ID sede non valido'),
})

export type CreateStationFormData = z.infer<typeof createStationSchema>

export const updateStationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
})

export type UpdateStationFormData = z.infer<typeof updateStationSchema>

export const updateStationServicesSchema = z.object({
  stationId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()),
})

export type UpdateStationServicesFormData = z.infer<typeof updateStationServicesSchema>

const scheduleEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(timeRegex, 'Formato orario non valido (HH:mm)'),
  closeTime: z.string().regex(timeRegex, 'Formato orario non valido (HH:mm)'),
}).refine(
  (entry) => entry.closeTime > entry.openTime,
  { message: "L'orario di chiusura deve essere dopo l'apertura" }
)

export const updateStationScheduleSchema = z.object({
  stationId: z.string().uuid(),
  schedules: z.array(scheduleEntrySchema),
})

export type UpdateStationScheduleFormData = z.infer<typeof updateStationScheduleSchema>
