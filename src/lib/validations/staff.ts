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

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const assignUserToLocationSchema = z.object({
  userId: z.string().uuid('ID utente non valido'),
  locationId: z.string().uuid('ID sede non valido'),
  dayOfWeek: z.number().int().min(0).max(6, 'Giorno non valido'),
  startTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
  endTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "L'orario di fine deve essere successivo all'orario di inizio", path: ['endTime'] }
)

export type AssignUserToLocationFormData = z.infer<typeof assignUserToLocationSchema>

export const updateAssignmentSchema = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid('ID sede non valido'),
  startTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
  endTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "L'orario di fine deve essere successivo all'orario di inizio", path: ['endTime'] }
)

export type UpdateAssignmentFormData = z.infer<typeof updateAssignmentSchema>

export const removeAssignmentSchema = z.object({
  id: z.string().uuid(),
})

export type RemoveAssignmentFormData = z.infer<typeof removeAssignmentSchema>

const weeklyAssignmentItemSchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  dayOfWeek: z.number().int().min(0).max(6, 'Giorno non valido'),
  startTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
  endTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "L'orario di fine deve essere successivo all'orario di inizio", path: ['endTime'] }
)

export const saveWeeklyCalendarSchema = z.object({
  userId: z.string().uuid('ID utente non valido'),
  assignments: z.array(weeklyAssignmentItemSchema),
})

export type SaveWeeklyCalendarFormData = z.infer<typeof saveWeeklyCalendarSchema>
