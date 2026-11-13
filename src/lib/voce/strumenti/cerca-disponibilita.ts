// cerca-disponibilita: c'è posto per questo servizio, questo giorno, a quest'ora?
// Corpo: giorno, ora, servizio (obbligatori), cane (facoltativo, solo per il prezzo).
// La durata è quella del servizio (POC, nodo 3).

import type { Contesto } from '../contesto'
import { prezzoAPartireDa } from '../dati'
import { leggiGiorno, leggiOra, testo } from '../formati'
import { quando } from '../frasi'
import { datiNonValidi, type Risposta } from '../http'
import { cercaPerNome } from '../nomi'
import { maiuscola, prezzoInParole } from '../parole'
import { chiChiama, controllaDataEOrario, riconosciServizio } from './comune'

export async function cercaDisponibilita(corpo: Record<string, unknown>, ctx: Contesto): Promise<Risposta> {
  const giorno = leggiGiorno(corpo.giorno)
  const ora = leggiOra(corpo.ora)
  if (!giorno) return datiNonValidi('Per che giorno vuole l\'appuntamento?')
  if (!ora) return datiNonValidi('A che ora le andrebbe bene?')

  const r = await riconosciServizio(ctx, testo(corpo.servizio))
  if ('risposta' in r) return r.risposta
  const { servizio } = r

  // Il prezzo si dice solo se il cliente lo chiede (nodo 8): sta in un campo a parte.
  const nomeCane = testo(corpo.cane)
  const { cani } = nomeCane ? await chiChiama(ctx) : { cani: [] }
  const cane = nomeCane ? cercaPerNome(cani, nomeCane, (c) => c.nome).trovata : null
  const prezzo = await prezzoAPartireDa(ctx.tenantId, servizio, cane)
  const prezzoDetto = `Di solito ${servizio.name.toLowerCase()} parte da ${prezzoInParole(prezzo)}: il prezzo preciso lo vede il toelettatore quando vede il cane.`

  const controllo = await controllaDataEOrario(ctx, giorno, ora, servizio.duration)
  if (!controllo.ok) return { ...controllo.risposta, servizio: servizio.name, prezzo_detto: prezzoDetto }

  return {
    esito: 'disponibile',
    da_dire: `${maiuscola(quando(giorno, ora, ctx))} c'è posto.`,
    servizio: servizio.name,
    durata_minuti: servizio.duration,
    prezzo_detto: prezzoDetto,
  }
}
