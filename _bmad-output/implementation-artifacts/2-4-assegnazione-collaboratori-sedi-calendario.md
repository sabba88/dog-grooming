# Story 2.4: Assegnazione Collaboratori a Sedi e Calendario Disponibilita'

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **assegnare collaboratori e amministratori alle sedi con un calendario settimanale di disponibilita'**,
so that **l'agenda mostri le persone giuste per ogni sede e giorno, e il team sappia dove lavorare**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Gestione Personale
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista degli utenti attivi con le loro assegnazioni settimanali

2. **Given** un Amministratore seleziona un utente
   **When** configura il calendario settimanale assegnando sede e fascia oraria per ogni giorno della settimana
   **Then** le assegnazioni vengono salvate nella tabella `user_location_assignments` con tenantId
   **And** mostra un toast "Calendario aggiornato"

3. **Given** un Amministratore assegna un utente a una sede per un giorno
   **When** l'utente e' gia' assegnato a un'altra sede nello stesso giorno
   **Then** il sistema impedisce l'operazione e mostra un messaggio "L'utente e' gia' assegnato a [nome sede] per questo giorno"

4. **Given** un Amministratore modifica l'assegnazione di un utente
   **When** cambia sede o fascia oraria per un giorno specifico
   **Then** le modifiche vengono salvate
   **And** l'agenda riflette la nuova assegnazione

5. **Given** un Amministratore rimuove l'assegnazione di un utente per un giorno
   **When** conferma la rimozione
   **Then** l'utente risulta "non assegnato" per quel giorno
   **And** nell'agenda la sua colonna mostra lo stato neutro (non assegnato)

