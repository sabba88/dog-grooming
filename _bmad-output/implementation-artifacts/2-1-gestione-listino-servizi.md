# Story 2.1: Gestione Listino Servizi

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare e gestire il listino dei servizi del mio salone specificando nome, tariffa e tempo di esecuzione**,
so that **possa definire l'offerta del salone e i collaboratori possano consultarla**.

As a **Collaboratore**,
I want **consultare il listino servizi in sola lettura**,
so that **possa conoscere l'offerta del salone durante il lavoro**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Servizi
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista dei servizi con nome, tariffa (in EUR) e tempo di esecuzione

2. **Given** un Amministratore clicca su "Nuovo Servizio"
   **When** compila il form con nome, tariffa e tempo di esecuzione
   **Then** il sistema crea il servizio con tenantId del salone corrente e prezzo salvato in centesimi nel database
   **And** mostra un toast "Servizio creato"

3. **Given** un Amministratore compila il form servizio
   **When** lascia campi obbligatori vuoti o inserisce valori non validi (tariffa <= 0, tempo <= 0)
   **Then** il sistema mostra errori di validazione inline in italiano

4. **Given** un Amministratore seleziona un servizio dalla lista
   **When** modifica nome, tariffa o tempo e salva
   **Then** le modifiche vengono salvate
   **And** mostra un toast "Servizio aggiornato"

5. **Given** un Amministratore seleziona un servizio dalla lista
   **When** clicca su "Elimina"
   **Then** viene mostrato un Alert Dialog di conferma "Eliminare il servizio [nome]?"
   **And** dopo conferma il servizio viene eliminato
   **And** mostra un toast "Servizio eliminato"

6. **Given** un Collaboratore accede alla pagina Servizi
   **When** la pagina viene renderizzata
   **Then** vede la lista dei servizi in sola lettura, senza opzioni di creazione, modifica o eliminazione

## Tasks / Subtasks

