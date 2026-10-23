// CC-2026-10-23 — Stato "da pianificare".
//
// Non e' una colonna del database: uno stato memorizzato andrebbe tenuto in sync a
// mano e uscirebbe di fase al primo percorso che dimentica di aggiornarlo. E' invece
// una funzione delle colonne che la pianificazione valorizza.

export interface PlanningFields {
  stationId: string | null
  userId: string | null
  serviceId: string | null
}

/** Mancano postazione, collaboratore o servizio: l'appuntamento non e' ancora pianificato. */
export function isDaPianificare(a: PlanningFields): boolean {
  return !a.stationId || !a.userId || !a.serviceId
}

/** Elenco in italiano di cosa manca, per il tooltip del badge. */
export function missingPlanningFields(a: PlanningFields): string[] {
  const missing: string[] = []
  if (!a.serviceId) missing.push('servizio')
  if (!a.stationId) missing.push('postazione')
  if (!a.userId) missing.push('collaboratore')
  return missing
}

export const DA_PIANIFICARE_LABEL = 'Da pianificare'
