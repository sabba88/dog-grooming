# Story 2.4: Assegnazione Collaboratori a Sedi e Calendario Disponibilita'

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **definire per ogni collaboratore le fasce lavorative giorno per giorno sul calendario, assegnando a ciascuna fascia una sede specifica**,
so that **l'agenda mostri le persone giuste per ogni sede e fascia oraria, e il team sappia dove e quando lavorare in ogni giornata**.

> **CC-2026-04-26:** Story riscritta. Il modello settimanale ripetitivo (`dayOfWeek`) e' sostituito da pianificazione per data specifica con fasce multiple per giorno, ciascuna con sede indipendente.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Gestione Personale
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista degli utenti attivi

2. **Given** un Amministratore seleziona un utente e clicca su una data nel calendario mensile
   **When** la data viene selezionata
   **Then** viene mostrato il pannello turni per quella data specifica con le fasce gia' configurate (se presenti)

3. **Given** un Amministratore sta visualizzando i turni di una data
   **When** aggiunge una nuova fascia specificando sede, ora inizio e ora fine
   **Then** la fascia viene salvata nella tabella `user_location_assignments` per quella data specifica con tenantId
   **And** mostra un toast "Turni aggiornati"

4. **Given** un Amministratore aggiunge una fascia per una data
   **When** la fascia si sovrappone temporalmente a una fascia gia' esistente per lo stesso utente e stessa data
   **Then** il sistema impedisce l'operazione e mostra "Fascia oraria sovrapposta a un turno esistente"

5. **Given** un Amministratore sta visualizzando i turni di una data
   **When** rimuove una fascia esistente
   **Then** la fascia viene eliminata
   **And** se era l'unica fascia, la data non mostra piu' indicatori nel calendario mensile

6. **Given** piu' fasce sono configurate per la stessa data (es. 09:00-13:00 Sede A e 15:00-18:00 Sede B)
   **When** un utente visualizza il calendario Staff
   **Then** la data mostra un indicatore con il numero di fasce configurate

