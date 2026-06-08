import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Inserisci il tuo username'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
})

export type LoginFormData = z.infer<typeof loginSchema>
