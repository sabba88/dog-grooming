# Story 2.2: Gestione Sedi

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare e configurare le sedi del mio salone**,
so that **possa organizzare l'attivita' per sede e i collaboratori possano sapere dove lavorano**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Sedi
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista delle sedi con nome e indirizzo

2. **Given** un Amministratore clicca su "Nuova Sede"
   **When** compila il form con nome e indirizzo
   **Then** il sistema crea la sede con tenantId del salone corrente
   **And** mostra un toast "Sede creata"

3. **Given** un Amministratore seleziona una sede dalla lista
   **When** modifica nome o indirizzo e salva
   **Then** le modifiche vengono salvate
   **And** mostra un toast "Sede aggiornata"

4. **Given** esiste almeno una sede nel sistema
   **When** un utente autenticato accede all'applicazione
   **Then** l'Header mostra un selettore per la sede corrente
   **And** la sede selezionata viene mantenuta nella sessione dell'utente

## Tasks / Subtasks

- [x] Task 1: Creare tabella `locations` nello schema Drizzle e migrare il database (AC: #1, #2)
  - [x] 1.1 Aggiungere tabella `locations` in `src/lib/db/schema.ts` con campi: id (uuid PK), name (text, not null), address (text, not null), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [x] Task 2: Creare schema Zod per validazione sedi (AC: #2, #3)
  - [x] 2.1 Creare `src/lib/validations/locations.ts` — `createLocationSchema` con name (min 2 char), address (min 5 char)
  - [x] 2.2 Creare `updateLocationSchema` — id (uuid) + stessi campi di create
  - [x] 2.3 Esportare tipi inferiti `CreateLocationFormData`, `UpdateLocationFormData`

- [x] Task 3: Creare Server Actions per gestione sedi (AC: #2, #3)
  - [x] 3.1 Creare `src/lib/actions/locations.ts` con `authActionClient`
  - [x] 3.2 Implementare `createLocation` — checkRole admin, insert con tenantId dal contesto
  - [x] 3.3 Implementare `updateLocation` — checkRole admin, aggiornamento selettivo, updatedAt manuale

- [x] Task 4: Creare query functions per lista sedi (AC: #1, #4)
  - [x] 4.1 Creare `src/lib/queries/locations.ts` — `getLocations(tenantId)`: tutte le sedi del tenant, ordinate per nome
  - [x] 4.2 Creare `getLocationById(locationId, tenantId)` — singola sede per form di modifica

- [x] Task 5: Creare componente LocationForm (AC: #2, #3)
  - [x] 5.1 Creare `src/components/location/LocationForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [x] 5.2 Campi: Nome (Input), Indirizzo (Input)
  - [x] 5.3 Il form si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [x] 5.4 Validazione inline al blur, messaggi in italiano
  - [x] 5.5 Bottone primario "Crea Sede" (creazione) o "Salva Modifiche" (modifica)
  - [x] 5.6 In modalita' modifica: pre-compilare i campi con dati esistenti

- [x] Task 6: Creare la pagina Sedi completa (AC: #1)
  - [x] 6.1 Sostituire il placeholder `src/app/(auth)/settings/locations/page.tsx` — Server Component che carica la lista sedi dal database
  - [x] 6.2 Creare `src/components/location/LocationList.tsx` — Client Component con lista sedi
  - [x] 6.3 Header con titolo "Gestione Sedi" e bottone "Nuova Sede"
  - [x] 6.4 Lista in tabella (desktop) o card impilate (mobile): nome, indirizzo
  - [x] 6.5 Per ogni riga: azione "Modifica" (apre LocationForm in modalita' modifica)
  - [x] 6.6 Stato vuoto: "Nessuna sede configurata" con CTA "Aggiungi la prima sede"

- [ ] Task 7: Implementare selettore sede nell'Header (AC: #4)
  - [ ] 7.1 Creare `src/hooks/useLocationSelector.ts` — hook per gestire la sede selezionata con localStorage come persistenza
  - [ ] 7.2 Modificare `src/components/layout/Header.tsx` — aggiungere componente Select (shadcn/ui) nel placeholder gia' predisposto
  - [ ] 7.3 Il selettore mostra tutte le sedi del tenant, la sede selezionata e' evidenziata
  - [ ] 7.4 Se esiste una sola sede, il selettore mostra la sede selezionata automaticamente senza necessita' di scelta
  - [ ] 7.5 La sede selezionata viene salvata in localStorage con chiave `selectedLocationId` e letta al caricamento
  - [ ] 7.6 Se la sede salvata non esiste piu' (eliminata), selezionare automaticamente la prima sede disponibile
  - [ ] 7.7 Il selettore e' visibile a tutti i ruoli (admin e collaborator)

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** nelle Server Actions di mutazione (create, update) — solo l'admin gestisce le sedi
- **Nessuna eliminazione sedi** in questa story — le sedi saranno referenziate dalle postazioni (Story 2.3) e dall'agenda (Epica 4). Un'eventuale eliminazione richiedera' gestione delle dipendenze.
- **Pagina admin-only:** La route `/settings/locations` e' gia' in `adminOnlyRoutes` in `permissions.ts`. I collaboratori non possono accedere alla pagina di gestione sedi.
- **Selettore sede nell'Header:** Visibile a TUTTI i ruoli. La query `getLocations` non richiede checkRole — entrambi i ruoli devono vedere e selezionare la sede.

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

**Schema Zod (pattern da src/lib/validations/services.ts):**
```typescript
export const createServiceSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  price: z.number().int().positive('La tariffa deve essere maggiore di 0'),
  duration: z.number().int().positive('La durata deve essere maggiore di 0'),
})
export type CreateServiceFormData = z.infer<typeof createServiceSchema>
```

**Server Action (pattern da src/lib/actions/services.ts):**
```typescript
'use server'
export const createService = authActionClient
  .schema(createServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    const [newService] = await db.insert(services).values({
      ...parsedInput,
      tenantId: ctx.tenantId,
    }).returning({ id: services.id, name: services.name })
    return { service: newService }
  })
```

**Query (pattern da src/lib/queries/services.ts):**
```typescript
export async function getServices(tenantId: string) {
  return db.select({ id: services.id, name: services.name, /* ... */ })
    .from(services)
    .where(eq(services.tenantId, tenantId))
    .orderBy(asc(services.name))
}
```

**useAction (pattern da src/components/service/ServiceForm.tsx):**
```typescript
const { execute: executeCreate, isPending: isCreating } = useAction(createLocation, {
  onSuccess: () => {
    toast.success('Sede creata')
    form.reset()
    onOpenChange(false)
    onSuccess()
  },
  onError: (error) => {
    toast.error(error.error?.serverError || 'Errore durante la creazione')
  },
})
```

**Database schema (pattern per la nuova tabella locations):**
```typescript
// Da aggiungere in src/lib/db/schema.ts
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**RBAC (src/lib/auth/permissions.ts):**
```typescript
// Permesso 'manageLocations' GIA' DEFINITO — mappato a ['admin']
// La route '/settings/locations' GIA' in adminOnlyRoutes
// NON serve aggiungere nulla ai permessi
```

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
Success:        #22C55E — conferme
Font:           Inter
```

**IMPORTANTE:** Usare le classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`), NON colori inline. I design tokens sono variabili CSS custom in `globals.css`.

**UX Pattern da Seguire:**
- Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- Toast con Sonner (gia' configurato in root layout) — `toast.success()`, `toast.error()`
- Nessuna conferma per azioni creative (creazione, modifica)
- Validazione inline al blur, messaggi in italiano semplice
- Touch target minimi 44x44px
- Stato vuoto con messaggio + CTA
- Una sola azione primaria per schermata/modale
- Testo bottoni imperativo: "Crea Sede", "Salva Modifiche" — mai "OK" o "Si"
- **Selettore sede:** Select shadcn/ui con label chiara ("Sede"), visibile nell'Header per tutti i ruoli

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabella DB | snake_case plurale | `locations` |
| Colonne DB | snake_case | `tenant_id`, `created_at` |
| Server Actions | camelCase con verbo | `createLocation`, `updateLocation` |
| Schema Zod | camelCase + Schema | `createLocationSchema`, `updateLocationSchema` |
| Componenti React | PascalCase | `LocationForm.tsx`, `LocationList.tsx` |
| File directory | kebab-case | `components/location/` |
| Tipi inferiti | PascalCase + FormData | `CreateLocationFormData` |
| Query functions | camelCase con get | `getLocations`, `getLocationById` |
| Hook | use + PascalCase | `useLocationSelector` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      settings/
        locations/
          page.tsx              # SOSTITUIRE: placeholder -> pagina completa (Server Component)
  components/
    location/
      LocationForm.tsx          # CREARE: form creazione/modifica sede (Client Component)
      LocationList.tsx          # CREARE: lista sedi con azioni admin (Client Component)
    layout/
      Header.tsx                # MODIFICARE: aggiungere selettore sede nel placeholder gia' predisposto
  hooks/
    useLocationSelector.ts      # CREARE: hook gestione sede selezionata con localStorage
  lib/
    actions/
      locations.ts              # CREARE: Server Actions createLocation, updateLocation
    validations/
      locations.ts              # CREARE: Schema Zod createLocationSchema, updateLocationSchema
    queries/
      locations.ts              # CREARE: Query functions getLocations, getLocationById
    db/
      schema.ts                 # MODIFICARE: aggiungere tabella 'locations'
```

**File da NON modificare:**
- `src/lib/auth/permissions.ts` — il permesso `manageLocations: ['admin']` e' gia' definito, `/settings/locations` gia' in `adminOnlyRoutes`
- `src/components/layout/nav-items.ts` — il titolo `'Gestione Sedi'` per la route `/settings/locations` e' gia' presente
- `src/app/(auth)/settings/page.tsx` — gia' contiene il link alla pagina sedi

### Componenti shadcn/ui Disponibili (gia' installati)

Tutti i componenti necessari sono gia' installati da Story 1.2 e 1.3:
- `button`, `input`, `label`, `card`, `sonner` (toast) — da Story 1.1/1.2
- `sheet`, `dialog`, `select`, `badge`, `table`, `alert-dialog`, `dropdown-menu`, `skeleton`, `separator`, `scroll-area` — da Story 1.2/1.3

**NON installare componenti aggiuntivi** — tutto il necessario e' gia' presente.

### Selettore Sede — Dettagli Implementativi (AC #4)

**Strategia di persistenza:** localStorage

**Motivazione:** La sede selezionata e' una preferenza UI dell'utente, non un dato di sessione server-side. localStorage e' la scelta piu' semplice e performante:
- Zero latenza (lettura locale)
- Persiste tra sessioni del browser
- Non richiede modifiche al JWT o al database
- Sufficiente per l'MVP con max 5 utenti concorrenti

**Hook `useLocationSelector`:**
```typescript
// src/hooks/useLocationSelector.ts
// - Legge selectedLocationId da localStorage
// - Espone: selectedLocationId, setSelectedLocationId, locations (lista)
// - Se selectedLocationId non valido (sede eliminata), fallback alla prima sede
// - Se nessuna sede esiste, selectedLocationId = null
```

**Header.tsx — Integrazione:**
```typescript
// Il placeholder gia' presente in Header.tsx:
// <div className="ml-auto flex items-center gap-3">
//   {/* Spazio riservato per selettore sede (Epica 2) */}
//
// Sostituire il commento con:
// <LocationSelector /> — componente Select con le sedi del tenant
```

**Nota importante per le story future:** Il `selectedLocationId` sara' usato da Story 2.3 (Postazioni) e da tutta l'Epica 4 (Agenda) per filtrare i dati per sede. L'hook `useLocationSelector` deve essere progettato per essere riutilizzabile da qualsiasi componente dell'applicazione.

**Gestione caso "nessuna sede":**
- Se non esistono sedi, il selettore non viene mostrato (o mostra "Nessuna sede" disabilitato)
- Le pagine che dipendono dalla sede (future: Postazioni, Agenda) mostreranno un messaggio "Configura una sede prima"

### Previous Story Intelligence

**Da Story 2.1 (Gestione Listino Servizi) — pattern identico da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook in `src/hooks/use-mobile.ts` per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- ServiceForm: singolo componente gestisce sia creazione che modifica via prop `service?`
- ServiceList: tabella (desktop) / card (mobile) con azioni admin condizionali
- Stato vuoto con messaggio e CTA — riusare stesso pattern
- AlertDialog gia' installato — in questa story non serve (nessuna eliminazione)

**Da Story 1.2 (Layout e RBAC):**
- I design tokens sono variabili CSS custom — usare classi Tailwind, MAI colori inline
- `aria-label` e `aria-current` per WCAG — seguire stesso pattern nei nuovi componenti
- Header.tsx ha placeholder commento per selettore sede — utilizzare quello spazio
- Sidebar e BottomBar: il link alla pagina sedi e' gia' nel menu Impostazioni

**Da Story 1.1 (Inizializzazione e Login):**
- `next-auth@beta` (v5.0.0-beta.30) — Auth.js v5
- `next-safe-action v8` — API middleware con `.use()` chain
- Sonner per toast (non `toast` deprecato)
- Schema `users` con pattern colonne: `uuid('id').primaryKey().defaultRandom()`, `timestamp('created_at').defaultNow().notNull()`

### Git Intelligence

Pattern commit recenti:
```
story 2-1-gestione-listino-servizi: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 2-2-gestione-sedi: Task N — Descrizione breve della feature
```

**File toccati nelle story precedenti (pattern stabiliti):**
- `src/lib/db/schema.ts` — modificato per aggiungere tabelle
- `src/lib/validations/*.ts` — un file per dominio
- `src/lib/actions/*.ts` — un file per dominio
- `src/lib/queries/*.ts` — un file per dominio
- `src/components/{domain}/*.tsx` — una directory per dominio con componenti specifici
- `src/app/(auth)/{route}/page.tsx` — una pagina per route

### Protezione Anti-Errori

- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** Le nuove sedi ereditano il tenantId dall'admin che le crea (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **Nessuna eliminazione:** Non implementare `deleteLocation` in questa story. Le sedi saranno referenziate da postazioni (FK) a partire da Story 2.3. Se si implementa ora, il dev potrebbe eliminare una sede usata come FK.
- **Ruolo nella UI:** La pagina `/settings/locations` e' gia' protetta da `adminOnlyRoutes` nel middleware — il collaboratore viene reindirizzato automaticamente. Non serve ulteriore logica di protezione nella pagina.
- **localStorage e SSR:** `useLocationSelector` deve gestire il caso SSR (localStorage non disponibile). Usare un `useEffect` per leggere da localStorage dopo il mount, evitando errori di hydration mismatch.
- **Sede selezionata e multi-tab:** Se l'utente cambia sede in una tab, le altre tab non si aggiornano automaticamente con localStorage. Per l'MVP questo e' accettabile. Se necessario in futuro, usare l'evento `storage` di Window per sincronizzare.

### Testing

Nessun framework di test e' attualmente configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale:** testare tutti i flussi come admin
- **Casi critici da verificare:**
  - Creazione sede con nome e indirizzo validi → salvataggio nel DB con tenantId
  - Validazione form: nome vuoto, indirizzo vuoto → errori inline
  - Modifica sede → dati aggiornati correttamente
  - Stato vuoto: nessuna sede → messaggio appropriato con CTA
  - Selettore sede nell'Header: appare dopo creazione prima sede
  - Selettore sede: persiste la scelta dopo refresh pagina (localStorage)
  - Selettore sede: fallback alla prima sede se quella salvata non esiste piu'
  - Collaboratore: non puo' accedere alla pagina gestione sedi (redirect)
  - Collaboratore: vede il selettore sede nell'Header (sola lettura della sede)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId su tutte le entita']
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — Organizzazione progetto]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — Naming conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gerarchia-Bottoni]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Feedback — Toast Sonner]
- [Source: _bmad-output/planning-artifacts/prd.md#FR5 — Creazione e configurazione sedi]
- [Source: _bmad-output/implementation-artifacts/2-1-gestione-listino-servizi.md — Pattern codice, file list, completion notes]
- [Source: src/lib/db/schema.ts — Tabelle users, services come riferimento pattern]
- [Source: src/lib/auth/permissions.ts — manageLocations gia' definito, /settings/locations in adminOnlyRoutes]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/components/layout/Header.tsx — Placeholder per selettore sede]
- [Source: src/app/(auth)/settings/locations/page.tsx — Placeholder da sostituire]
- [Source: src/app/(auth)/settings/page.tsx — Link a pagina sedi gia' presente]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1: Aggiunta tabella `locations` in schema.ts con campi id, name, address, tenantId, createdAt, updatedAt. Schema pushato al database con drizzle-kit push.
- Task 2: Creato `src/lib/validations/locations.ts` con createLocationSchema (name min 2, address min 5), updateLocationSchema (+ id). Tipi inferiti CreateLocationFormData, UpdateLocationFormData esportati.
- Task 3: Creato `src/lib/actions/locations.ts` con createLocation e updateLocation. Entrambe con authActionClient, checkRole admin, tenantId dal contesto. updateLocation aggiorna updatedAt manualmente.
- Task 4: Creato `src/lib/queries/locations.ts` con getLocations(tenantId) e getLocationById(locationId, tenantId). Query con select esplicito, filtro tenantId, ordinamento per nome asc.
- Task 5: Creato `src/components/location/LocationForm.tsx` — Client Component con Dialog (desktop) e Sheet (mobile). React Hook Form + Zod resolver, supporto creazione/modifica via prop `location?`. useAction hooks per createLocation/updateLocation con toast feedback.
- Task 6: Sostituito placeholder in `page.tsx` con Server Component che carica sedi dal DB. Creato `LocationList.tsx` con tabella (desktop) e card (mobile), header con titolo e bottone "Nuova Sede", azione "Modifica" per riga, stato vuoto con CTA. Nessuna eliminazione (come da story).

### File List

- `src/lib/db/schema.ts` — Modificato: aggiunta tabella `locations`
- `src/lib/validations/locations.ts` — Creato: schema Zod per validazione sedi
- `src/lib/actions/locations.ts` — Creato: Server Actions createLocation, updateLocation
- `src/lib/queries/locations.ts` — Creato: Query functions getLocations, getLocationById
- `src/components/location/LocationForm.tsx` — Creato: form creazione/modifica sede con Dialog/Sheet responsive
- `src/components/location/LocationList.tsx` — Creato: lista sedi con tabella/card responsive e azioni admin
- `src/app/(auth)/settings/locations/page.tsx` — Modificato: sostituito placeholder con pagina completa
