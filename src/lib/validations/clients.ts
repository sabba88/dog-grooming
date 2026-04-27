import { z } from 'zod'

export const createClientSchema = z.object({
  nominativo: z.string().min(2, 'Il nominativo deve avere almeno 2 caratteri'),
  phone: z.string().min(6, 'Il telefono deve avere almeno 6 caratteri'),
  owner2: z.string().optional().or(z.literal('')),
  phone2: z.string().optional().or(z.literal('')),
  owner3: z.string().optional().or(z.literal('')),
  phone3: z.string().optional().or(z.literal('')),
  email: z.string().email('Inserisci un indirizzo email valido').optional().or(z.literal('')),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare il trattamento dei dati personali',
  }),
})

export type CreateClientFormData = z.infer<typeof createClientSchema>

export const updateClientSchema = z.object({
  id: z.string().uuid(),
  nominativo: z.string().min(2, 'Il nominativo deve avere almeno 2 caratteri'),
  phone: z.string().min(6, 'Il telefono deve avere almeno 6 caratteri'),
  owner2: z.string().optional().or(z.literal('')),
  phone2: z.string().optional().or(z.literal('')),
  owner3: z.string().optional().or(z.literal('')),
  phone3: z.string().optional().or(z.literal('')),
  email: z.string().email('Inserisci un indirizzo email valido').optional().or(z.literal('')),
})

export type UpdateClientFormData = z.infer<typeof updateClientSchema>

export const addClientNoteSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1, 'Inserisci il testo della nota'),
})

export type AddClientNoteFormData = z.infer<typeof addClientNoteSchema>
