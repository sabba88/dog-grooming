import { z } from 'zod'

export const createDogSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  breed: z.string().optional().or(z.literal('')),
  size: z.enum(['piccola', 'media', 'grande']).optional().or(z.literal('')),
  age: z.string().optional().or(z.literal('')),
  clientId: z.string().uuid(),
})

export type CreateDogFormData = z.infer<typeof createDogSchema>

export const updateDogSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  breed: z.string().optional().or(z.literal('')),
  size: z.enum(['piccola', 'media', 'grande']).optional().or(z.literal('')),
  age: z.string().optional().or(z.literal('')),
})

export type UpdateDogFormData = z.infer<typeof updateDogSchema>

export const addDogNoteSchema = z.object({
  dogId: z.string().uuid(),
  content: z.string().min(1, 'Inserisci il testo della nota'),
})

export type AddDogNoteFormData = z.infer<typeof addDogNoteSchema>
