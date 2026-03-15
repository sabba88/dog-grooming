---
title: 'Fix Station Services/Schedule Assignment Error'
slug: 'fix-station-assignment-error'
created: '2026-02-16'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['next-safe-action ^8.0.11', 'drizzle-orm/neon-http', '@neondatabase/serverless', 'next.js 16', 'sonner']
files_to_modify: ['src/lib/actions/client.ts', 'src/lib/actions/stations.ts']
code_patterns: ['authActionClient + useAction hook', 'neon-http batch transactions', 'onSuccess/onError toast pattern', 'router.refresh() for data revalidation']
test_patterns: []
---

# Tech-Spec: Fix Station Services/Schedule Assignment Error

**Created:** 2026-02-16

## Overview

### Problem Statement

L'assegnazione di servizi e orari alle postazioni fallisce con il messaggio di errore generico di next-safe-action: "Something went wrong while executing the operation." Il server risponde HTTP 200 (comportamento standard di next-safe-action che wrappa gli errori nel body). Dopo refresh manuale, le postazioni mostrano ancora "0 servizi", "Nessun orario" e badge "Incompleta" — i dati NON vengono salvati.

**Causa root identificata:** Il progetto usa `drizzle-orm/neon-http` con `neon()` HTTP proxy. Le server actions chiamano `db.transaction()` che in modalita' neon-http opera come batch HTTP e puo' fallire. L'assenza di `handleServerError` personalizzato in `createSafeActionClient()` maschera l'errore reale con il messaggio generico in inglese.

### Solution

1. Eliminare `db.transaction()` dalle server actions di stazioni e sostituire con operazioni sequenziali (delete + insert senza wrapper transazionale) — il driver neon-http gestisce query individuali senza problemi
2. Aggiungere `handleServerError` personalizzato al safe action client per esporre messaggi errore leggibili in italiano

### Scope

**In Scope:**
- Rimozione `db.transaction()` da `updateStationServices` e `updateStationSchedule`, sostituzione con operazioni sequenziali
- Configurazione `handleServerError` in `createSafeActionClient` per messaggi errore in italiano
- Verifica end-to-end del flusso assegnazione servizi e orari

**Out of Scope:**
- Nuove features per le postazioni
- Refactoring dell'architettura azioni o migrazione driver DB
- Modifiche UI/UX ai form
- Aggiunta FK o unique constraints allo schema DB

## Context for Development

### Codebase Patterns

