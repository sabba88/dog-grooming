import { z } from 'zod'

export const getAppointmentsQuerySchema = z.object({
  locationId: z.string().uuid('ID sede non valido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
})

export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>
