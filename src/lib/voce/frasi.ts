// Frasi comuni a più strumenti. Sono sempre frasi da dire al cliente, mai istruzioni
// per l'assistente (lezione della pizzeria: il modello le legge come sono scritte).

import type { Alternativa, EsitoData, EsitoOrario, OrarioSede } from './disponibilita'
import { alleOre, dalleOre, dataInParole, elenco, GIORNI_SETTIMANA, giornoDetto, maiuscola, numeroInParole } from './parole'
import { aggiungiGiorni } from './formati'
import { REGOLE_VOCE } from './regole'

export interface Giorni {
  oggi: string
  domani: string
}

/** "giovedì diciannove novembre alle undici", o "domani alle nove". */
export function quando(giorno: string, ora: string, g: Giorni): string {
  return `${giornoDetto(giorno, g.oggi, g.domani)} ${alleOre(ora)}`
}

/** "Posso proporle domani alle nove, domani alle dieci o venerdì venti novembre alle nove." */
export function proposta(alternative: Alternativa[], g: Giorni): string {
  if (alternative.length === 0) return 'Nei prossimi giorni non trovo posto: posso lasciare un messaggio al negozio, così la richiamano.'
  // Le alternative dello stesso giorno si dicono senza ripetere il giorno.
  const parti = alternative.map((a, i) =>
    i > 0 && alternative[i - 1].giorno === a.giorno ? alleOre(a.ora) : quando(a.giorno, a.ora, g)
  )
  return `Posso proporle ${elenco(parti)}.`
}

/**
 * Gli orari della settimana a parole, con i giorni uguali raggruppati:
 * "dal martedì al venerdì dalle nove alle tredici e dalle quattordici alle diciannove;
 *  sabato dalle nove alle quattordici; chiuso lunedì e domenica".
 */
export function orariInParole(orari: OrarioSede[]): string {
  const perGiorno = GIORNI_SETTIMANA.map((_, dow) =>
    orari
      .filter((o) => o.dayOfWeek === dow)
      .sort((a, b) => a.openTime.localeCompare(b.openTime))
      .map((o) => `${dalleOre(o.openTime)} ${alleOre(o.closeTime)}`)
      .join(' e ')
  )
  const gruppi: { da: number; a: number; fasce: string }[] = []
  perGiorno.forEach((fasce, dow) => {
    const ultimo = gruppi[gruppi.length - 1]
    if (ultimo && ultimo.fasce === fasce && ultimo.a === dow - 1) ultimo.a = dow
    else gruppi.push({ da: dow, a: dow, fasce })
  })
  const aperti = gruppi
    .filter((g) => g.fasce)
    .map((g) => {
      if (g.da === g.a) return `${GIORNI_SETTIMANA[g.da]} ${g.fasce}`
      return `dal ${GIORNI_SETTIMANA[g.da]} al ${GIORNI_SETTIMANA[g.a]} ${g.fasce}`
    })
  const chiusi = perGiorno.map((f, dow) => (f ? '' : GIORNI_SETTIMANA[dow])).filter(Boolean)
  if (aperti.length === 0) return 'orari non disponibili'
  return [...aperti, ...(chiusi.length > 0 ? [`chiuso ${elenco(chiusi, 'e')}`] : [])].join('; ')
}

/** La frase per un giorno che l'assistente non può prenotare. */
export function fraseData(esito: Exclude<EsitoData, 'ok'>, g: Giorni, alternative: Alternativa[]): string {
  if (esito === 'oggi') {
    return `Per oggi non riesco a fissare appuntamenti al telefono. ${proposta(alternative, g)}`
  }
  if (esito === 'passato') return `Quel giorno è già passato. ${proposta(alternative, g)}`
  const ultimo = aggiungiGiorni(g.oggi, REGOLE_VOCE.giorniMassimiAnticipo)
  return `Al telefono posso fissare appuntamenti fino a ${numeroInParole(REGOLE_VOCE.giorniMassimiAnticipo)} giorni da oggi, cioè fino a ${dataInParole(ultimo)}. Che giorno preferisce?`
}

/** La frase per un orario che non va (pieno, chiuso, fuori dalle fasce). */
export function fraseOrario(
  esito: Exclude<EsitoOrario, 'disponibile'>,
  giorno: string,
  ora: string,
  g: Giorni,
  alternative: Alternativa[]
): string {
  const detto = giornoDetto(giorno, g.oggi, g.domani)
  if (esito === 'chiuso') return `${maiuscola(detto)} il negozio è chiuso. ${proposta(alternative, g)}`
  if (esito === 'fuori_orario') {
    return `${maiuscola(detto)} ${alleOre(ora)} non riusciamo: il negozio è chiuso o non finiremmo prima della chiusura. ${proposta(alternative, g)}`
  }
  return `${maiuscola(detto)} ${alleOre(ora)} è tutto occupato. ${proposta(alternative, g)}`
}
