// Pezzi comuni agli strumenti: riconoscere il servizio, controllare data e orario
// con le alternative, trovare cliente e cane di chi chiama.

import { cercaAlternative, controllaData, verificaOrario, type Alternativa } from '../disponibilita'
import { caniDeiClienti, clientiPerTelefono, giornate, sede, servizi, type CaneTrovato, type ClienteTrovato } from '../dati'
import { aggiungiGiorni, minuti } from '../formati'
import { fraseData, fraseOrario } from '../frasi'
import { cercaPerNome } from '../nomi'
import { elenco } from '../parole'
import { REGOLE_VOCE } from '../regole'
import type { Contesto } from '../contesto'
import type { Risposta } from '../http'

export type Servizio = Awaited<ReturnType<typeof servizi>>[number]

/** Il servizio detto dal cliente, o la risposta da dare se non si riconosce. */
export async function riconosciServizio(
  ctx: Contesto,
  detto: string
): Promise<{ servizio: Servizio } | { risposta: Risposta }> {
  const tutti = await servizi(ctx.tenantId)
  if (!detto) {
    return {
      risposta: {
        esito: 'dati_non_validi',
        da_dire: 'Che servizio le serve? Per esempio bagno, bagno e taglio o stripping.',
      },
    }
  }
  const { trovata, simili } = cercaPerNome(tutti, detto, (s) => s.name)
  if (trovata) return { servizio: trovata }
  const nomi = simili.map((s) => s.name.toLowerCase())
  return {
    risposta: {
      esito: 'servizio_sconosciuto',
      da_dire: nomi.length > 0
        ? `Intende ${elenco(nomi)}?`
        : `Non ho trovato quel servizio. Facciamo per esempio ${elenco(tutti.slice(0, 4).map((s) => s.name.toLowerCase()))}: quale le serve?`,
      simili: simili.map((s) => s.name),
    },
  }
}

export type Controllo =
  | { ok: true; postazioni: number }
  | { ok: false; risposta: Risposta }

/**
 * Data e orario vanno bene per un appuntamento di `durata` minuti? Se no, la risposta con
 * fino a tre alternative. `escludi` è l'appuntamento che si sta spostando.
 */
export async function controllaDataEOrario(
  ctx: Contesto,
  giorno: string,
  ora: string,
  durata: number,
  escludi?: string
): Promise<Controllo> {
  const { orari, postazioni } = await sede(ctx.tenantId, ctx.locationId)
  const esitoData = controllaData(giorno, ctx.oggi)
  if (esitoData === 'troppo_in_la') {
    return { ok: false, risposta: { esito: 'data_non_valida', da_dire: fraseData(esitoData, ctx, []), alternative: [] } }
  }

  // Abbastanza giorni per le alternative, a partire dal primo prenotabile.
  const primo = esitoData === 'ok' ? giorno : aggiungiGiorni(ctx.oggi, REGOLE_VOCE.giorniMinimiAnticipo)
  const giornata = await giornate(
    ctx.tenantId, ctx.locationId, orari, primo,
    aggiungiGiorni(primo, REGOLE_VOCE.giorniRicercaAlternative), escludi
  )
  const alternative = (): Alternativa[] =>
    cercaAlternative({ giorno, ora, durata, postazioni, oggi: ctx.oggi, giornata })

  if (esitoData !== 'ok') {
    const alt = alternative()
    return { ok: false, risposta: { esito: 'data_non_valida', da_dire: fraseData(esitoData, ctx, alt), alternative: alt } }
  }
  const esito = verificaOrario(giornata(giorno), minuti(ora), durata, postazioni)
  if (esito === 'disponibile') return { ok: true, postazioni }
  const alt = alternative()
  return {
    ok: false,
    risposta: {
      esito: esito === 'pieno' ? 'pieno' : 'chiuso',
      da_dire: fraseOrario(esito, giorno, ora, ctx, alt),
      alternative: alt,
    },
  }
}

/** Clienti e cani legati al numero di chi chiama (vuoti se il numero è nascosto). */
export async function chiChiama(ctx: Contesto, telefono = ctx.telefonoChiamante): Promise<{
  clienti: ClienteTrovato[]
  cani: CaneTrovato[]
}> {
  if (!telefono) return { clienti: [], cani: [] }
  const clienti = await clientiPerTelefono(ctx.tenantId, telefono)
  const cani = await caniDeiClienti(ctx.tenantId, clienti.map((c) => c.id))
  return { clienti, cani }
}
