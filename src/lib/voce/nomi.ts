// Riconoscere un nome detto a voce fra quelli del gestionale: servizi, cani, razze, clienti.
// Il riconoscimento vocale sbaglia maiuscole, accenti e articoli, e ogni tanto una lettera.

const PAROLE_VUOTE = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una', 'e', 'ed', 'di', 'del', 'della',
  'per', 'con', 'solo', 'soltanto', 'anche', 'po', 'un\'', 'cane', 'cagnolino', 'cagnolina',
])

/** "Bagno e Taglio" -> "bagno e taglio": minuscole, senza accenti né punteggiatura. */
export function normalizza(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Le parole che contano: "solo il bagno" -> ["bagno"]. */
export function paroleChiave(t: string): string[] {
  return normalizza(t).split(' ').filter((p) => p && !PAROLE_VUOTE.has(p))
}

/** Distanza di modifica fra due parole (lettere da cambiare, aggiungere o togliere). */
export function distanza(a: string, b: string): number {
  const riga = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let precedente = riga[0]
    riga[0] = i
    for (let j = 1; j <= b.length; j++) {
      const sopra = riga[j]
      riga[j] = Math.min(riga[j] + 1, riga[j - 1] + 1, precedente + (a[i - 1] === b[j - 1] ? 0 : 1))
      precedente = sopra
    }
  }
  return riga[b.length]
}

function stessaParola(a: string, b: string): boolean {
  if (a === b) return true
  // Una lettera di differenza solo su parole di almeno 5 lettere: "barboncino"/"barboncini" sì,
  // "luna"/"lina" no (sarebbero due cani diversi).
  return Math.min(a.length, b.length) >= 5 && distanza(a, b) <= 1
}

/** Quanto due nomi si somigliano, da 0 a 1, sulle parole che contano. */
export function somiglianza(detto: string, voce: string): number {
  const a = paroleChiave(detto)
  const b = paroleChiave(voce)
  if (a.length === 0 || b.length === 0) return 0
  const comuni = a.filter((p) => b.some((q) => stessaParola(p, q))).length
  return comuni / (a.length + b.length - comuni)
}

export interface Ricerca<T> {
  /** La voce riconosciuta senza dubbi, se c'è. */
  trovata: T | null
  /** Le voci più vicine, dalla più simile, per chiedere al cliente quale intende. */
  simili: T[]
}

/**
 * Cerca `detto` fra le voci. È "trovata" solo se una e una sola voce ha le stesse parole
 * che contano (somiglianza 1). Altrimenti torna fino a `quanti` voci simili.
 */
export function cercaPerNome<T>(voci: T[], detto: string, nomeDi: (v: T) => string, quanti = 3): Ricerca<T> {
  const punteggi = voci
    .map((v) => ({ v, s: somiglianza(detto, nomeDi(v)) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
  const piene = punteggi.filter((x) => x.s === 1)
  if (piene.length === 1) return { trovata: piene[0].v, simili: [] }
  return { trovata: null, simili: punteggi.slice(0, quanti).map((x) => x.v) }
}
