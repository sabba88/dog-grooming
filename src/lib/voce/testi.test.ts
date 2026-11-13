// Test di telefono, nomi, parole e orari della sede: tutto quello che l'assistente
// vocale confronta o dice ad alta voce.
import { describe, expect, it } from 'vitest'
import { telefonoNazionale, stessoTelefono } from './telefono'
import { cercaPerNome } from './nomi'
import { alleOre, dataInParole, prezzoInParole } from './parole'
import { orariInParole, proposta } from './frasi'

describe('telefono', () => {
  it('riduce i numeri italiani alla forma del gestionale', () => {
    expect(telefonoNazionale('+393331234567')).toBe('3331234567')
    expect(telefonoNazionale('0039 333 123 4567')).toBe('3331234567')
    expect(telefonoNazionale('393331234567')).toBe('3331234567')
    expect(telefonoNazionale('333 123 4567')).toBe('3331234567')
    expect(telefonoNazionale('071 123456')).toBe('071123456')
  })
  it('non tocca un cellulare che inizia con 39', () => {
    expect(telefonoNazionale('3391234567')).toBe('3391234567')
  })
  it('tiene il prefisso dei numeri esteri', () => {
    expect(telefonoNazionale('+41 79 123 45 67')).toBe('+41791234567')
  })
  it('vuoto per numeri nascosti o segnaposto', () => {
    expect(telefonoNazionale('')).toBe('')
    expect(telefonoNazionale('—')).toBe('')
    expect(stessoTelefono('', '')).toBe(false)
  })
  it('riconosce lo stesso numero scritto in modi diversi', () => {
    expect(stessoTelefono('+393331234567', '333 1234567')).toBe(true)
    expect(stessoTelefono('+393331234567', '3331234568')).toBe(false)
  })
})

describe('cercaPerNome', () => {
  const servizi = ['Bagno', 'Bagno SPA', 'Bagno e Taglio', 'Bagno e Taglio e Snodatura', 'Taglio', 'Taglio unghie']
  const cerca = (detto: string) => cercaPerNome(servizi, detto, (s) => s)
  it('trova il servizio senza badare ad articoli e maiuscole', () => {
    expect(cerca('solo il bagno').trovata).toBe('Bagno')
    expect(cerca('bagno e taglio').trovata).toBe('Bagno e Taglio')
    expect(cerca('TAGLIO').trovata).toBe('Taglio')
  })
  it('se non è sicuro propone i simili', () => {
    const r = cerca('unghie')
    expect(r.trovata).toBeNull()
    expect(r.simili[0]).toBe('Taglio unghie')
  })
  it('tollera una lettera sbagliata solo nei nomi lunghi', () => {
    expect(cercaPerNome(['Barboncino'], 'barboncini', (s) => s).trovata).toBe('Barboncino')
    expect(cercaPerNome(['Luna'], 'Lina', (s) => s).trovata).toBeNull()
  })
})

describe('parole', () => {
  it('prezzi, ore e date come si dicono', () => {
    expect(prezzoInParole(3550)).toBe('trentacinque euro e cinquanta')
    expect(alleOre('10:30')).toBe('alle dieci e trenta')
    expect(alleOre('13:00')).toBe('alle tredici')
    expect(dataInParole('2026-11-19')).toBe('giovedì diciannove novembre')
    expect(dataInParole('2026-12-01')).toBe('martedì primo dicembre')
  })
  it('le alternative dello stesso giorno non ripetono il giorno', () => {
    const g = { oggi: '2026-11-12', domani: '2026-11-13' }
    expect(proposta([{ giorno: '2026-11-13', ora: '09:00' }, { giorno: '2026-11-13', ora: '10:00' }, { giorno: '2026-11-19', ora: '09:00' }], g))
      .toBe('Posso proporle domani alle nove, alle dieci o giovedì diciannove novembre alle nove.')
  })
})

describe('orariInParole', () => {
  it('raggruppa i giorni uguali e dice quando è chiuso', () => {
    const orari = [1, 2, 3, 4].flatMap((d) => [
      { dayOfWeek: d, openTime: '09:00', closeTime: '13:00' },
      { dayOfWeek: d, openTime: '14:00', closeTime: '19:00' },
    ])
    orari.push({ dayOfWeek: 5, openTime: '09:00', closeTime: '14:00' })
    expect(orariInParole(orari)).toBe(
      'dal martedì al venerdì dalle nove alle tredici e dalle quattordici alle diciannove; ' +
      'sabato dalle nove alle quattordici; chiuso lunedì e domenica'
    )
  })
})
