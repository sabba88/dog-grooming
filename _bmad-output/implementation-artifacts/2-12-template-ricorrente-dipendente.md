# Story 2.12: Template Ricorrente per Dipendente

Status: done

<!-- CC-2026-05-18: Nuova story — terza fase UX stesura orario (sprint-change-proposal-2026-05-18). Dipende da Story 2.10 (StaffWeeklyScheduleGrid, ShiftCell, ShiftInlineEditor — DONE) e Story 2.11 (CopyWeekButton, WeekNavigator — DONE). Richiede migrazione DB: nuova tabella user_recurring_schedules. -->

## Story

As a **Amministratore**,
I want **configurare un orario standard ricorrente per dipendente e applicarlo con un click a qualsiasi settimana**,
so that **nelle settimane standard (70% dei casi) non devo inserire i turni da zero o copiare dalla settimana precedente: il template fa tutto il lavoro**.

## Acceptance Criteria

1. **Given** un Amministratore è nella griglia settimanale dipendenti
   **When** visualizza una cella (dipendente × giorno) che non ha turni reali ma ha un template ricorrente per quel giorno della settimana
   **Then** vede uno o più ghost-badge translucenti (bordo tratteggiato, testo attenuato) con "Sede · HH:mm–HH:mm"
   **And** i ghost-badge sono visivamente distinti dai badge reali (emerald pieno vs trasparente/tratteggiato)

2. **Given** un Amministratore clicca su un ghost-badge
   **When** il Popover si apre
   **Then** vede il pulsante "Crea turno per oggi" (pre-compilato con i valori del template)
   **And** vede il pulsante "Modifica template" che apre un editor del template ricorrente
   **And** vede il pulsante "Elimina template" con conferma inline

3. **Given** un Amministratore clicca "Crea turno per oggi" dal Popover ghost-badge
   **When** l'azione si completa con successo
   **Then** viene creato un turno reale nella data corrente (userLocationAssignments) con i valori del template
   **And** la cella passa da ghost-badge a badge reale
   **And** appare toast "Turno creato"
   **And** il template ricorrente rimane invariato

4. **Given** un Amministratore configura o modifica un template tramite "Modifica template"
   **When** salva il template (RecurringShiftEditor)
   **Then** il template viene salvato in user_recurring_schedules
   **And** i ghost-badge nella griglia si aggiornano per riflettere i nuovi valori
   **And** appare toast "Template aggiornato"

5. **Given** esiste almeno un template ricorrente configurato per il tenant
   **When** un Amministratore visualizza il WeekNavigator
   **Then** compare il bottone "Applica template a settimana" abilitato

6. **Given** un Amministratore clicca "Applica template a settimana"
   **When** l'AlertDialog di conferma si apre
   **Then** mostra il messaggio "Verranno generati i turni standard per tutti i dipendenti. I turni già presenti non saranno sovrascritti."

7. **Given** un Amministratore conferma "Applica template a settimana"
   **When** l'operazione si completa con successo
   **Then** vengono creati i turni reali (userLocationAssignments) per ogni dipendente × ogni giorno della settimana corrente dove esiste un template e non esiste già un turno reale
   **And** appare toast "N turni generati dal template"
   **And** la griglia si aggiorna mostrando i nuovi turni reali (via `router.refresh()`)
   **And** l'operazione è idempotente: eseguirla più volte non duplica i turni (deduplication per userId|date|startTime|locationId)

