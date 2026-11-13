// lascia-messaggio: un messaggio per il negozio. Serve per tutto quello che l'assistente
// non fa da solo: disdette, appuntamenti per oggi, cani difficili, richieste particolari.
// Corpo: nome, messaggio, telefono_detto (solo se il numero è nascosto).

import type { Contesto } from '../contesto'
import { salvaMessaggio } from '../dati'
import { testo } from '../formati'
import { datiNonValidi, type Risposta } from '../http'
import { telefonoNazionale } from '../telefono'
import { chiChiama } from './comune'

export async function lasciaMessaggio(corpo: Record<string, unknown>, ctx: Contesto): Promise<Risposta> {
  const messaggio = testo(corpo.messaggio)
  if (!messaggio) return datiNonValidi('Cosa vuole che riferisca al negozio?')

  const telefono = ctx.telefonoChiamante || telefonoNazionale(testo(corpo.telefono_detto))
  if (!telefono) {
    return { esito: 'manca_dato', manca: 'telefono', da_dire: 'Il suo numero non mi arriva: a che numero la possono richiamare?' }
  }

  const { clienti } = await chiChiama(ctx, telefono)
  const nome = testo(corpo.nome) || (clienti.length === 1 ? clienti[0].nominativo : '')
  await salvaMessaggio({
    tenantId: ctx.tenantId,
    locationId: ctx.locationId,
    clientId: clienti.length === 1 ? clienti[0].id : null,
    nome,
    telefono,
    messaggio,
    sessionId: ctx.sessionId,
  })
  return { esito: 'salvato', da_dire: 'Ho lasciato il messaggio al negozio: la richiamano appena possono.' }
}