7. **Given** i turni per data sono configurati
   **When** un utente visualizza l'agenda per una sede
   **Then** le colonne mostrano le persone con i rispettivi stati visivi per fascia oraria:
   - Colore pieno (#E8F0ED): persona ha una fascia attiva su questa sede in quell'orario
   - Colore chiaro (#FEF3C7): persona ha una fascia su altra sede in quell'orario
   - Stato neutro (#F9FAFB): persona non ha fasce per quella data

## Tasks / Subtasks

> **CC-2026-04-26 — Rewrite:** Tasks 1-10 erano implementati con modello `dayOfWeek`. Tasks 1R-5R sostituiscono il modello con `date` (data specifica). Tasks 6-10 (struttura pagina, navigazione) rimangono invariati e restano completati.

- [x] Task 1 (COMPLETATO — da aggiornare): Schema Drizzle `user_location_assignments` con `dayOfWeek`
- [x] Task 1R: Aggiornare schema — sostituire `dayOfWeek` con `date` (AC: #3, #7)
  - [x] 1R.1 In `src/lib/db/schema.ts`: rimuovere `dayOfWeek: integer('day_of_week').notNull()`, aggiungere `date: date('date').notNull()`
  - [x] 1R.2 Migration applicata direttamente via script Node.js + @neondatabase/serverless (drizzle-kit push richiede prompt interattivo per rename colonna)

- [x] Task 2 (COMPLETATO — da aggiornare): Schemi Zod con `dayOfWeek`
- [x] Task 2R: Aggiornare validazioni Zod (AC: #3, #4)
  - [x] 2R.1 In `src/lib/validations/staff.ts`: in `assignUserToLocationSchema` sostituire `dayOfWeek` con `date: z.string().date()`
  - [x] 2R.2 Creato `saveDayShiftsSchema` — `{ userId: uuid, date: string.date(), shifts: [{ locationId: uuid, startTime: HH:mm, endTime: HH:mm }] }`
  - [x] 2R.3 Rimosso `saveWeeklyCalendarSchema` (sostituito da `saveDayShiftsSchema`)
  - [x] 2R.4 Rimosso `dayOfWeek` da `updateAssignmentSchema`
  - [x] 2R.5 Rimossa costante `DAYS_OF_WEEK` da `staff.ts`

- [x] Task 3 (COMPLETATO — da aggiornare): Server Actions con `saveWeeklyCalendar`
- [x] Task 3R: Aggiornare Server Actions (AC: #3, #4, #5)
  - [x] 3R.1 In `src/lib/actions/staff.ts`: aggiunto `saveDayShifts` — checkRole admin, replace strategy DELETE WHERE userId+date+tenantId + INSERT shifts
  - [x] 3R.2 Aggiornato `assignUserToLocation` — parametro `date` invece di `dayOfWeek`, validazione sovrapposizione per stessa data
  - [x] 3R.3 Rimosso `saveWeeklyCalendar`

- [x] Task 4 (COMPLETATO — da aggiornare): Query con `dayOfWeek` e `getIsoDayOfWeek`
- [x] Task 4R: Aggiornare query functions (AC: #7)
  - [x] 4R.1 In `src/lib/queries/staff.ts`: aggiornato `getStaffStatusForDate` — filtro `WHERE date = specificDate`
  - [x] 4R.2 Aggiornato tipo di ritorno: `shifts: ShiftInfo[]` + `overallStatus: StaffStatus`
  - [x] 4R.3 Eliminato helper `getIsoDayOfWeek`
  - [x] 4R.4 Aggiornato `getUserAssignments` — ordine per `date` invece di `dayOfWeek`

- [x] Task 5 (COMPLETATO — da sostituire): UI `StaffScheduleCalendar` griglia settimanale
- [x] Task 5R: Creare componente `StaffCalendarEditor` per pianificazione per data (AC: #2, #3, #4, #5, #6)
  - [x] 5R.1 Creato `src/components/staff/StaffCalendarEditor.tsx` — sostituisce `StaffScheduleCalendar.tsx` (eliminato)
  - [x] 5R.2 Calendario mensile (shadcn/ui `Calendar`) con `modifiersStyles` per giorni con fasce (grassetto + sottolineatura puntata)
  - [x] 5R.3 Click su data → pannello "Turni per [data in italiano]"
  - [x] 5R.4 Pannello turni: shift cards (sede + HH:mm – HH:mm + bottone × rimuovi)
  - [x] 5R.5 Bottone "+ Aggiungi fascia" apre `AssignmentForm` con `date`
  - [x] 5R.6 Salvataggio via `saveDayShifts` — replace per la data selezionata
  - [x] 5R.7 Dialog (desktop) / Sheet (mobile) con `useIsMobile()`
  - [x] 5R.8 Aggiornato `AssignmentForm.tsx` — `date: string` + `existingShifts` per overlap check
  - [x] 5R.9 Aggiornato `StaffList.tsx` — usa `StaffCalendarEditor`, badge "X giorni"

- [x] Task 6 (COMPLETATO — invariato): Route `/staff` admin-only
- [x] Task 7 (COMPLETATO — invariato): Lista utenti StaffList (solo bottone da aggiornare al Task 5R.9)
- [x] Task 8 (COMPLETATO — aggiornare al Task 5R.8): AssignmentForm
- [x] Task 9 (COMPLETATO — invariato): Pagina `/staff/page.tsx`
- [x] Task 10 (COMPLETATO — invariato): Voce "Personale" nella navigazione

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** in TUTTE le Server Actions di mutazione — solo l'admin gestisce le assegnazioni personale
- **Il calendario NON ha logica di blocco** — un appuntamento puo' essere creato anche se la persona non e' formalmente assegnata alla sede quel giorno. Lo stato serve come informazione visiva, non come vincolo.

### Stack e Pattern dal Codice Esistente

**authActionClient (src/lib/actions/client.ts):**
```typescript
// Usa authActionClient — gia' verifica autenticazione e fornisce ctx.userId, ctx.role, ctx.tenantId
export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const session = await auth()
  if (!session?.user) throw new Error('Non autenticato')
  return next({
    ctx: { userId: session.user.id, role: session.user.role, tenantId: session.user.tenantId }
  })
})
```

**Schema Drizzle (pattern stabilito):**
```typescript
// Tutte le tabelle usano lo stesso pattern:
// - uuid('id').primaryKey().defaultRandom()
// - tenantId: uuid('tenant_id').notNull()
// - timestamp('created_at').defaultNow().notNull()
// - timestamp('updated_at').defaultNow().notNull()
// - NO foreign key constraints (FK logiche, non enforced dal DB)
```

**Server Action (pattern da src/lib/actions/locations.ts e stations.ts):**
```typescript
'use server'
export const createLocation = authActionClient
  .schema(createLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    const [result] = await db.insert(table).values({
      ...parsedInput,
      tenantId: ctx.tenantId,
    }).returning({ id: table.id, name: table.name })
    return { result }
  })
```

**Componente Form (pattern da StationForm.tsx, LocationForm.tsx):**
```typescript
'use client'
// React Hook Form + zodResolver
// useIsMobile() per Dialog/Sheet responsive
// useAction da next-safe-action/hooks con onSuccess/onError
// toast.success() / toast.error() per feedback
// form.register() per campi, form.formState.errors per errori inline
```

**Componente Lista (pattern da StationList.tsx, LocationList.tsx):**
```typescript
'use client'
// useState per form open/close e editing state
// useRouter().refresh() dopo mutazione per ricaricare dati dal server
// Desktop: Table / Mobile: Card — breakpoint md:
// Stato vuoto con messaggio + CTA
// Icone da lucide-react
```

### Design della Tabella `user_location_assignments` (CC-2026-04-26)

```typescript
// Una riga = una fascia lavorativa per una data specifica.
// Fasce multiple per lo stesso giorno = piu' righe con stesso userId + date.
// Ogni fascia puo' avere una sede diversa.
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),           // FK logica a users
  locationId: uuid('location_id').notNull(),   // FK logica a locations — sede di questa fascia
  date: date('date').notNull(),                // CC-2026-04-26: data specifica YYYY-MM-DD (non dayOfWeek ripetuto)
  startTime: text('start_time').notNull(),     // es. "09:00"
  endTime: text('end_time').notNull(),         // es. "13:00"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Perche' `date` e non `dayOfWeek`:**
- Ogni salone ha giornate diverse: festivi, chiusure, turni speciali. Il modello settimanale non li cattura.
- Le fasce multiple per lo stesso giorno sono supportate nativamente (piu' righe con stesso userId+date).
- La sede per fascia e' gia' nella struttura (ogni riga ha il suo `locationId`).

**ELIMINATO:** `dayOfWeek INTEGER` e costante `DAYS_OF_WEEK` — non piu' necessari.

**Nota orari come testo:** Salvare gli orari come stringhe "HH:mm" — gli orari di disponibilita' sono indipendenti dal timezone e dalla data. Pattern identico a `station_schedules`.

**Vincolo di business (AC #4):** Le fasce lavorative dello stesso utente nella stessa data NON possono sovrapporsi. Un utente PUO' essere assegnato a sedi diverse nello stesso giorno, purche' le fasce non si sovrappongano (es. 09:00-13:00 Sede A + 15:00-18:00 Sede B = OK; 09:00-13:00 + 11:00-14:00 = ERRORE). La validazione deve essere eseguita:
1. **Server-side:** In `assignUserToLocation` e `saveDayShifts`, verificare che le fasce del batch non si sovrappongano tra loro e con quelle esistenti per lo stesso userId+date
2. **Client-side:** In `AssignmentForm`, validare in tempo reale prima del submit

### Strategia Replace per Turni di una Data Specifica (CC-2026-04-26)

Per salvare i turni di un utente per una data specifica, usare la strategia "delete by userId+date + insert new" dentro una transazione Drizzle:

```typescript
// saveDayShifts — replace strategy per userId+date
await db.transaction(async (tx) => {
  // 1. Elimina le fasce per questo utente in questa data specifica
  await tx.delete(userLocationAssignments)
    .where(and(
      eq(userLocationAssignments.userId, userId),
      eq(userLocationAssignments.date, date),
      eq(userLocationAssignments.tenantId, tenantId)
    ))
  // 2. Inserisci le nuove fasce
  if (shifts.length > 0) {
    await tx.insert(userLocationAssignments).values(
      shifts.map(s => ({
        userId,
        locationId: s.locationId,
        date,
        startTime: s.startTime,
        endTime: s.endTime,
        tenantId,
      }))
    )
  }
})
```

**Motivazione:** Replace per data e' atomico e prevedibile. Non richiede merge/diff. Salva solo la data toccata, non l'intera storia dell'utente.

### Query per Stato Persona nell'Agenda (AC #7) — CC-2026-04-26

La query `getStaffStatusForDate` deve determinare lo stato di ogni persona per una data specifica su una sede, supportando fasce multiple per giorno:

```typescript
// Pseudocodice — ritorna array di shift per ogni utente
export async function getStaffStatusForDate(locationId: string, date: string, tenantId: string) {
  // Tutti gli utenti attivi del tenant
  const allActiveUsers = await getActiveUsers(tenantId)

  // Tutte le fasce per la data specifica (non dayOfWeek!)
  const dateShifts = await db.select({ ...userLocationAssignments, locationName: locations.name })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(and(
      eq(userLocationAssignments.tenantId, tenantId),
      eq(userLocationAssignments.date, date)  // filtro per data specifica
    ))

  // Per ogni utente, classificare le sue fasce rispetto alla sede corrente
  return allActiveUsers.map(user => {
    const userShifts = dateShifts.filter(s => s.userId === user.id)
    const shifts = userShifts.map(s => ({
      locationId: s.locationId,
      locationName: s.locationName,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.locationId === locationId ? 'active' : 'elsewhere',
    }))
    const overallStatus = shifts.length === 0 ? 'unassigned'
      : shifts.some(s => s.status === 'active') ? 'active'
      : 'elsewhere'
    return { ...user, overallStatus, shifts }
  })
}
```

**ELIMINATO:** Helper `getIsoDayOfWeek` — non piu' necessario con il filtro per data specifica.

### UX Pattern da Seguire

- **Pagina `Gestione Personale`:** Lista utenti con assegnazioni → click su utente → calendario settimanale
- **Calendario in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- **Toast con Sonner** (gia' configurato in root layout) — `toast.success()`, `toast.error()`
- **Nessuna conferma per azioni creative** (creazione e modifica assegnazioni)
- **Validazione inline al blur**, messaggi in italiano semplice
- **Touch target minimi 44x44px**
- **Stato vuoto** con messaggio + CTA
- **Badge per giorni assegnati:** Nella lista utenti, mostrare un badge colorato per ogni giorno con assegnazione, con nome sede abbreviato
- **Select per sede:** Dropdown con nome sede
- **Input orari:** Due campi `time` (apertura/chiusura) per giorno, stile identico a `StationScheduleForm`

### Design Tokens e UX

```
Primary:        var(--primary) — verde salvia #4A7C6F — bottoni CTA, link, stati attivi
Primary Light:  #E8F0ED — sfondi selezionati, hover, badge — anche "persona attiva sulla sede"
Warning:        #FEF3C7 / amber-50 — "persona assegnata ad altra sede"
Neutral:        #F9FAFB / gray-50 — "persona non assegnata"
Font:           Inter
```

**IMPORTANTE:** Usare classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`), NON colori inline. Per i badge stato:
- Attiva: `bg-emerald-50 text-emerald-700 border-emerald-200` (corrisponde a #E8F0ED)
- Altrove: `bg-amber-50 text-amber-700 border-amber-200` (corrisponde a #FEF3C7)
- Non assegnata: `bg-gray-50 text-gray-500 border-gray-200` (corrisponde a #F9FAFB)

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabella DB | snake_case plurale | `user_location_assignments` |
| Colonne DB | snake_case | `user_id`, `location_id`, `day_of_week`, `start_time` |
| Server Actions | camelCase con verbo | `assignUserToLocation`, `updateAssignment`, `removeAssignment`, `saveWeeklyCalendar` |
| Schema Zod | camelCase + Schema | `assignUserToLocationSchema`, `updateAssignmentSchema` |
| Componenti React | PascalCase | `StaffList.tsx`, `StaffScheduleCalendar.tsx`, `AssignmentForm.tsx` |
| File directory | kebab-case | `components/staff/` (nuova directory) |
| Tipi inferiti | PascalCase + FormData | `AssignUserToLocationFormData`, `UpdateAssignmentFormData` |
| Query functions | camelCase con get | `getStaffByLocation`, `getUserAssignments`, `getStaffStatusForDate` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      staff/
        page.tsx                    # CREARE: pagina Gestione Personale (Server Component)
  components/
    staff/                          # CREARE: nuova directory
      StaffList.tsx                 # CREARE: lista utenti con riepilogo assegnazioni
      StaffScheduleCalendar.tsx     # CREARE: calendario settimanale per utente
      AssignmentForm.tsx            # CREARE: form assegnazione singolo giorno
    layout/
      Sidebar.tsx                   # MODIFICARE: aggiungere voce "Personale" (solo admin)
  lib/
    actions/
      staff.ts                     # CREARE: Server Actions assegnazioni
    validations/
      staff.ts                     # CREARE: Schema Zod assegnazioni
    queries/
      staff.ts                     # CREARE: Query functions staff e assegnazioni
    db/
      schema.ts                    # MODIFICARE: aggiungere tabella user_location_assignments
    auth/
      permissions.ts               # MODIFICARE: aggiungere '/staff' a adminOnlyRoutes e 'manageStaff' a permissions
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/actions/client.ts` — authActionClient gia' configurato
- `src/components/layout/Header.tsx` — selettore sede gia' funzionante
- `src/hooks/useLocationSelector.ts` — hook sede gia' funzionante
- `src/lib/validations/stations.ts` — DAYS_OF_WEEK gia' definita, importarla se necessario

### Previous Story Intelligence

**Da Story 2.3 (Gestione Postazioni) — pattern identici da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook in `src/hooks/use-mobile.ts` per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Singolo componente gestisce sia creazione che modifica via prop opzionale
- Lista con tabella (desktop) / card (mobile) con azioni admin condizionali
- Stato vuoto con messaggio e CTA
- Server Component page: `checkPermission` + `auth()` + fetch data + render Client Component
- Replace strategy (delete all + insert) in transazione Drizzle — pattern stabile
- DAYS_OF_WEEK con convenzione ISO 8601 (0=Lunedi')

**Da Story 2.2 (Gestione Sedi):**
- `getLocations(tenantId)` — query che restituisce id, name, address. Necessaria per il select sedi nel form assegnazione.

**Da Story 1.3 (Gestione Utenze):**
- Gli utenti attivi sono recuperabili con query su tabella `users` dove `isActive = true` e filtro `tenantId`
- Pattern lista utenti con tabella/card responsive

**Da Story 1.2 (Layout e RBAC):**
- Sidebar in `src/components/layout/Sidebar.tsx` — voce di navigazione con icone lucide-react
- `adminOnlyRoutes` con pattern `startsWith` per protezione sottopagine
- Design tokens come variabili CSS — usare classi Tailwind

### Git Intelligence

Pattern commit recenti:
```
story 4-2-creazione-appuntamento-rapido: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 2-4-assegnazione-collaboratori-sedi-calendario: Task N — Descrizione breve della feature
```

**File toccati nelle story precedenti (pattern stabiliti):**
- `src/lib/db/schema.ts` — modificato per aggiungere tabelle
- `src/lib/validations/*.ts` — un file per dominio
- `src/lib/actions/*.ts` — un file per dominio
- `src/lib/queries/*.ts` — un file per dominio
- `src/components/{domain}/*.tsx` — componenti nella directory del dominio
- `src/app/(auth)/{route}/page.tsx` — una pagina per route

### Protezione Anti-Errori

- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** Le nuove assegnazioni ereditano il tenantId dall'admin che le crea (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **userId verificato:** Prima di creare un'assegnazione, verificare che `userId` sia un utente attivo appartenente al `tenantId` dell'admin corrente per evitare IDOR
- **locationId verificato:** Prima di creare un'assegnazione, verificare che `locationId` appartenga al `tenantId` dell'admin corrente per evitare IDOR
- **Vincolo un utente per sede per giorno (AC #3):** Verificare server-side che non esista un'assegnazione per lo stesso userId + dayOfWeek su una locationId diversa PRIMA dell'insert. Se si usa la replace strategy (saveWeeklyCalendar), il vincolo e' gestito automaticamente perche' si cancella tutto e si re-inserisce. Per l'assegnazione singola (assignUserToLocation), verificare esplicitamente.
- **dayOfWeek 0-6:** Validare lato server e client che il valore sia nell'intervallo 0-6
- **endTime > startTime:** Validare lato server con refine Zod
- **Nessuna eliminazione utenti correlata:** Questa story non gestisce la disattivazione utenti. Se un utente viene disattivato (Story 1.3), le sue assegnazioni restano nel DB ma non saranno visibili nella lista utenti attivi.
- **Calendario informativo:** NON implementare alcuna logica di blocco appuntamenti basata sulle assegnazioni. Lo stato serve SOLO per visualizzazione nell'agenda.
- **Transazioni per replace:** Le operazioni delete+insert su `user_location_assignments` DEVONO essere in una transazione Drizzle per evitare stati inconsistenti in caso di errore.
- **Navigazione Sidebar:** Aggiungere la voce "Personale" SOLO per admin. Usare il pattern di visibilita' condizionale gia' presente nella Sidebar per le voci admin-only.

### Componenti shadcn/ui Disponibili (gia' installati)

Tutti i componenti necessari sono gia' installati dalle story precedenti:
- `button`, `input`, `label`, `card`, `sonner` (toast) — da Story 1.1/1.2
- `sheet`, `dialog`, `select`, `badge`, `table`, `alert-dialog`, `dropdown-menu`, `skeleton`, `separator`, `scroll-area` — da Story 1.2/1.3
- `checkbox`, `tooltip` — da Story 2.3

### Testing

Nessun framework di test e' attualmente configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale:** testare tutti i flussi come admin
- **Casi critici da verificare:**
  - Lista utenti attivi mostrata correttamente con nomi, ruoli e badge assegnazioni
  - Click su "Modifica Calendario" → calendario settimanale dell'utente
  - Assegnare un utente a una sede per Lunedi' con orario 09:00-18:00 → salvataggio corretto
  - Assegnare lo STESSO utente a una DIVERSA sede per lo stesso giorno → errore "L'utente e' gia' assegnato a [nome sede] per questo giorno"
  - Assegnare lo stesso utente a sedi diverse su giorni diversi → OK, nessun errore
  - Modificare assegnazione: cambiare sede per un giorno → aggiornamento corretto
  - Modificare assegnazione: cambiare fascia oraria → aggiornamento corretto
  - Rimuovere assegnazione per un giorno → utente diventa "non assegnato"
  - Salvare calendario completo con replace strategy → tutte le assegnazioni aggiornate atomicamente
  - Stato vuoto: utente senza assegnazioni → tutti i giorni mostrano "Non assegnato"
  - Validazione: endTime prima di startTime → errore inline
  - Validazione: formato orario non HH:mm → errore inline
  - Collaboratore: non puo' accedere alla pagina /staff (redirect via adminOnlyRoutes)
  - Collaboratore: non vede la voce "Personale" nella Sidebar
  - Formattazione: giorni in italiano, orari in formato HH:mm, nomi sedi corretti

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — tabella user_location_assignments]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — directory staff/, files staff.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns — TanStack Query keys staff.*]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, naming]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8 — Calendario settimanale disponibilita' collaboratori]
- [Source: _bmad-output/planning-artifacts/prd.md#FR34 — Assegnazione utenti a sedi per giorno della settimana]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StaffScheduleCalendar — Componente calendario]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey-5 — Gestione Disponibilita' Personale]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction — Gestione Personale come prerequisito agenda]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Roadmap — Fase 1 Gestione Personale]
- [Source: _bmad-output/implementation-artifacts/2-3-gestione-postazioni-con-servizi-abilitati-e-orari.md — Pattern codice, replace strategy, DAYS_OF_WEEK]
- [Source: src/lib/db/schema.ts — Tabelle esistenti come riferimento pattern]
- [Source: src/lib/auth/permissions.ts — adminOnlyRoutes, permissions object]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/lib/validations/stations.ts — DAYS_OF_WEEK costante, pattern schema orari]
- [Source: src/components/location/StationScheduleForm.tsx — Pattern UI griglia giorni con orari]
- [Source: src/components/location/StationList.tsx — Pattern lista con tabella/card responsive]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nessun debug necessario. Implementazione completata senza blocchi.

### Completion Notes List

- Task 1: Aggiunta tabella `user_location_assignments` allo schema Drizzle con dayOfWeek ISO 8601, orari come testo HH:mm. Push al DB completato.
- Task 2: Creati schemi Zod: `assignUserToLocationSchema`, `updateAssignmentSchema`, `removeAssignmentSchema`, `saveWeeklyCalendarSchema` con validazione endTime > startTime e costante `DAYS_OF_WEEK`.
- Task 3: Create 4 Server Actions (`assignUserToLocation`, `updateAssignment`, `removeAssignment`, `saveWeeklyCalendar`) con authActionClient, checkRole admin, verifica IDOR su userId e locationId, vincolo un utente per sede per giorno.
- Task 4: Create query functions (`getActiveUsers`, `getUserAssignments`, `getAllUsersWithAssignments`, `getStaffByLocation`, `getStaffStatusForDate`) con helper `getIsoDayOfWeek`.
- Task 5: Aggiunta route `/staff` a `adminOnlyRoutes` e permesso `manageStaff` a permissions.
- Task 6: Creato `StaffList.tsx` — lista utenti con tabella (desktop) e card (mobile), badge per assegnazioni settimanali, bottone "Modifica Calendario".
- Task 7: Creato `StaffScheduleCalendar.tsx` — calendario settimanale in Dialog/Sheet responsive, draft locale con salvataggio via `saveWeeklyCalendar` (replace strategy).
- Task 8: Creato `AssignmentForm.tsx` — form con Select sede, input orari, validazione Zod, Controller per Select shadcn/ui.
- Task 9: Creata pagina `/staff/page.tsx` — Server Component con `checkPermission('manageStaff')`, carica utenti e sedi.
- Task 10: Aggiunta voce "Personale" alla Sidebar con icona `UserCog`, visibile solo per admin. Aggiunto page title mapping.

### Change Log

- 2026-03-15: Implementazione completa Story 2.4 — Assegnazione collaboratori a sedi con calendario settimanale di disponibilita'. 10 task completati.
- 2026-04-26: CC-2026-04-26 — Rewrite completato. Modello `dayOfWeek` sostituito con `date` (data specifica). Fasce multiple per giorno con sede per fascia. Tasks 1R-5R implementati. Agenda (ScheduleGrid, ScheduleTimeline, PersonHeader, AgendaView) aggiornata per multi-fascia. TypeScript clean.

### File List

- `src/lib/db/schema.ts` — Modificato: `userLocationAssignments` con `date` (CC-2026-04-26)
- `src/lib/validations/staff.ts` — Modificato: `saveDayShiftsSchema` + `date` al posto di `dayOfWeek`, rimosso `DAYS_OF_WEEK`
- `src/lib/actions/staff.ts` — Modificato: `saveDayShifts` replace-per-data, rimosso `saveWeeklyCalendar`
- `src/lib/queries/staff.ts` — Modificato: `getStaffStatusForDate` con `shifts[]` + `overallStatus`, rimosso `getIsoDayOfWeek`
- `src/lib/auth/permissions.ts` — Modificato: aggiunta '/staff' a adminOnlyRoutes, 'manageStaff' a permissions
- `src/components/staff/StaffList.tsx` — Modificato: usa `StaffCalendarEditor`, badge "X giorni"
- `src/components/staff/StaffCalendarEditor.tsx` — Nuovo: calendario mensile per data, fasce multiple per giorno (sostituisce StaffScheduleCalendar)
- `src/components/staff/AssignmentForm.tsx` — Modificato: `date: string` + `existingShifts` per overlap check
- `src/app/(auth)/staff/page.tsx` — Modificato: descrizione aggiornata
- `src/components/layout/nav-items.ts` — Modificato: aggiunta voce "Personale" con icona UserCog
- `src/components/schedule/ScheduleGrid.tsx` — Modificato: multi-fascia rendering, `overallStatus` + `shifts[]`
- `src/components/schedule/ScheduleTimeline.tsx` — Modificato: `overallStatus` per `isMovingTarget`
- `src/components/schedule/PersonHeader.tsx` — Modificato: mostra fasce attive multiple "HH:mm-HH:mm • HH:mm-HH:mm"
- `src/components/schedule/AgendaView.tsx` — Modificato: rimossa enrichment locationName (ora in `shifts[]`)
