# Story 3.1: Anagrafica Clienti

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **creare, modificare e cercare clienti con le relative note**,
so that **possa gestire la rubrica del salone e avere tutte le informazioni a portata di mano**.

## Acceptance Criteria

1. **Given** un utente accede alla pagina Clienti
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista dei clienti con avatar (iniziali), nome, telefono e numero di cani associati

2. **Given** un utente clicca su "Nuovo Cliente"
   **When** compila il form con nome, cognome, telefono, email (opzionale) e accetta il consenso al trattamento dati
   **Then** il sistema crea il cliente con tenantId, consentGivenAt e consentVersion
   **And** mostra un toast "Cliente creato"

3. **Given** un utente seleziona un cliente dalla lista
   **When** accede al dettaglio del cliente
   **Then** vede i dati anagrafici, la lista dei cani associati, le note libere e lo storico appuntamenti

4. **Given** un utente e' nel dettaglio di un cliente
   **When** modifica i dati anagrafici e salva
   **Then** le modifiche vengono salvate
   **And** mostra un toast "Cliente aggiornato"

5. **Given** un utente e' nel dettaglio di un cliente
   **When** aggiunge una nota libera
   **Then** la nota viene salvata con data e autore
   **And** e' visibile nello storico note del cliente

6. **Given** un utente digita 2 o piu' caratteri nel campo ricerca clienti
   **When** la ricerca incrementale si attiva (debounce 300ms)
   **Then** vengono mostrati i risultati corrispondenti con avatar, nome e numero cani
   **And** i risultati si aggiornano in tempo reale ad ogni carattere aggiuntivo

7. **Given** un utente cerca un cliente che non esiste
   **When** nessun risultato corrisponde
   **Then** viene mostrato "Nessun risultato" con l'opzione "Crea nuovo cliente"

## Tasks / Subtasks

