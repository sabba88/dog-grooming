# Story 3.2: Anagrafica Cani

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **gestire i cani associati ai clienti con note e storico prestazioni**,
so that **possa conoscere ogni cane e offrire un servizio personalizzato basato sullo storico**.

## Acceptance Criteria

1. **Given** un utente e' nel dettaglio di un cliente
   **When** clicca su "Aggiungi Cane"
   **Then** si apre un form per inserire nome, razza, taglia, eta' e note
   **And** il cane viene associato al cliente (relazione uno-a-molti)

2. **Given** un utente e' nel dettaglio di un cliente
   **When** la lista dei cani viene renderizzata
   **Then** ogni cane mostra nome, razza e taglia

3. **Given** un utente seleziona un cane
   **When** accede al dettaglio del cane
   **Then** vede i dati del cane, le note libere e lo storico completo delle note prestazione

4. **Given** un utente e' nel dettaglio di un cane
   **When** modifica i dati e salva
   **Then** le modifiche vengono salvate
   **And** mostra un toast "Cane aggiornato"

5. **Given** un utente e' nel dettaglio di un cane
   **When** aggiunge una nota libera
   **Then** la nota viene salvata con data e autore
   **And** e' visibile nello storico note del cane

6. **Given** un utente e' nel dettaglio di un cane
   **When** consulta lo storico delle note prestazione
   **Then** vengono mostrate tutte le note delle prestazioni precedenti in ordine cronologico inverso
   **And** ogni nota mostra data, servizio effettuato e testo della nota

7. **Given** un utente e' nella lista clienti
   **When** la pagina viene renderizzata
   **Then** ogni cliente mostra il numero di cani associati (conteggio reale dalla tabella dogs)

## Tasks / Subtasks

