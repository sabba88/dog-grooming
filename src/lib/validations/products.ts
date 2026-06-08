import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(200),
  price: z.number().int().min(0, 'Il prezzo non può essere negativo'),
  stock: z.number().int().min(0, 'Le scorte non possono essere negative'),
})

export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Il nome è obbligatorio').max(200),
  price: z.number().int().min(0, 'Il prezzo non può essere negativo'),
})

export const updateProductStockSchema = z.object({
  id: z.string().uuid(),
  stock: z.number().int().min(0, 'Le scorte non possono essere negative'),
})

export const deleteProductSchema = z.object({
  id: z.string().uuid(),
})

export const addProductToAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1, 'La quantità deve essere almeno 1'),
})

export const removeAppointmentProductSchema = z.object({
  appointmentProductId: z.string().uuid(),
})

export type CreateProductFormData = z.infer<typeof createProductSchema>
export type UpdateProductFormData = z.infer<typeof updateProductSchema>
