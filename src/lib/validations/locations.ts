import { z } from 'zod'

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