- [x] Task 1: Creare tabella `services` nello schema Drizzle e migrare il database (AC: #1, #2)
  - [x] 1.1 Aggiungere tabella `services` in `src/lib/db/schema.ts` con campi: id (uuid PK), name (text, not null), price (integer, not null — centesimi), duration (integer, not null — minuti), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [ ] Task 2: Creare schema Zod per validazione servizi (AC: #2, #3, #4)
  - [ ] 2.1 Creare `src/lib/validations/services.ts` — `createServiceSchema` con name (min 2 char), price (numero > 0, in EUR — convertito in centesimi prima del salvataggio), duration (intero > 0, minuti)
  - [ ] 2.2 Creare `updateServiceSchema` — id (uuid) + stessi campi di create
  - [ ] 2.3 Creare `deleteServiceSchema` — id (uuid)
  - [ ] 2.4 Esportare tipi inferiti `CreateServiceFormData`, `UpdateServiceFormData`

- [ ] Task 3: Creare Server Actions per gestione servizi (AC: #2, #3, #4, #5)
  - [ ] 3.1 Creare `src/lib/actions/services.ts` con `authActionClient`
  - [ ] 3.2 Implementare `createService` — checkRole admin, insert con tenantId dal contesto, prezzo ricevuto in centesimi
  - [ ] 3.3 Implementare `updateService` — checkRole admin, aggiornamento selettivo, updatedAt manuale
  - [ ] 3.4 Implementare `deleteService` — checkRole admin, eliminazione hard delete (non soft delete — i servizi non contengono dati personali GDPR)

- [ ] Task 4: Creare query functions per lista servizi (AC: #1, #6)
  - [ ] 4.1 Creare `src/lib/queries/services.ts` — `getServices(tenantId)`: tutti i servizi del tenant, ordinati per nome
  - [ ] 4.2 Creare `getServiceById(serviceId, tenantId)` — singolo servizio per form di modifica

- [ ] Task 5: Creare componente ServiceForm (AC: #2, #3, #4)
  - [ ] 5.1 Creare `src/components/service/ServiceForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [ ] 5.2 Campi: Nome (Input), Tariffa (Input type="number", in EUR con step 0.01 — conversione centesimi nel submit), Durata (Input type="number", in minuti)
  - [ ] 5.3 Il form si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [ ] 5.4 Validazione inline al blur, messaggi in italiano
  - [ ] 5.5 Bottone primario "Crea Servizio" (creazione) o "Salva Modifiche" (modifica)
  - [ ] 5.6 In modalita' modifica: pre-compilare i campi con dati esistenti (prezzo convertito da centesimi a EUR per display)

- [ ] Task 6: Creare la pagina Servizi completa (AC: #1, #6)
  - [ ] 6.1 Sostituire il placeholder `src/app/(auth)/services/page.tsx` — Server Component che carica la lista servizi e il ruolo utente dalla sessione
  - [ ] 6.2 Creare `src/components/service/ServiceList.tsx` — Client Component con lista servizi
  - [ ] 6.3 Se ruolo admin: header con titolo "Servizi" e bottone "Nuovo Servizio", azioni per riga (Modifica, Elimina)
  - [ ] 6.4 Se ruolo collaborator: header con solo titolo "Servizi", nessun bottone, nessuna azione — solo lettura
  - [ ] 6.5 Lista in tabella (desktop) o card impilate (mobile): nome, tariffa formattata EUR, durata formattata (es. "45 min")
  - [ ] 6.6 Stato vuoto: "Nessun servizio configurato" con CTA "Aggiungi il primo servizio" (solo admin)

- [ ] Task 7: Implementare eliminazione con Alert Dialog (AC: #5)
  - [ ] 7.1 Riutilizzare AlertDialog shadcn/ui (gia' installato da Story 1.3)
  - [ ] 7.2 Dialog di conferma: titolo "Eliminare il servizio [nome]?", descrizione "Il servizio verra' rimosso dal listino.", bottoni "Annulla" + "Elimina" (distruttivo)
  - [ ] 7.3 Dopo conferma: chiamare `deleteService`, mostrare toast "Servizio eliminato", aggiornare lista con `router.refresh()`

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** nelle Server Actions di mutazione (create, update, delete) — solo l'admin gestisce il listino
- **Nessun checkRole** per la query `getServices` — entrambi i ruoli possono leggere il listino (FR11)
- **Prezzi:** interi in centesimi nel database (`1500` = 15.00 EUR), formattati con `Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })` nella UI
- **Durata:** interi in minuti nel database, formattata come "XX min" nella UI
- **Eliminazione:** hard delete (non soft delete) — i servizi non sono dati personali, GDPR non si applica. Nota: in futuro quando esistono appuntamenti collegati, valutare vincolo FK o soft delete. Per ora hard delete e' corretto.

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

**Schema Zod (pattern da src/lib/validations/users.ts):**
```typescript
// Messaggi in italiano, tipi inferiti esportati
export const createUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
})
export type CreateUserFormData = z.infer<typeof createUserSchema>
```

**Server Action (pattern da src/lib/actions/users.ts):**
```typescript
'use server'
export const createUser = authActionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    const [newUser] = await db.insert(users).values({
      ...parsedInput,
      tenantId: ctx.tenantId,
    }).returning({ id: users.id, name: users.name })
    return { user: newUser }
  })
```

**Query (pattern da src/lib/queries/users.ts):**
```typescript
export async function getUsers(tenantId: string) {
  return db.select({ id: users.id, name: users.name, /* ... */ })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(asc(users.name))
}
```

**useAction (pattern da src/components/user/UserForm.tsx):**
```typescript
const { execute: executeCreate, isPending: isCreating } = useAction(createService, {
  onSuccess: () => {
    toast.success('Servizio creato')
    form.reset()
    onOpenChange(false)
    onSuccess()
  },
  onError: (error) => {
    toast.error(error.error?.serverError || 'Errore durante la creazione')
  },
})
```

**Database schema (pattern per la nuova tabella services):**
```typescript
// Da aggiungere in src/lib/db/schema.ts
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(),        // centesimi (1500 = €15,00)
  duration: integer('duration').notNull(),   // minuti
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**RBAC (src/lib/auth/permissions.ts):**
```typescript
// Permesso 'manageServices' GIA' DEFINITO — mappato a ['admin']
// NON serve aggiungere nulla ai permessi
// La pagina /services NON e' in adminOnlyRoutes — accessibile a tutti (lettura)
// La protezione e' a livello di Server Action (checkRole) e a livello UI (nascondi bottoni)
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

**IMPORTANTE:** Usare le classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-destructive`), NON colori inline. I design tokens sono stati migrati a variabili CSS custom in `globals.css` durante la code review di Story 1.2.

