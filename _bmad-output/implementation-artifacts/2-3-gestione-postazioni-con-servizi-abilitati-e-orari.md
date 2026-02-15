# Story 2.3: Gestione Postazioni con Servizi Abilitati e Orari

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare postazioni per ogni sede, assegnare i servizi abilitati e definire gli orari di apertura**,
so that **il salone sia completamente configurato e pronto per prendere appuntamenti**.

## Acceptance Criteria

1. **Given** un Amministratore e' nella pagina di una sede
   **When** la sezione postazioni viene renderizzata
   **Then** viene mostrata la lista delle postazioni con nome, servizi abilitati e orari

2. **Given** un Amministratore clicca su "Nuova Postazione"
   **When** compila il form con nome della postazione
   **Then** il sistema crea la postazione associata alla sede corrente con tenantId
   **And** mostra un toast "Postazione creata"

3. **Given** un Amministratore seleziona una postazione
   **When** assegna i servizi abilitati selezionandoli dal listino (creato in Story 2.1)
   **Then** i servizi vengono associati alla postazione
   **And** solo questi servizi saranno prenotabili su questa postazione

4. **Given** un Amministratore seleziona una postazione
   **When** definisce gli orari di apertura e chiusura per ogni giorno della settimana
   **Then** gli orari vengono salvati
   **And** determinano le fasce orarie disponibili nell'agenda per questa postazione

5. **Given** un Amministratore modifica servizi abilitati o orari di una postazione
   **When** salva le modifiche
   **Then** le modifiche vengono applicate
   **And** mostra un toast "Postazione aggiornata"

6. **Given** una postazione non ha servizi abilitati o orari definiti
   **When** un utente visualizza l'agenda
   **Then** la postazione non mostra slot prenotabili fino a completamento della configurazione

## Tasks / Subtasks

