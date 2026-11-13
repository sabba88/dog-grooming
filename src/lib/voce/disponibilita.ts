// Quando c'è posto, per l'assistente vocale. Funzioni pure: niente database, così si
// provano con i test e la stessa regola potrà servire anche alla griglia a video.
//
// La regola è quella che la griglia settimanale mostra già a colori (BookingWeekGrid):
// - l'appuntamento intero (inizio + durata) sta dentro una fascia di apertura del giorno;
// - in nessun momento dell'appuntamento gli appuntamenti sovrapposti arrivano al numero
//   di postazioni della sede.
// In più, solo per l'assistente: si prenota dal giorno dopo e fino a N giorni (regole.ts).

import { aggiungiGiorni, giorniTra, minuti, oraDaMinuti } from './formati'
import { giornoSettimana } from './parole'
import { REGOLE_VOCE } from './regole'

/** Un intervallo in minuti dalla mezzanotte: 9:00-13:00 = { inizio: 540, fine: 780 }. */
export interface Intervallo {
  inizio: number
  fine: number
}

/** Una giornata della sede: quando è aperta e quali appuntamenti ha già. */
export interface Giornata {
  fasce: Intervallo[]
  appuntamenti: Intervallo[]
}

export interface OrarioSede {
  dayOfWeek: number // 0 = lunedì, come location_business_hours
  openTime: string
  closeTime: string
}

export type EsitoOrario = 'disponibile' | 'pieno' | 'chiuso' | 'fuori_orario'
export type EsitoData = 'ok' | 'passato' | 'oggi' | 'troppo_in_la'

/**
 * Il cane ha già un appuntamento quel giorno? Al telefono capita che un cliente non si ricordi
 * di aver già prenotato: due toelettature lo stesso giorno per lo stesso cane sono quasi sempre
 * un errore, quindi l'assistente non salva la seconda (prova del 13/11/2026: doppione salvato).
 */
export function appuntamentoStessoGiorno<T extends { dogId: string; giorno: string }>(
  esistenti: T[],
  dogId: string,
  giorno: string
): T | undefined {
  return esistenti.find((a) => a.dogId === dogId && a.giorno === giorno)
}

/** Le fasce di apertura di un giorno, dalla tabella degli orari della sede. */
export function fasceDelGiorno(orari: OrarioSede[], giorno: string): Intervallo[] {
  const dow = giornoSettimana(giorno)
  return orari
    .filter((o) => o.dayOfWeek === dow)
    .map((o) => ({ inizio: minuti(o.openTime), fine: minuti(o.closeTime) }))
    .sort((a, b) => a.inizio - b.inizio)
}

/** Il numero più alto di appuntamenti contemporanei fra `inizio` e `fine`. */
export function occupazioneMassima(appuntamenti: Intervallo[], inizio: number, fine: number): number {
  const sovrapposti = appuntamenti.filter((a) => a.inizio < fine && a.fine > inizio)
  // L'occupazione cambia solo quando inizia un appuntamento: basta guardare quei momenti.
  const momenti = [inizio, ...sovrapposti.map((a) => a.inizio).filter((m) => m > inizio && m < fine)]
  let massimo = 0
  for (const m of momenti) {
    const presenti = sovrapposti.filter((a) => a.inizio <= m && a.fine > m).length
    if (presenti > massimo) massimo = presenti
  }
  return massimo
}

/** C'è posto per un appuntamento di `durata` minuti che inizia a `inizio`? */
export function verificaOrario(g: Giornata, inizio: number, durata: number, postazioni: number): EsitoOrario {
  if (g.fasce.length === 0) return 'chiuso'
  const fine = inizio + durata
  if (!g.fasce.some((f) => inizio >= f.inizio && fine <= f.fine)) return 'fuori_orario'
  return occupazioneMassima(g.appuntamenti, inizio, fine) < postazioni ? 'disponibile' : 'pieno'
}

/** Il giorno è prenotabile dall'assistente? `oggi` è la data di Roma. */
export function controllaData(giorno: string, oggi: string, regole = REGOLE_VOCE): EsitoData {
  const distanza = giorniTra(oggi, giorno)
  if (distanza < 0) return 'passato'
  if (distanza < regole.giorniMinimiAnticipo) return 'oggi'
  if (distanza > regole.giorniMassimiAnticipo) return 'troppo_in_la'
  return 'ok'
}

/** Gli inizi liberi di una giornata, ogni `passo` minuti, per un appuntamento di `durata`. */
export function orariLiberi(g: Giornata, durata: number, postazioni: number, passo: number): number[] {
  const liberi: number[] = []
  for (const f of g.fasce) {
    const primo = Math.ceil(f.inizio / passo) * passo
    for (let t = primo; t + durata <= f.fine; t += passo) {
      if (verificaOrario(g, t, durata, postazioni) === 'disponibile') liberi.push(t)
    }
  }
  return liberi
}

export interface Alternativa {
  giorno: string
  ora: string
}

/**
 * Fino a `alternativeMassime` orari liberi da proporre al posto di quello chiesto:
 * prima lo stesso giorno, dal più vicino all'ora chiesta; poi i giorni seguenti, uno per
 * giorno, il più vicino all'ora chiesta. Solo giorni prenotabili (controllaData).
 */
export function cercaAlternative(opzioni: {
  giorno: string
  ora: string
  durata: number
  postazioni: number
  oggi: string
  giornata: (giorno: string) => Giornata
  regole?: typeof REGOLE_VOCE
}): Alternativa[] {
  const regole = opzioni.regole ?? REGOLE_VOCE
  const { durata, postazioni, oggi } = opzioni
  const chiesta = minuti(opzioni.ora)
  const vicinoAllOra = (a: number, b: number) => Math.abs(a - chiesta) - Math.abs(b - chiesta) || a - b

  // Se il giorno chiesto non è prenotabile (oggi, passato) si parte dal primo che lo è.
  const primoBuono = aggiungiGiorni(oggi, regole.giorniMinimiAnticipo)
  const partenza = giorniTra(primoBuono, opzioni.giorno) >= 0 ? opzioni.giorno : primoBuono

  const trovate: Alternativa[] = []
  for (let i = 0; i <= regole.giorniRicercaAlternative && trovate.length < regole.alternativeMassime; i++) {
    const giorno = aggiungiGiorni(partenza, i)
    if (controllaData(giorno, oggi, regole) !== 'ok') continue
    const liberi = orariLiberi(opzioni.giornata(giorno), durata, postazioni, regole.passoAlternativeMinuti)
      .filter((t) => !(giorno === opzioni.giorno && t === chiesta))
      .sort(vicinoAllOra)
    const quanti = giorno === opzioni.giorno ? regole.alternativeMassime : 1
    for (const t of liberi.slice(0, quanti)) {
      if (trovate.length < regole.alternativeMassime) trovate.push({ giorno, ora: oraDaMinuti(t) })
    }
  }
  return trovate
}
