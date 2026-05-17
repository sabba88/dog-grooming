import { z } from 'zod'

export const servicePriceMatrixCellSchema = z.object({
  coatType: z.string(),
  sizeType: z.string(),
  price: z.number().int().min(0, 'Il prezzo non può essere negativo'),
})

export type ServicePriceMatrixCell = z.infer<typeof servicePriceMatrixCellSchema>

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  price: z.number().int().positive('La tariffa deve essere maggiore di 0'),
  duration: z.number().int().positive('La durata deve essere maggiore di 0'),
  durationSurchargePer30min: z.number().int().min(0, 'La maggiorazione non può essere negativa'),
  matrixCells: z.array(servicePriceMatrixCellSchema).optional(),
})

export type CreateServiceFormData = z.infer<typeof createServiceSchema>

export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  price: z.number().int().positive('La tariffa deve essere maggiore di 0'),
  duration: z.number().int().positive('La durata deve essere maggiore di 0'),
  durationSurchargePer30min: z.number().int().min(0, 'La maggiorazione non può essere negativa'),
  matrixCells: z.array(servicePriceMatrixCellSchema).optional(),
})

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>

export const deleteServiceSchema = z.object({
  id: z.string().uuid(),
})
