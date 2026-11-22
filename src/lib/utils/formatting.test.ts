import { describe, expect, it } from 'vitest'
import { matchesWordPrefix } from './formatting'

describe('matchesWordPrefix', () => {
  it('trova per inizio di parola, non per contenuto', () => {
    expect(matchesWordPrefix('Mario Rossi', 'rossi')).toBe(true)
    expect(matchesWordPrefix('Lola', 'ola')).toBe(false)
  })

  it('nome e cognome insieme: ogni parola trova la sua', () => {
    expect(matchesWordPrefix('SAMUELE SABBATINI', 'samuele sab')).toBe(true)
    expect(matchesWordPrefix('SAMUELE SABBATINI', 'sabbatini samuele')).toBe(true)
  })

  it('le parole possono stare in qualunque ordine nel valore', () => {
    expect(matchesWordPrefix('SABBATINI SAMUELE', 'samuele sab')).toBe(true)
  })

  it('se una parola non trova nulla, non e\' un risultato', () => {
    expect(matchesWordPrefix('SAMUELE SABBATINI', 'samuele bianchi')).toBe(false)
    expect(matchesWordPrefix('SAMUELE', 'samuele sab')).toBe(false)
  })

  it('spazi di troppo e punteggiatura non contano', () => {
    expect(matchesWordPrefix('SAMUELE SABBATINI', '  samuele   sab ')).toBe(true)
    expect(matchesWordPrefix("D'ANGELO MARIA", 'angelo maria')).toBe(true)
  })

  it('ricerca vuota: passano tutti', () => {
    expect(matchesWordPrefix('Mario Rossi', '')).toBe(true)
    expect(matchesWordPrefix('Mario Rossi', '   ')).toBe(true)
    expect(matchesWordPrefix(null, '')).toBe(true)
  })

  it('valore assente con una ricerca in corso: nessun risultato', () => {
    expect(matchesWordPrefix(null, 'rossi')).toBe(false)
    expect(matchesWordPrefix('', 'rossi')).toBe(false)
  })

  it('vale anche sulla lista dei cani di un cliente', () => {
    expect(matchesWordPrefix('MOLLY, RUDY', 'rud')).toBe(true)
    expect(matchesWordPrefix('MOLLY, RUDY', 'dy')).toBe(false)
  })
})