6. **Given** il calendario settimanale e' configurato
   **When** un utente visualizza l'agenda per una sede
   **Then** le colonne mostrano le persone associate alla sede con i rispettivi stati visivi:
   - Colore pieno (#E8F0ED): persona attiva sulla sede per quel giorno
   - Colore chiaro (#FEF3C7): persona assegnata ad altra sede per quel giorno
   - Stato neutro (#F9FAFB): persona non assegnata per quel giorno

## Tasks / Subtasks

- [x] Task 1: Creare tabella `user_location_assignments` nello schema Drizzle (AC: #1, #2, #6)
  - [x] 1.1 Aggiungere tabella `user_location_assignments` in `src/lib/db/schema.ts` con campi: id (uuid PK), userId (uuid, not null), locationId (uuid, not null), dayOfWeek (integer 0-6, not null), startTime (text "HH:mm", not null), endTime (text "HH:mm", not null), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [x] Task 2: Creare schemi Zod per validazione assegnazioni (AC: #2, #3, #4, #5)
  - [x] 2.1 Creare `src/lib/validations/staff.ts` — `assignUserToLocationSchema` con userId (uuid), locationId (uuid), dayOfWeek (0-6), startTime ("HH:mm"), endTime ("HH:mm")
  - [x] 2.2 Creare `updateAssignmentSchema` — id (uuid) + locationId (uuid), startTime, endTime
  - [x] 2.3 Creare `removeAssignmentSchema` — id (uuid)
  - [x] 2.4 Aggiungere refine: endTime > startTime
  - [x] 2.5 Riutilizzare costante DAYS_OF_WEEK da `validations/stations.ts` oppure estrarla in un file condiviso
  - [x] 2.6 Esportare tipi inferiti per tutti gli schemi

- [x] Task 3: Creare Server Actions per gestione assegnazioni (AC: #2, #3, #4, #5)
  - [x] 3.1 Creare `src/lib/actions/staff.ts` con `authActionClient`
  - [x] 3.2 Implementare `assignUserToLocation` — checkRole admin, verifica che l'utente NON sia gia' assegnato a un'altra sede nello stesso dayOfWeek (AC #3), insert con tenantId
  - [x] 3.3 Implementare `updateAssignment` — checkRole admin, verifica ownership (tenantId), aggiornamento sede/orari
  - [x] 3.4 Implementare `removeAssignment` — checkRole admin, verifica ownership, delete
  - [x] 3.5 Implementare `saveWeeklyCalendar` — checkRole admin, replace strategy per tutte le assegnazioni di un utente (delete all + insert new in transazione)

- [x] Task 4: Creare query functions per assegnazioni (AC: #1, #6)
  - [x] 4.1 Creare `src/lib/queries/staff.ts` — `getStaffByLocation(locationId, tenantId)`: utenti attivi associati alla sede con le loro assegnazioni settimanali
  - [x] 4.2 Creare `getUserAssignments(userId, tenantId)`: tutte le assegnazioni settimanali di un utente (con nome sede in JOIN)
  - [x] 4.3 Creare `getActiveUsers(tenantId)`: lista utenti attivi del tenant
  - [x] 4.4 Creare `getStaffStatusForDate(locationId, date, tenantId)`: stato assegnazione di ogni persona per una data specifica (per l'agenda, AC #6)

- [x] Task 5: Aggiungere route `/staff` alle route admin-only (AC: #1)
  - [x] 5.1 Aggiungere `'/staff'` all'array `adminOnlyRoutes` in `src/lib/auth/permissions.ts`
  - [x] 5.2 Aggiungere permesso `manageStaff: ['admin']` all'oggetto `permissions`

- [x] Task 6: Creare componente StaffList per lista utenti con assegnazioni (AC: #1)
  - [x] 6.1 Creare `src/components/staff/StaffList.tsx` — Client Component
  - [x] 6.2 Lista utenti attivi con nome, ruolo, riepilogo assegnazioni settimanali (badge per ogni giorno con nome sede)
  - [x] 6.3 Per ogni utente: bottone "Modifica Calendario" che apre il calendario settimanale
  - [x] 6.4 Desktop: tabella con colonne Nome, Ruolo, Lun, Mar, Mer, Gio, Ven, Sab, Dom, Azioni
  - [x] 6.5 Mobile: card con nome, ruolo e badge giorni assegnati
  - [x] 6.6 Stato vuoto: "Nessun utente attivo" (caso improbabile ma gestito)

- [x] Task 7: Creare componente StaffScheduleCalendar per calendario settimanale (AC: #2, #3, #4, #5)
  - [x] 7.1 Creare `src/components/staff/StaffScheduleCalendar.tsx` — Client Component
  - [x] 7.2 Griglia 7 giorni (Lunedi' → Domenica) — ogni cella mostra: sede assegnata (nome), fascia oraria (HH:mm - HH:mm), oppure "Non assegnato"
  - [x] 7.3 Celle vuote toccabili/cliccabili per aggiungere assegnazione — apre AssignmentForm
  - [x] 7.4 Celle con assegnazione: azioni "Modifica" e "Rimuovi"
  - [x] 7.5 Pre-compilare con assegnazioni esistenti dell'utente selezionato
  - [x] 7.6 Si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [x] 7.7 Header con nome utente e ruolo
  - [x] 7.8 Bottone "Salva Calendario" che usa la saveWeeklyCalendar action (replace strategy)

- [x] Task 8: Creare componente AssignmentForm per assegnazione singolo giorno (AC: #2, #3)
  - [x] 8.1 Creare `src/components/staff/AssignmentForm.tsx` — Client Component con React Hook Form + Zod
  - [x] 8.2 Select per sede (lista sedi del tenant)
  - [x] 8.3 Input orario inizio (HH:mm) e fine (HH:mm)
  - [x] 8.4 Validazione: endTime > startTime, formato HH:mm
  - [x] 8.5 Validazione conflitto: se l'utente ha gia' un'assegnazione per quel giorno su un'altra sede, mostrare errore (AC #3)
  - [x] 8.6 Si apre in Dialog/Sheet responsive
  - [x] 8.7 Bottone "Assegna" / "Salva Modifiche"

- [x] Task 9: Creare pagina Gestione Personale (AC: #1)
  - [x] 9.1 Creare `src/app/(auth)/staff/page.tsx` — Server Component che carica utenti attivi + assegnazioni + sedi
  - [x] 9.2 Header: "Gestione Personale" con descrizione
  - [x] 9.3 Render StaffList con dati dal server
  - [x] 9.4 `checkPermission('manageStaff')` con redirect se non admin

- [x] Task 10: Aggiungere voce "Personale" alla navigazione (AC: #1)
  - [x] 10.1 Aggiungere voce "Personale" nella Sidebar desktop (dopo "Servizi", solo per admin)
  - [x] 10.2 Aggiungere icona Users da lucide-react
  - [x] 10.3 Verificare che il Collaboratore NON veda la voce "Personale"

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

### Design della Tabella `user_location_assignments`

```typescript
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),           // FK logica a users
  locationId: uuid('location_id').notNull(),   // FK logica a locations
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi', 1=Martedi', ..., 6=Domenica (ISO 8601)
  startTime: text('start_time').notNull(),     // es. "09:00"
  endTime: text('end_time').notNull(),         // es. "18:00"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**ATTENZIONE dayOfWeek:** L'architettura doc specifica `// 0=dom, 1=lun, ..., 6=sab` (convenzione JavaScript), MA il codice esistente in `validations/stations.ts` usa la convenzione ISO 8601 (0=Lunedi', 6=Domenica). **SEGUIRE la convenzione ISO 8601 (0=Monday)** per coerenza con il codice esistente e con la cultura italiana (lunedi' e' il primo giorno della settimana). Riutilizzare la costante `DAYS_OF_WEEK` gia' definita in `validations/stations.ts`.

**Nota orari come testo:** Salvare gli orari come stringhe "HH:mm" — gli orari di disponibilita' sono indipendenti dal timezone e dalla data. Pattern identico a `station_schedules`.

**Vincolo di business (AC #3):** Un utente NON puo' essere assegnato a piu' sedi nello stesso giorno. La validazione deve essere eseguita:
1. **Server-side:** Nella Server Action, verificare che non esista gia' un'assegnazione per lo stesso userId + dayOfWeek su una locationId diversa
2. **Client-side:** Nel form, quando l'utente seleziona una sede per un giorno gia' assegnato, mostrare l'errore immediatamente

### Strategia Replace per Calendario Completo

Per salvare il calendario settimanale completo di un utente, usare la strategia "delete all + insert new" dentro una transazione Drizzle (stessa strategia usata in Story 2.3 per `station_services` e `station_schedules`):

```typescript
// saveWeeklyCalendar — replace strategy
await db.transaction(async (tx) => {
  // 1. Elimina tutte le assegnazioni attuali dell'utente
  await tx.delete(userLocationAssignments)
    .where(and(
      eq(userLocationAssignments.userId, userId),
      eq(userLocationAssignments.tenantId, tenantId)
    ))
  // 2. Inserisci le nuove assegnazioni
  if (assignments.length > 0) {
    await tx.insert(userLocationAssignments).values(
      assignments.map(a => ({
        userId,
        locationId: a.locationId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        tenantId,
      }))
    )
  }
})
```

**Motivazione:** Max 7 righe per utente (una per giorno). Replace e' piu' semplice e prevedibile di un merge/diff.

### Query per Stato Persona nell'Agenda (AC #6)

La query `getStaffStatusForDate` deve determinare lo stato di ogni persona per una data specifica su una sede:

```typescript
// Pseudocodice
export async function getStaffStatusForDate(locationId: string, date: Date, tenantId: string) {
  const dayOfWeek = getIsoDayOfWeek(date) // 0=Lun, 6=Dom

  // Tutti gli utenti attivi del tenant
  const allActiveUsers = await getActiveUsers(tenantId)

  // Tutte le assegnazioni per il dayOfWeek corrente
  const todayAssignments = await db.select(...)
    .from(userLocationAssignments)
    .where(and(
      eq(userLocationAssignments.tenantId, tenantId),
      eq(userLocationAssignments.dayOfWeek, dayOfWeek)
    ))

  // Per ogni utente, determinare lo stato rispetto alla sede selezionata:
  // - "active": assegnato a QUESTA sede per questo giorno → #E8F0ED
  // - "elsewhere": assegnato a UN'ALTRA sede per questo giorno → #FEF3C7
  // - "unassigned": nessuna assegnazione per questo giorno → #F9FAFB
  return allActiveUsers.map(user => ({
    ...user,
    status: determineStatus(user.id, locationId, todayAssignments),
    assignment: findAssignment(user.id, todayAssignments),
  }))
}
```

**IMPORTANTE:** La funzione `getIsoDayOfWeek(date)` deve convertire il giorno JavaScript (0=Dom) in ISO (0=Lun):
```typescript
// JavaScript: new Date().getDay() → 0=Dom, 1=Lun, ..., 6=Sab
// ISO 8601 / DB: 0=Lun, 1=Mar, ..., 6=Dom
export function getIsoDayOfWeek(date: Date): number {
  const jsDay = date.getDay() // 0=Dom, 1=Lun, ..., 6=Sab
  return jsDay === 0 ? 6 : jsDay - 1 // Converti: Dom→6, Lun→0, Mar→1, ...
}
```

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

### File List

- `src/lib/db/schema.ts` — Modificato: aggiunta tabella `userLocationAssignments`
- `src/lib/validations/staff.ts` — Nuovo: schemi Zod per assegnazioni, costante DAYS_OF_WEEK
- `src/lib/actions/staff.ts` — Nuovo: Server Actions (assign, update, remove, saveWeeklyCalendar)
- `src/lib/queries/staff.ts` — Nuovo: query functions (getActiveUsers, getUserAssignments, getAllUsersWithAssignments, getStaffByLocation, getStaffStatusForDate)
- `src/lib/auth/permissions.ts` — Modificato: aggiunta '/staff' a adminOnlyRoutes, 'manageStaff' a permissions
- `src/components/staff/StaffList.tsx` — Nuovo: componente lista utenti con assegnazioni
- `src/components/staff/StaffScheduleCalendar.tsx` — Nuovo: calendario settimanale per utente
- `src/components/staff/AssignmentForm.tsx` — Nuovo: form assegnazione singolo giorno
- `src/app/(auth)/staff/page.tsx` — Nuovo: pagina Gestione Personale
- `src/components/layout/nav-items.ts` — Modificato: aggiunta voce "Personale" con icona UserCog
