import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const assignUserToLocationSchema = z.object({
  userId: z.string().uuid('ID utente non valido'),
  locationId: z.string().uuid('ID sede non valido'),
  date: z.string().date('Data non valida (YYYY-MM-DD)'),
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

const shiftItemSchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  startTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
  endTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "L'orario di fine deve essere successivo all'orario di inizio", path: ['endTime'] }
)

export const saveDayShiftsSchema = z.object({
  userId: z.string().uuid('ID utente non valido'),
  date: z.string().date('Data non valida (YYYY-MM-DD)'),
  shifts: z.array(shiftItemSchema),
})

export type SaveDayShiftsFormData = z.infer<typeof saveDayShiftsSchema>