**UX Pattern da Seguire:**
- Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- Toast con Sonner (gia' configurato in root layout) — `toast.success()`, `toast.error()`
- Alert Dialog solo per azioni distruttive (eliminazione servizio)
- Nessuna conferma per azioni creative (creazione, modifica)
- Validazione inline al blur, messaggi in italiano semplice
- Touch target minimi 44x44px
- Stato vuoto con messaggio + CTA (solo admin)
- Una sola azione primaria per schermata/modale
- Testo bottoni imperativo: "Crea Servizio", "Salva Modifiche", "Elimina" — mai "OK" o "Si"

**Formattazione Prezzi nella UI:**
```typescript
// Utility da creare o riusare in src/lib/utils/formatting.ts
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
// 1500 → "€ 15,00"
// 2750 → "€ 27,50"
```

**Formattazione Durata nella UI:**
```typescript
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
// 30 → "30 min"
// 90 → "1h 30min"
```

### Componenti shadcn/ui Disponibili (gia' installati)

Tutti i componenti necessari sono gia' installati da Story 1.2 e 1.3:
- `button`, `input`, `label`, `card`, `sonner` (toast) — da Story 1.1/1.2
- `sheet`, `dialog`, `select`, `badge`, `table`, `alert-dialog`, `dropdown-menu`, `skeleton`, `separator`, `scroll-area` — da Story 1.2/1.3

**NON installare componenti aggiuntivi** — tutto il necessario e' gia' presente.

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabella DB | snake_case plurale | `services` |
| Colonne DB | snake_case | `tenant_id`, `created_at` |
| Server Actions | camelCase con verbo | `createService`, `updateService`, `deleteService` |
| Schema Zod | camelCase + Schema | `createServiceSchema`, `updateServiceSchema` |
| Componenti React | PascalCase | `ServiceForm.tsx`, `ServiceList.tsx` |
| File directory | kebab-case | `components/service/` |
| Tipi inferiti | PascalCase + FormData | `CreateServiceFormData` |
| Query functions | camelCase con get | `getServices`, `getServiceById` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      services/
        page.tsx              # SOSTITUIRE: placeholder → pagina completa (Server Component)
  components/
    service/
      ServiceForm.tsx         # CREARE: form creazione/modifica servizio (Client Component)
      ServiceList.tsx         # CREARE: lista servizi con azioni admin/readonly collab (Client Component)
  lib/
    actions/
      services.ts             # CREARE: Server Actions createService, updateService, deleteService
    validations/
      services.ts             # CREARE: Schema Zod createServiceSchema, updateServiceSchema, deleteServiceSchema
    queries/
      services.ts             # CREARE: Query functions getServices, getServiceById
    db/
      schema.ts               # MODIFICARE: aggiungere tabella 'services'
    utils/
      formatting.ts           # MODIFICARE O CREARE: aggiungere formatPrice, formatDuration
```

**File da NON modificare:**
- `src/components/layout/nav-items.ts` — la voce "Servizi" con route `/services` e' gia' presente per tutti i ruoli
- `src/lib/auth/permissions.ts` — il permesso `manageServices: ['admin']` e' gia' definito
- `src/middleware.ts` — la route `/services` NON deve essere in `adminOnlyRoutes` (i collaboratori la vedono in sola lettura)
- `src/app/(auth)/settings/page.tsx` — non necessario collegare servizi dalle impostazioni, la pagina e' gia' raggiungibile dalla navigazione principale

**Verifica `src/lib/utils/formatting.ts`:**
- Se il file esiste gia': aggiungere `formatPrice()` e `formatDuration()` alle utility esistenti
- Se non esiste: crearlo con le due funzioni di formattazione

### Testing

Nessun framework di test e' attualmente configurato nel progetto (confermato dalla nota di completamento Story 1.3). Il testing per questa story si limita a:

- **Verifica manuale:** testare tutti i flussi come admin (CRUD completo) e come collaboratore (sola lettura)
- **Casi critici da verificare:**
  - Creazione servizio con prezzo e durata validi → salvataggio in centesimi nel DB
  - Validazione form: nome vuoto, prezzo 0 o negativo, durata 0 o negativa → errori inline
  - Modifica servizio → prezzo visualizzato correttamente in EUR nel form di modifica
  - Eliminazione servizio → AlertDialog di conferma → rimozione dalla lista
  - Collaboratore: pagina senza bottoni di creazione/modifica/eliminazione
  - Collaboratore: tentativo diretto di chiamare Server Action → errore "Non autorizzato"
  - Stato vuoto: nessun servizio → messaggio appropriato con CTA (solo admin)

### Protezione Anti-Errori

- **Conversione prezzo:** Il form riceve e mostra EUR (es. "15.00"), la Server Action riceve centesimi (es. 1500). La conversione `EUR * 100` deve avvenire nel submit del form PRIMA di chiamare la Server Action. Lo schema Zod della Server Action valida centesimi (integer > 0).
- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** I nuovi servizi ereditano il tenantId dall'admin che li crea (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **Eliminazione futura:** Quando in Epica 4 esistono appuntamenti collegati ai servizi, l'eliminazione di un servizio potrebbe fallire per vincolo FK. Per ora non ci sono FK perche' la tabella `appointments` non esiste ancora — hard delete e' sicuro.
- **Ruolo nella UI:** Usare il ruolo dalla sessione per nascondere/mostrare i controlli admin. NON fare una query aggiuntiva per verificare il ruolo — usare `session.user.role` passato come prop dal Server Component

### Previous Story Intelligence

**Da Story 1.3 (Gestione Utenze) — pattern identico da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook in `src/hooks/use-mobile.ts` per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Badge con varianti `default`, `secondary`, `outline`, `destructive` — riusare per etichette servizio
- Fix Zod v4.3.6: usare `message` invece di `required_error` in `z.enum()` — applicabile se si aggiungono enum
- AlertDialog gia' installato e pattern consolidato — riusare identico per eliminazione servizio

**Da Story 1.2 (Layout e RBAC):**
- I design tokens sono variabili CSS custom — usare classi Tailwind, MAI colori inline
- `aria-label` e `aria-current` per WCAG — seguire stesso pattern nei nuovi componenti
- La pagina `/services` gia' esiste come placeholder — sostituire senza cambiare la route
- Componenti shadcn/ui installati: tutti quelli necessari sono gia' presenti

**Da Story 1.1 (Inizializzazione e Login):**
- `next-auth@beta` (v5.0.0-beta.30) — Auth.js v5
- `next-safe-action v8` — API middleware con `.use()` chain
- Sonner per toast (non `toast` deprecato)
- Schema `users` con pattern colonne: `uuid('id').primaryKey().defaultRandom()`, `timestamp('created_at').defaultNow()`

### Git Intelligence

Pattern commit recenti (ultimi 10):
```
story 1-3-gestione-utenze: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 2-1-gestione-listino-servizi: Task N — Descrizione breve della feature
```

**File toccati nelle story precedenti (pattern stabiliti):**
- `src/lib/db/schema.ts` — modificato per aggiungere tabelle (qui si aggiunge `services`)
- `src/lib/validations/*.ts` — un file per dominio
- `src/lib/actions/*.ts` — un file per dominio
- `src/lib/queries/*.ts` — un file per dominio
- `src/components/{domain}/*.tsx` — una directory per dominio con componenti specifici
- `src/app/(auth)/{route}/page.tsx` — una pagina per route

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — Prezzi in centesimi]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — Organizzazione progetto]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns — Date, prezzi, JSON]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — Naming conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gerarchia-Bottoni]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Feedback — Toast Sonner]
- [Source: _bmad-output/planning-artifacts/prd.md#FR9-FR10-FR11 — Gestione Listino Servizi]
- [Source: _bmad-output/implementation-artifacts/1-3-gestione-utenze.md#Dev-Notes — Pattern codice]
- [Source: _bmad-output/implementation-artifacts/1-3-gestione-utenze.md#Completion-Notes — Fix Zod v4]
- [Source: src/lib/db/schema.ts — Tabella users come riferimento pattern]
- [Source: src/lib/auth/permissions.ts — manageServices gia' definito]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/components/layout/nav-items.ts — Voce Servizi gia' presente]
- [Source: src/app/(auth)/services/page.tsx — Placeholder da sostituire]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- Task 1: Aggiunta tabella `services` in schema.ts con campi id, name, price (centesimi), duration (minuti), tenantId, createdAt, updatedAt. Import `integer` aggiunto. Schema pushato al database con drizzle-kit push.

### File List

- `src/lib/db/schema.ts` — Modificato: aggiunta tabella `services`, import `integer`
