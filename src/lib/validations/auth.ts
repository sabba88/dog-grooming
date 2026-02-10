import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
})

export type LoginFormData = z.infer<typeof loginSchema>
