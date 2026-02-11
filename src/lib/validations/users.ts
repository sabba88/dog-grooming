import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
  role: z.enum(['admin', 'collaborator'], {
    message: 'Seleziona un ruolo',
  }),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z
    .string()
    .min(6, 'La password deve avere almeno 6 caratteri')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'collaborator'], {
    message: 'Seleziona un ruolo',
  }),
})

export type UpdateUserFormData = z.infer<typeof updateUserSchema>
