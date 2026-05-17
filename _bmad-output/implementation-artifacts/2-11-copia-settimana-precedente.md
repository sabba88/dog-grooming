# Story 2.11: Copia Settimana Precedente

Status: done

<!-- CC-2026-05-18: Nuova story — UX correct-course. Aggiunge il bottone "Copia settimana prec." nella griglia orario settimanale (Story 2.10). Dipende da: Story 2.10 (WeekNavigator, StaffWeeklyScheduleGrid — DONE). -->

## Story

As a **Amministratore**,
I want **replicare con un click i turni della settimana precedente nella settimana corrente**,
so that **quando i turni sono ricorrenti (70% dei casi) non devo reinserirli manualmente giorno per giorno**.

## Acceptance Criteria

1. **Given** un Amministratore è nella vista settimanale di una settimana senza turni
   **When** visualizza il WeekNavigator
   **Then** compare il bottone "Copia settimana prec." abilitato

2. **Given** un Amministratore è nella vista settimanale di una settimana con almeno un turno esistente
   **When** visualizza il WeekNavigator
   **Then** il bottone "Copia settimana prec." è disabilitato (settimana già popolata)

3. **Given** un Amministratore clicca "Copia settimana prec."
   **When** la finestra di conferma si apre
   **Then** mostra l'intervallo della settimana sorgente (es. "1 Mag – 7 Mag") e il messaggio "I turni già presenti non verranno sovrascritti"

4. **Given** un Amministratore conferma la copia
   **When** l'operazione si completa con successo
   **Then** appare toast "N turni copiati dalla settimana precedente"
   **And** la griglia si aggiorna mostrando i turni copiati (via `router.refresh()`)
   **And** i turni già presenti nella settimana corrente (se alcune date erano popolate) non vengono duplicati

5. **Given** la settimana precedente non ha turni
   **When** l'Amministratore conferma la copia
   **Then** appare toast informativo "Nessun turno da copiare o tutti già presenti"
   **And** nessun dato viene modificato

6. **Given** l'operazione di copia viene eseguita due volte consecutive sulla stessa settimana (idempotenza)
   **When** la seconda esecuzione si completa
   **Then** il numero di turni non aumenta (deduplication per userId+date+startTime+locationId)

## Tasks / Subtasks

- [x] Task 1: Validation + Action (AC: #4, #5, #6)
  - [x] 1.1 Aggiunto `copyWeekShiftsSchema` a `src/lib/validations/staff.ts`
  - [x] 1.2 Aggiunta action `copyWeekShifts` a `src/lib/actions/staff.ts`:
    - SELECT turni `source_week_start..source_week_start+6`
    - Mappa date offset (sourceDate - sourceWeekStart) → targetDate
    - Carica turni esistenti nella settimana target, costruisce Set di chiavi `userId|date|startTime|locationId`
    - INSERT batch solo turni non presenti nel Set (idempotenza)
    - Ritorna `{ copied, skipped }`
  - [x] 1.3 Import `gte, lte` già presenti in `staff.ts`

- [x] Task 2: Componente CopyWeekButton (AC: #1–#5)
  - [x] 2.1 Creato `src/components/staff/CopyWeekButton.tsx`
  - [x] 2.2 Prop `hasShifts: boolean` → disabilita il pulsante se la settimana è già popolata
  - [x] 2.3 AlertDialog di conferma con label settimana sorgente formattata (date-fns locale it)
  - [x] 2.4 `useAction(copyWeekShifts)` con `onSuccess` → toast + `router.refresh()`
  - [x] 2.5 `onError` → toast con messaggio di errore

- [x] Task 3: Integrazione nella griglia (AC: #1, #2)
  - [x] 3.1 `CopyWeekButton` aggiunto in `StaffWeeklyScheduleGrid` come children di `WeekNavigator`
  - [x] 3.2 `hasShiftsThisWeek` calcolato sui 7 giorni della settimana corrente dallo state `shifts`
