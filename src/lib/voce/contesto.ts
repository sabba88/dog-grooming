// Quello che ogni strumento dell'assistente vocale deve sapere prima di lavorare:
// per quale negozio (tenant e sede), chi chiama, che giorno è a Roma.

import { aRoma, aggiungiGiorni, testo } from './formati'
import { telefonoNazionale } from './telefono'

export interface Contesto {
  tenantId: string
  locationId: string
  sessionId: string
  /**
   * Il numero di chi chiama in forma nazionale ("3331234567"), o "" se è nascosto.
   * Solo questo numero dà accesso agli appuntamenti già presi (spostare, cercare).
   */
  telefonoChiamante: string
  /** true se il numero è quello di prova (VOCE_TELEFONO_PROVA), non quello vero. */
  telefonoDiProva: boolean
  oggi: string
  domani: string
  /** Adesso, a Roma: { giorno, ora }. */
  adesso: { giorno: string; ora: string }
}

export class ConfigurazioneMancante extends Error {}

/**
 * Il numero da salvare su un cliente nuovo o su un messaggio: quello vero di chi chiama,
 * altrimenti quello detto a voce. Mai il numero di prova: serve solo a riconoscere,
 * non deve finire nel database (prova del 13/11/2026: cliente salvato con il numero finto).
 */
export function telefonoDaSalvare(ctx: Contesto, detto: unknown): string {
  return (ctx.telefonoDiProva ? '' : ctx.telefonoChiamante) || telefonoNazionale(detto)
}

/**
 * Il numero di prova vale solo fuori dalla produzione: serve per provare l'assistente dal
 * costruttore di Fish, dove il numero di chi chiama arriva vuoto (POC, nodo 9).
 */
function telefonoDiProva(): string {
  if (process.env.VERCEL_ENV === 'production') return ''
  return telefonoNazionale(process.env.VOCE_TELEFONO_PROVA ?? '')
}

export function creaContesto(corpo: Record<string, unknown>, numeroChiamante: unknown): Contesto {
  const tenantId = process.env.VOCE_TENANT_ID
  const locationId = process.env.VOCE_LOCATION_ID
  if (!tenantId || !locationId) throw new ConfigurazioneMancante('VOCE_TENANT_ID o VOCE_LOCATION_ID mancanti')

  const vero = telefonoNazionale(numeroChiamante)
  const prova = vero ? '' : telefonoDiProva()
  const adesso = aRoma()
  return {
    tenantId,
    locationId,
    sessionId: testo(corpo.session_id),
    telefonoChiamante: vero || prova,
    telefonoDiProva: !vero && prova !== '',
    oggi: adesso.giorno,
    domani: aggiungiGiorni(adesso.giorno, 1),
    adesso,
  }
}
