# Sprint Change Proposal — UX Stesura Orario Dipendenti

**Data:** 2026-05-18
**Progetto:** dog-grooming
**Branch corrente:** 2-9-editor-matrice-prezzi-servizio
**Classificazione scope:** Moderata

---

## Sezione 1: Riepilogo del Problema

### Problema

L'interfaccia di stesura dell'orario dipendenti implementata nella story `2-4-assegnazione-collaboratori-sedi-calendario` è **macchinosa e lenta**: per coprire una settimana di 5 dipendenti × 5 giorni sono necessari ~125 click e 25 salvataggi separati per giorno.

**Bottleneck identificati:**

| Bottleneck | Dettaglio |
|-----------|-----------|
| Editor 1-dipendente-1-giorno | Ogni dipendente ha un proprio Dialog con `react-day-picker` single-date: impossibile vedere o modificare la settimana di tutto il team in un colpo solo |
| Modal annidato (Dialog → Dialog) | Per aggiungere una fascia: 1-click "Aggiungi fascia" → si apre un secondo Dialog nested (`AssignmentForm`) |
| Save per-giorno bloccante | Ogni giorno richiede un click "Salva giorno" separato via `saveDayShifts` (replace-strategy distruttiva) |
| Nessun riuso settimana | Nessun meccanismo per copiare la settimana precedente o definire un orario standard ricorrente |
| Default 09:00–18:00 hardcoded | `AssignmentForm.tsx:83-84` non legge `location_business_hours` |

### Contesto di scoperta

Segnalato dall'Amministratore dopo le prime settimane di utilizzo: il pattern reale dei turni è **70% ricorsivo / 30% variabile** con 4-8 dipendenti e 1-2 sedi, tutti gestiti da desktop.

---

## Sezione 2: Analisi dell'Impatto

### 2.1 Impatto sugli Epic

#### Epic 2 — Configurazione del Salone — Impatto: MEDIO

**Story 2-4-assegnazione-collaboratori-sedi-calendario** (done): la UX viene completamente rimpiazzata. Lo schema DB `user_location_assignments` rimane invariato.

Componenti rimossi:
- `StaffCalendarEditor.tsx` (Dialog singolo-dipendente)
- `AssignmentForm.tsx` (Dialog nested)
- `StaffList.tsx` (entry-point vecchio editor)

Componenti aggiunti:
- `StaffWeeklyScheduleGrid.tsx` + `ShiftCell.tsx` + `ShiftInlineEditor.tsx` + `WeekNavigator.tsx` + `CopyWeekButton.tsx`

### 2.2 Impatto sulle Story

Nessuna story in-progress impattata. Tutte le story delle epic 1-5 sono done.

### 2.3 Impatto Tecnico

- `src/lib/queries/staff.ts`: aggiunto `WeekGridShift` type + `getWeekShiftsForGrid`
- `src/lib/queries/locations.ts`: aggiunto `BusinessHoursEntry` type + `getAllLocationBusinessHours`
- `src/lib/validations/staff.ts`: aggiunti `upsertShiftSchema`, `deleteShiftSchema`, `copyWeekShiftsSchema`
- `src/lib/actions/staff.ts`: aggiunte action `upsertShift`, `deleteShift`, `copyWeekShifts`
- Nessuna migrazione DB necessaria (tabelle esistenti invariate)
- `getWeeklyStaffShifts` (usata da `actions/appointments.ts`) non modificata

---

## Sezione 3: Approccio Raccomandato — Direct Adjustment

Tre story incrementali, ognuna rilasciabile da sola:

### Story 2-10 (done): Vista settimanale a griglia + editing inline

- Griglia righe=dipendenti, colonne=7 giorni
- Click cella vuota/badge → Popover inline (no Dialog)
- Ottimistic updates con rollback su errore
- Default ore da `location_business_hours` per sede
- ROI: ~125 click → ~25 click per 5 dip × 5 giorni

### Story 2-11 (done): Copia settimana precedente

- Bottone "Copia settimana prec." abilitato solo su settimane vuote
- AlertDialog di conferma con label settimana sorgente
- Deduplication idempotente (userId|date|startTime|locationId)
- ROI: ~25 click → ~3 click (copia + eccezioni puntuali)

### Story 2-12 (backlog): Template ricorrente per dipendente

- Nuova tabella `user_recurring_schedules` (userId, dayOfWeek, startTime, endTime, locationId, validFrom, validTo)
- Ghost-badge per settimane vuote con template configurato
- Bottone "Applica template a settimana" → genera turni concreti
- Eccezioni per data: override senza toccare il template
- ROI: ~3 click → ~1 click (genera template, poi zero per le settimane standard)
- Dipende da: migrazione Drizzle Kit

---

## Sezione 4: Proposte di Modifica Dettagliate

### 4.1 File rimossi

```
src/components/staff/StaffCalendarEditor.tsx  ← RIMOSSO
src/components/staff/AssignmentForm.tsx        ← RIMOSSO
src/components/staff/StaffList.tsx             ← RIMOSSO
```

### 4.2 File modificati

**`src/app/(auth)/staff/page.tsx`**
```
OLD: pagina con getAllUsersWithAssignments + StaffList
NEW: redirect('/staff/schedule')
```

**`src/lib/queries/staff.ts`** — aggiunto `WeekGridShift` + `getWeekShiftsForGrid`

**`src/lib/queries/locations.ts`** — aggiunto `BusinessHoursEntry` + `getAllLocationBusinessHours`

**`src/lib/validations/staff.ts`** — aggiunti `upsertShiftSchema`, `deleteShiftSchema`, `copyWeekShiftsSchema`

**`src/lib/actions/staff.ts`** — aggiunte `upsertShift`, `deleteShift`, `copyWeekShifts`

### 4.3 File creati

```
src/app/(auth)/staff/schedule/page.tsx            ← nuova pagina server
src/components/staff/WeekNavigator.tsx             ← navigatore settimana ◄/►
src/components/staff/ShiftInlineEditor.tsx         ← form inline (add/edit)
src/components/staff/ShiftCell.tsx                 ← cella griglia con Popover
src/components/staff/CopyWeekButton.tsx            ← copia settimana prec.
src/components/staff/StaffWeeklyScheduleGrid.tsx   ← griglia principale
```

---

## Sezione 5: Handoff e Prossimi Passi

**Story 2-10 e 2-11: done.** Disponibili per review e deploy.

**Story 2-12 (template ricorrente): backlog.** Richiede:
1. Migrazione DB: nuova tabella `user_recurring_schedules`
2. Drizzle Kit: `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate`
3. 3 nuovi componenti + query + actions

**Criteri di successo:**
- 5 dipendenti × 5 giorni in < 2 minuti senza modal annidati
- Copia settimana eseguita senza duplicati (test idempotenza)
- Desktop + tablet 768px funzionanti