- [x] Task 1: Aggiungere tabelle `dogs` e `dog_notes` nello schema Drizzle (AC: #1, #2, #3, #5)
  - [x] 1.1 Aggiungere tabella `dogs` in `src/lib/db/schema.ts` con campi: id (uuid PK), name (text, not null), breed (text, nullable), size (text, nullable), age (text, nullable), clientId (uuid, not null), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Aggiungere tabella `dog_notes` con campi: id (uuid PK), dogId (uuid, not null), content (text, not null), authorId (uuid, not null), tenantId (uuid, not null), createdAt (timestamp, defaultNow, not null)
  - [x] 1.3 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [ ] Task 2: Creare schemi Zod per validazione cani e note (AC: #1, #4, #5)
  - [ ] 2.1 Creare `src/lib/validations/dogs.ts` — `createDogSchema` con name (min 2 char), breed (optional), size (optional, enum: "piccola" | "media" | "grande"), age (optional), clientId (uuid)
  - [ ] 2.2 Creare `updateDogSchema` — id (uuid) + name (min 2), breed (optional), size (optional), age (optional)
  - [ ] 2.3 Creare `addDogNoteSchema` — dogId (uuid), content (min 1 char, "Inserisci il testo della nota")
  - [ ] 2.4 Esportare tipi inferiti: `CreateDogFormData`, `UpdateDogFormData`, `AddDogNoteFormData`

- [ ] Task 3: Creare Server Actions per gestione cani (AC: #1, #4, #5)
  - [ ] 3.1 Creare `src/lib/actions/dogs.ts` con `authActionClient`
  - [ ] 3.2 Implementare `createDog` — NO checkRole, verificare che il clientId appartenga al tenantId e che il cliente non sia soft-deleted (isNull deletedAt), insert con tenantId da ctx
  - [ ] 3.3 Implementare `updateDog` — NO checkRole, update con filtro id + tenantId, updatedAt = new Date()
  - [ ] 3.4 Implementare `addDogNote` — NO checkRole, verificare che il cane esista e appartenga al tenantId, insert con authorId = ctx.userId

- [ ] Task 4: Creare query functions per cani (AC: #1, #2, #3, #5, #7)
  - [ ] 4.1 Creare `src/lib/queries/dogs.ts` — `getDogsByClient(clientId, tenantId)`: tutti i cani del cliente, ordinati per name ASC
  - [ ] 4.2 Creare `getDogById(dogId, tenantId)` — singolo cane con i dati del cliente associato (firstName, lastName); restituire null se non trovato
  - [ ] 4.3 Creare `getDogNotes(dogId, tenantId)` — note del cane ordinate per createdAt DESC, con JOIN su users per ottenere il nome dell'autore
  - [ ] 4.4 Aggiornare `getClients` in `src/lib/queries/clients.ts` — aggiungere LEFT JOIN con `dogs` e `count(dogs.id)` come `dogsCount`; aggiungere `groupBy(clients.id)`

- [ ] Task 5: Creare componente DogForm per aggiunta/modifica cane (AC: #1, #4)
  - [ ] 5.1 Creare `src/components/dog/DogForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [ ] 5.2 Campi: Nome (Input, obbligatorio), Razza (Input, opzionale), Taglia (Select: Piccola/Media/Grande, opzionale), Eta' (Input, opzionale)
  - [ ] 5.3 In creazione: campo `clientId` nascosto, passato come prop
  - [ ] 5.4 In modifica: pre-compilare con dati esistenti
  - [ ] 5.5 Il form si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [ ] 5.6 Validazione inline al blur, messaggi in italiano
  - [ ] 5.7 Bottone primario "Aggiungi Cane" (creazione) o "Salva Modifiche" (modifica)
  - [ ] 5.8 Installare componente `select` di shadcn/ui se non presente: `npx shadcn@latest add select`

- [ ] Task 6: Aggiornare pagina dettaglio cliente con lista cani reale (AC: #2, #7)
  - [ ] 6.1 Creare `src/components/dog/DogList.tsx` — Client Component che mostra la lista dei cani del cliente
  - [ ] 6.2 Ogni cane mostra: nome, razza, taglia — con click per navigare a `/dogs/[id]`
  - [ ] 6.3 Stato vuoto: "Nessun cane associato" con CTA "Aggiungi il primo cane"
  - [ ] 6.4 Bottone "Aggiungi Cane" che apre DogForm con clientId
  - [ ] 6.5 Aggiornare `src/app/(auth)/clients/[id]/page.tsx` — fetch `getDogsByClient` e passare al componente
  - [ ] 6.6 Aggiornare `src/components/client/ClientDetail.tsx` — sostituire la sezione placeholder "Cani Associati" con il componente DogList reale
  - [ ] 6.7 Aggiornare `src/components/client/ClientList.tsx` — mostrare il conteggio cani reale nella tabella/card (dato da `dogsCount`)

- [ ] Task 7: Creare pagina dettaglio cane con note (AC: #3, #4, #5, #6)
  - [ ] 7.1 Creare `src/app/(auth)/dogs/[id]/page.tsx` — Server Component con fetch cane + note
  - [ ] 7.2 Creare `src/components/dog/DogDetail.tsx` — Client Component con sezioni
  - [ ] 7.3 Breadcrumb "Clienti > [Nome Cognome Cliente] > [Nome Cane]" con link al cliente
  - [ ] 7.4 Sezione Dati Cane: nome, razza, taglia, eta' + bottone "Modifica" che apre DogForm in modalita' modifica
  - [ ] 7.5 Creare `src/components/dog/DogNotes.tsx` — componente per lista note + form aggiunta nota (stesso pattern di ClientNotes)
  - [ ] 7.6 Lista note: ogni nota mostra contenuto, nome autore, data formattata in italiano — ordine cronologico inverso
  - [ ] 7.7 Form aggiunta nota: Textarea + bottone "Aggiungi Nota" — inline nella sezione, non in modale
  - [ ] 7.8 Sezione Storico Note Prestazione: stato vuoto "Nessuna nota prestazione registrata — Le note verranno aggiunte durante gli appuntamenti" — sezione placeholder per Epica 4
  - [ ] 7.9 Redirect a `/clients` se il cane non esiste

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono gestire cani (FR16-FR19). NON aggiungere `if (ctx.role !== 'admin')` nelle Server Actions di questa story
- **Pagine accessibili a tutti:** Le route `/clients/[id]` e `/dogs/[id]` NON sono admin-only — entrambi i ruoli accedono
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB
- **Relazione 1:N:** Un cliente puo' avere molti cani. Il campo `clientId` nella tabella `dogs` referenzia `clients.id`
- **Nessun deletedAt sui cani:** I cani non hanno soft delete diretto. Se un cliente viene soft-deleted (Story 3.3), i suoi cani non saranno visibili perche' il cliente non sara' piu' raggiungibile. Le query sui cani devono verificare che il cliente associato non sia soft-deleted

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

**Server Action (pattern da src/lib/actions/clients.ts — SENZA checkRole):**
```typescript
'use server'
import { authActionClient } from '@/lib/actions/client'
import { createDogSchema } from '@/lib/validations/dogs'
import { db } from '@/lib/db'
import { dogs, clients } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export const createDog = authActionClient
  .schema(createDogSchema)
  .action(async ({ parsedInput, ctx }) => {
    // NO checkRole — admin + collaborator possono creare cani
    // Verificare che il cliente esista e non sia soft-deleted
    const [client] = await db.select({ id: clients.id })
      .from(clients)
      .where(and(
        eq(clients.id, parsedInput.clientId),
        eq(clients.tenantId, ctx.tenantId),
        isNull(clients.deletedAt)
      ))
      .limit(1)
    if (!client) throw new Error('Cliente non trovato')

    const [newDog] = await db.insert(dogs).values({
      name: parsedInput.name,
      breed: parsedInput.breed || null,
      size: parsedInput.size || null,
      age: parsedInput.age || null,
      clientId: parsedInput.clientId,
      tenantId: ctx.tenantId,
    }).returning({ id: dogs.id, name: dogs.name })
    return { dog: newDog }
  })
```

**Query getClients aggiornata (con conteggio cani):**
```typescript
import { db } from '@/lib/db'
import { clients, dogs } from '@/lib/db/schema'
import { eq, and, asc, isNull, count } from 'drizzle-orm'

export async function getClients(tenantId: string) {
  return db.select({
    id: clients.id,
    firstName: clients.firstName,
    lastName: clients.lastName,
    phone: clients.phone,
    email: clients.email,
    createdAt: clients.createdAt,
    dogsCount: count(dogs.id),
  })
  .from(clients)
  .leftJoin(dogs, eq(dogs.clientId, clients.id))
  .where(and(eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
  .groupBy(clients.id, clients.firstName, clients.lastName, clients.phone, clients.email, clients.createdAt)
  .orderBy(asc(clients.lastName), asc(clients.firstName))
}
```

**Query getDogsByClient:**
```typescript
export async function getDogsByClient(clientId: string, tenantId: string) {
  return db.select({
    id: dogs.id,
    name: dogs.name,
    breed: dogs.breed,
    size: dogs.size,
    age: dogs.age,
    createdAt: dogs.createdAt,
  })
  .from(dogs)
  .where(and(eq(dogs.clientId, clientId), eq(dogs.tenantId, tenantId)))
  .orderBy(asc(dogs.name))
}
```

**Componente Form (pattern da src/components/client/ClientForm.tsx):**
```typescript
'use client'
// React Hook Form + zodResolver
// useIsMobile() per Dialog/Sheet responsive
// useAction da next-safe-action/hooks con onSuccess/onError
// toast.success() / toast.error() per feedback
// form.register() per campi, form.formState.errors per errori inline
// Singolo componente gestisce sia creazione che modifica via prop opzionale
```

**Page Server Component (pattern da src/app/(auth)/clients/[id]/page.tsx):**
```typescript
// Server Component — NO 'use client'
// auth() per tenantId
// Fetch cane + note
// Redirect a /clients se il cane non esiste
```

### Design della Tabella `dogs`

```typescript
export const dogs = pgTable('dogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  breed: text('breed'),                     // razza — nullable
  size: text('size'),                       // taglia — nullable (piccola/media/grande)
  age: text('age'),                         // eta' — nullable (testo libero, es. "3 anni", "cucciolo")
  clientId: uuid('client_id').notNull(),    // FK logica a clients (1:N)
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Nota sul campo `age`:** Usare `text` invece di `integer` perche' l'eta' di un cane puo' essere espressa come "3 anni", "cucciolo", "6 mesi", ecc. Piu' flessibile e allineato con l'uso nel salone.

**Nota su `size`:** Taglia come testo libero con 3 valori predefiniti (piccola, media, grande) selezionabili da un Select. Il campo accetta anche valori custom se necessario.

### Design della Tabella `dog_notes`

```typescript
export const dogNotes = pgTable('dog_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  dogId: uuid('dog_id').notNull(),       // FK logica a dogs
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull(), // FK logica a users — chi ha scritto la nota
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Pagina Dettaglio Cane: Navigazione e Breadcrumb

**Route:** `/dogs/[id]` — pagina dedicata, sotto `(auth)/dogs/[id]/page.tsx`

**Breadcrumb:** "Clienti > [Nome Cognome Cliente] > [Nome Cane]"
- Il link "Clienti" naviga a `/clients`
- Il link "[Nome Cognome]" naviga a `/clients/[clientId]`
- "[Nome Cane]" e' il titolo corrente

**getDogById** deve restituire anche i dati del cliente associato (firstName, lastName, id) per costruire il breadcrumb.

### Aggiornamento Lista Clienti con Conteggio Cani

La query `getClients` in `src/lib/queries/clients.ts` va aggiornata con:
1. `leftJoin(dogs, eq(dogs.clientId, clients.id))` per joinare i cani
2. `count(dogs.id)` nel select come `dogsCount`
3. `groupBy` su tutti i campi del select di clients

Il componente `ClientList.tsx` va aggiornato per mostrare `dogsCount` nella tabella (desktop) e nelle card (mobile).

### Storico Note Prestazione — Placeholder per Epica 4

L'AC #6 richiede lo storico delle note prestazione nel dettaglio cane. Nella Story 3.2, la tabella `appointments` e le note prestazione non esistono ancora. La sezione deve mostrare uno stato vuoto funzionale:

"Nessuna nota prestazione registrata — Le note verranno aggiunte durante gli appuntamenti"

Questa sezione verra' completata in Epica 4 (Story 4.4 — Note Prestazione).

### UX Pattern da Seguire

- **Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- **Toast con Sonner** (gia' configurato in root layout) — `toast.success('Cane salvato')`, `toast.error()`
- **Nessuna conferma per azioni creative** (creazione, modifica, salvataggio note)
- **Validazione inline al blur**, messaggi in italiano semplice
- **Touch target minimi 44x44px**
- **Stato vuoto** con messaggio + CTA
- **Testo bottoni imperativo:** "Aggiungi Cane", "Salva Modifiche", "Aggiungi Nota"
- **Breadcrumb** nella pagina dettaglio: "Clienti > [Nome Cognome] > [Nome Cane]"
- **Navigazione click:** Click sul cane nella lista porta al dettaglio `/dogs/[id]`
- **Form note inline:** Il form per aggiungere una nota e' nella pagina dettaglio, NON in modale
- **Data formattata in italiano:** Usare `Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' })` per le date delle note
- **Lista cani nel dettaglio cliente:** Card per ogni cane con nome, razza, taglia + click per navigare al dettaglio

### Design Tokens e UX

```
Primary:        var(--primary) — verde salvia #4A7C6F — bottoni CTA, link
Primary Light:  #E8F0ED — sfondi selezionati, hover
Primary Dark:   #345A50 — hover bottoni
Background:     var(--background) — #FFFFFF
Surface:        var(--card) — #F8FAFB — sfondo card, pannelli
Border:         var(--border) — #E2E8F0 — bordi, separatori
Text Primary:   var(--foreground) — #1A202C — testo principale
Text Secondary: var(--muted-foreground) — #64748B — label, testo secondario, autore nota
Text Muted:     #94A3B8 — placeholder
Error:          var(--destructive) — #EF4444 — errori validazione
Success:        #22C55E — conferme
Font:           Inter
```

**IMPORTANTE:** Usare le classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`), NON colori inline.

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle DB | snake_case plurale | `dogs`, `dog_notes` |
| Colonne DB | snake_case | `client_id`, `created_at`, `author_id` |
| Server Actions | camelCase con verbo | `createDog`, `updateDog`, `addDogNote` |
| Schema Zod | camelCase + Schema | `createDogSchema`, `updateDogSchema`, `addDogNoteSchema` |
| Componenti React | PascalCase | `DogForm.tsx`, `DogList.tsx`, `DogDetail.tsx`, `DogNotes.tsx` |
| File directory | kebab-case | `components/dog/` |
| Tipi inferiti | PascalCase + FormData | `CreateDogFormData`, `UpdateDogFormData`, `AddDogNoteFormData` |
| Query functions | camelCase con get | `getDogsByClient`, `getDogById`, `getDogNotes` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      clients/
        [id]/
          page.tsx              # AGGIORNARE: fetch getDogsByClient e passare a ClientDetail
      dogs/
        [id]/
          page.tsx              # CREARE: dettaglio cane (Server Component)
  components/
    client/
      ClientDetail.tsx          # AGGIORNARE: sostituire placeholder cani con DogList reale
      ClientList.tsx            # AGGIORNARE: mostrare dogsCount
    dog/                        # CREARE directory
      DogForm.tsx               # CREARE: form creazione/modifica cane
      DogList.tsx               # CREARE: lista cani nel dettaglio cliente
      DogDetail.tsx             # CREARE: dettaglio cane con sezioni
      DogNotes.tsx              # CREARE: lista note + form aggiunta nota
  lib/
    actions/
      dogs.ts                   # CREARE: Server Actions createDog, updateDog, addDogNote
    validations/
      dogs.ts                   # CREARE: Schema Zod per cani e note
    queries/
      dogs.ts                   # CREARE: Query functions getDogsByClient, getDogById, getDogNotes
      clients.ts                # AGGIORNARE: getClients con LEFT JOIN per conteggio cani
    db/
      schema.ts                 # AGGIORNARE: aggiungere tabelle dogs e dog_notes
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/auth/permissions.ts` — NON aggiungere `/dogs` a adminOnlyRoutes
- `src/lib/actions/client.ts` — authActionClient gia' configurato, non toccare
- `src/middleware.ts` — gia' protegge tutte le route autenticate
- `src/components/layout/Sidebar.tsx` — la navigazione cani avviene dal dettaglio cliente, non serve una voce dedicata in sidebar

### Allineamento con la Struttura del Progetto

- I componenti dog vanno in `components/dog/` (singolare per dominio, come `components/client/`)
- Le Server Actions vanno in `actions/dogs.ts` (plurale, coerente con `actions/clients.ts`, `actions/locations.ts`)
- Le validazioni vanno in `validations/dogs.ts`
- Le query vanno in `queries/dogs.ts`
- La pagina dettaglio cane va in `app/(auth)/dogs/[id]/page.tsx` — sotto `(auth)/`, NON sotto `clients/`

### Previous Story Intelligence

**Da Story 3.1 (Anagrafica Clienti) — pattern da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Singolo componente gestisce sia creazione che modifica via prop opzionale (es. `dog?`)
- Note con autore: `addDogNote` deve verificare che il cane esista e appartenga al tenant, poi inserire con `authorId = ctx.userId`
- Note ordinate per `createdAt DESC` con JOIN su users per nome autore
- Placeholder section: la sezione "Storico Appuntamenti" in ClientDetail e' un buon pattern per la sezione "Note Prestazione" nel dettaglio cane

**Da Story 3.1 — aggiornamenti necessari:**
- `getClients` deve essere aggiornata con LEFT JOIN per conteggio cani
- `ClientDetail.tsx` deve sostituire il placeholder "Cani Associati" con la lista reale
- `ClientList.tsx` deve mostrare il conteggio cani nella tabella/card

**Componenti shadcn/ui gia' installati:**
- button, input, label, card, sonner (toast)
- sheet, dialog, table, badge, skeleton, separator, scroll-area
- checkbox, tooltip, avatar, textarea

**Da installare (se non gia' presente):**
- `select` — per la taglia del cane: `npx shadcn@latest add select`

### Protezione Anti-Errori

- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** I nuovi cani ereditano il tenantId dall'utente autenticato (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **clientId verificato:** Prima di creare un cane, verificare che il `clientId` appartenga al `tenantId` dell'utente E che il cliente non sia soft-deleted (`isNull(clients.deletedAt)`)
- **dogId verificato:** Prima di aggiungere una nota a un cane, verificare che il `dogId` appartenga al `tenantId` dell'utente
- **authorId:** Usare SEMPRE `ctx.userId` dal JWT come autore della nota — NON accettare `authorId` dall'input utente
- **XSS nel contenuto note:** Il contenuto delle note viene da input utente — React gestisce l'escaping automaticamente nel rendering JSX. NON usare `dangerouslySetInnerHTML`
- **Sezione placeholder note prestazione:** La sezione "Storico Note Prestazione" nel dettaglio cane deve mostrare uno stato vuoto funzionale, NON un componente non implementato che genera errori
- **Conteggio cani con LEFT JOIN:** Usare `leftJoin` (non `innerJoin`) perche' un cliente puo' avere 0 cani — `count(dogs.id)` restituira' 0 in quel caso
- **groupBy completo:** Quando si usa `count()` con Drizzle, bisogna includere TUTTI i campi nel groupBy, non solo l'id

### Git Intelligence

Pattern commit recenti:
```
story 3-1-anagrafica-clienti: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 3-2-anagrafica-cani: Task N — Descrizione breve della feature
```

### Testing

Nessun framework di test e' attualmente configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale** — testare tutti i flussi come admin e come collaborator
- **Casi critici da verificare:**
  - Creazione cane con dati validi → salvataggio nel DB con clientId e tenantId corretti
  - Creazione cane per cliente inesistente → errore "Cliente non trovato"
  - Creazione cane per cliente soft-deleted → errore "Cliente non trovato"
  - Modifica cane → dati aggiornati, toast "Cane aggiornato"
  - Aggiunta nota cane → nota salvata con data e autore corretto
  - Lista cani nel dettaglio cliente → mostra nome, razza, taglia per ogni cane
  - Click su cane → navigazione a `/dogs/[id]`
  - Dettaglio cane con cane inesistente → redirect a `/clients`
  - Conteggio cani nella lista clienti → numero corretto (0 per clienti senza cani)
  - Stato vuoto cani → "Nessun cane associato" con CTA
  - Collaborator: accesso completo a dettaglio cane — NO redirect
  - Breadcrumb: link al cliente funzionante

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId, Drizzle pattern, FK logiche]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — directory organization, components/dog/]
- [Source: _bmad-output/planning-artifacts/prd.md#FR16 — Aggiunta cani associati a cliente]
- [Source: _bmad-output/planning-artifacts/prd.md#FR17 — Modifica dati cane]
- [Source: _bmad-output/planning-artifacts/prd.md#FR18 — Note libere su cane]
- [Source: _bmad-output/planning-artifacts/prd.md#FR19 — Storico note prestazione]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form — form layout, validazione inline]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay — Dialog/Sheet]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Feedback — Toast Sonner]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Stati-Vuoti — empty states]
- [Source: _bmad-output/implementation-artifacts/3-1-anagrafica-clienti.md — Pattern codice, file list, completion notes, aggiornamento conteggio cani]
- [Source: src/lib/db/schema.ts — Tabelle clients, client_notes come riferimento pattern]
- [Source: src/lib/actions/clients.ts — Pattern Server Actions senza checkRole]
- [Source: src/lib/validations/clients.ts — Pattern Schema Zod]
- [Source: src/lib/queries/clients.ts — Pattern Query functions con deletedAt filter]
- [Source: src/components/client/ClientForm.tsx — Pattern form con Dialog/Sheet responsive]
- [Source: src/components/client/ClientDetail.tsx — Placeholder cani da sostituire]
- [Source: src/components/client/ClientList.tsx — Aggiornamento conteggio cani]
- [Source: src/components/client/ClientNotes.tsx — Pattern note da replicare per DogNotes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- ✅ Task 1: Aggiunte tabelle `dogs` e `dog_notes` a `src/lib/db/schema.ts` seguendo pattern esistente (uuid PK, tenantId, timestamps). Schema pushato al DB con `drizzle-kit push`.

### File List

- `src/lib/db/schema.ts` — MODIFICATO: aggiunte tabelle `dogs` e `dogNotes`
