'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'agendaGroupBy'

export type AgendaGroupBy = 'station' | 'person'

function readStored(): AgendaGroupBy {
  if (typeof window === 'undefined') return 'station'
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'person' ? 'person' : 'station'
  } catch {
    return 'station'
  }
}

/**
 * Asse di raggruppamento dell'agenda: postazioni o persone.
 * Persistito in localStorage, come la sede selezionata (vedi useLocationSelector).
 * AgendaView non renderizza nulla finche' non e' idratata, quindi leggere il valore
 * in fase di inizializzazione non provoca mismatch di idratazione.
 */
export function useAgendaGroupBy() {
  const [groupBy, setGroupByState] = useState<AgendaGroupBy>(readStored)

  const setGroupBy = useCallback((value: AgendaGroupBy) => {
    setGroupByState(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // localStorage non disponibile: la scelta resta valida per la sessione corrente
    }
  }, [])

  return { groupBy, setGroupBy }
}
