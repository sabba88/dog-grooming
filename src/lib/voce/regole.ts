// Regole dell'assistente vocale, decise il 12/11/2026 con il titolare del progetto
// (POC "assistente vocale per toelettatura", nodi 2 e 4 del piano).
// Stanno qui e solo qui: le route le leggono, nessuna soglia sparsa nel codice.

export const REGOLE_VOCE = {
  /** Dal giorno dopo: per oggi l'assistente lascia un messaggio o passa la chiamata. */
  giorniMinimiAnticipo: 1,
  /** Fino a 60 giorni da oggi: copre il ciclo di toelettatura (4-8 settimane, ipotesi). */
  giorniMassimiAnticipo: 60,
  /** Gli orari proposti come alternativa cadono ogni mezz'ora: al telefono si dicono meglio. */
  passoAlternativeMinuti: 30,
  /** Quante alternative propone al massimo. */
  alternativeMassime: 3,
  /** Quanti giorni dopo quello chiesto guarda per trovare alternative. */
  giorniRicercaAlternative: 7,
  /**
   * Sotto questa cifra un prezzo è un segnaposto, non un prezzo vero: su uat molti servizi
   * valgono 20 centesimi (12/11/2026). L'assistente allora non dice cifre e rimanda al toelettatore.
   */
  prezzoMinimoCredibileCent: 500,
  /** Versione del consenso per i clienti nati al telefono (nodo 6). */
  versioneConsenso: 'telefono-1.0',
} as const
