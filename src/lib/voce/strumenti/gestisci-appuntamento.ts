// gestisci-appuntamento: cercare o spostare gli appuntamenti futuri di chi chiama.
// Corpo: azione ("cerca" | "sposta"), cane, giorno (per scegliere quale), nuovo_giorno, nuova_ora.
//
// Solo con il numero di chi chiama (mai con un numero detto a voce): così nessuno sposta
// l'appuntamento di un altro. Annullare non si fa: diventa un messaggio (POC, nodo 7).
// Spostare vale anche per gli appuntamenti già pianificati, che tornano "da pianificare".

import type { Contesto } from '../contesto'
import { appuntamentiFuturi, spostaSeCePosto, type AppuntamentoFuturo } from '../dati'
import { leggiGiorno, leggiOra, testo } from '../formati'
import { quando } from '../frasi'
import { datiNonValidi, type Risposta } from '../http'
import { cercaPerNome } from '../nomi'
import { elenco } from '../parole'
import { chiChiama, controllaDataEOrario } from './comune'

function descrivi(a: AppuntamentoFuturo, ctx: Contesto): string {
  const cosa = a.servizio ? `${a.servizio.toLowerCase()} per ${a.cane}` : `appuntamento per ${a.cane}`
  return `${cosa} ${quando(a.giorno, a.ora, ctx)}`
}

function perIlCliente(a: AppuntamentoFuturo) {
  return { cane: a.cane, servizio: a.servizio, giorno: a.giorno, ora: a.ora }
}

export async function gestisciAppuntamento(corpo: Record<string, unknown>, ctx: Contesto): Promise<Risposta> {
  const azione = testo(corpo.azione).toLowerCase()
  if (azione !== 'cerca' && azione !== 'sposta') return datiNonValidi('Vuole sapere quando ha l\'appuntamento o spostarlo?')

  if (!ctx.telefonoChiamante) {
    return {
      esito: 'numero_nascosto',
      da_dire: 'Il suo numero non mi arriva, quindi non posso vedere i suoi appuntamenti. Posso lasciare un messaggio al negozio, così la richiamano.',
    }
  }

  const { clienti } = await chiChiama(ctx)
  const tutti = await appuntamentiFuturi(ctx.tenantId, ctx.locationId, clienti.map((c) => c.id), ctx.adesso)
  if (tutti.length === 0) {
    return { esito: 'nessuno', da_dire: 'Con questo numero non trovo appuntamenti in programma.' }
  }

  // Quale appuntamento: si restringe per cane e per giorno, se il cliente li ha detti.
  let scelti = tutti
  const cane = testo(corpo.cane)
  if (cane) {
    const nomi = [...new Set(tutti.map((a) => a.cane))]
    const trovato = cercaPerNome(nomi, cane, (n) => n).trovata
    if (trovato) scelti = scelti.filter((a) => a.cane === trovato)
  }
  const giorno = leggiGiorno(corpo.giorno)
  if (giorno) {
    const stessoGiorno = scelti.filter((a) => a.giorno === giorno)
    if (stessoGiorno.length > 0) scelti = stessoGiorno
  }

  if (azione === 'cerca') {
    return {
      esito: 'trovati',
      da_dire: `Ho trovato ${elenco(scelti.map((a) => descrivi(a, ctx)), 'e')}.`,
      appuntamenti: scelti.map(perIlCliente),
    }
  }

  if (scelti.length > 1) {
    return {
      esito: 'scegli',
      da_dire: `Ho ${elenco(scelti.map((a) => descrivi(a, ctx)), 'e')}: quale vuole spostare?`,
      appuntamenti: scelti.map(perIlCliente),
    }
  }
  const appuntamento = scelti[0]

  const nuovoGiorno = leggiGiorno(corpo.nuovo_giorno)
  const nuovaOra = leggiOra(corpo.nuova_ora)
  if (!nuovoGiorno) return datiNonValidi(`A che giorno vuole spostare ${descrivi(appuntamento, ctx)}?`)
  if (!nuovaOra) return datiNonValidi('A che ora le andrebbe bene?')

  const controllo = await controllaDataEOrario(ctx, nuovoGiorno, nuovaOra, appuntamento.durata, appuntamento.id)
  if (!controllo.ok) return controllo.risposta

  const spostato = await spostaSeCePosto({
    tenantId: ctx.tenantId,
    locationId: ctx.locationId,
    postazioni: controllo.postazioni,
    id: appuntamento.id,
    giorno: nuovoGiorno,
    ora: nuovaOra,
    durata: appuntamento.durata,
  })
  if (!spostato) {
    const ancora = await controllaDataEOrario(ctx, nuovoGiorno, nuovaOra, appuntamento.durata, appuntamento.id)
    return ancora.ok
      ? { esito: 'pieno', da_dire: 'Proprio ora quell\'orario si è riempito. Vuole che le proponga un altro orario?', alternative: [] }
      : ancora.risposta
  }
  const cosa = appuntamento.servizio ? `${appuntamento.servizio.toLowerCase()} per ${appuntamento.cane}` : `appuntamento per ${appuntamento.cane}`
  return {
    esito: 'spostato',
    da_dire: `Fatto: ${cosa} è spostato a ${quando(nuovoGiorno, nuovaOra, ctx)}.`,
    era_pianificato: appuntamento.pianificato,
  }
}
