import { z } from 'zod'

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
