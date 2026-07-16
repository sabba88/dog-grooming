import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  username: z.string().min(3, 'Lo username deve avere almeno 3 caratteri'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
  role: z.enum(['admin', 'collaborator'], {
    message: 'Seleziona un ruolo',
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  username: z.string().min(3, 'Lo username deve avere almeno 3 caratteri'),
  password: z
    .string()
    .min(6, 'La password deve avere almeno 6 caratteri')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'collaborator'], {
    message: 'Seleziona un ruolo',
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
})

export type UpdateUserFormData = z.infer<typeof updateUserSchema>