- [x] Task 1: Creare tabelle `stations`, `station_services` e `station_schedules` nello schema Drizzle (AC: #1, #2, #3, #4)
  - [x] 1.1 Aggiungere tabella `stations` in `src/lib/db/schema.ts` con campi: id (uuid PK), name (text, not null), locationId (uuid, not null), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Aggiungere tabella `station_services` (junction many-to-many) con campi: id (uuid PK), stationId (uuid, not null), serviceId (uuid, not null), tenantId (uuid, not null), createdAt
  - [x] 1.3 Aggiungere tabella `station_schedules` con campi: id (uuid PK), stationId (uuid, not null), dayOfWeek (integer 0-6, not null), openTime (text "HH:mm", not null), closeTime (text "HH:mm", not null), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.4 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [x] Task 2: Creare schemi Zod per validazione postazioni, servizi abilitati e orari (AC: #2, #3, #4, #5)
  - [x] 2.1 Creare `src/lib/validations/stations.ts` — `createStationSchema` con name (min 2 char), locationId (uuid)
  - [x] 2.2 Creare `updateStationSchema` — id (uuid) + name (min 2 char)
  - [x] 2.3 Creare `updateStationServicesSchema` — stationId (uuid), serviceIds (array di uuid)
  - [x] 2.4 Creare `updateStationScheduleSchema` — stationId (uuid), schedules (array di oggetti {dayOfWeek 0-6, openTime "HH:mm", closeTime "HH:mm"})
  - [x] 2.5 Esportare tipi inferiti per tutti gli schemi

- [ ] Task 3: Creare Server Actions per gestione postazioni (AC: #2, #3, #4, #5)
  - [ ] 3.1 Creare `src/lib/actions/stations.ts` con `authActionClient`
  - [ ] 3.2 Implementare `createStation` — checkRole admin, insert con tenantId e locationId dal contesto/input
  - [ ] 3.3 Implementare `updateStation` — checkRole admin, aggiornamento nome, updatedAt manuale
  - [ ] 3.4 Implementare `updateStationServices` — checkRole admin, delete+insert bulk per la junction table (replace strategy)
  - [ ] 3.5 Implementare `updateStationSchedule` — checkRole admin, delete+insert bulk per gli orari settimanali (replace strategy)

- [ ] Task 4: Creare query functions per postazioni (AC: #1, #3, #4, #6)
  - [ ] 4.1 Creare `src/lib/queries/stations.ts` — `getStationsByLocation(locationId, tenantId)`: tutte le postazioni di una sede con servizi abilitati e orari
  - [ ] 4.2 Creare `getStationById(stationId, tenantId)` — singola postazione con servizi e orari per form di configurazione
  - [ ] 4.3 Creare `getStationServices(stationId, tenantId)` — lista serviceId abilitati per una postazione
  - [ ] 4.4 Creare `getStationSchedule(stationId, tenantId)` — orari settimanali di una postazione

- [ ] Task 5: Creare componente StationForm per creazione/modifica postazione (AC: #2, #5)
  - [ ] 5.1 Creare `src/components/location/StationForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [ ] 5.2 Campo: Nome postazione (Input)
  - [ ] 5.3 Il form si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [ ] 5.4 Validazione inline al blur, messaggi in italiano
  - [ ] 5.5 Bottone primario "Crea Postazione" (creazione) o "Salva Modifiche" (modifica)
  - [ ] 5.6 In modalita' modifica: pre-compilare il nome con dati esistenti

- [ ] Task 6: Creare componente StationServicesForm per assegnazione servizi (AC: #3, #5)
  - [ ] 6.1 Creare `src/components/location/StationServicesForm.tsx` — Client Component
  - [ ] 6.2 Lista checkbox di tutti i servizi disponibili (dal listino, Story 2.1) con nome, durata e prezzo formattati
  - [ ] 6.3 Pre-selezionare i servizi gia' abilitati sulla postazione
  - [ ] 6.4 Bottone "Salva Servizi" che invoca `updateStationServices` con gli ID selezionati
  - [ ] 6.5 Toast "Servizi aggiornati" al salvataggio
  - [ ] 6.6 Il form si apre in Dialog (desktop) o Sheet (mobile)

- [ ] Task 7: Creare componente StationScheduleForm per orari settimanali (AC: #4, #5)
  - [ ] 7.1 Creare `src/components/location/StationScheduleForm.tsx` — Client Component
  - [ ] 7.2 Griglia con 7 righe (Lunedi' → Domenica), ciascuna con campi Apertura (HH:mm) e Chiusura (HH:mm)
  - [ ] 7.3 Possibilita' di lasciare un giorno senza orari (giorno chiuso) — non inserire riga per quel giorno
  - [ ] 7.4 Pre-compilare con orari esistenti se la postazione ha gia' un schedule
  - [ ] 7.5 Validazione: orario chiusura deve essere dopo apertura, formato HH:mm valido
  - [ ] 7.6 Bottone "Salva Orari" che invoca `updateStationSchedule`
  - [ ] 7.7 Toast "Orari aggiornati" al salvataggio
  - [ ] 7.8 Il form si apre in Dialog (desktop) o Sheet (mobile)

- [ ] Task 8: Creare pagina dettaglio sede con lista postazioni (AC: #1)
  - [ ] 8.1 Creare `src/app/(auth)/settings/locations/[id]/page.tsx` — Server Component che carica sede + postazioni + servizi dal database
  - [ ] 8.2 Creare `src/components/location/StationList.tsx` — Client Component con lista postazioni
  - [ ] 8.3 Header con titolo "Postazioni di [nome sede]" e bottone "Nuova Postazione"
  - [ ] 8.4 Per ogni postazione: mostrare nome, badge con numero servizi abilitati, riepilogo orari
  - [ ] 8.5 Per ogni postazione: azioni "Modifica", "Servizi", "Orari" — ciascuna apre il rispettivo form
  - [ ] 8.6 Stato vuoto: "Nessuna postazione configurata" con CTA "Aggiungi la prima postazione"
  - [ ] 8.7 Aggiungere bottone "Gestisci Postazioni" nella lista sedi (LocationList.tsx) per navigare a questa pagina

- [ ] Task 9: Aggiungere indicatore "postazione incompleta" per AC #6
  - [ ] 9.1 Se una postazione non ha servizi abilitati O non ha orari definiti, mostrare un badge di avviso "Configurazione incompleta" in arancione
  - [ ] 9.2 Tooltip o testo sotto il badge: "Aggiungi servizi e orari per rendere la postazione prenotabile"

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** in TUTTE le Server Actions di mutazione — solo l'admin gestisce postazioni, servizi abilitati e orari
- **Pagina admin-only:** La route `/settings/locations/[id]` e' coperta da `adminOnlyRoutes` in `permissions.ts` che matcha `/settings/locations/*` — i collaboratori non possono accedere
- **Replace strategy per junction tables:** Quando si aggiornano i servizi abilitati o gli orari, fare DELETE + INSERT in una transazione — piu' semplice e sicuro di un merge/diff
- **Prezzi in centesimi:** Quando si mostrano i servizi nella checkbox list, formattare il prezzo da centesimi a EUR (`€ 15,00`)
- **Durata in minuti:** Formattare la durata del servizio in modo leggibile (es. "60 min")

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

**Schema Drizzle (pattern stabilito per le 3 tabelle esistenti: users, services, locations):**
```typescript
// Tutte le tabelle usano lo stesso pattern:
// - uuid('id').primaryKey().defaultRandom()
// - tenantId: uuid('tenant_id').notNull()
// - timestamp('created_at').defaultNow().notNull()
// - timestamp('updated_at').defaultNow().notNull()
```

**Server Action (pattern da src/lib/actions/locations.ts):**
```typescript
'use server'
export const createLocation = authActionClient
  .schema(createLocationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    const [newLocation] = await db.insert(locations).values({
      ...parsedInput,
      tenantId: ctx.tenantId,
    }).returning({ id: locations.id, name: locations.name })
    return { location: newLocation }
  })
```

**Query (pattern da src/lib/queries/locations.ts):**
```typescript
export async function getLocations(tenantId: string) {
  return db.select({ id: locations.id, name: locations.name, /* ... */ })
    .from(locations)
    .where(eq(locations.tenantId, tenantId))
    .orderBy(asc(locations.name))
}
```

**Componente Form (pattern da src/components/location/LocationForm.tsx):**
```typescript
'use client'
// React Hook Form + zodResolver
// useIsMobile() per Dialog/Sheet responsive
// useAction da next-safe-action/hooks con onSuccess/onError
// toast.success() / toast.error() per feedback
// form.register() per campi, form.formState.errors per errori inline
// Singolo componente gestisce sia creazione che modifica via prop opzionale
```

**Componente Lista (pattern da src/components/location/LocationList.tsx):**
```typescript
'use client'
// useState per form open/close e editing state
// useRouter().refresh() dopo mutazione per ricaricare dati dal server
// Desktop: Table / Mobile: Card — breakpoint md:
// Stato vuoto con messaggio + CTA
// Icone da lucide-react
```

**Page (pattern da src/app/(auth)/settings/locations/page.tsx):**
```typescript
// Server Component
// checkPermission('manageLocations') con redirect
// auth() per tenantId
// Fetch data e passa a Client Component
```

### Design della Tabella `stations`

```typescript
export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locationId: uuid('location_id').notNull(),  // FK logica a locations
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Nota FK:** Il progetto NON usa foreign key constraints in Drizzle (le tabelle esistenti `users`, `services`, `locations` non hanno `.references()`). Mantenere lo stesso pattern — FK logiche, non enforced dal DB. L'integrita' referenziale e' gestita a livello applicativo.

### Design della Tabella `station_services` (Junction Many-to-Many)

```typescript
export const stationServices = pgTable('station_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').notNull(),   // FK logica a stations
  serviceId: uuid('service_id').notNull(),   // FK logica a services
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Design della Tabella `station_schedules`

```typescript
export const stationSchedules = pgTable('station_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').notNull(),   // FK logica a stations
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi', 1=Martedi', ..., 6=Domenica
  openTime: text('open_time').notNull(),      // "09:00"
  closeTime: text('close_time').notNull(),    // "18:00"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Nota dayOfWeek:** Usare convenzione ISO 8601 — 0=Lunedi', 6=Domenica. NON usare la convenzione JavaScript (0=Domenica). In Italia il primo giorno della settimana e' Lunedi'.

**Nota orari come testo:** Salvare gli orari come stringhe "HH:mm" anziche' timestamp. Motivazione: gli orari di apertura sono indipendenti dal timezone e dalla data. "09:00" significa sempre le 9 del mattino locale. Usare timestamp introdurrebbe complessita' inutile con timezone.

### Strategia Replace per Aggiornamento Servizi/Orari

Per aggiornare i servizi abilitati e gli orari di una postazione, usare la strategia "delete all + insert new" dentro una transazione Drizzle:

```typescript
// Esempio per updateStationServices
await db.transaction(async (tx) => {
  // 1. Elimina tutti i servizi attuali della postazione
  await tx.delete(stationServices)
    .where(and(
      eq(stationServices.stationId, stationId),
      eq(stationServices.tenantId, tenantId)
    ))
  // 2. Inserisci i nuovi servizi selezionati
  if (serviceIds.length > 0) {
    await tx.insert(stationServices).values(
      serviceIds.map(serviceId => ({
        stationId,
        serviceId,
        tenantId,
      }))
    )
  }
})
```

**Motivazione:** Piu' semplice e prevedibile di un merge/diff. Con poche righe (max ~20 servizi), la performance e' identica. Evita bug di sincronizzazione.

### UX Pattern da Seguire

- **Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- **Toast con Sonner** (gia' configurato in root layout) — `toast.success()`, `toast.error()`
- **Nessuna conferma per azioni creative** (creazione, modifica, salvataggio servizi/orari)
- **Validazione inline al blur**, messaggi in italiano semplice
- **Touch target minimi 44x44px**
- **Stato vuoto** con messaggio + CTA
- **Testo bottoni imperativo:** "Crea Postazione", "Salva Servizi", "Salva Orari" — mai "OK" o "Si"
- **Badge per configurazione incompleta:** Badge arancione (warning) con testo "Incompleta" se mancano servizi o orari
- **Checkbox per servizi:** Ogni servizio mostra nome, durata formattata ("60 min"), prezzo formattato ("€ 15,00")
- **Griglia orari:** 7 righe (Lun-Dom), ciascuna con input orario apertura e chiusura. Giorno chiuso = riga vuota/disabilitata.

### Design Tokens e UX

```
Primary:        var(--primary) — verde salvia #4A7C6F — bottoni CTA, link, stati attivi
Primary Light:  #E8F0ED — sfondi selezionati, hover, badge
Primary Dark:   #345A50 — hover bottoni
Background:     var(--background) — #FFFFFF
Surface:        var(--card) — #F8FAFB — sfondo card, pannelli
Border:         var(--border) — #E2E8F0 — bordi, separatori
Text Primary:   var(--foreground) — #1A202C — testo principale
Text Secondary: var(--muted-foreground) — #64748B — label, testo secondario
Text Muted:     #94A3B8 — placeholder
Error:          var(--destructive) — #EF4444 — errori, azioni distruttive
Warning:        #F59E0B — badge "Incompleta", avvisi configurazione
Success:        #22C55E — conferme
Font:           Inter
```

**IMPORTANTE:** Usare le classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`), NON colori inline. Per il warning badge, usare `text-amber-600 bg-amber-50 border-amber-200`.

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle DB | snake_case plurale | `stations`, `station_services`, `station_schedules` |
| Colonne DB | snake_case | `station_id`, `location_id`, `day_of_week`, `open_time` |
| Server Actions | camelCase con verbo | `createStation`, `updateStationServices`, `updateStationSchedule` |
| Schema Zod | camelCase + Schema | `createStationSchema`, `updateStationServicesSchema` |
| Componenti React | PascalCase | `StationForm.tsx`, `StationList.tsx`, `StationServicesForm.tsx`, `StationScheduleForm.tsx` |
| File directory | kebab-case | `components/location/` (riusare directory location esistente) |
| Tipi inferiti | PascalCase + FormData | `CreateStationFormData`, `UpdateStationServicesFormData` |
| Query functions | camelCase con get | `getStationsByLocation`, `getStationSchedule` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      settings/
        locations/
          page.tsx              # ESISTENTE: lista sedi (aggiungere link "Gestisci Postazioni")
          [id]/
            page.tsx            # CREARE: dettaglio sede con lista postazioni (Server Component)
  components/
    location/
      LocationForm.tsx          # ESISTENTE — non modificare
      LocationList.tsx          # MODIFICARE: aggiungere bottone "Gestisci Postazioni" per ogni sede
      StationForm.tsx           # CREARE: form creazione/modifica postazione
      StationList.tsx           # CREARE: lista postazioni con azioni (modifica, servizi, orari)
      StationServicesForm.tsx   # CREARE: form checkbox servizi abilitati
      StationScheduleForm.tsx   # CREARE: form griglia orari settimanali
  lib/
    actions/
      stations.ts              # CREARE: Server Actions createStation, updateStation, updateStationServices, updateStationSchedule
    validations/
      stations.ts              # CREARE: Schema Zod per tutte le operazioni su postazioni
    queries/
      stations.ts              # CREARE: Query functions getStationsByLocation, getStationById, etc.
    db/
      schema.ts                # MODIFICARE: aggiungere tabelle stations, station_services, station_schedules
    utils/
      formatting.ts            # CREARE (o verificare se esiste): formatPrice(), formatDuration()
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/auth/permissions.ts` — `/settings/locations/*` gia' coperto da adminOnlyRoutes via `startsWith`
- `src/lib/actions/client.ts` — authActionClient gia' configurato
- `src/components/layout/Header.tsx` — selettore sede gia' funzionante
- `src/hooks/useLocationSelector.ts` — hook sede gia' funzionante

### Allineamento con la Struttura del Progetto

- I componenti delle postazioni vanno nella directory `components/location/` (NON creare una nuova directory `components/station/`). L'architettura organizza per feature/dominio e le postazioni sono una sotto-feature delle sedi.
- Le Server Actions vanno in un file separato `actions/stations.ts` (NON in `actions/locations.ts`). Motivazione: il file locations.ts gestisce le sedi; le postazioni hanno sufficiente complessita' (3 tabelle, 4 actions) per un file dedicato.
- Le validazioni vanno in `validations/stations.ts` separato.
- Le query vanno in `queries/stations.ts` separato.

### Previous Story Intelligence

**Da Story 2.2 (Gestione Sedi) — pattern identici da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook in `src/hooks/use-mobile.ts` per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Singolo componente gestisce sia creazione che modifica via prop opzionale (es. `station?`)
- Lista con tabella (desktop) / card (mobile) con azioni admin condizionali
- Stato vuoto con messaggio e CTA
- Server Component page: `checkPermission` + `auth()` + fetch data + render Client Component

**Da Story 2.1 (Gestione Listino Servizi):**
- La lista dei servizi e' in `getServices(tenantId)` — query che restituisce id, name, price, duration
- I prezzi sono in centesimi (integer) nel DB — formattare per la UI
- Le durate sono in minuti (integer) nel DB

**Da Story 1.2 (Layout e RBAC):**
- I design tokens sono variabili CSS custom — usare classi Tailwind, MAI colori inline
- `aria-label` e `aria-current` per WCAG — seguire stesso pattern nei nuovi componenti
- AdminOnlyRoutes: `/settings/locations` matcha con `startsWith` — `/settings/locations/[id]` e' gia' protetto

### Git Intelligence

Pattern commit recenti:
```
story 2-2-gestione-sedi: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 2-3-gestione-postazioni: Task N — Descrizione breve della feature
```

**File toccati nelle story precedenti (pattern stabiliti):**
- `src/lib/db/schema.ts` — modificato per aggiungere tabelle
- `src/lib/validations/*.ts` — un file per dominio
- `src/lib/actions/*.ts` — un file per dominio
- `src/lib/queries/*.ts` — un file per dominio
- `src/components/{domain}/*.tsx` — componenti nella directory del dominio
- `src/app/(auth)/{route}/page.tsx` — una pagina per route

### Utility di Formattazione

Creare (se non esiste) `src/lib/utils/formatting.ts` con:

```typescript
/**
 * Formatta un prezzo in centesimi come stringa EUR.
 * 1500 → "€ 15,00"
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/**
 * Formatta una durata in minuti come stringa leggibile.
 * 60 → "60 min"
 * 90 → "1h 30min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
```

### Giorni della Settimana — Costanti

```typescript
// Definire in stations.ts (validations) o in un file condiviso
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunedi\'' },
  { value: 1, label: 'Martedi\'' },
  { value: 2, label: 'Mercoledi\'' },
  { value: 3, label: 'Giovedi\'' },
  { value: 4, label: 'Venerdi\'' },
  { value: 5, label: 'Sabato' },
  { value: 6, label: 'Domenica' },
] as const
```

### Protezione Anti-Errori

- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** Le nuove postazioni ereditano il tenantId dall'admin che le crea (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **locationId verificato:** Prima di creare una postazione, verificare che la `locationId` appartenga al `tenantId` dell'admin corrente per evitare IDOR
- **serviceId verificati:** Prima di salvare i servizi abilitati, verificare che tutti i `serviceId` appartengano al `tenantId` dell'admin corrente
- **Orario chiusura > apertura:** Validare lato server che `closeTime > openTime` per ogni giorno
- **dayOfWeek unico per postazione:** Non deve essere possibile avere due righe con lo stesso dayOfWeek per la stessa postazione — la replace strategy lo garantisce
- **Nessuna eliminazione postazioni:** Non implementare `deleteStation` in questa story. Le postazioni saranno referenziate dagli appuntamenti (Epica 4). Un'eventuale eliminazione richiedera' gestione delle dipendenze.
- **localStorage sede:** Il `useLocationSelector` gia' funzionante fornisce la sede corrente. Nella pagina dettaglio sede, usare il `[id]` dalla URL, NON il selettore dell'Header.
- **Transazioni per replace:** Le operazioni delete+insert su `station_services` e `station_schedules` DEVONO essere in una transazione Drizzle per evitare stati inconsistenti in caso di errore.

### Componenti shadcn/ui Disponibili (gia' installati)

Tutti i componenti necessari sono gia' installati dalle story precedenti:
- `button`, `input`, `label`, `card`, `sonner` (toast) — da Story 1.1/1.2
- `sheet`, `dialog`, `select`, `badge`, `table`, `alert-dialog`, `dropdown-menu`, `skeleton`, `separator`, `scroll-area` — da Story 1.2/1.3
- `checkbox` — **VERIFICARE se installato**, altrimenti installare con `npx shadcn@latest add checkbox`
- `tooltip` — **VERIFICARE se installato**, altrimenti installare con `npx shadcn@latest add tooltip`

### Testing

Nessun framework di test e' attualmente configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale:** testare tutti i flussi come admin
- **Casi critici da verificare:**
  - Creazione postazione con nome valido → salvataggio nel DB con tenantId e locationId corretti
  - Validazione form: nome vuoto → errore inline
  - Modifica nome postazione → dati aggiornati correttamente
  - Assegnazione servizi: selezionare 3 servizi → tutti salvati nella junction table
  - Assegnazione servizi: deselezionare un servizio → rimosso dalla junction table
  - Assegnazione servizi: nessun servizio selezionato → junction table vuota, badge "Incompleta"
  - Orari: definire orari per 5 giorni (Lun-Ven) → salvati correttamente
  - Orari: giorno senza orari (Sabato, Domenica) → nessuna riga in station_schedules
  - Orari: chiusura prima di apertura → errore validazione
  - Stato vuoto: nessuna postazione per una sede → messaggio appropriato con CTA
  - Badge "Incompleta": postazione senza servizi O senza orari → badge arancione visibile
  - Badge assente: postazione con servizi E orari configurati → nessun badge warning
  - Navigazione: da lista sedi, click "Gestisci Postazioni" → pagina dettaglio sede corretta
  - Collaboratore: non puo' accedere alla pagina postazioni (redirect via adminOnlyRoutes)
  - Formattazione: prezzi in EUR, durate in minuti, giorni in italiano

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId, Drizzle pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — directory organization]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping — FR5-FR8 → locations]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gerarchia-Bottoni]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Feedback — Toast Sonner]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6 — Creazione postazioni per sede]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7 — Assegnazione servizi abilitati a postazione]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8 — Definizione orari apertura/chiusura postazione]
- [Source: _bmad-output/implementation-artifacts/2-2-gestione-sedi.md — Pattern codice, file list, completion notes]
- [Source: src/lib/db/schema.ts — Tabelle users, services, locations come riferimento pattern]
- [Source: src/lib/auth/permissions.ts — manageLocations, adminOnlyRoutes con startsWith]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/lib/actions/locations.ts — Pattern Server Actions con authActionClient]
- [Source: src/lib/validations/locations.ts — Pattern Schema Zod]
- [Source: src/lib/queries/locations.ts — Pattern Query functions]
- [Source: src/components/location/LocationForm.tsx — Pattern form con Dialog/Sheet responsive]
- [Source: src/components/location/LocationList.tsx — Pattern lista con tabella/card responsive]
- [Source: src/app/(auth)/settings/locations/page.tsx — Pattern Server Component page]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- ✅ Task 1: Aggiunte tabelle `stations`, `station_services`, `station_schedules` allo schema Drizzle. Push al DB completato.
- ✅ Task 2: Creati schemi Zod con validazione (createStation, updateStation, updateStationServices, updateStationSchedule). Include costante DAYS_OF_WEEK, regex HH:mm, refine closeTime > openTime.

### File List

- `src/lib/db/schema.ts` (modified)
- `src/lib/validations/stations.ts` (new)
