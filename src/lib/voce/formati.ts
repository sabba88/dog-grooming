// Leggere e controllare i dati che arrivano dall'assistente vocale: date, ore, testi.
// Il fuso del negozio è Europe/Rome; il database usa la convenzione "UTC nudo"
// (le 10:00 di Roma sono salvate come 10:00Z), quindi l'ora di Roma si scrive così com'è.

const FORMATO_ROMA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Giorno ("2026-11-19") e ora ("10:30") di un istante, a Roma. Senza argomento: adesso. */
export function aRoma(istante: Date = new Date()): { giorno: string; ora: string } {
  const parti: Record<string, string> = {}
  for (const p of FORMATO_ROMA.formatToParts(istante)) parti[p.type] = p.value
  return { giorno: `${parti.year}-${parti.month}-${parti.day}`, ora: `${parti.hour}:${parti.minute}` }
}

/** Giorno e ora di Roma come li salva il gestionale ("UTC nudo"). */
export function istanteNudo(giorno: string, ora: string): Date {
  return new Date(`${giorno}T${ora}:00.000Z`)
}

/** Giorno ("AAAA-MM-GG") e ora ("HH:MM") di un istante salvato in "UTC nudo". */
export function daIstanteNudo(istante: Date): { giorno: string; ora: string } {
  const iso = istante.toISOString()
  return { giorno: iso.slice(0, 10), ora: iso.slice(11, 16) }
}

/** Per i parametri delle query SQL grezze: "2026-11-19 10:00:00" (timestamp senza fuso). */
export function timestampSql(giorno: string, ora: string): string {
  return `${giorno} ${ora}:00`
}

/**
 * Testo pulito, o "" se manca. Fish manda i campi facoltativi sempre, come "" quando il
 * cliente non li ha detti; per prudenza anche null e la stringa "null" valgono come vuoto.
 */
export function testo(valore: unknown): string {
  if (valore === null || valore === undefined) return ''
  const t = String(valore).trim()
  return t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined' ? '' : t
}

/** "2026-11-19" valido -> lo stesso; vuoto o sbagliato -> null. Controlla anche che il giorno esista. */
export function leggiGiorno(valore: unknown): string | null {
  const t = testo(valore)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (!m) return null
  const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return data.toISOString().slice(0, 10) === t ? t : null // 2026-02-30 non passa
}

/** "10:30", "9:15" o "10.30" -> "10:30" / "09:15"; altrimenti null. */
export function leggiOra(valore: unknown): string | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(testo(valore))
  if (!m) return null
  const ore = Number(m[1])
  const minuti = Number(m[2])
  if (ore > 23 || minuti > 59) return null
  return `${String(ore).padStart(2, '0')}:${m[2]}`
}

/** true per "sì", "si", "yes", true; tutto il resto è no. */
export function leggiSi(valore: unknown): boolean {
  if (valore === true) return true
  return ['sì', 'si', 'yes', 'true', 'vero'].includes(testo(valore).toLowerCase())
}

/** "2026-11-30" + 1 -> "2026-12-01". */
export function aggiungiGiorni(giorno: string, quanti: number): string {
  const [anno, mese, numero] = giorno.split('-').map(Number)
  return new Date(Date.UTC(anno, mese - 1, numero + quanti)).toISOString().slice(0, 10)
}

/** Giorni da `da` a `a` (positivo se `a` viene dopo). */
export function giorniTra(da: string, a: string): number {
  const [y1, m1, d1] = da.split('-').map(Number)
  const [y2, m2, d2] = a.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

/** "10:30" -> 630 minuti dalla mezzanotte. */
export function minuti(ora: string): number {
  const [h, m] = ora.split(':').map(Number)
  return h * 60 + m
}

/** 630 -> "10:30". */
export function oraDaMinuti(totale: number): string {
  return `${String(Math.floor(totale / 60)).padStart(2, '0')}:${String(totale % 60).padStart(2, '0')}`
}
