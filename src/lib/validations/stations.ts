import { z } from 'zod'
import { SIZE_TYPES } from '@/lib/types'

export const createStationSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  locationId: z.string().uuid('ID sede non valido'),
  allowedSizes: z.array(z.enum(SIZE_TYPES)).min(1, 'Seleziona almeno una taglia').optional(),
})

export type CreateStationFormData = z.infer<typeof createStationSchema>

export const updateStationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  allowedSizes: z.array(z.enum(SIZE_TYPES)).min(1, 'Seleziona almeno una taglia').optional(),
})

export type UpdateStationFormData = z.infer<typeof updateStationSchema>

export const updateStationServicesSchema = z.object({
  stationId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()),
})

export type UpdateStationServicesFormData = z.infer<typeof updateStationServicesSchema>
