# Story 2.10: Vista Settimanale Orario Dipendenti — Griglia + Editing Inline

Status: done

<!-- CC-2026-05-18: Nuova story — UX correct-course (CC-2026-05-18): sostituzione dell'editor singolo-dipendente (StaffCalendarEditor + AssignmentForm modal annidato) con vista settimanale a griglia (tutti i dipendenti × 7 giorni) + editing inline via Popover. Rimuove StaffCalendarEditor.tsx, AssignmentForm.tsx, StaffList.tsx. Nuova action upsertShift/deleteShift (granulare, no replace). Default ore da business_hours sede. -->

## Story

As a **Amministratore**,
I want **vedere e modificare i turni di tutti i dipendenti in una griglia settimanale**,
so that **possa stendere l'orario della settimana senza aprire modal annidati per ogni singolo turno, riducendo da ~125 click a ~25 click per 5 dipendenti × 5 giorni**.

## Acceptance Criteria

1. **Given** un Amministratore naviga a `/staff` o `/staff/schedule`
   **When** la pagina viene caricata
   **Then** visualizza una griglia con righe = dipendenti attivi e colonne = 7 giorni della settimana corrente (lun–dom, locale italiano)
   **And** ogni cella mostra badge compatti per i turni esistenti di quel dipendente in quel giorno (formato: "Sede · 09:00–13:00")
   **And** ogni cella ha un pulsante "+" per aggiungere un turno

2. **Given** un Amministratore clicca su un badge turno esistente
   **When** il Popover si apre
   **Then** compaiono i campi Select sede + Input inizio + Input fine pre-compilati con i valori attuali
   **And** compaiono i bottoni "Salva" e "Elimina" e "Annulla"
   **And** salvando aggiorna il turno inline senza ricaricare la pagina (ottimistic update)

3. **Given** un Amministratore clicca "+" su una cella vuota
   **When** il Popover si apre
   **Then** i campi inizio/fine sono pre-compilati con gli orari di apertura della sede selezionata per quel giorno della settimana (da `location_business_hours`)
   **And** fallback a 09:00–18:00 se nessuna sede è selezionata o la sede non ha business hours

4. **Given** un Amministratore salva un turno con fascia sovrapposta a un turno esistente dello stesso dipendente nello stesso giorno
   **When** il form viene validato (client-side e server-side)
   **Then** appare un messaggio di errore inline "Fascia sovrapposta a un turno esistente"
   **And** il turno non viene salvato

5. **Given** un Amministratore naviga tra settimane usando ◄ e ► nel WeekNavigator
   **When** cambia settimana
   **Then** la griglia si aggiorna con i turni della nuova settimana tramite Next.js navigation (?week=YYYY-MM-DD)
   **And** il bottone "Oggi" riporta alla settimana corrente ed è disabilitato se già sulla settimana corrente

6. **Given** un Collaboratore accede al sistema
   **When** naviga a `/staff/schedule`
   **Then** viene reindirizzato a `/agenda` (nessun accesso alla gestione turni)

## Tasks / Subtasks

- [x] Task 1: Queries (AC: #1, #3)
  - [x] 1.1 Aggiunto tipo `WeekGridShift` a `src/lib/queries/staff.ts`
  - [x] 1.2 Aggiunta query `getWeekShiftsForGrid(weekStart, weekEnd, tenantId)` con JOIN locations
  - [x] 1.3 Aggiunto tipo `BusinessHoursEntry` a `src/lib/queries/locations.ts`
  - [x] 1.4 Aggiunta query `getAllLocationBusinessHours(tenantId)`

- [x] Task 2: Validations + Actions (AC: #4)
  - [x] 2.1 Aggiunto `upsertShiftSchema` e `deleteShiftSchema` a `src/lib/validations/staff.ts`
  - [x] 2.2 Aggiunta action `upsertShift` (insert o update con overlap check, esclude sé stesso in edit)
  - [x] 2.3 Aggiunta action `deleteShift`
  - [x] 2.4 Import `gte, lte` aggiunto in `src/lib/actions/staff.ts`

- [x] Task 3: Componente WeekNavigator (AC: #5)
  - [x] 3.1 Creato `src/components/staff/WeekNavigator.tsx` con navigazione ◄/► + "Oggi"
  - [x] 3.2 Usa `router.push('/staff/schedule?week=...')` con date-fns ISO week

- [x] Task 4: Componente ShiftInlineEditor (AC: #2, #3, #4)
  - [x] 4.1 Creato `src/components/staff/ShiftInlineEditor.tsx`
  - [x] 4.2 Form react-hook-form + zod, mode add/edit, prop `editShiftId` per escludere overlap check
  - [x] 4.3 useEffect: aggiorna startTime/endTime dai business hours quando cambia sede (solo mode=add)
  - [x] 4.4 Bottone Elimina visibile solo in mode=edit

- [x] Task 5: Componente ShiftCell (AC: #1, #2, #3)
  - [x] 5.1 Creato `src/components/staff/ShiftCell.tsx`
  - [x] 5.2 Stato `openPopoverId` gestisce quale popover è aperto (shift ID | 'add' | null)
  - [x] 5.3 Badge turno cliccabile → popover edit; pulsante "+" → popover add

- [x] Task 6: Componente StaffWeeklyScheduleGrid (AC: #1–#5)
  - [x] 6.1 Creato `src/components/staff/StaffWeeklyScheduleGrid.tsx`
  - [x] 6.2 State `shifts` con ottimistic updates (tempId per add, rollback su errore server)
  - [x] 6.3 `handleAdd`: aggiunge ottimisticamente con tempId, aggiorna a ID reale su successo, rimuove su errore
  - [x] 6.4 `handleUpdate`/`handleDelete`: ottimistic patch/remove con rollback su errore
  - [x] 6.5 Vista desktop: tabella sticky-header; vista mobile: lista accordion per dipendente
  - [x] 6.6 Colore "oggi" evidenziato nell'header colonne

- [x] Task 7: Pagina e routing (AC: #1, #5, #6)
  - [x] 7.1 Creata `src/app/(auth)/staff/schedule/page.tsx` (server component, searchParam `week`)
  - [x] 7.2 Calcola weekStart (startOfISOWeek se mancante), weekEnd, weekDays (7 date)
  - [x] 7.3 Carica `getActiveUsers`, `getWeekShiftsForGrid`, `getLocations`, `getAllLocationBusinessHours` in parallel
  - [x] 7.4 `src/app/(auth)/staff/page.tsx` → redirect a `/staff/schedule`

- [x] Task 8: Cleanup (rimozione componenti deprecati)
  - [x] 8.1 Rimosso `src/components/staff/StaffCalendarEditor.tsx`
  - [x] 8.2 Rimosso `src/components/staff/AssignmentForm.tsx`
  - [x] 8.3 Rimosso `src/components/staff/StaffList.tsx`