- **DB Connection**: `neon()` HTTP proxy + `drizzle-orm/neon-http` in `src/lib/db/index.ts` — query singole funzionano, transazioni batch possono fallire
- **Server Actions**: `authActionClient` da next-safe-action v8.0.11 — `createSafeActionClient()` in `src/lib/actions/client.ts`
- **Pattern attuale (broken)**: `db.transaction(async (tx) => { tx.delete(); tx.insert(); })` — il batch HTTP fallisce silenziosamente
- **Pattern corretto**: `await db.delete(); await db.insert();` — operazioni sequenziali dirette, affidabili con neon-http
- **Client**: `useAction` hook con `onSuccess` → `toast.success` + `router.refresh()`, `onError` → `toast.error(error.error?.serverError || fallback)`
- **Query**: `getStationsByLocation()` in `src/lib/queries/stations.ts` — logica conteggio corretta, dati mancanti perche' non salvati

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/lib/actions/client.ts` | Safe action client — aggiungere `handleServerError` |
| `src/lib/actions/stations.ts` | Server actions — rimuovere `db.transaction()`, usare operazioni sequenziali |
| `src/lib/db/index.ts` | DB connection — neon-http (non modificare, solo reference) |
| `src/lib/db/schema.ts` | Schema DB — stationServices, stationSchedules (reference) |
| `src/lib/queries/stations.ts` | Query conteggio — logica OK (reference) |
| `src/components/location/StationServicesForm.tsx` | Form servizi — error handling OK (reference) |
| `src/components/location/StationScheduleForm.tsx` | Form orari — error handling OK (reference) |
| `src/components/location/StationList.tsx` | Lista postazioni — isIncomplete() logic OK (reference) |

### Technical Decisions

- **Eliminare transazioni invece di cambiare driver**: Le operazioni delete+insert su `stationServices` e `stationSchedules` non richiedono atomicita' critica. Se l'insert fallisce dopo il delete, l'utente puo' semplicemente riprovare (assegnando di nuovo i servizi/orari). Questo approccio e' piu' semplice e non richiede dipendenze aggiuntive.
- **handleServerError**: Deve preservare il messaggio di errore originale per gli Error espliciti (`e.message` per "Non autorizzato", "Postazione non trovata") e fornire un fallback italiano generico per errori sconosciuti.

## Implementation Plan

### Tasks

- [x] Task 1: Aggiungere `handleServerError` a `createSafeActionClient`
  - File: `src/lib/actions/client.ts`
  - Action: Aggiungere parametro `handleServerError` a ENTRAMBI i client (`actionClient` e `authActionClient`) che:
    - Se l'errore e' un'istanza di `Error`, restituisce `e.message` (preserva messaggi come "Non autorizzato", "Postazione non trovata")
    - Altrimenti, restituisce `"Si e' verificato un errore imprevisto"` (fallback italiano)
  - Codice target:
    ```typescript
    const handleServerError = (e: Error) => {
      console.error('Action error:', e.message)
      return e.message
    }

    export const actionClient = createSafeActionClient({
      handleServerError,
    })

    export const authActionClient = createSafeActionClient({
      handleServerError,
    }).use(async ({ next }) => {
      // ...middleware esistente invariato...
    })
    ```
  - Notes: Questo fix e' indipendente dal fix transazioni e migliora l'error handling di TUTTE le server actions del progetto.

- [x] Task 2: Rimuovere `db.transaction()` da `updateStationServices`
  - File: `src/lib/actions/stations.ts` (righe 108-125)
  - Action: Sostituire il blocco `db.transaction()` con operazioni sequenziali usando `db` direttamente:
    ```typescript
    // PRIMA (broken):
    await db.transaction(async (tx) => {
      await tx.delete(stationServices).where(...)
      if (parsedInput.serviceIds.length > 0) {
        await tx.insert(stationServices).values(...)
      }
    })

    // DOPO (fix):
    await db.delete(stationServices).where(
      and(
        eq(stationServices.stationId, parsedInput.stationId),
        eq(stationServices.tenantId, ctx.tenantId)
      )
    )

    if (parsedInput.serviceIds.length > 0) {
      await db.insert(stationServices).values(
        parsedInput.serviceIds.map(serviceId => ({
          stationId: parsedInput.stationId,
          serviceId,
          tenantId: ctx.tenantId,
        }))
      )
    }
    ```
  - Notes: Stessa logica, solo senza il wrapper transazionale. Le operazioni usano `db` invece di `tx`.

- [x] Task 3: Rimuovere `db.transaction()` da `updateStationSchedule`
  - File: `src/lib/actions/stations.ts` (righe 148-167)
  - Action: Stessa trasformazione del Task 2, ma per gli schedules:
    ```typescript
    // DOPO (fix):
    await db.delete(stationSchedules).where(
      and(
        eq(stationSchedules.stationId, parsedInput.stationId),
        eq(stationSchedules.tenantId, ctx.tenantId)
      )
    )

    if (parsedInput.schedules.length > 0) {
      await db.insert(stationSchedules).values(
        parsedInput.schedules.map(schedule => ({
          stationId: parsedInput.stationId,
          dayOfWeek: schedule.dayOfWeek,
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          tenantId: ctx.tenantId,
        }))
      )
    }
    ```

- [ ] Task 4: Verifica manuale end-to-end
  - Action: Testare il flusso completo nell'applicazione:
    1. Aprire pagina postazioni di una sede
    2. Cliccare "Servizi" su una postazione
    3. Selezionare uno o piu' servizi e salvare → verificare toast "Servizi aggiornati"
    4. Verificare che la colonna "Servizi" mostri il conteggio corretto
    5. Cliccare "Orari" sulla stessa postazione
    6. Abilitare giorni e definire orari, salvare → verificare toast "Orari aggiornati"
    7. Verificare che la colonna "Orari" mostri i giorni configurati
    8. Verificare che il badge "Incompleta" scompaia
    9. Refresh pagina (F5) → verificare che i dati persistano

### Acceptance Criteria

- [ ] AC 1: Given una postazione senza servizi, when l'admin seleziona servizi e clicca "Salva Servizi", then i servizi vengono salvati, il toast mostra "Servizi aggiornati", e il conteggio servizi si aggiorna nella lista
- [ ] AC 2: Given una postazione senza orari, when l'admin configura gli orari e clicca "Salva Orari", then gli orari vengono salvati, il toast mostra "Orari aggiornati", e i giorni configurati appaiono nella lista
- [ ] AC 3: Given una postazione con servizi e orari configurati, when la pagina viene refreshata (F5), then i dati persistono correttamente (servizi count > 0, orari visibili)
- [ ] AC 4: Given una postazione con servizi e orari completi, when la lista viene renderizzata, then il badge "Incompleta" NON appare
- [ ] AC 5: Given un utente non admin, when tenta di assegnare servizi a una postazione, then il sistema mostra un errore in italiano "Non autorizzato" (NON il messaggio generico inglese)
- [ ] AC 6: Given una postazione con servizi gia' assegnati, when l'admin modifica la selezione servizi e salva, then i vecchi servizi vengono rimossi e i nuovi salvati correttamente (replace strategy funzionante)
- [ ] AC 7: Given un errore imprevisto del server, when l'azione fallisce, then il toast mostra un messaggio in italiano (es. "Si e' verificato un errore imprevisto") invece di "Something went wrong while executing the operation"

## Additional Context

### Dependencies

- next-safe-action ^8.0.11 — parametro `handleServerError` disponibile in v8
- drizzle-orm con neon-http — `db.delete()` e `db.insert()` funzionano singolarmente, solo `db.transaction()` e' problematico
- Nessuna nuova dipendenza richiesta

### Testing Strategy

- **Manuale**: Test completo del flusso assegnazione servizi e orari (Task 4)
- **Verifica regressione**: Le altre server actions (createStation, updateStation) non usano transazioni e non sono impattate
- **Edge cases**: Assegnare 0 servizi (deselezionare tutto), assegnare servizi a postazione inesistente, assegnare orari con chiusura prima di apertura (validazione client-side gia' presente)

### Notes

- **Rischio basso**: Le modifiche sono minime (rimozione wrapper transazionale) e localizzate a 2 file
- **Impatto positivo collaterale**: Il `handleServerError` migliora l'error handling di TUTTE le server actions del progetto, non solo quelle delle stazioni
- **Considerazione futura**: Se in futuro servissero transazioni atomiche (es. per operazioni finanziarie), valutare l'aggiunta di un secondo driver DB con WebSocket (`drizzle-orm/neon-serverless` con `Pool`)
- **Nessun FK sulle tabelle**: L'assenza di foreign keys su stationServices/stationSchedules non causa problemi immediati ma andrebbe considerata in una futura migrazione di hardening
