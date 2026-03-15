# Story 2.3: Gestione Postazioni con Servizi Abilitati

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare postazioni per ogni sede e assegnare i servizi abilitati**,
so that **possa definire le entita' fisiche del salone e quali servizi sono eseguibili su ciascuna**.

## Acceptance Criteria

1. **Given** un Amministratore e' nella pagina di una sede
   **When** la sezione postazioni viene renderizzata
   **Then** viene mostrata la lista delle postazioni con nome e servizi abilitati

2. **Given** un Amministratore clicca su "Nuova Postazione"
   **When** compila il form con nome della postazione
   **Then** il sistema crea la postazione associata alla sede corrente con tenantId
   **And** mostra un toast "Postazione creata"

3. **Given** un Amministratore seleziona una postazione
   **When** assegna i servizi abilitati selezionandoli dal listino (creato in Story 2.1)
   **Then** i servizi vengono associati alla postazione
   **And** solo questi servizi saranno prenotabili su questa postazione

4. **Given** un Amministratore modifica i servizi abilitati di una postazione
   **When** salva le modifiche
   **Then** le modifiche vengono applicate
   **And** mostra un toast "Postazione aggiornata"

## Tasks / Subtasks

- [x] Task 1: Rimuovere tabella `station_schedules` dallo schema Drizzle e applicare migrazione (AC: #1)
  - [x] 1.1 Rimuovere la definizione `stationSchedules` da `src/lib/db/schema.ts`
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare la rimozione della tabella al database di sviluppo

- [x] Task 2: Rimuovere validazione e tipi relativi agli orari (AC: #3, #4)
  - [x] 2.1 Rimuovere `DAYS_OF_WEEK`, `timeRegex`, `scheduleEntrySchema`, `updateStationScheduleSchema`, `UpdateStationScheduleFormData` da `src/lib/validations/stations.ts`
  - [x] 2.2 Mantenere intatti: `createStationSchema`, `updateStationSchema`, `updateStationServicesSchema` e relativi tipi

- [x] Task 3: Rimuovere Server Action `updateStationSchedule` e import orari (AC: #4)
  - [x] 3.1 Rimuovere l'import `updateStationScheduleSchema` e `stationSchedules` da `src/lib/actions/stations.ts`
  - [x] 3.2 Rimuovere l'intera funzione `updateStationSchedule` da `src/lib/actions/stations.ts`
  - [x] 3.3 Mantenere intatte: `createStation`, `updateStation`, `updateStationServices`

- [x] Task 4: Rimuovere query function `getStationSchedule` e riferimenti schedule (AC: #1)
  - [x] 4.1 Rimuovere import `stationSchedules` da `src/lib/queries/stations.ts`
  - [x] 4.2 Rimuovere la funzione `getStationSchedule` da `src/lib/queries/stations.ts`
  - [x] 4.3 Aggiornare `getStationsByLocation` — rimuovere la query `scheduleRows` e i campi `schedulesCount`/`schedules` dal return
  - [x] 4.4 Mantenere intatte: `getStationById`, `getStationServices`, `getServicesForStation`

- [x] Task 5: Rimuovere componente `StationScheduleForm` (AC: #1, #4)
  - [x] 5.1 Eliminare il file `src/components/location/StationScheduleForm.tsx`

- [x] Task 6: Aggiornare `StationList` — rimuovere riferimenti orari e aggiornare badge incompleta (AC: #1, #3)
  - [x] 6.1 Rimuovere import `StationScheduleForm` e `Clock` da `StationList.tsx`
  - [x] 6.2 Rimuovere import `DAYS_OF_WEEK` da `StationList.tsx`
  - [x] 6.3 Rimuovere `ScheduleEntry` interface e la funzione `formatScheduleSummary`
  - [x] 6.4 Rimuovere i campi `schedulesCount` e `schedules` dalla `Station` interface — mantenere solo `id`, `name`, `locationId`, `servicesCount`
  - [x] 6.5 Rimuovere lo state `scheduleFormOpen`/`scheduleStation` e la funzione `handleSchedule`
  - [x] 6.6 Rimuovere la colonna "Orari" dalla tabella desktop (TableHead + TableCell)
  - [x] 6.7 Rimuovere il bottone "Orari" sia dalla tabella desktop che dalle card mobile
  - [x] 6.8 Rimuovere il rendering di `StationScheduleForm` in fondo al componente
  - [x] 6.9 Aggiornare la logica `isIncomplete` — ora una postazione e' incompleta solo se `servicesCount === 0` (rimosso il check su `schedulesCount`)
  - [x] 6.10 Aggiornare il testo del Tooltip/mobile da "Aggiungi servizi e orari" a "Aggiungi servizi per rendere la postazione prenotabile"

- [x] Task 7: Aggiornare pagina dettaglio sede `[id]/page.tsx` — rimuovere dati schedule dal fetch (AC: #1)
  - [x] 7.1 In `src/app/(auth)/settings/locations/[id]/page.tsx` — nessuna modifica necessaria (la pagina non fetcha schedule direttamente; il cambiamento e' in `getStationsByLocation` che non restituisce piu' schedule)
  - [x] 7.2 Verificare che il componente `StationList` riceva i props corretti dopo la modifica dell'interfaccia `Station`

## Dev Notes

### Contesto: Story di Semplificazione

Questa story **sostituisce** la precedente `2-3-gestione-postazioni-con-servizi-abilitati-e-orari.md`. A seguito della Change Proposal CC-2026-03-14 (approvata), il modello organizzativo del salone e' cambiato da **postazioni con orari** a **persone con calendario disponibilita'**. Gli orari non sono piu' sulle postazioni — vengono gestiti dalla nuova Story 2.4 tramite `user_location_assignments`.

**Cosa si rimuove:** Tutto cio' che riguarda `station_schedules` — tabella DB, schema Zod, Server Action, query, componente form, colonna tabella UI, logica badge.

**Cosa si mantiene:** Tutto cio' che riguarda `stations` e `station_services` — creazione/modifica postazioni, assegnazione servizi abilitati.

### Architettura e Pattern Obbligatori

- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** in TUTTE le Server Actions di mutazione — solo l'admin gestisce postazioni
- **Pagina admin-only:** La route `/settings/locations/[id]` e' coperta da `adminOnlyRoutes` in `permissions.ts` via `startsWith`
- **Replace strategy per junction tables:** `station_services` usa DELETE + INSERT — mantenere invariato
- **Prezzi in centesimi, durate in minuti:** La `StationServicesForm` gia' formatta correttamente

### Codice Esistente da Modificare

**`src/lib/db/schema.ts` — RIMUOVERE `stationSchedules`:**
```typescript
// RIMUOVERE completamente queste righe (53-62):
export const stationSchedules = pgTable('station_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  openTime: text('open_time').notNull(),
  closeTime: text('close_time').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**`src/lib/validations/stations.ts` — RIMUOVERE schema orari:**
```typescript
// RIMUOVERE: DAYS_OF_WEEK, timeRegex, scheduleEntrySchema, updateStationScheduleSchema, UpdateStationScheduleFormData
// MANTENERE: createStationSchema, updateStationSchema, updateStationServicesSchema e relativi tipi
```

**`src/lib/actions/stations.ts` — RIMUOVERE action orari:**
```typescript
// RIMUOVERE: import updateStationScheduleSchema, import stationSchedules
// RIMUOVERE: intera funzione updateStationSchedule
// MANTENERE: createStation, updateStation, updateStationServices
```

**`src/lib/queries/stations.ts` — RIMUOVERE query orari:**
```typescript
// RIMUOVERE: import stationSchedules
// RIMUOVERE: funzione getStationSchedule
// AGGIORNARE: getStationsByLocation — rimuovere scheduleRows query e schedulesCount/schedules dal return
// MANTENERE: getStationById, getStationServices, getServicesForStation
```

**`src/components/location/StationScheduleForm.tsx` — ELIMINARE file intero**

**`src/components/location/StationList.tsx` — AGGIORNARE:**
```typescript
// RIMUOVERE: import StationScheduleForm, Clock, DAYS_OF_WEEK
// RIMUOVERE: interface ScheduleEntry, funzione formatScheduleSummary
// RIMUOVERE: campi schedulesCount/schedules dalla Station interface
// RIMUOVERE: state scheduleFormOpen/scheduleStation, handleSchedule
// RIMUOVERE: colonna "Orari" da tabella e bottone "Orari" da card
// RIMUOVERE: rendering StationScheduleForm
// AGGIORNARE: isIncomplete — solo servicesCount === 0
// AGGIORNARE: testo badge "Aggiungi servizi per rendere la postazione prenotabile"
```

### File che NON Devono Essere Modificati

- `src/components/location/StationForm.tsx` — invariato, gestisce solo nome postazione
- `src/components/location/StationServicesForm.tsx` — invariato, gestisce servizi abilitati
- `src/components/location/LocationForm.tsx` — invariato
- `src/components/location/LocationList.tsx` — invariato (ha gia' bottone "Postazioni")
- `src/lib/actions/client.ts` — authActionClient invariato
- `src/lib/auth/permissions.ts` — route gia' protetta

### Verifica Post-Rimozione

Dopo la rimozione degli orari, verificare che:
1. **Nessun import rotto:** Cercare `stationSchedules`, `StationScheduleForm`, `getStationSchedule`, `updateStationSchedule`, `updateStationScheduleSchema`, `DAYS_OF_WEEK`, `ScheduleEntry` nel codebase — devono risultare zero occorrenze
2. **Build passa:** `npm run build` senza errori TypeScript
3. **Migrazione DB:** `npx drizzle-kit push` rimuove la tabella `station_schedules`
4. **UI funzionante:** La lista postazioni mostra nome + servizi senza orari, badge "Incompleta" solo per servizi mancanti

### Stack e Pattern dal Codice Esistente

**authActionClient (src/lib/actions/client.ts):**
```typescript
export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const session = await auth()
  if (!session?.user) throw new Error('Non autenticato')
  return next({
    ctx: { userId: session.user.id, role: session.user.role, tenantId: session.user.tenantId }
  })
})
```

**Pattern Server Actions mantenute:**
```typescript
// createStation, updateStation, updateStationServices — tutti funzionanti, non toccare
```

**Pattern Query mantenute:**
```typescript
// getStationById, getStationServices, getServicesForStation — tutti funzionanti, non toccare
// getStationsByLocation — rimuovere SOLO la parte scheduleRows e schedulesCount/schedules
```

### Design Tokens e UX

```
Warning:        #F59E0B / text-amber-600 bg-amber-50 border-amber-200 — badge "Incompleta"
```

La logica badge cambia: **Incompleta** = postazione senza servizi abilitati (era: senza servizi O senza orari).
Il testo del Tooltip cambia da "Aggiungi servizi e orari per rendere la postazione prenotabile" a "Aggiungi servizi per rendere la postazione prenotabile".

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle DB | snake_case plurale | `stations`, `station_services` |
| Server Actions | camelCase con verbo | `createStation`, `updateStationServices` |
| Schema Zod | camelCase + Schema | `createStationSchema`, `updateStationServicesSchema` |
| Componenti React | PascalCase | `StationForm.tsx`, `StationList.tsx`, `StationServicesForm.tsx` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      settings/
        locations/
          [id]/
            page.tsx              # ESISTENTE — verificare che compili dopo cambio interfaccia
  components/
    location/
      StationForm.tsx           # ESISTENTE — NON modificare
      StationList.tsx           # MODIFICARE — rimuovere orari, aggiornare badge
      StationServicesForm.tsx   # ESISTENTE — NON modificare
      StationScheduleForm.tsx   # ELIMINARE
  lib/
    actions/
      stations.ts              # MODIFICARE — rimuovere updateStationSchedule
    validations/
      stations.ts              # MODIFICARE — rimuovere schema orari
    queries/
      stations.ts              # MODIFICARE — rimuovere getStationSchedule, aggiornare getStationsByLocation
    db/
      schema.ts                # MODIFICARE — rimuovere stationSchedules
```

### Previous Story Intelligence

**Da Story 2.3 vecchia (con orari) — codice implementato:**
- Tutte le 3 tabelle (`stations`, `station_services`, `station_schedules`) sono nel DB e nello schema
- Tutti i componenti, actions, queries, validazioni sono implementati e funzionanti
- `StationScheduleForm` usa `useAction` + `useForm` + Dialog/Sheet responsive
- `StationList` ha logica completa con 3 bottoni azioni (Modifica, Servizi, Orari) e badge incompleta
- La pagina `[id]/page.tsx` fetcha stations e services, passa tutto a `StationList`

**Da Story 2.2 (Gestione Sedi):**
- `router.refresh()` per ricaricare dati dopo mutazione
- `useIsMobile()` hook per responsive Dialog/Sheet
- Pattern errore: `error.error?.serverError`

### Git Intelligence

Pattern commit recenti:
```
story 4-2-creazione-appuntamento-rapido: Task N — Descrizione breve
story 4-1-vista-agenda-per-sede-e-postazione: Task N — Descrizione breve
```

**Pattern da seguire per i commit di questa story (semplificazione):**
```
story 2-3-gestione-postazioni-con-servizi-abilitati: Task N — Descrizione breve
```

### Attenzione: Impatto su Epica 4 (Build Break)

La rimozione di `stationSchedules` dallo schema **rompe la build** in 2 file dell'Epica 4:

1. **`src/lib/actions/appointments.ts`** (riga 13): importa `stationSchedules` e lo usa per verificare gli orari della postazione durante la creazione appuntamento (righe 44-52, 167-174)
2. **`src/lib/queries/appointments.ts`** (riga 2): importa `stationSchedules` e lo usa per mostrare gli orari nella vista agenda (righe 62-70)

**Azione richiesta per fix build (scope minimo):**
1. Rimuovere `stationSchedules` dagli import in entrambi i file
2. Rimuovere/commentare il codice che usa `stationSchedules` con commento `// TODO: Story 4.x — riscrittura agenda per persone`
3. Se il codice e' in una funzione che ritorna dati usati dalla UI, ritornare valori vuoti/default al posto dei dati schedule
4. **Non riscrivere la logica dell'agenda** — e' fuori scope

La tabella `appointments` attualmente ha `stationId` come `notNull()`. La Change Proposal prevede che diventi opzionale e che si aggiunga `userId`. **Questo NON e' scope di questa story** — sara' gestito nelle story 4.x riscritte.

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-14.md — Sezione 4.1, 4.5]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3 — Nuovi AC senza orari]
- [Source: _bmad-output/planning-artifacts/architecture.md — station_schedules rimossa]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6 — Postazioni come entita' fisiche]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7 — Servizi abilitati per postazione]
- [Source: _bmad-output/implementation-artifacts/2-3-gestione-postazioni-con-servizi-abilitati-e-orari.md — Codice vecchio]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Nessun problema di debug riscontrato.

### Completion Notes List

- Rimossa tabella `station_schedules` dallo schema Drizzle e dal database (drizzle-kit push)
- Rimossi schema Zod per orari (DAYS_OF_WEEK, timeRegex, scheduleEntrySchema, updateStationScheduleSchema)
- Rimossa Server Action `updateStationSchedule` e relativi import
- Rimossa query `getStationSchedule`, aggiornata `getStationsByLocation` (senza schedule)
- Eliminato componente `StationScheduleForm.tsx`
- Aggiornato `StationList.tsx`: rimossi colonna Orari, bottone Orari, state schedule, interfaccia ScheduleEntry, formatScheduleSummary. Badge "Incompleta" ora solo per servizi mancanti.
- Fix build break Epica 4: aggiornati `appointments.ts` (actions e queries) per rimuovere riferimenti a `stationSchedules` con valori default e TODO per Story 4.x
- Verificato zero occorrenze di `stationSchedules`, `StationScheduleForm`, `getStationSchedule`, `DAYS_OF_WEEK`, `ScheduleEntry` in src/
- TypeScript compila senza errori nuovi (errore preesistente in clients/[id] non correlato)

### File List

- `src/lib/db/schema.ts` — rimossa definizione `stationSchedules`
- `src/lib/validations/stations.ts` — rimossi DAYS_OF_WEEK, timeRegex, scheduleEntrySchema, updateStationScheduleSchema
- `src/lib/actions/stations.ts` — rimossa funzione updateStationSchedule e import relativi
- `src/lib/queries/stations.ts` — rimossa getStationSchedule, aggiornata getStationsByLocation
- `src/components/location/StationScheduleForm.tsx` — ELIMINATO
- `src/components/location/StationList.tsx` — rimossi tutti i riferimenti orari, aggiornato badge
- `src/lib/actions/appointments.ts` — rimosso import stationSchedules, fix findAlternativeSlots e createAppointment
- `src/lib/queries/appointments.ts` — rimosso import stationSchedules, aggiornata getStationsWithScheduleForDay con default

### Change Log

- 2026-03-15: Story completata — Rimosso tutto il codice relativo a `station_schedules` (schema, validazione, actions, queries, componenti UI). Fix build break Epica 4 con valori default e TODO per riscrittura.
