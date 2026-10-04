export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export interface CoOwner {
  /** Numero del proprietario in anagrafica (2 o 3), indipendente dai buchi. */
  slot: 2 | 3
  name: string
  phone: string
}

interface CoOwnerSource {
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
}

// Proprietari 2 e 3 di un cliente, solo quelli valorizzati (nome oppure telefono).
export function getCoOwners(c: CoOwnerSource): CoOwner[] {
  const slots: [2 | 3, string | null, string | null][] = [
    [2, c.owner2, c.phone2],
    [3, c.owner3, c.phone3],
  ]
  return slots
    .map(([slot, name, phone]) => ({ slot, name: name?.trim() ?? '', phone: phone?.trim() ?? '' }))
    .filter((o) => o.name !== '' || o.phone !== '')
}

// "Anna Rossi, Luca Rossi" - solo i nomi, per gli spazi stretti (blocco agenda).
export function formatCoOwnerNames(coOwners: CoOwner[]): string {
  return coOwners.map((o) => o.name || o.phone).join(', ')
}

// "Anna Rossi · 340 9988776, Luca Rossi · 345 1122334", per tooltip e righe estese.
// I campi vuoti vengono omessi invece di rendere un trattino nel mezzo della stringa.
export function formatCoOwnerFull(coOwners: CoOwner[]): string {
  return coOwners
    .map((o) => [o.name, o.phone].filter(Boolean).join(' · '))
    .join(', ')
}

// Nominativo e telefono sono facoltativi in creazione (vedi MissingContactDialog):
// dove mancano vanno segnalati invece di lasciare la cella vuota.
export function isMissingValue(value: string | null | undefined): boolean {
  return !value || value.trim() === ''
}
