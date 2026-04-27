import { z } from 'zod'

export const breedServicePriceSchema = z.object({
  serviceId: z.string().uuid(),
  price: z.number().int().positive().optional(),
})

export const createBreedSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  servicePrices: z.array(breedServicePriceSchema).default([]),
})

export const updateBreedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  servicePrices: z.array(breedServicePriceSchema).default([]),
})

export const deleteBreedSchema = z.object({
  id: z.string().uuid(),
})

export const upsertServiceBreedPricesSchema = z.object({
  serviceId: z.string().uuid(),
  breedPrices: z.array(z.object({
    breedId: z.string().uuid(),
    price: z.number().int().positive().optional(),
  })),
})

export type CreateBreedFormData = z.infer<typeof createBreedSchema>
export type UpdateBreedFormData = z.infer<typeof updateBreedSchema>
