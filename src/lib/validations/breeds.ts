import { z } from 'zod'

export const createBreedSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  coatType: z.enum(['short', 'medium', 'long']).optional().or(z.literal('')),
  sizeType: z.enum(['toy', 'small', 'medium', 'large', 'giant']).optional().or(z.literal('')),
})

export const updateBreedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  coatType: z.enum(['short', 'medium', 'long']).optional().or(z.literal('')),
  sizeType: z.enum(['toy', 'small', 'medium', 'large', 'giant']).optional().or(z.literal('')),
})

export const deleteBreedSchema = z.object({
  id: z.string().uuid(),
})

export type CreateBreedFormData = z.infer<typeof createBreedSchema>
export type UpdateBreedFormData = z.infer<typeof updateBreedSchema>
