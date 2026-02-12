import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  price: z.number().int().positive('La tariffa deve essere maggiore di 0'),
  duration: z.number().int().positive('La durata deve essere maggiore di 0'),
})

export type CreateServiceFormData = z.infer<typeof createServiceSchema>

export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  price: z.number().int().positive('La tariffa deve essere maggiore di 0'),
  duration: z.number().int().positive('La durata deve essere maggiore di 0'),
})

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>

export const deleteServiceSchema = z.object({
  id: z.string().uuid(),
})
