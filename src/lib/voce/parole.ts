// Numeri, prezzi, orari e date scritti a parole in italiano.
// Le risposte all'assistente vocale hanno un campo `da_dire` pronto da leggere ad alta voce:
// "trentacinque euro", "alle dieci e trenta", "giovedì diciannove novembre".
// Copiato dall'assistente della pizzeria (stesso contratto), senza le parti che qui non servono.

const FINO_A_DICIANNOVE = [
  'zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove',
  'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici',
  'diciassette', 'diciotto', 'diciannove',
]
const DECINE = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta']

function sottoCento(n: number): string {
  if (n < 20) return FINO_A_DICIANNOVE[n]
  const decina = DECINE[Math.floor(n / 10)]
  const unita = n % 10
  if (unita === 0) return decina
  // "venti" + "uno" = "ventuno", "trenta" + "otto" = "trentotto": la vocale finale cade.
  const base = unita === 1 || unita === 8 ? decina.slice(0, -1) : decina
  // "ventitré": tre in fondo prende l'accento.
  return base + (unita === 3 ? 'tré' : FINO_A_DICIANNOVE[unita])
}

function sottoMille(n: number): string {
  if (n < 100) return sottoCento(n)
  const centinaia = Math.floor(n / 100)
  const resto = n % 100
  const prefisso = centinaia === 1 ? 'cento' : FINO_A_DICIANNOVE[centinaia] + 'cento'
  if (resto === 0) return prefisso
  const coda = sottoCento(resto)
  // "cento" + "ottanta" = "centottanta": anche qui la vocale doppia cade.
  return coda.startsWith('o') ? prefisso.slice(0, -1) + coda : prefisso + coda
}

/** 0 -> "zero", 21 -> "ventuno", 1250 -> "milleduecentocinquanta". Interi da 0 a 999.999. */
export function numeroInParole(n: number): string {
  n = Math.trunc(Math.abs(n))
  if (n < 1000) return sottoMille(n)
  const migliaia = Math.floor(n / 1000)
  const resto = n % 1000
  const prefisso = migliaia === 1 ? 'mille' : sottoMille(migliaia) + 'mila'
  return resto === 0 ? prefisso : prefisso + sottoMille(resto)
}

/** 3550 -> "trentacinque euro e cinquanta", 100 -> "un euro", 50 -> "cinquanta centesimi". */
export function prezzoInParole(centesimi: number): string {
  const euro = Math.floor(centesimi / 100)
  const cent = centesimi % 100
  if (euro === 0) return cent === 0 ? 'zero euro' : `${numeroInParole(cent)} centesimi`
  const parteEuro = euro === 1 ? 'un euro' : `${numeroInParole(euro)} euro`
  return cent === 0 ? parteEuro : `${parteEuro} e ${numeroInParole(cent)}`
}

/** "10:30" -> "dieci e trenta", "13:00" -> "tredici", "01:15" -> "l'una e quindici". */
export function orarioInParole(ora: string): string {
  const [h, m] = ora.split(':').map(Number)
  const ore = h === 0 ? 'mezzanotte' : h === 1 ? "l'una" : numeroInParole(h)
  return m === 0 ? ore : `${ore} e ${numeroInParole(m)}`
}

/** "10:30" -> "alle dieci e trenta", "01:00" -> "all'una". */
export function alleOre(ora: string): string {
  const parole = orarioInParole(ora)
  if (parole.startsWith("l'")) return 'al' + parole
  if (parole.startsWith('mezzanotte')) return 'a ' + parole
  return 'alle ' + parole
}

/** "09:00" -> "dalle nove", "01:00" -> "dall'una". */
export function dalleOre(ora: string): string {
  const parole = orarioInParole(ora)
  if (parole.startsWith("l'")) return 'dal' + parole
  if (parole.startsWith('mezzanotte')) return 'da ' + parole
  return 'dalle ' + parole
}

/** 0 = lunedì … 6 = domenica, come `location_business_hours.day_of_week`. */
export const GIORNI_SETTIMANA = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']

const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

/** Giorno della settimana di una data "AAAA-MM-GG": 0 = lunedì … 6 = domenica. */
export function giornoSettimana(giorno: string): number {
  const [anno, mese, numero] = giorno.split('-').map(Number)
  // Una data senza ora: si calcola in UTC, così il fuso del server non sposta il giorno.
  return (new Date(Date.UTC(anno, mese - 1, numero)).getUTCDay() + 6) % 7
}

/** "2026-11-19" -> "giovedì diciannove novembre"; il primo del mese è "primo". */
export function dataInParole(giorno: string): string {
  const [, mese, numero] = giorno.split('-').map(Number)
  const numeroDetto = numero === 1 ? 'primo' : numeroInParole(numero)
  return `${GIORNI_SETTIMANA[giornoSettimana(giorno)]} ${numeroDetto} ${MESI[mese - 1]}`
}

/** Come dataInParole, ma "oggi" e "domani" quando lo sono (oggi = data di Roma). */
export function giornoDetto(giorno: string, oggi: string, domani: string): string {
  if (giorno === oggi) return 'oggi'
  if (giorno === domani) return 'domani'
  return dataInParole(giorno)
}

/** ["a", "b", "c"] -> "a, b o c" (o "a, b e c" con congiunzione "e"). */
export function elenco(voci: string[], congiunzione = 'o'): string {
  if (voci.length <= 1) return voci.join('')
  return `${voci.slice(0, -1).join(', ')} ${congiunzione} ${voci[voci.length - 1]}`
}

/** Prima lettera maiuscola, per le frasi che iniziano con un giorno ("Giovedì …"). */
export function maiuscola(frase: string): string {
  return frase.charAt(0).toUpperCase() + frase.slice(1)
}
