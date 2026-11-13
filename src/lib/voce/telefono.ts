// Confronto fra numeri di telefono.
// Nel gestionale i numeri sono salvati senza spazi e quasi sempre senza prefisso
// ("3331234567", vedi cleanPhone in seed-clients.ts); Fish manda il chiamante in
// formato internazionale ("+393331234567"). Per confrontarli si riducono entrambi
// alla stessa forma: le cifre del numero italiano senza prefisso.

/**
 * Forma "nazionale" di un numero, per confronti e salvataggi:
 * - "+39 333 123 4567", "0039 3331234567", "393331234567" -> "3331234567"
 * - "071 123456" -> "071123456"
 * - un numero estero tiene il suo prefisso: "+41 79 123 45 67" -> "+41791234567"
 * Restituisce "" se ci sono meno di 6 cifre (numero nascosto, "—", testo).
 */
export function telefonoNazionale(valore: unknown): string {
  const t = typeof valore === 'string' ? valore.trim() : ''
  let cifre = t.replace(/\D/g, '')
  let internazionale = t.startsWith('+')
  if (cifre.startsWith('00')) {
    cifre = cifre.slice(2)
    internazionale = true
  }
  if (internazionale) {
    if (cifre.startsWith('39')) cifre = cifre.slice(2)
    else return cifre.length >= 6 ? `+${cifre}` : ''
  } else if (cifre.startsWith('39') && cifre.length >= 11) {
    // "39" + 9-10 cifre: un numero italiano scritto con il prefisso ma senza "+".
    // Un cellulare nazionale ("339…") ha 9-10 cifre in tutto, quindi non viene toccato.
    cifre = cifre.slice(2)
  }
  return cifre.length >= 6 ? cifre : ''
}

/** true se i due numeri sono lo stesso numero (e nessuno dei due è vuoto). */
export function stessoTelefono(a: unknown, b: unknown): boolean {
  const x = telefonoNazionale(a)
  return x !== '' && x === telefonoNazionale(b)
}

/** Le ultime cifre, per cercare i candidati nel database con un ILIKE prima del confronto esatto. */
export function codaTelefono(valore: unknown, quante = 6): string {
  return telefonoNazionale(valore).replace(/\D/g, '').slice(-quante)
}
