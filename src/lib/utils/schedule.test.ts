import { describe, expect, it } from 'vitest'
import { effectiveStaffShifts, weekSlotState, weekdayIndex } from './schedule'

describe('weekSlotState', () => {
  it('fuori orario la cella e\' chiusa, anche con prenotazioni dentro', () => {
    expect(weekSlotState({ isOpen: false, occupied: 2, stationCount: 3, staffCount: 2 })).toBe('chiuso')
  })

  it('senza postazioni configurate non si puo\' dire quando e\' pieno', () => {
    expect(weekSlotState({ isOpen: true, occupied: 5, stationCount: 0, staffCount: 1 })).toBe('capacita_ignota')
  })

  it('postazioni sature: pieno', () => {
    expect(weekSlotState({ isOpen: true, occupied: 3, stationCount: 3, staffCount: 2 })).toBe('pieno')
  })

  it('3 postazioni, 2 collaboratori, 2 prenotazioni: spazio libero ma nessuno che lavori', () => {
    expect(weekSlotState({ isOpen: true, occupied: 2, stationCount: 3, staffCount: 2 })).toBe('senza_collaboratori')
  })

  it('nessun collaboratore in turno: il quarto d\'ora non e\' prenotabile', () => {
    expect(weekSlotState({ isOpen: true, occupied: 0, stationCount: 3, staffCount: 0 })).toBe('senza_collaboratori')
  })

  it('con un collaboratore libero resta verde', () => {
    expect(weekSlotState({ isOpen: true, occupied: 1, stationCount: 3, staffCount: 2 })).toBe('libero')
  })

  it('le postazioni vincono sui collaboratori: pieno prima di senza_collaboratori', () => {
    expect(weekSlotState({ isOpen: true, occupied: 3, stationCount: 3, staffCount: 0 })).toBe('pieno')
  })

  it('turni non pianificati (staffCount null): il vincolo non si applica', () => {
    expect(weekSlotState({ isOpen: true, occupied: 2, stationCount: 3, staffCount: null })).toBe('libero')
  })
})

describe('effectiveStaffShifts', () => {
  // Ven 20/11/2026 e' un venerdi': indice 4 con lunedi' = 0.
  const settimana = [
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19',
    '2026-11-20', '2026-11-21', '2026-11-22',
  ]
  const sede = 'sede-1'
  const altra = 'sede-2'

  it('senza turni inseriti a mano vale il ricorrente', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: settimana,
      userIds: ['u1'],
      assignments: [],
      recurring: [{ userId: 'u1', dayOfWeek: 4, locationId: sede, startTime: '09:00', endTime: '13:00' }],
    })
    expect(turni).toEqual([{ userId: 'u1', date: '2026-11-20', startTime: '09:00', endTime: '13:00' }])
  })

  it('il turno inserito a mano sostituisce il ricorrente di quel giorno', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: ['2026-11-20'],
      userIds: ['u1'],
      assignments: [{ userId: 'u1', date: '2026-11-20', locationId: sede, startTime: '09:00', endTime: '10:00' }],
      recurring: [{ userId: 'u1', dayOfWeek: 4, locationId: sede, startTime: '09:00', endTime: '13:00' }],
    })
    expect(turni).toEqual([{ userId: 'u1', date: '2026-11-20', startTime: '09:00', endTime: '10:00' }])
  })

  it('chi quel giorno sta in un altra sede non conta qui', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: ['2026-11-20'],
      userIds: ['u1'],
      assignments: [{ userId: 'u1', date: '2026-11-20', locationId: altra, startTime: '09:00', endTime: '13:00' }],
      recurring: [{ userId: 'u1', dayOfWeek: 4, locationId: sede, startTime: '09:00', endTime: '13:00' }],
    })
    expect(turni).toEqual([])
  })

  it('il ricorrente di un altra sede non conta', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: ['2026-11-20'],
      userIds: ['u1'],
      assignments: [],
      recurring: [{ userId: 'u1', dayOfWeek: 4, locationId: altra, startTime: '09:00', endTime: '13:00' }],
    })
    expect(turni).toEqual([])
  })

  it('i turni di un collaboratore disattivato non entrano nel conto', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: ['2026-11-20'],
      userIds: [],
      assignments: [{ userId: 'u1', date: '2026-11-20', locationId: sede, startTime: '09:00', endTime: '13:00' }],
      recurring: [],
    })
    expect(turni).toEqual([])
  })

  it('due turni spezzati dello stesso giorno restano due righe dello stesso utente', () => {
    const turni = effectiveStaffShifts({
      locationId: sede,
      weekDays: ['2026-11-20'],
      userIds: ['u1'],
      assignments: [
        { userId: 'u1', date: '2026-11-20', locationId: sede, startTime: '09:00', endTime: '13:00' },
        { userId: 'u1', date: '2026-11-20', locationId: sede, startTime: '14:00', endTime: '19:00' },
      ],
      recurring: [],
    })
    expect(turni).toHaveLength(2)
    expect(new Set(turni.map((t) => t.userId)).size).toBe(1)
  })
})

describe('weekdayIndex', () => {
  // La convenzione di location_business_hours e user_recurring_schedules: lunedi' = 0.
  it('lunedi vale 0 e domenica vale 6', () => {
    expect(weekdayIndex('2026-11-16')).toBe(0)
    expect(weekdayIndex('2026-11-22')).toBe(6)
  })

  it('non si sposta col fuso: vale la data come e scritta', () => {
    expect(weekdayIndex('2026-11-20')).toBe(4)
    expect(weekdayIndex('2026-01-01')).toBe(3)
  })
})
