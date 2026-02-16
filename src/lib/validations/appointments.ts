import { z } from 'zod'

export const getAppointmentsQuerySchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
})

export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>

export const createAppointmentSchema = z.object({
  stationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  clientId: z.string().uuid(),
  dogId: z.string().uuid(),
  serviceId: z.string().uuid(),
  duration: z.number().int().min(15),
  price: z.number().int().min(0),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const deleteAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
})

export type DeleteAppointmentInput = z.infer<typeof deleteAppointmentSchema>

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  stationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>