8. **Given** un Amministratore elimina un turno reale di un giorno coperto da template
   **When** il turno viene eliminato
   **Then** il ghost-badge del template riappare nella cella (override senza toccare il template)
   **And** il template rimane invariato (l'eliminazione del turno reale non modifica user_recurring_schedules)

9. **Given** nessun template ricorrente è configurato per il tenant
   **When** un Amministratore visualizza il WeekNavigator
   **Then** il bottone "Applica template a settimana" non è visibile

10. **Given** un Collaboratore accede al sistema
    **When** visualizza la griglia orario (se avesse accesso)
    **Then** la gestione dei template (crea/modifica/elimina/applica) non è accessibile (solo Amministratore)

## Tasks / Subtasks

- [x] Task 1: Migrazione DB — nuova tabella `user_recurring_schedules` (AC: #1–#4, #7)
  - [x] 1.1 Aggiungere `userRecurringSchedules` a `src/lib/db/schema.ts`:
    - Colonne: `id uuid PK`, `userId uuid NOT NULL → users.id CASCADE`, `locationId uuid NOT NULL → locations.id CASCADE`, `dayOfWeek integer NOT NULL` (0=Lun ISO, 6=Dom), `startTime text NOT NULL "HH:mm"`, `endTime text NOT NULL "HH:mm"`, `tenantId uuid NOT NULL`, `createdAt`, `updatedAt`
    - Unique index su `(userId, dayOfWeek, startTime, tenantId)` per prevenire template sovrapposti identici
  - [x] 1.2 Eseguire `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate` (o `pnpm db:push` per dev)
  - [x] 1.3 Aggiungere export `userRecurringSchedules` agli import in `actions/staff.ts` e `queries/staff.ts`

- [x] Task 2: Validations (AC: #2, #4, #7)
  - [x] 2.1 Aggiungere a `src/lib/validations/staff.ts`:
    - `upsertRecurringShiftSchema`: `{ id?: uuid, userId: uuid, locationId: uuid, dayOfWeek: z.number().int().min(0).max(6), startTime: HH:mm regex, endTime: HH:mm regex }` con refine `endTime > startTime`
    - `deleteRecurringShiftSchema`: `{ id: uuid }`
    - `applyTemplateToWeekSchema`: `{ weekStart: z.string().date() }`

- [x] Task 3: Queries (AC: #1, #5, #9)
  - [x] 3.1 Aggiungere tipo `RecurringShift` a `src/lib/queries/staff.ts`:
    ```typescript
    export type RecurringShift = {
      id: string
      userId: string
      dayOfWeek: number
      locationId: string
      locationName: string | null
      startTime: string
      endTime: string
    }
    ```
  - [x] 3.2 Aggiungere query `getRecurringShiftsForGrid(tenantId: string): Promise<RecurringShift[]>`:
    - SELECT con LEFT JOIN `locations` per `locationName`
    - WHERE `tenantId = ?`
    - ORDER BY `userId, dayOfWeek, startTime`

- [x] Task 4: Actions (AC: #3, #4, #7, #10)
  - [x] 4.1 Aggiungere action `upsertRecurringShift` a `src/lib/actions/staff.ts`:
    - `checkRole: admin`
    - Validazione utente e sede esistenti nel tenant
    - Overlap check: cerca template già esistenti per stesso `userId + dayOfWeek` che si sovrappongono in orario (esclude `id` in edit)
    - INSERT o UPDATE su `user_recurring_schedules`
    - Ritorna `{ recurringShift: { id } }`
  - [x] 4.2 Aggiungere action `deleteRecurringShift` a `src/lib/actions/staff.ts`:
    - `checkRole: admin`
    - DELETE WHERE `id = ? AND tenantId = ?`
    - Ritorna `{ success: true }`
  - [x] 4.3 Aggiungere action `applyTemplateToWeek` a `src/lib/actions/staff.ts`:
    - `checkRole: admin`
    - Input: `{ weekStart: YYYY-MM-DD }`
    - Calcola `weekEnd = weekStart + 6 giorni`
    - Carica TUTTI i template attivi del tenant: `SELECT * FROM user_recurring_schedules WHERE tenantId = ?`
    - Per ogni giorno `[weekStart..weekEnd]`: calcola `dayOfWeek` ISO (0=Lun)
    - Trova template per quel `dayOfWeek`, costruisce i turni target con la data specifica
    - Carica turni esistenti nella settimana target (come in `copyWeekShifts`), costruisce Set di chiavi `userId|date|startTime|locationId`
    - INSERT batch solo turni non già presenti (idempotenza)
    - Ritorna `{ generated: number, skipped: number }`

- [x] Task 5: Componente `RecurringShiftEditor` (AC: #2, #4)
  - [x] 5.1 Creare `src/components/staff/RecurringShiftEditor.tsx`
  - [x] 5.2 Props: `mode: 'add' | 'edit'`, `editId?: string`, `userId: string`, `dayOfWeek: number`, `defaultLocationId?: string`, `defaultStartTime?: string`, `defaultEndTime?: string`, `locations: Location[]`, `onSave: (data) => Promise<void>`, `onDelete?: () => Promise<void>`, `onCancel: () => void`, `isPending?: boolean`
  - [x] 5.3 Form react-hook-form + zod (stesso pattern di `ShiftInlineEditor` ma senza campo `date`)
  - [x] 5.4 Header fisso: `format(dayLabel, 'EEEE', { locale: it })` (es. "Lunedì")
  - [x] 5.5 Bottone "Elimina template" visibile solo in mode=edit, con `onClick` diretto (no AlertDialog — il Popover è già un contesto di conferma)

- [x] Task 6: Aggiornamento `ShiftCell` con ghost badges (AC: #1, #2, #3, #8)
  - [x] 6.1 Aggiungere prop `recurringShifts: RecurringShift[]` a `ShiftCellProps` (default `[]`)
  - [x] 6.2 Se `shifts.length === 0 && recurringShifts.length > 0`: renderizzare ghost badge(s) sopra il pulsante "+"
  - [x] 6.3 Ghost badge styling: `bg-emerald-50/40 border-dashed border-emerald-300 opacity-70 text-emerald-700` (distinto dal badge reale `bg-emerald-50 border-emerald-200`)
  - [x] 6.4 Clicking ghost badge → apre Popover dedicato con 3 azioni:
    - "Crea turno per oggi": chiama `onAdd(userId, date, { locationId, startTime, endTime })` con valori del template → chiude Popover
    - "Modifica template": apre `RecurringShiftEditor` (mode=edit, inline nel Popover)
    - "Elimina template": chiama `onDeleteRecurring(recurringShift.id)` → chiude Popover
  - [x] 6.5 Se `shifts.length > 0 && recurringShifts.length > 0`: non mostrare ghost badge (i turni reali nascondono i template)
  - [x] 6.6 Aggiungere callback `onAddRecurring`, `onUpdateRecurring`, `onDeleteRecurring` a `ShiftCellProps`

- [x] Task 7: Componente `ApplyTemplateButton` (AC: #5, #6, #7, #9)
  - [x] 7.1 Creare `src/components/staff/ApplyTemplateButton.tsx`
  - [x] 7.2 Props: `weekStart: string`, `hasTemplates: boolean`
  - [x] 7.3 Renderizzare `null` se `!hasTemplates`
  - [x] 7.4 AlertDialog di conferma con messaggio descrittivo (vedi AC #6)
  - [x] 7.5 `useAction(applyTemplateToWeek)` con:
    - `onSuccess`: toast `"N turni generati dal template"` (o `"Tutti i turni del template erano già presenti"` se N=0) + `router.refresh()`
    - `onError`: toast con messaggio errore

- [x] Task 8: Aggiornamento `StaffWeeklyScheduleGrid` (AC: #1, #4, #5, #8, #9)
  - [x] 8.1 Aggiungere prop `recurringShifts: RecurringShift[]` (default `[]`)
  - [x] 8.2 Aggiungere state `recurring: RecurringShift[]` inizializzato da `recurringShifts`
  - [x] 8.3 Creare `getISODayOfWeekForDate(date: string): number` (0=Lun…6=Dom) usando `getISODay(parseISO(date)) - 1`
  - [x] 8.4 Aggiungere `getRecurringForCell(userId, date)` → filtra `recurring` per `userId` e `dayOfWeek === getISODayOfWeekForDate(date)`
  - [x] 8.5 Implementare `handleAddRecurring`, `handleUpdateRecurring`, `handleDeleteRecurring` (ottimistic update su `recurring` state con rollback, pattern identico a `handleAdd`/`handleUpdate`/`handleDelete` ma per `recurring` state)
  - [x] 8.6 Passare `recurringShifts={getRecurringForCell(user.id, day)}` + callback a ogni `ShiftCell`
  - [x] 8.7 Calcolare `hasTemplates = recurring.length > 0`
  - [x] 8.8 Aggiungere `<ApplyTemplateButton weekStart={weekStart} hasTemplates={hasTemplates} />` in `WeekNavigator` (accanto a `CopyWeekButton`)

- [x] Task 9: Aggiornamento pagina `staff/schedule/page.tsx` (AC: #1, #5, #9)
  - [x] 9.1 Import `getRecurringShiftsForGrid` da `@/lib/queries/staff`
  - [x] 9.2 Aggiungere alla `Promise.all`: `getRecurringShiftsForGrid(tenantId)`
  - [x] 9.3 Passare `recurringShifts={recurringShifts}` a `StaffWeeklyScheduleGrid`
  - [x] 9.4 Aggiornare tipo props di `StaffWeeklyScheduleGrid` con `recurringShifts: RecurringShift[]`

## Dev Notes

### Nuovo schema DB: `user_recurring_schedules`

```typescript
// src/lib/db/schema.ts — aggiungere dopo userLocationAssignments
export const userRecurringSchedules = pgTable('user_recurring_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedì (ISO getISODay-1), 6=Domenica
  startTime: text('start_time').notNull(), // "HH:mm"
  endTime: text('end_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('urs_user_dow_start_tenant_idx').on(table.userId, table.dayOfWeek, table.startTime, table.tenantId)
])
```

Nota: `dayOfWeek` segue la stessa convenzione di `locationBusinessHours` (0=Lun ISO, `getISODay(date) - 1`). Il campo `getISODay` di `date-fns` restituisce 1=Lun…7=Dom; sottrarre 1 per allinearlo.

### Pattern `applyTemplateToWeek` (idempotenza)

Identico a `copyWeekShifts` ma la sorgente è `user_recurring_schedules` anziché `user_location_assignments` della settimana precedente. Il calcolo della data target:
```typescript
const dayOffset = dayOfWeek // 0=Lun, 1=Mar, ... 6=Dom
const targetDate = format(addDays(parseISO(weekStart), dayOffset), 'yyyy-MM-dd')
// weekStart è sempre Lunedì (startOfISOWeek)
```
Deduplication key: `userId|date|startTime|locationId` — identico a `copyWeekShifts`.

### Ottimistic updates per `recurring` state

Il pattern è identico a `shifts` state in `StaffWeeklyScheduleGrid`:
- `handleAddRecurring`: tempId → execUpsertRecurring → sostituisce tempId con id reale o rimuove su errore
- `handleUpdateRecurring`: ottimistic patch → rollback su errore
- `handleDeleteRecurring`: remove ottimistico → reinsert su errore

I ghost badge devono aggiornarsi istantaneamente senza `router.refresh()`.

### Ghost badge: quando mostrare

Logica in `ShiftCell`:
```
showGhostBadges = shifts.length === 0 && recurringShifts.length > 0
```
Se ci sono turni reali (`shifts.length > 0`), i ghost non si mostrano — il template è "coperto" dai turni reali. I ghost badge mostrano solo dove manca l'applicazione concreta del template.

### Popover ghost badge: struttura

Il Popover del ghost badge (aperto su click) deve contenere:
1. Titolo: "Orario standard" (small muted header)
2. Label: "Sede · HH:mm–HH:mm" (valori del template)
3. Pulsante primario "Crea turno per oggi" → `onAdd` con valori pre-compilati
4. Separatore
5. Pulsante secondario "Modifica template" → sostituisce il contenuto del Popover con `RecurringShiftEditor` (mode=edit) — pattern "drill-down" in Popover
6. Pulsante destructive "Elimina template" → `onDeleteRecurring`

Non usare AlertDialog per il delete del template (troppi layer): il Popover è già un contesto di azione deliberata.

### File da toccare

| File | Azione |
|------|--------|
| `src/lib/db/schema.ts` | Aggiungere `userRecurringSchedules` table |
| `src/lib/validations/staff.ts` | Aggiungere 3 nuovi schema Zod |
| `src/lib/queries/staff.ts` | Aggiungere tipo `RecurringShift` + query `getRecurringShiftsForGrid` |
| `src/lib/actions/staff.ts` | Aggiungere 3 nuove actions |
| `src/components/staff/ShiftCell.tsx` | Ghost badges + 3 nuovi callback |
| `src/components/staff/StaffWeeklyScheduleGrid.tsx` | recurring state + ottimistic + passaggio props |
| `src/app/(auth)/staff/schedule/page.tsx` | Aggiungere fetch `getRecurringShiftsForGrid` |

File da creare:
| File | Contenuto |
|------|-----------|
| `src/components/staff/RecurringShiftEditor.tsx` | Form template per dayOfWeek |
| `src/components/staff/ApplyTemplateButton.tsx` | AlertDialog + action `applyTemplateToWeek` |

### Project Structure Notes

- Tutti i nuovi componenti vanno in `src/components/staff/` — coerente con 2.10/2.11
- `upsertRecurringShiftSchema`, `deleteRecurringShiftSchema`, `applyTemplateToWeekSchema` → `src/lib/validations/staff.ts`
- `upsertRecurringShift`, `deleteRecurringShift`, `applyTemplateToWeek` → `src/lib/actions/staff.ts` (stessa action file per dominio)
- `getRecurringShiftsForGrid` → `src/lib/queries/staff.ts`
- Migrazione Drizzle: `pnpm drizzle-kit generate` crea file in `src/lib/db/migrations/`; per prod usare `pnpm drizzle-kit migrate`, per dev `pnpm db:push`
- Il `uniqueIndex` su schema Drizzle va nella quarta callback del `pgTable` — vedere pattern da `service_price_matrix` in schema.ts (usa array di constraints `(table) => [uniqueIndex(...).on(...)]`)

### Dipendenze da storie precedenti

- **`StaffWeeklyScheduleGrid`** (2.10): component base da modificare — la griglia, `ShiftCell`, `WeekNavigator` esistono già
- **`CopyWeekButton`** (2.11): `ApplyTemplateButton` segue lo stesso pattern AlterDialog + `useAction` + `router.refresh()`
- **`locationBusinessHours`** (2.5): la convenzione `dayOfWeek` (0=Lun) deve essere identica
- **`userLocationAssignments`** (2.4/2.10): `applyTemplateToWeek` produce righe in questa tabella

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-05-18.md#Sezione 3] — Descrizione story 2-12 con table schema, ghost-badge, apply-to-week
- [Source: src/components/staff/StaffWeeklyScheduleGrid.tsx] — Ottimistic update pattern (shifts state, handleAdd/Update/Delete)
- [Source: src/components/staff/ShiftCell.tsx] — Props pattern e Popover structure da estendere
- [Source: src/components/staff/CopyWeekButton.tsx] — Pattern AlertDialog + useAction + router.refresh per ApplyTemplateButton
- [Source: src/lib/actions/staff.ts#copyWeekShifts] — Algoritmo idempotenza (deduplication Set) da replicare in applyTemplateToWeek
- [Source: src/lib/db/schema.ts#locationBusinessHours] — Convenzione dayOfWeek (0=Lun, integer)
- [Source: src/lib/db/schema.ts#servicePriceMatrix] — Pattern uniqueIndex Drizzle con array callback
- [Source: src/lib/validations/staff.ts] — Pattern schema Zod con timePattern regex e refine

## Change Log

- 2026-05-18: Implementazione completa story 2.12 — DB migration user_recurring_schedules, 3 actions (upsert/delete/applyTemplate), query + tipo RecurringShift, componenti RecurringShiftEditor e ApplyTemplateButton, ghost badge in ShiftCell, recurring state con ottimistic update in StaffWeeklyScheduleGrid.
- 2026-05-18: Fix review — aggiunto entry point 'Crea template ricorrente' nel Popover + (ShiftCell): toggle addView shift/template con RecurringShiftEditor(mode='add'), visibile solo se onAddRecurring è disponibile (admin). Tutti gli AC verificati via browser testing.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- drizzle-kit migrate fallisce (enum user_role già esistente nel DB); risolto con `drizzle-kit push` che applica solo il diff schema effettivo.
- Il migration 0002 generato include anche `ALTER TABLE breeds ADD COLUMN coat_type/size_type`; `drizzle-kit push` gestisce correttamente le colonne già presenti.

### Completion Notes List

- Implementazione completa in un'unica sessione (2026-05-18).
- Task 1: Tabella `user_recurring_schedules` aggiunta a schema.ts + migration generata (0002_mature_virginia_dare.sql) + applicata via `drizzle-kit push`.
- Task 2: 3 nuovi schema Zod in validations/staff.ts (upsertRecurringShiftSchema, deleteRecurringShiftSchema, applyTemplateToWeekSchema).
- Task 3: Tipo RecurringShift + query getRecurringShiftsForGrid in queries/staff.ts.
- Task 4: 3 nuove server actions (upsertRecurringShift con overlap check, deleteRecurringShift, applyTemplateToWeek con idempotenza identica a copyWeekShifts) in actions/staff.ts.
- Task 5: RecurringShiftEditor.tsx — form RHF+Zod, header con nome giorno in italiano, Elimina solo in mode=edit.
- Task 6: ShiftCell.tsx — ghost badge con styling dashed/translucent, Popover con 3 azioni (Crea turno / Modifica template drill-down / Elimina), logica showGhostBadges = shifts.length===0 && recurring.length>0.
- Task 7: ApplyTemplateButton.tsx — AlertDialog + useAction + router.refresh(), ritorna null se !hasTemplates.
- Task 8: StaffWeeklyScheduleGrid.tsx — recurring state, getISODayOfWeekForDate, getRecurringForCell, handleAddRecurring/UpdateRecurring/DeleteRecurring con ottimistic update e rollback.
- Task 9: page.tsx — getRecurringShiftsForGrid aggiunto alla Promise.all, prop recurringShifts passata alla griglia.
- Build Next.js completato senza errori TypeScript. Linting: solo warning pre-esistenti in file non modificati.
- AC #10 (solo Admin): gestito tramite checkRole: admin nelle actions. La pagina /staff/schedule è già protetta da checkPermission('manageStaff').

### File List

- src/lib/db/schema.ts
- src/lib/validations/staff.ts
- src/lib/queries/staff.ts
- src/lib/actions/staff.ts
- src/components/staff/RecurringShiftEditor.tsx (nuovo)
- src/components/staff/ApplyTemplateButton.tsx (nuovo)
- src/components/staff/ShiftCell.tsx
- src/components/staff/StaffWeeklyScheduleGrid.tsx
- src/app/(auth)/staff/schedule/page.tsx
- drizzle/0002_mature_virginia_dare.sql (nuovo)
- drizzle/meta/0002_snapshot.json (nuovo)
- drizzle/meta/_journal.json