- [x] Task 1: Installare TanStack Query e configurare QueryClientProvider (AC: #6)
  - [x] 1.1 Installare `@tanstack/react-query` con npm
  - [x] 1.2 Creare o aggiornare `src/app/providers.tsx` con `QueryClientProvider` — verificare se il file esiste gia'; se si', aggiungere il provider; se no, crearlo
  - [x] 1.3 Importare `<Providers>` nel root layout (`src/app/layout.tsx`) e wrappare `{children}`
  - [x] 1.4 Verificare che `npm run dev` funziona correttamente con il nuovo provider

- [x] Task 2: Aggiungere tabelle `clients` e `client_notes` nello schema Drizzle (AC: #1, #2, #3, #5)
  - [x] 2.1 Aggiungere tabella `clients` in `src/lib/db/schema.ts` con campi: id (uuid PK), firstName (text, not null), lastName (text, not null), phone (text, not null), email (text, nullable), consentGivenAt (timestamp, not null), consentVersion (text, not null, default "1.0"), deletedAt (timestamp, nullable), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 2.2 Aggiungere tabella `client_notes` con campi: id (uuid PK), clientId (uuid, not null), content (text, not null), authorId (uuid, not null), tenantId (uuid, not null), createdAt (timestamp, defaultNow, not null)
  - [x] 2.3 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [x] Task 3: Creare schemi Zod per validazione clienti e note (AC: #2, #4, #5)
  - [x] 3.1 Creare `src/lib/validations/clients.ts` — `createClientSchema` con firstName (min 2 char), lastName (min 2 char), phone (min 6 char), email (optional, email format se fornito), consent (boolean, refine must be true)
  - [x] 3.2 Creare `updateClientSchema` — id (uuid) + firstName (min 2), lastName (min 2), phone (min 6), email (optional)
  - [x] 3.3 Creare `addClientNoteSchema` — clientId (uuid), content (min 1 char, "Inserisci il testo della nota")
  - [x] 3.4 Esportare tipi inferiti: `CreateClientFormData`, `UpdateClientFormData`, `AddClientNoteFormData`

- [x] Task 4: Creare Server Actions per gestione clienti (AC: #2, #4, #5)
  - [x] 4.1 Creare `src/lib/actions/clients.ts` con `authActionClient`
  - [x] 4.2 Implementare `createClient` — NO checkRole (admin + collaborator possono creare), insert con tenantId da ctx, consentGivenAt = new Date(), consentVersion = "1.0", verificare che deletedAt non sia impostato (nuovo cliente)
  - [x] 4.3 Implementare `updateClient` — NO checkRole, update con filtro id + tenantId + deletedAt IS NULL, updatedAt = new Date()
  - [x] 4.4 Implementare `addClientNote` — NO checkRole, insert con clientId, content, authorId = ctx.userId, tenantId da ctx; verificare che il cliente esista e non sia soft-deleted

- [x] Task 5: Creare query functions per clienti (AC: #1, #3, #5, #6)
  - [x] 5.1 Creare `src/lib/queries/clients.ts` — `getClients(tenantId)`: tutti i clienti con filtro `deletedAt IS NULL`, ordinati per lastName ASC poi firstName ASC
  - [x] 5.2 Creare `getClientById(clientId, tenantId)` — singolo cliente con filtro deletedAt IS NULL; restituire null se non trovato
  - [x] 5.3 Creare `getClientNotes(clientId, tenantId)` — note del cliente ordinate per createdAt DESC, con JOIN su users per ottenere il nome dell'autore
  - [x] 5.4 Creare `searchClients(query, tenantId)` — ricerca con ILIKE su firstName, lastName, phone; filtro deletedAt IS NULL; limit 10; restituire id, firstName, lastName, phone, email

- [x] Task 6: Creare API Route per ricerca incrementale clienti (AC: #6, #7)
  - [x] 6.1 Creare `src/app/api/clients/search/route.ts` — GET handler
  - [x] 6.2 Estrarre sessione con `auth()` per ottenere tenantId — ritornare 401 se non autenticato
  - [x] 6.3 Leggere parametro query `q` da searchParams — ritornare array vuoto se `q` ha meno di 2 caratteri
  - [x] 6.4 Invocare `searchClients(q, tenantId)` e restituire risultati come JSON: `{ clients: [...] }`

- [x] Task 7: Creare componente ClientForm con consenso GDPR (AC: #2, #4)
  - [x] 7.1 Creare `src/components/client/ClientForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [x] 7.2 Campi: Nome (Input), Cognome (Input), Telefono (Input), Email (Input, opzionale)
  - [x] 7.3 Checkbox consenso trattamento dati — obbligatorio in creazione, con label "Acconsento al trattamento dei dati personali"; nascosto in modalita' modifica
  - [x] 7.4 Il form si apre in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare `useIsMobile()` hook
  - [x] 7.5 Validazione inline al blur, messaggi in italiano
  - [x] 7.6 Bottone primario "Crea Cliente" (creazione) o "Salva Modifiche" (modifica)
  - [x] 7.7 In modalita' modifica: pre-compilare con dati esistenti
  - [x] 7.8 Installare componente `avatar` di shadcn/ui se non presente: `npx shadcn@latest add avatar`

- [x] Task 8: Creare componente ClientSearch con ricerca tipo-ahead (AC: #6, #7)
  - [x] 8.1 Creare `src/components/client/ClientSearch.tsx` — Client Component
  - [x] 8.2 Input ricerca con icona Search (lucide-react), placeholder "Cerca cliente..."
  - [x] 8.3 Debounce 300ms sull'input — usare `useQuery` di TanStack Query con `enabled: query.length >= 2`
  - [x] 8.4 Fetch verso `/api/clients/search?q=term`
  - [x] 8.5 Mostrare risultati sotto l'input: avatar con iniziali + nome completo + telefono
  - [x] 8.6 Stato "Nessun risultato" con opzione "Crea nuovo cliente" che apre ClientForm
  - [x] 8.7 Il componente espone `onSelect(client)` callback e `onCreateNew()` callback — riusabile in futuro per il form appuntamento (Epica 4)

- [ ] Task 9: Creare pagina lista clienti con avatar e ricerca (AC: #1, #6, #7)
  - [ ] 9.1 Creare `src/app/(auth)/clients/page.tsx` — Server Component con `auth()` per tenantId + fetch `getClients(tenantId)`
  - [ ] 9.2 Creare `src/components/client/ClientList.tsx` — Client Component
  - [ ] 9.3 Header con titolo "Clienti" e bottone "Nuovo Cliente" (icona Plus)
  - [ ] 9.4 Barra ricerca ClientSearch integrata sotto l'header — la ricerca sostituisce la lista con i risultati del server
  - [ ] 9.5 Desktop (hidden md:block): tabella con colonne Avatar, Nome Completo, Telefono, Email, Azioni
  - [ ] 9.6 Mobile (md:hidden): card con avatar iniziali + nome + telefono
  - [ ] 9.7 Avatar con iniziali: prima lettera nome + prima lettera cognome, sfondo primary-light
  - [ ] 9.8 Click su riga/card → navigazione a `/clients/[id]` con `useRouter().push()` o `<Link>`
  - [ ] 9.9 Stato vuoto: "Nessun cliente registrato" con CTA "Aggiungi il primo cliente"
  - [ ] 9.10 Nota: il conteggio cani sara' sempre 0 fino a Story 3.2 — mostrare "0" o omettere la colonna; aggiornare la query in Story 3.2 con JOIN sulla tabella dogs

- [ ] Task 10: Creare pagina dettaglio cliente con note (AC: #3, #4, #5)
  - [ ] 10.1 Creare `src/app/(auth)/clients/[id]/page.tsx` — Server Component con fetch cliente + note
  - [ ] 10.2 Creare `src/components/client/ClientDetail.tsx` — Client Component con sezioni
  - [ ] 10.3 Breadcrumb "Clienti > [Nome Cognome]" e bottone Indietro
  - [ ] 10.4 Sezione Dati Anagrafici: nome, cognome, telefono, email, data registrazione + bottone "Modifica" che apre ClientForm in modalita' modifica
  - [ ] 10.5 Sezione Cani Associati: stato vuoto "Nessun cane associato" con testo "I cani verranno gestiti nella prossima funzionalita'" — sezione placeholder per Story 3.2
  - [ ] 10.6 Creare `src/components/client/ClientNotes.tsx` — componente per lista note + form aggiunta nota
  - [ ] 10.7 Lista note: ogni nota mostra contenuto, nome autore, data formattata in italiano — ordine cronologico inverso
  - [ ] 10.8 Form aggiunta nota: Textarea + bottone "Aggiungi Nota" — inline nella sezione, non in modale
  - [ ] 10.9 Sezione Storico Appuntamenti: stato vuoto "Nessun appuntamento registrato" — sezione placeholder per Epica 4
  - [ ] 10.10 Redirect a `/clients` se il cliente non esiste o e' soft-deleted

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **deletedAt IS NULL** — OGNI query sui clienti DEVE filtrare per `isNull(clients.deletedAt)` per escludere i clienti soft-deleted (predisposizione GDPR Story 3.3)
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono gestire clienti (FR12-FR15). NON aggiungere `if (ctx.role !== 'admin')` nelle Server Actions di questa story
- **Pagina accessibile a tutti:** La route `/clients` e `/clients/[id]` NON e' admin-only — entrambi i ruoli accedono. Non aggiungere a `adminOnlyRoutes` in permissions.ts
- **GDPR predisposta:** Includere campi `consentGivenAt`, `consentVersion`, `deletedAt` nella tabella `clients` fin dall'inizio. Le operazioni GDPR complete (diritto all'oblio, export) saranno implementate in Story 3.3.

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

**Server Action (pattern da src/lib/actions/locations.ts — SENZA checkRole per questa story):**
```typescript
'use server'
import { authActionClient } from '@/lib/actions/client'
import { createClientSchema } from '@/lib/validations/clients'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export const createClient = authActionClient
  .schema(createClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    // NO checkRole — admin + collaborator possono creare clienti
    const [newClient] = await db.insert(clients).values({
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName,
      phone: parsedInput.phone,
      email: parsedInput.email || null,
      consentGivenAt: new Date(),
      consentVersion: '1.0',
      tenantId: ctx.tenantId,
    }).returning({ id: clients.id, firstName: clients.firstName, lastName: clients.lastName })
    return { client: newClient }
  })
```

**Query (pattern da src/lib/queries/locations.ts — CON filtro deletedAt):**
```typescript
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'
import { eq, and, asc, isNull, ilike, or } from 'drizzle-orm'

export async function getClients(tenantId: string) {
  return db.select({
    id: clients.id,
    firstName: clients.firstName,
    lastName: clients.lastName,
    phone: clients.phone,
    email: clients.email,
    createdAt: clients.createdAt,
  })
  .from(clients)
  .where(and(eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
  .orderBy(asc(clients.lastName), asc(clients.firstName))
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
// Server Component — NO 'use client'
// auth() per tenantId
// Fetch data e passa a Client Component
// Redirect a /login se non autenticato
```

### Design della Tabella `clients`

```typescript
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),                              // nullable — opzionale
  consentGivenAt: timestamp('consent_given_at').notNull(),  // GDPR: quando il consenso e' stato dato
  consentVersion: text('consent_version').notNull(),  // GDPR: versione informativa privacy (es. "1.0")
  deletedAt: timestamp('deleted_at'),                 // GDPR: soft delete (Story 3.3)
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Nota FK:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB.

### Design della Tabella `client_notes`

```typescript
export const clientNotes = pgTable('client_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),    // FK logica a clients
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull(),    // FK logica a users — chi ha scritto la nota
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Nota authorId:** Le note salvano `ctx.userId` come autore. Per mostrare il nome autore nella UI, fare JOIN con la tabella `users` nella query `getClientNotes`.

### GDPR: Consenso e Predisposizione Soft Delete

**Creazione cliente:**
- Il form di creazione include un checkbox obbligatorio "Acconsento al trattamento dei dati personali"
- Alla creazione: `consentGivenAt = new Date()`, `consentVersion = "1.0"`
- Lo schema Zod valida che `consent === true` con refine

**Modifica cliente:**
- Il campo consenso NON viene mostrato nel form di modifica (il consenso e' gia' stato dato)
- Lo schema `updateClientSchema` NON include il campo consent

**Soft delete (predisposizione per Story 3.3):**
- Il campo `deletedAt` e' nullable — `null` = cliente attivo, valore = soft-deleted
- TUTTE le query sui clienti includono `isNull(clients.deletedAt)` nella clausola WHERE
- L'implementazione effettiva del diritto all'oblio (impostare `deletedAt`) e' in Story 3.3

### TanStack Query: Setup e Utilizzo

**Installazione:**
```bash
npm install @tanstack/react-query
```

**Provider (src/app/providers.tsx):**
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**IMPORTANTE:** Se `providers.tsx` esiste gia' (es. con altri provider), aggiungere `QueryClientProvider` wrappando il contenuto esistente. NON sovrascrivere altri provider.

**Root Layout (src/app/layout.tsx):**
```typescript
import { Providers } from './providers'

// Nel return del layout:
<body>
  <Providers>
    {children}
  </Providers>
</body>
```

**Utilizzo in ClientSearch:**
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['clients', 'search', debouncedQuery],
  queryFn: () => fetch(`/api/clients/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
  enabled: debouncedQuery.length >= 2,
})
```

### Ricerca Incrementale: API Route Pattern

**API Route (src/app/api/clients/search/route.ts):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchClients } from '@/lib/queries/clients'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ clients: [] }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) {
    return NextResponse.json({ clients: [] })
  }

  const results = await searchClients(q, session.user.tenantId)
  return NextResponse.json({ clients: results })
}
```

**Query searchClients:**
```typescript
export async function searchClients(query: string, tenantId: string) {
  const searchPattern = `%${query}%`
  return db.select({
    id: clients.id,
    firstName: clients.firstName,
    lastName: clients.lastName,
    phone: clients.phone,
    email: clients.email,
  })
  .from(clients)
  .where(and(
    eq(clients.tenantId, tenantId),
    isNull(clients.deletedAt),
    or(
      ilike(clients.firstName, searchPattern),
      ilike(clients.lastName, searchPattern),
      ilike(clients.phone, searchPattern),
    )
  ))
  .orderBy(asc(clients.lastName), asc(clients.firstName))
  .limit(10)
}
```

**Debounce nel componente ClientSearch:**
Implementare un custom hook `useDebounce` o usare `setTimeout`/`clearTimeout` in un `useEffect` per ritardare la query di 300ms dopo l'ultimo input.

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
```

### Pagina Lista Clienti: Comportamento Ricerca

La pagina lista clienti ha due modalita':
1. **Modalita' lista completa** (default): mostra tutti i clienti dal server rendering iniziale
2. **Modalita' ricerca** (quando l'utente digita 2+ caratteri): mostra i risultati dal server via API

**Flusso:**
- L'utente apre `/clients` → il Server Component carica tutti i clienti → `ClientList` li mostra
- L'utente digita nel campo ricerca → dopo 300ms debounce → TanStack Query fetcha `/api/clients/search?q=...`
- I risultati sostituiscono la lista originale
- L'utente cancella la ricerca → torna alla lista originale

### Avatar con Iniziali

L'avatar mostra le iniziali del cliente (prima lettera nome + prima lettera cognome) con sfondo colorato:

```typescript
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// UI:
<Avatar className="h-10 w-10">
  <AvatarFallback className="bg-primary/10 text-primary font-medium">
    {getInitials(client.firstName, client.lastName)}
  </AvatarFallback>
</Avatar>
```

Installare il componente Avatar se non presente: `npx shadcn@latest add avatar`

### UX Pattern da Seguire

- **Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- **Toast con Sonner** (gia' configurato in root layout) — `toast.success()`, `toast.error()`
- **Nessuna conferma per azioni creative** (creazione, modifica, salvataggio note)
- **Validazione inline al blur**, messaggi in italiano semplice
- **Touch target minimi 44x44px**
- **Stato vuoto** con messaggio + CTA
- **Testo bottoni imperativo:** "Crea Cliente", "Salva Modifiche", "Aggiungi Nota" — mai "OK" o "Si"
- **Ricerca incrementale:** Input con icona Search, risultati sotto l'input, avatar + nome + telefono
- **Breadcrumb** nella pagina dettaglio: "Clienti > [Nome Cognome]"
- **Navigazione click su riga:** Click sulla riga del cliente nella lista porta al dettaglio
- **Form note inline:** Il form per aggiungere una nota e' nella pagina dettaglio, NON in modale. Textarea + bottone "Aggiungi Nota" direttamente nella sezione note.
- **Data formattata in italiano:** Usare `Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' })` per le date delle note

### Design Tokens e UX

```
Primary:        var(--primary) — verde salvia #4A7C6F — bottoni CTA, link, avatar sfondo
Primary Light:  #E8F0ED — sfondi selezionati, hover, avatar fallback
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
| Tabelle DB | snake_case plurale | `clients`, `client_notes` |
| Colonne DB | snake_case | `first_name`, `last_name`, `consent_given_at`, `deleted_at` |
| Server Actions | camelCase con verbo | `createClient`, `updateClient`, `addClientNote` |
| Schema Zod | camelCase + Schema | `createClientSchema`, `updateClientSchema`, `addClientNoteSchema` |
| Componenti React | PascalCase | `ClientForm.tsx`, `ClientList.tsx`, `ClientDetail.tsx`, `ClientNotes.tsx`, `ClientSearch.tsx` |
| File directory | kebab-case | `components/client/` |
| Tipi inferiti | PascalCase + FormData | `CreateClientFormData`, `UpdateClientFormData`, `AddClientNoteFormData` |
| Query functions | camelCase con get/search | `getClients`, `getClientById`, `getClientNotes`, `searchClients` |
| API Route | kebab-case | `api/clients/search/route.ts` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      clients/
        page.tsx              # CREARE: lista clienti (Server Component)
        [id]/
          page.tsx            # CREARE: dettaglio cliente (Server Component)
    api/
      clients/
        search/
          route.ts            # CREARE: API route ricerca incrementale
    providers.tsx             # CREARE o AGGIORNARE: QueryClientProvider
    layout.tsx                # AGGIORNARE: wrappare children con <Providers>
  components/
    client/                   # CREARE directory
      ClientForm.tsx          # CREARE: form creazione/modifica cliente
      ClientList.tsx          # CREARE: lista clienti con tabella/card responsive
      ClientDetail.tsx        # CREARE: dettaglio cliente con sezioni
      ClientNotes.tsx         # CREARE: lista note + form aggiunta nota
      ClientSearch.tsx        # CREARE: ricerca incrementale tipo-ahead
    ui/
      avatar.tsx              # INSTALLARE se non presente: npx shadcn@latest add avatar
  lib/
    actions/
      clients.ts             # CREARE: Server Actions createClient, updateClient, addClientNote
    validations/
      clients.ts             # CREARE: Schema Zod per clienti e note
    queries/
      clients.ts             # CREARE: Query functions getClients, getClientById, getClientNotes, searchClients
    db/
      schema.ts              # MODIFICARE: aggiungere tabelle clients e client_notes
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/auth/permissions.ts` — NON aggiungere `/clients` a adminOnlyRoutes (la pagina e' accessibile a tutti)
- `src/lib/actions/client.ts` — authActionClient gia' configurato, non toccare
- `src/middleware.ts` — gia' protegge tutte le route autenticate, `/clients` e' coperta automaticamente
- `src/components/layout/Sidebar.tsx` — la voce "Clienti" e' gia' nella navigazione dalla Story 1.2

### Allineamento con la Struttura del Progetto

- I componenti client vanno in `components/client/` (NON in `components/clients/` — singolare per dominio)
- Le Server Actions vanno in `actions/clients.ts` (plurale, coerente con `actions/services.ts`, `actions/locations.ts`)
- Le validazioni vanno in `validations/clients.ts`
- Le query vanno in `queries/clients.ts`
- L'API Route va in `app/api/clients/search/route.ts`
- Le pagine vanno in `app/(auth)/clients/page.tsx` e `app/(auth)/clients/[id]/page.tsx` — sotto `(auth)/`, NON sotto `settings/`

### Previous Story Intelligence

**Da Story 2.3 (Gestione Postazioni) — pattern da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile
- `useIsMobile()` hook in `src/hooks/use-mobile.ts` per responsive Dialog/Sheet
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- `useForm` con `zodResolver` — passare schema diverso per create vs update
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Singolo componente gestisce sia creazione che modifica via prop opzionale (es. `client?`)

**Da Story 2.2 (Gestione Sedi):**
- Server Component page: `auth()` + fetch data + render Client Component con props
- `router.refresh()` e' il pattern stabile per ricaricare dati dopo mutazioni
- Non servono checkPermission per pagine accessibili a tutti i ruoli

**Da Story 2.1 (Gestione Listino Servizi):**
- Il servizio list component e' un buon pattern per la lista clienti
- Tabella desktop + card mobile e' il layout responsive standard

**Da Story 1.2 (Layout e RBAC):**
- La Sidebar ha gia' la voce "Clienti" con link a `/clients`
- La Bottom Tab Bar mobile ha gia' la voce "Clienti"
- `aria-label` e `aria-current` per WCAG — seguire stesso pattern

### Git Intelligence

Pattern commit recenti:
```
story 2-3-gestione-postazioni: Task N — Descrizione breve della feature
```

**Pattern da seguire per i commit di questa story:**
```
story 3-1-anagrafica-clienti: Task N — Descrizione breve della feature
```

### Componenti shadcn/ui Necessari

Componenti gia' installati (dalle story precedenti):
- `button`, `input`, `label`, `card`, `sonner` (toast)
- `sheet`, `dialog`, `table`, `badge`, `skeleton`, `separator`, `scroll-area`
- `checkbox`, `tooltip`

**Da installare (se non gia' presenti):**
- `avatar` — per le iniziali del cliente: `npx shadcn@latest add avatar`
- `textarea` — per il form note: `npx shadcn@latest add textarea`

### Protezione Anti-Errori

- **updatedAt:** Aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **tenantId:** I nuovi clienti ereditano il tenantId dall'utente autenticato (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **deletedAt:** TUTTE le query devono includere `isNull(clients.deletedAt)` — se lo dimentichi, i clienti soft-deleted appaiono nei risultati
- **clientId verificato:** Prima di aggiungere una nota, verificare che il `clientId` appartenga al `tenantId` dell'utente E che `deletedAt IS NULL`
- **authorId:** Usare SEMPRE `ctx.userId` dal JWT come autore della nota — NON accettare `authorId` dall'input utente
- **Consenso obbligatorio:** Lo schema Zod per la creazione deve avere `refine` su `consent === true`. Lo schema per l'update NON deve includere il campo consent
- **Ricerca ILIKE:** Usare `ilike` (case-insensitive) di Drizzle per la ricerca, NON `like` (case-sensitive)
- **Limit sulla ricerca:** La query `searchClients` deve avere `limit(10)` per non sovraccaricare il client con troppi risultati
- **XSS nel contenuto note:** Il contenuto delle note viene da input utente — React gestisce l'escaping automaticamente nel rendering JSX. NON usare `dangerouslySetInnerHTML`.
- **Debounce 300ms:** Il ClientSearch deve avere un debounce di 300ms per non sovraccaricare il server con richieste ad ogni carattere
- **Sezioni placeholder:** Le sezioni "Cani Associati" e "Storico Appuntamenti" nel dettaglio cliente devono mostrare uno stato vuoto funzionale, NON un componente non implementato che genera errori

### Conteggio Cani — Nota per Story 3.2

L'AC #1 richiede il "numero di cani associati" nella lista clienti. Nella Story 3.1, la tabella `dogs` non esiste ancora. Due approcci:
1. **Approccio consigliato:** Mostrare "0 cani" come placeholder o omettere il conteggio dalla lista. Aggiornare la query e l'UI in Story 3.2 quando la tabella dogs sara' disponibile.
2. La query `getClients` per ora restituisce solo i dati della tabella `clients`. In Story 3.2, aggiungere un LEFT JOIN con `COUNT(dogs.id)` per ottenere il conteggio reale.

### Testing

Nessun framework di test e' attualmente configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale** — testare tutti i flussi come admin e come collaborator
- **Casi critici da verificare:**
  - Creazione cliente con dati validi → salvataggio nel DB con tenantId, consentGivenAt, consentVersion corretti
  - Creazione cliente senza consenso → errore validazione "Devi accettare il trattamento dati"
  - Creazione cliente con nome troppo corto (<2 char) → errore inline
  - Modifica cliente → dati aggiornati, toast "Cliente aggiornato"
  - Aggiunta nota → nota salvata con data e autore corretto, visibile nella lista note
  - Ricerca con 1 carattere → nessuna ricerca attivata
  - Ricerca con 2+ caratteri → risultati mostrati dopo 300ms debounce
  - Ricerca senza risultati → "Nessun risultato" con opzione "Crea nuovo cliente"
  - Click su "Crea nuovo cliente" dalla ricerca → apre ClientForm
  - Navigazione: click su riga cliente → pagina dettaglio `/clients/[id]`
  - Pagina dettaglio con cliente inesistente → redirect a `/clients`
  - Stato vuoto lista clienti → messaggio "Nessun cliente registrato" + CTA
  - Stato vuoto note → messaggio "Nessuna nota" con form aggiunta visibile
  - Avatar: verifica che le iniziali siano corrette (es. "MR" per Mario Rossi)
  - TanStack Query: verifica che la ricerca funziona dopo setup provider
  - Collaborator: accesso completo a /clients e /clients/[id] — NO redirect

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId, GDPR soft delete, Drizzle pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, naming, TanStack Query]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — directory organization, components/client/]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Boundaries — API Route /api/clients/search]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping — FR12-FR15 → clients]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture — TanStack Query, React Hook Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns — ricerca incrementale]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form — form layout, validazione inline]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay — Dialog/Sheet]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gerarchia-Bottoni — bottoni primario, secondario]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Feedback — Toast Sonner]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy — ClientSearch, Avatar]
- [Source: _bmad-output/planning-artifacts/prd.md#FR12 — Creazione clienti]
- [Source: _bmad-output/planning-artifacts/prd.md#FR13 — Modifica dati cliente]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14 — Note libere su cliente]
- [Source: _bmad-output/planning-artifacts/prd.md#FR15 — Ricerca rapida cliente]
- [Source: _bmad-output/planning-artifacts/prd.md#GDPR — Consenso, predisposizione soft delete]
- [Source: _bmad-output/implementation-artifacts/2-3-gestione-postazioni-con-servizi-abilitati-e-orari.md — Pattern codice, file list, completion notes]
- [Source: src/lib/db/schema.ts — Tabelle users, services, locations, stations come riferimento pattern]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/lib/actions/locations.ts — Pattern Server Actions]
- [Source: src/lib/validations/locations.ts — Pattern Schema Zod]
- [Source: src/lib/queries/locations.ts — Pattern Query functions]
- [Source: src/components/location/LocationForm.tsx — Pattern form con Dialog/Sheet responsive]
- [Source: src/components/location/LocationList.tsx — Pattern lista con tabella/card responsive]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
