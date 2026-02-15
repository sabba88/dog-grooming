import { z } from 'zod'

export const createClientSchema = z.object({
  firstName: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  lastName: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  phone: z.string().min(6, 'Il telefono deve avere almeno 6 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido').optional().or(z.literal('')),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare il trattamento dei dati personali',
  }),
})

export type CreateClientFormData = z.infer<typeof createClientSchema>

export const updateClientSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  lastName: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  phone: z.string().min(6, 'Il telefono deve avere almeno 6 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido').optional().or(z.literal('')),
})

export type UpdateClientFormData = z.infer<typeof updateClientSchema>

export const addClientNoteSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1, 'Inserisci il testo della nota'),
})

export type AddClientNoteFormData = z.infer<typeof addClientNoteSchema>
