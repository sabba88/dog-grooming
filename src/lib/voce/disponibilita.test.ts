import { describe, expect, it } from 'vitest'
import { cercaAlternative, controllaData, fasceDelGiorno, occupazioneMassima, orariLiberi, verificaOrario, type Giornata } from './disponibilita'

const h = (ora: string) => {
  const [a, b] = ora.split(':').map(Number)
  return a * 60 + b
}
const iv = (da: string, a: string) => ({ inizio: h(da), fine: h(a) })

// Giornata tipo di dev: 9-13 e 14-19, tre postazioni.
const fasce = [iv('09:00', '13:00'), iv('14:00', '19:00')]

describe('occupazioneMassima', () => {
  it('conta solo gli appuntamenti contemporanei, non tutti quelli che toccano l\'intervallo', () => {
    // 9-10 e 10-11 toccano 9-11 ma non sono mai insieme: il massimo è 1.
    expect(occupazioneMassima([iv('09:00', '10:00'), iv('10:00', '11:00')], h('09:00'), h('11:00'))).toBe(1)
  })
  it('vede la sovrapposizione che comincia a metà', () => {
    const app = [iv('09:00', '11:00'), iv('10:00', '11:00'), iv('10:30', '12:00')]
    expect(occupazioneMassima(app, h('09:00'), h('10:00'))).toBe(1)
    expect(occupazioneMassima(app, h('09:00'), h('11:00'))).toBe(3)
  })
  it('un appuntamento che finisce quando inizia il nuovo non conta', () => {
    expect(occupazioneMassima([iv('09:00', '10:00')], h('10:00'), h('11:00'))).toBe(0)
  })
})

describe('verificaOrario', () => {
  const vuota: Giornata = { fasce, appuntamenti: [] }
  it('libero dentro una fascia', () => {
    expect(verificaOrario(vuota, h('10:00'), 60, 3)).toBe('disponibile')
  })
  it('giorno senza fasce: chiuso', () => {
    expect(verificaOrario({ fasce: [], appuntamenti: [] }, h('10:00'), 60, 3)).toBe('chiuso')
  })
  it('l\'appuntamento deve finire prima della pausa pranzo', () => {
    expect(verificaOrario(vuota, h('12:30'), 60, 3)).toBe('fuori_orario')
    expect(verificaOrario(vuota, h('12:00'), 60, 3)).toBe('disponibile')
  })
  it('pieno quando le postazioni sono tutte occupate', () => {
    const piena: Giornata = { fasce, appuntamenti: [iv('10:00', '11:00'), iv('10:00', '11:00'), iv('10:30', '11:30')] }
    expect(verificaOrario(piena, h('10:30'), 60, 3)).toBe('pieno')
    expect(verificaOrario(piena, h('09:00'), 60, 3)).toBe('disponibile')
  })
  it('senza postazioni non c\'è mai posto', () => {
    expect(verificaOrario(vuota, h('10:00'), 60, 0)).toBe('pieno')
  })
})

describe('controllaData', () => {
  it('oggi no, domani sì, fino a 60 giorni', () => {
    expect(controllaData('2026-11-12', '2026-11-12')).toBe('oggi')
    expect(controllaData('2026-11-11', '2026-11-12')).toBe('passato')
    expect(controllaData('2026-11-13', '2026-11-12')).toBe('ok')
    expect(controllaData('2027-01-11', '2026-11-12')).toBe('ok')
    expect(controllaData('2027-01-12', '2026-11-12')).toBe('troppo_in_la')
  })
})

describe('fasceDelGiorno', () => {
  it('usa 0 = lunedì come la tabella degli orari', () => {
    const orari = [
      { dayOfWeek: 3, openTime: '14:00', closeTime: '19:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '13:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '14:00' },
    ]
    // 19 novembre 2026 è un giovedì (3).
    expect(fasceDelGiorno(orari, '2026-11-19')).toEqual(fasce)
    expect(fasceDelGiorno(orari, '2026-11-22')).toEqual([]) // domenica
  })
})

describe('orariLiberi e cercaAlternative', () => {
  it('gli orari liberi rispettano durata e fasce', () => {
    const g: Giornata = { fasce: [iv('09:00', '11:00')], appuntamenti: [] }
    expect(orariLiberi(g, 60, 1, 30)).toEqual([h('09:00'), h('09:30'), h('10:00')])
  })
  it('prima lo stesso giorno, dal più vicino all\'ora chiesta (a pari distanza il più presto)', () => {
    const giornata = (): Giornata => ({ fasce, appuntamenti: [iv('10:00', '11:00')] })
    const alt = cercaAlternative({ giorno: '2026-11-19', ora: '10:00', durata: 60, postazioni: 1, oggi: '2026-11-12', giornata })
    expect(alt).toEqual([
      { giorno: '2026-11-19', ora: '09:00' },
      { giorno: '2026-11-19', ora: '11:00' },
      { giorno: '2026-11-19', ora: '11:30' },
    ])
  })
  it('se il giorno è pieno passa ai giorni dopo, uno per giorno', () => {
    const giornata = (giorno: string): Giornata =>
      giorno === '2026-11-19' ? { fasce, appuntamenti: [iv('09:00', '19:00')] } : { fasce, appuntamenti: [] }
    const alt = cercaAlternative({ giorno: '2026-11-19', ora: '10:00', durata: 60, postazioni: 1, oggi: '2026-11-12', giornata })
    expect(alt).toEqual([
      { giorno: '2026-11-20', ora: '10:00' },
      { giorno: '2026-11-21', ora: '10:00' },
      { giorno: '2026-11-22', ora: '10:00' },
    ])
  })
  it('per oggi propone a partire da domani', () => {
    const giornata = (): Giornata => ({ fasce, appuntamenti: [] })
    const alt = cercaAlternative({ giorno: '2026-11-12', ora: '10:00', durata: 60, postazioni: 1, oggi: '2026-11-12', giornata })
    expect(alt[0]).toEqual({ giorno: '2026-11-13', ora: '10:00' })
    expect(alt.every((a) => a.giorno !== '2026-11-12')).toBe(true)
  })
})
