---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-09'
inputDocuments:
  - product-brief-dog-grooming-2026-02-06.md
  - prd.md
  - ux-design-specification.md
workflowType: 'architecture'
project_name: 'dog-grooming'
user_name: 'Samueles'
date: '2026-02-09'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Requisiti Funzionali:**
33 requisiti funzionali (FR1-FR33) organizzati in 9 aree:

| Area | Requisiti | Complessita' architetturale |
|------|-----------|---------------------------|
| Gestione Utenze e Accessi | FR1-FR4 | Media — RBAC, autenticazione, gestione sessioni |
| Gestione Sedi e Postazioni | FR5-FR8 | Bassa — CRUD con relazioni gerarchiche (Sede → Postazione → Servizi abilitati) |
| Gestione Listino Servizi | FR9-FR11 | Bassa — CRUD con permessi differenziati per ruolo |
| Anagrafica Clienti | FR12-FR15 | Bassa — CRUD con note e ricerca rapida |
| Anagrafica Cani | FR16-FR19 | Bassa — CRUD con relazione 1:N verso Cliente, storico note prestazioni |
| Gestione Appuntamenti | FR20-FR25 | Alta — vincoli di non-sovrapposizione, calcolo automatico durata, spostamento, note prestazione |
| Agenda e Visualizzazione | FR26-FR29 | Alta — vista per sede/postazione, navigazione temporale, identificazione visiva slot liberi/occupati |
| Dashboard | FR30 | Bassa — vista riassuntiva aggregata |
| Privacy e Dati Personali | FR31-FR33 | Media — GDPR (oblio, portabilita', consenso) impatta la modellazione dei dati |

**Requisiti Non-Funzionali:**
12 NFR che guidano le scelte architetturali:

- **Performance (NFR1-NFR4):** Caricamenti istantanei, salvataggi senza ritardo, appuntamento in <30s, 5 utenti concorrenti — richiede ottimizzazione frontend (caching, ottimistic updates) e query efficienti
- **Sicurezza (NFR5-NFR10):** Autenticazione con password hashate, HTTPS, RBAC, conformita' GDPR, predisposizione multi-giurisdizione — richiede middleware di autorizzazione robusto e gestione dati privacy-aware
- **Scalabilita' (NFR11-NFR12):** MVP single-tenant (max 5 utenti), architettura senza vincoli verso multi-tenant — richiede isolamento logico dei dati fin dall'inizio

**Implicazioni architetturali dalla specifica UX:**

- **Componenti custom complessi:** ScheduleGrid (griglia agenda desktop) e ScheduleTimeline (timeline mobile) sono i componenti piu' critici — richiedono rendering performante di molti elementi, gestione eventi touch/click, aggiornamento in tempo reale
- **Responsive con comportamento differenziato:** Non solo layout diverso ma componenti diversi per mobile vs desktop (Sheet vs Dialog, Timeline vs Grid)
- **Ricerca incrementale:** ClientSearch con type-ahead richiede debouncing, query ottimizzate e UX fluida
- **Pre-compilazione intelligente:** I form auto-compilano dati dal contesto (slot selezionato, servizio → durata/prezzo) — richiede gestione stato frontend sofisticata
- **Accessibilita' WCAG 2.1 AA:** Navigazione da tastiera, screen reader, contrasto colori, focus management — impatta ogni componente

**Scala e Complessita':**

- Dominio primario: Full-stack web (React/Next.js frontend + API + database relazionale)
- Livello di complessita': Medio
- Componenti architetturali stimati: ~8-10 (Auth, API, Database, Frontend App, Scheduling Engine, RBAC Middleware, GDPR Data Layer, Search, Dashboard Aggregation)

### Vincoli Tecnici e Dipendenze

- **Stack definito dalla UX spec:** React + Next.js + TypeScript + shadcn/ui + Tailwind CSS — vincola il frontend
- **Web app responsive, nessuna app nativa** — semplifica l'architettura (un solo artefatto deployabile)
- **Connessione richiesta (no offline)** — semplifica la gestione stato e sincronizzazione
- **Sviluppatore singolo con AI** — l'architettura deve essere semplice, manutenibile, con convention chiare per gli agenti AI
- **MVP single-tenant** — nessun overhead multi-tenant immediato, ma le scelte non devono precluderlo
- **GDPR fin dall'MVP** — non rimandabile, deve essere integrato nella modellazione dei dati

### Concern Trasversali Identificati

- **Autenticazione e Autorizzazione (RBAC):** Attraversa ogni endpoint e vista — middleware centralizzato
- **GDPR e Privacy:** Impatta storage, query, cancellazione e esportazione dati — deve essere un layer architetturale, non un'aggiunta posteriore
- **Gestione dello Stato Frontend:** Pre-compilazione form, aggiornamento ottimistico agenda, ricerca incrementale — richiede una strategia di state management coerente
- **Predisposizione Multi-Tenant:** Ogni entita' deve avere un tenant_id o equivalente fin dall'inizio, anche se l'MVP ha un solo tenant
- **Performance Percepita:** Ottimistic updates, caching, query ottimizzate — impatta sia frontend che backend
- **Validazione e Vincoli di Business:** Non-sovrapposizione appuntamenti, orari postazione, servizi abilitati — logica di business che deve essere server-side per consistenza

## Starter Template Evaluation

### Dominio Tecnologico Primario

Full-stack web application basata su React/Next.js, identificata dall'analisi dei requisiti di progetto e dalla specifica UX che definisce esplicitamente lo stack frontend.

### Preferenze Tecniche e Piattaforma

- **Deploy:** Vercel — piattaforma di riferimento per Next.js, con ecosistema di servizi integrati
- **Approccio:** Massimizzare l'uso di servizi built-in Vercel per billing unificato, minima complessita' operativa e sviluppatore singolo

### Starter Options Considerati

**Opzione 1: `create-next-app` (Next.js 16) — SELEZIONATA**
- Starter ufficiale Vercel, sempre allineato all'ultima versione di Next.js
- Setup minimalista: TypeScript, Tailwind CSS v4, App Router, ESLint, Turbopack
- Massima compatibilita' con la documentazione e l'ecosistema Vercel
- Richiede aggiunta manuale di Drizzle, Auth.js, shadcn/ui — ma garantisce pieno controllo

**Opzione 2: `create-t3-app` (T3 Stack) — SCARTATA**
- Full-stack out-of-the-box: Next.js + tRPC + Drizzle + NextAuth + Tailwind
- Scartata perche': (1) v7.40.0 potrebbe non supportare Next.js 16, (2) tRPC aggiunge complessita' non necessaria quando le Server Actions di Next.js coprono i casi d'uso CRUD di dog-grooming, (3) minor controllo sulle versioni dei singoli componenti

### Starter Selezionato: create-next-app (Next.js 16)

**Motivazione della Scelta:**
- Next.js 16 con Turbopack offre performance di sviluppo superiore, critico per sviluppatore singolo con AI
- Le Server Actions di Next.js eliminano la necessita' di tRPC per operazioni CRUD
- Lo starter ufficiale garantisce compatibilita' al 100% con Vercel
- Ogni dipendenza aggiuntiva e' scelta e configurata esplicitamente, facilitando il debug

**Comando di Inizializzazione:**

```bash
npx create-next-app@16 dog-grooming --typescript --tailwind --eslint --app --src-dir --import-alias="@/*" --turbopack
```

### Decisioni Architetturali dello Starter

**Linguaggio e Runtime:**
- TypeScript strict mode
- Node.js runtime per le Server Functions

**Styling:**
- Tailwind CSS v4 (integrato dallo starter)
- shadcn/ui da aggiungere con `npx shadcn@latest init`

**Build Tooling:**
- Turbopack come bundler di default (dev e build)
- ESLint per linting

**Organizzazione Codice:**
- App Router (directory `app/`)
- Struttura `src/` abilitata
- Import alias `@/*`

**Nota:** L'inizializzazione del progetto con questo comando sara' la prima story di implementazione.

### Stack Tecnologico Completo

| Layer | Tecnologia | Integrazione Vercel |
|-------|-----------|-------------------|
| Framework | Next.js 16 (App Router) | Nativo |
| Linguaggio | TypeScript strict | Nativo |
| Styling | Tailwind CSS v4 + shadcn/ui | Nativo |
| Database | Vercel Postgres (Neon) | Marketplace built-in |
| ORM | Drizzle ORM | Serverless driver Neon |
| Auth | Auth.js v5 (credentials) | Middleware Next.js |
| Storage | Vercel Blob (futuro) | Built-in |
| Deploy | Vercel | Nativo |

## Core Architectural Decisions

### Analisi Priorita' Decisioni

**Decisioni Critiche (Bloccano l'Implementazione):**
- Validazione dati: Zod
- Strategia sessioni: JWT
- Pattern API: Server Actions + API Routes
- State management: Server Components + TanStack Query
- Form handling: React Hook Form + Zod
- RBAC: Middleware + utility checkRole()

**Decisioni Importanti (Modellano l'Architettura):**
- Predisposizione multi-tenant (tenantId su tutte le entita')
- GDPR: soft delete + export + consenso
- Type-safe Server Actions: next-safe-action
- Caching: Next.js cache + TanStack Query

**Decisioni Differite (Post-MVP):**
- Strategia di scaling orizzontale
- Monitoring avanzato (servizi esterni)
- Database sessions (se necessarie per invalidazione istantanea)
- Rate limiting (non necessario con 5 utenti concorrenti)

### Data Architecture

**Validazione Dati: Zod**
- Libreria di validazione TypeScript-first
- Schema condiviso tra client (React Hook Form) e server (Server Actions)
- Integrazione con Drizzle per derivare schemi di validazione dalle tabelle
- Rationale: standard de facto per Next.js, documentazione ufficiale lo raccomanda per i form
- Impatta: tutti i form, tutte le Server Actions, validazione API

**Strategia di Migrazione: Drizzle Kit**
- `db:push` durante lo sviluppo (applicazione diretta dello schema al database)
- `db:generate` + `db:migrate` per produzione (migrazioni versionabili e tracciabili)
- Schema definito in TypeScript — singola fonte di verita' per tipi e database
- Rationale: integrato nativamente con Drizzle ORM, zero configurazione aggiuntiva

**Predisposizione Multi-Tenant**
- Campo `tenantId` presente su tutte le entita' fin dall'MVP
- L'MVP avra' un solo tenant, ma il campo sara' sempre presente
- Tutte le query Drizzle filtreranno per `tenantId`
- Rationale: aggiungere un campo dopo e' costoso e rischioso; averlo dall'inizio e' un costo marginale
- Impatta: schema database, tutte le query, tutte le Server Actions

**Caching**
- Server-side: Next.js built-in data cache e full route cache
- Client-side: TanStack Query per cache, invalidation e refetching intelligente
- Ottimistic updates su TanStack Query per le mutazioni appuntamento
- Rationale: TanStack Query offre DevTools, mutations avanzate e invalidation granulare — superiore a SWR per la complessita' dell'agenda
- Impatta: performance percepita, aggiornamento agenda in tempo reale

### Authentication & Security

**Strategia Sessioni: JWT**
- JWT (non database sessions) per l'MVP
- Il token contiene: `userId`, `role`, `tenantId`
- Refresh automatico via Auth.js built-in (rotazione)
- Rationale: elimina query al database per ogni richiesta autenticata; sufficiente per 5 utenti concorrenti
- Fallback: migrazione a database sessions possibile senza cambiare l'architettura
- Impatta: autenticazione, middleware, Server Actions

**RBAC: Middleware + Utility**
- Middleware Next.js per protezione route (redirect se non autenticato)
- Utility `checkRole()` riusabile nelle Server Actions per verifica ruolo
- Due ruoli: `ADMIN` e `COLLABORATOR` — enum nel database e nel JWT
- Configurazione permessi centralizzata in `src/lib/permissions.ts`
- Rationale: semplicita', singolo punto di definizione dei permessi, facile da estendere
- Impatta: ogni route protetta, ogni Server Action con restrizioni di ruolo

**GDPR**
- Soft delete per dati cliente (campo `deletedAt`) — preserva integrita' referenziale
- Endpoint export dati cliente in JSON (portabilita')
- Campi consenso sull'entita' Cliente: `consentGivenAt`, `consentVersion`
- Purge periodica dei record soft-deleted dopo periodo di retention
- Rationale: GDPR richiesto fin dall'MVP, soft delete e' il pattern piu' sicuro per mantenere consistenza dei dati
- Impatta: schema Cliente, query con filtro `deletedAt IS NULL`, endpoint dedicati

### API & Communication Patterns

**Pattern API: Server Actions + API Routes**
- Server Actions per tutte le mutazioni CRUD (appuntamenti, clienti, cani, servizi, etc.)
- API Routes per casi specifici: ricerca incrementale (endpoint debounced), webhook futuri
- Nessun tRPC — le Server Actions con Zod coprono la type-safety end-to-end
- Rationale: pattern nativo Next.js, zero overhead, type-safe con Zod
- Impatta: tutta la comunicazione client-server

**Type-Safe Server Actions: next-safe-action**
- Wrapper leggero per Server Actions con validazione Zod automatica
- Gestione errori standardizzata: input validation errors vs server errors
- Pattern consistente per tutti gli agenti AI
- Rationale: standardizza il pattern delle Server Actions, riduce boilerplate, previene errori di validazione
- Impatta: tutte le Server Actions

**Error Handling**
- Pattern Result: `{ success: true, data } | { success: false, error }`
- Errori di validazione (Zod) separati dagli errori server
- Toast sul client per feedback utente (come da UX spec)
- Gestione errori inline nei componenti, nessun error boundary globale per errori di business
- Rationale: pattern esplicito, nessuna eccezione silenziosa, UX chiara per l'utente
- Impatta: tutte le Server Actions, tutti i form, componenti UI

### Frontend Architecture

**State Management**
- Server Components come default per il rendering iniziale dei dati
- TanStack Query per lo stato server-side sul client: ottimistic updates, cache invalidation, refetching
- React useState/useReducer per stato locale UI (form aperti, filtri, navigazione agenda)
- Nessun Redux, Zustand o state manager globale
- Rationale: Server Components + TanStack Query + React state coprono tutti i casi senza overhead aggiuntivo
- Impatta: tutti i componenti, strategia di data fetching

**Form Handling: React Hook Form + Zod**
- React Hook Form per gestione form lato client (validazione real-time, UX reattiva)
- Zod come schema condiviso tra RHF (client) e Server Actions (server)
- Pattern: RHF valida sul client → Server Action ri-valida con lo stesso schema Zod → risposta tipizzata
- Rationale: ecosistema maturo, documentazione ampia, integrazione Zod nativa
- Impatta: tutti i form dell'applicazione

**Data Fetching**
- Server Components per caricamento iniziale pagine (agenda del giorno, lista clienti)
- TanStack Query per interazioni client-side (ricerca incrementale, aggiornamento agenda post-mutazione, navigazione tra giorni)
- Ottimistic Updates su TanStack Query per mutazioni appuntamento — agenda si aggiorna istantaneamente
- Rationale: massimizza la performance percepita, riduce la latenza visibile per l'utente
- Impatta: agenda, ricerca clienti, tutte le operazioni CRUD

### Infrastructure & Deployment

**CI/CD: Vercel Built-in**
- Push su branch → Preview deployment automatico
- Merge su main → Production deployment
- Nessun pipeline CI/CD esterno per l'MVP
- Rationale: zero configurazione, integrato nativamente con Vercel
- Impatta: workflow di sviluppo, review deployments

**Environment Configuration**
- Vercel Environment Variables per i segreti (DATABASE_URL, AUTH_SECRET, etc.)
- File `.env.local` per sviluppo locale
- File `.env.example` committato come template (senza valori reali)
- Nessun file `.env` committato nel repository
- Rationale: best practice di sicurezza, gestione centralizzata su Vercel

**Monitoring**
- Vercel Analytics per metriche di performance (Web Vitals, page views)
- Vercel Speed Insights per monitoraggio performance reali
- Logging strutturato nelle Server Actions per debug in produzione
- Nessun servizio esterno per l'MVP
- Rationale: servizi built-in Vercel sufficienti per l'MVP, zero costo aggiuntivo

### Analisi d'Impatto delle Decisioni

**Sequenza di Implementazione:**
1. Inizializzazione progetto (`create-next-app`) + shadcn/ui + Drizzle + Auth.js
2. Schema database (Drizzle) con `tenantId` su tutte le entita'
3. Autenticazione e RBAC (Auth.js + middleware + permissions)
4. Server Actions con next-safe-action + Zod
5. Frontend con TanStack Query + React Hook Form
6. Componenti agenda (ScheduleGrid/Timeline)

**Dipendenze tra Decisioni:**
- Drizzle schema → Zod schema (derivati) → Server Actions (next-safe-action) → React Hook Form → TanStack Query
- Auth.js → JWT con role/tenantId → Middleware Next.js → checkRole() nelle Server Actions
- tenantId → presente in tutte le query Drizzle → filtro implicito in tutte le Server Actions

## Implementation Patterns & Consistency Rules

### Punti di Conflitto Critici Identificati

18 aree dove agenti AI diversi potrebbero fare scelte incompatibili. I pattern seguenti eliminano l'ambiguita'.

### Naming Patterns

**Database Naming Conventions (Drizzle Schema):**

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle | `snake_case` plurale | `appointments`, `service_notes` |
| Colonne | `snake_case` | `created_at`, `tenant_id`, `client_id` |
| Foreign key | `{entita_singolare}_id` | `client_id`, `station_id` |
| Indici | `idx_{tabella}_{colonne}` | `idx_appointments_station_id_date` |
| Enum | `snake_case` | `user_role` con valori `admin`, `collaborator` |

Esempio concreto di tabella Drizzle:

```typescript
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  clientId: uuid('client_id').notNull(),
  dogId: uuid('dog_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  stationId: uuid('station_id').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  price: integer('price').notNull(), // centesimi
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**Code Naming Conventions (TypeScript/React):**

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Componenti React | `PascalCase` | `ScheduleGrid`, `AppointmentBlock` |
| File componente | `PascalCase.tsx` | `ScheduleGrid.tsx`, `ClientSearch.tsx` |
| Funzioni/variabili | `camelCase` | `getAppointments`, `handleSlotClick` |
| Tipi/Interface | `PascalCase` | `Appointment`, `CreateAppointmentInput` |
| Costanti | `UPPER_SNAKE_CASE` | `MAX_CONCURRENT_USERS`, `DEFAULT_SLOT_DURATION` |
| Server Actions | `camelCase` con verbo | `createAppointment`, `updateClient`, `deleteService` |
| Schema Zod | `camelCase` + `Schema` | `createAppointmentSchema`, `updateClientSchema` |
| Hook custom | `use` + `PascalCase` | `useAppointments`, `useClientSearch` |

**File e Directory Naming:**

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Directory | `kebab-case` | `schedule/`, `client-search/` |
| File route (App Router) | `kebab-case` | `app/clients/[id]/page.tsx` |
| File utility | `camelCase.ts` | `permissions.ts`, `dateUtils.ts` |
| File schema Drizzle | `camelCase.ts` | `schema.ts` |

### Structure Patterns

**Organizzazione Progetto:**

```
src/
  app/                          # Next.js App Router routes
    (auth)/                     # Route group: pagine autenticate
      agenda/page.tsx
      clients/page.tsx
      clients/[id]/page.tsx
      dogs/page.tsx
      services/page.tsx
      dashboard/page.tsx
      settings/page.tsx
    (public)/                   # Route group: pagine pubbliche
      login/page.tsx
    api/                        # API Routes (solo dove necessario)
      clients/search/route.ts
    layout.tsx
    providers.tsx               # Client providers (TanStack Query, etc.)
  components/
    ui/                         # shadcn/ui (generati, non modificare)
    schedule/                   # Componenti agenda
    appointment/                # Componenti appuntamento
    client/                     # Componenti cliente
    dashboard/                  # Componenti dashboard
    layout/                     # Sidebar, BottomBar, Header
  lib/
    db/
      schema.ts                 # Schema Drizzle (tutte le tabelle)
      index.ts                  # Connessione database
      migrations/               # Migrazioni Drizzle Kit
    auth/
      auth.ts                   # Configurazione Auth.js
      permissions.ts            # Regole RBAC centralizzate
    actions/                    # Server Actions (next-safe-action)
      client.ts                 # Configurazione actionClient
      appointments.ts
      clients.ts
      dogs.ts
      services.ts
      locations.ts
    validations/                # Schema Zod
      appointments.ts
      clients.ts
      dogs.ts
      services.ts
    queries/                    # Query functions per TanStack Query
      appointments.ts
      clients.ts
    utils/
      dates.ts                  # Utility date/ora
      formatting.ts             # Formattazione prezzi, etc.
    types/                      # Tipi condivisi
      index.ts
  hooks/                        # Hook React custom
    useAppointments.ts
    useClientSearch.ts
```

**Regole strutturali:**
- Test co-locati: `ComponentName.test.tsx` nella stessa directory del componente
- Un file Server Action per dominio (`actions/appointments.ts`), mai un file per singola action
- Schema Zod separati dalle Server Actions (in `validations/`) per riusabilita' client/server
- Query TanStack separate (in `queries/`) per riusabilita' tra componenti
- Componenti organizzati per feature/dominio, non per tipo

### Format Patterns

**Server Actions (pattern obbligatorio con next-safe-action + Zod):**

```typescript
// src/lib/actions/appointments.ts
'use server'

import { actionClient } from '@/lib/actions/client'
import { createAppointmentSchema } from '@/lib/validations/appointments'
import { checkRole } from '@/lib/auth/permissions'

export const createAppointment = actionClient
  .schema(createAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    checkRole(ctx.session, ['admin', 'collaborator'])
    // ... logica di business
    return { appointment }
  })
```

**Anti-pattern — VIETATO:**

```typescript
// NO: Server Action senza validazione Zod
export async function createAppointment(data: any) { ... }

// NO: Validazione inline invece di schema condiviso
export async function createAppointment(data: unknown) {
  if (!data.clientId) throw new Error('Missing client')
}
```

**Risposte API Routes (per i pochi endpoint REST):**

```typescript
// Successo
{ success: true, data: { ... } }

// Errore di validazione
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', fields: { ... } } }

// Errore server
{ success: false, error: { code: 'SERVER_ERROR', message: '...' } }

// Non autorizzato
{ success: false, error: { code: 'UNAUTHORIZED', message: '...' } }
```

**Date e Orari:**
- Database: `timestamp` PostgreSQL (UTC)
- API/JSON: ISO 8601 string (`2026-02-09T10:30:00.000Z`)
- UI: Formattata in locale italiano con `Intl.DateTimeFormat('it-IT', ...)`

**Prezzi:**
- Database: interi in centesimi (`1500` = 15.00 EUR)
- UI: formattati in EUR (`€ 15,00`)

**JSON field naming:** `camelCase` in tutti gli scambi client-server

### Communication Patterns

**TanStack Query Keys (pattern obbligatorio):**

```typescript
// Pattern: [dominio, azione, ...parametri]
['appointments', 'list', { date: '2026-02-09', locationId: '...' }]
['appointments', 'detail', appointmentId]
['clients', 'search', { query: 'Mar' }]
['clients', 'detail', clientId]
['dogs', 'byClient', clientId]
```

**Invalidation dopo mutazione:**

```typescript
// Dopo createAppointment:
queryClient.invalidateQueries({ queryKey: ['appointments'] })

// Dopo updateClient:
queryClient.invalidateQueries({ queryKey: ['clients', 'detail', clientId] })
```

**State Update:** Sempre immutabile — nessuna mutazione diretta dello stato

**Ottimistic Update per appuntamenti:**
1. Aggiorna la cache TanStack Query immediatamente
2. Invia la Server Action
3. Se errore: rollback automatico (gestito da TanStack Query)

### Process Patterns

**Error Handling per livello:**

| Livello | Gestione | Esempio |
|---------|----------|---------|
| Validazione form (client) | React Hook Form + Zod → errori inline sotto i campi | "Inserisci il nome del cliente" |
| Validazione Server Action | next-safe-action + Zod → ritorna errori al client | Stessi messaggi del client |
| Errore di business | Return esplicito con codice errore | `{ code: 'SLOT_OCCUPIED', message: 'Lo slot e' gia' occupato' }` |
| Errore server imprevisto | Try/catch → log + messaggio generico | "Si e' verificato un errore. Riprova." |

Regola critica: mai esporre dettagli tecnici all'utente. Loggare server-side, mostrare messaggio semplice client-side.

**Loading States:**
- Server Components: `loading.tsx` di Next.js con Skeleton (shadcn/ui)
- Client mutations: stato `isPending` di TanStack Query → bottone disabilitato con spinner
- Ricerca incrementale: debounce 300ms, nessun loading visibile per query rapide

**Lingua dell'Interfaccia:**
- UI (label, messaggi, placeholder, errori utente): Italiano
- Codice (variabili, funzioni, commenti, nomi tabelle): Inglese
- Messaggi toast: Italiano, linguaggio semplice del salone
- Errori di validazione: Italiano, nessun gergo tecnico

### Regole di Enforcement

**Tutti gli agenti AI DEVONO:**

1. Usare `next-safe-action` con schema Zod per OGNI Server Action — nessuna eccezione
2. Includere `tenantId` in OGNI query al database — nessuna eccezione
3. Usare `checkRole()` in OGNI Server Action con restrizioni di ruolo
4. Seguire le naming conventions esattamente — `snake_case` nel DB, `camelCase` nel codice, `PascalCase` per componenti
5. Co-locare i test nella stessa directory del file testato
6. Usare schemi Zod dalla directory `validations/`, mai definire validazione inline
7. Formattare le date in italiano nella UI, ISO 8601 nelle API/database
8. Prezzi in centesimi nel database, formattati in EUR nella UI

**Verifica Pattern:**
- Ogni PR/commit deve rispettare le naming conventions
- Lo schema Zod deve esistere in `validations/` prima di creare la Server Action
- Il `tenantId` deve essere presente in ogni query — verificabile con grep sul codice

## Project Structure & Boundaries

### Complete Project Directory Structure

```
dog-grooming/
├── .env.example                    # Template variabili d'ambiente (committato)
├── .env.local                      # Variabili d'ambiente locali (NON committato)
├── .eslintrc.json                  # Configurazione ESLint
├── .gitignore
├── components.json                 # Configurazione shadcn/ui
├── drizzle.config.ts               # Configurazione Drizzle Kit
├── next.config.ts                  # Configurazione Next.js 16
├── package.json
├── postcss.config.mjs              # Configurazione PostCSS (Tailwind v4)
├── tailwind.config.ts              # Configurazione Tailwind CSS v4
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── globals.css             # Stili globali + importazioni Tailwind
│   │   ├── layout.tsx              # Root layout (metadata, font, providers)
│   │   ├── providers.tsx           # Client providers (TanStack QueryClientProvider)
│   │   ├── (auth)/                 # Route group — pagine autenticate
│   │   │   ├── layout.tsx          # Layout autenticato (Sidebar/BottomBar, Header)
│   │   │   ├── agenda/
│   │   │   │   └── page.tsx        # FR26-FR29: Vista agenda per sede/postazione
│   │   │   ├── appointments/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx    # FR20-FR25: Creazione appuntamento rapido
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx        # FR12-FR15: Lista clienti con ricerca
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Dettaglio cliente + cani + storico
│   │   │   ├── dogs/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # FR16-FR19: Dettaglio cane + storico note
│   │   │   ├── services/
│   │   │   │   └── page.tsx        # FR9-FR11: Gestione listino servizi
│   │   │   ├── locations/
│   │   │   │   └── page.tsx        # FR5-FR8: Gestione sedi e postazioni
│   │   │   ├── users/
│   │   │   │   └── page.tsx        # FR1-FR2: Gestione utenze (solo Admin)
│   │   │   ├── settings/
│   │   │   │   └── page.tsx        # Impostazioni profilo, orari
│   │   │   └── dashboard/
│   │   │       └── page.tsx        # FR30: Dashboard riassuntiva
│   │   ├── (public)/               # Route group — pagine pubbliche
│   │   │   └── login/
│   │   │       └── page.tsx        # FR3: Login con credenziali
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # Auth.js v5 route handler
│   │       └── clients/
│   │           └── search/
│   │               └── route.ts    # API Route per ricerca incrementale (debounced)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (generati con CLI, NON modificare)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── ...                 # Altri componenti shadcn/ui su necessita'
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Navigazione desktop (UX spec)
│   │   │   ├── BottomBar.tsx       # Navigazione mobile (UX spec)
│   │   │   └── Header.tsx          # Header con sede corrente, utente
│   │   ├── schedule/
│   │   │   ├── ScheduleGrid.tsx    # Griglia agenda desktop (postazioni × fasce orarie)
│   │   │   ├── ScheduleTimeline.tsx # Timeline agenda mobile (scroll verticale)
│   │   │   ├── AppointmentBlock.tsx # Blocco singolo appuntamento nella griglia
│   │   │   ├── TimeSlot.tsx        # Slot orario (libero/occupato)
│   │   │   ├── DayNavigator.tsx    # Navigazione tra giorni (FR27)
│   │   │   └── StationColumn.tsx   # Colonna singola postazione nel ScheduleGrid
│   │   ├── appointment/
│   │   │   ├── AppointmentForm.tsx  # Form creazione/modifica appuntamento
│   │   │   ├── AppointmentDetail.tsx # Dettaglio appuntamento con azioni
│   │   │   └── AppointmentNotes.tsx # Note prestazione (FR24)
│   │   ├── client/
│   │   │   ├── ClientSearch.tsx     # Ricerca incrementale clienti (FR15)
│   │   │   ├── ClientForm.tsx       # Form creazione/modifica cliente
│   │   │   ├── ClientDetail.tsx     # Dettaglio cliente con lista cani
│   │   │   └── ClientNotes.tsx      # Note libere cliente (FR14)
│   │   ├── dog/
│   │   │   ├── DogForm.tsx          # Form creazione/modifica cane
│   │   │   ├── DogDetail.tsx        # Dettaglio cane con storico
│   │   │   └── DogNotes.tsx         # Note cane + storico prestazioni (FR18-FR19)
│   │   ├── service/
│   │   │   ├── ServiceForm.tsx      # Form creazione/modifica servizio (Admin)
│   │   │   └── ServiceList.tsx      # Lista servizi (lettura per Collaboratore)
│   │   ├── location/
│   │   │   ├── LocationForm.tsx     # Form sede (Admin)
│   │   │   ├── StationForm.tsx      # Form postazione con servizi abilitati (Admin)
│   │   │   └── ScheduleForm.tsx     # Form orari apertura/chiusura (Admin)
│   │   ├── user/
│   │   │   └── UserForm.tsx         # Form creazione/modifica utenza (Admin)
│   │   └── dashboard/
│   │       ├── DashboardSummary.tsx # Riepilogo giornaliero
│   │       └── DashboardStats.tsx   # Statistiche aggregate
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts            # Connessione Drizzle + Neon serverless driver
│   │   │   ├── schema.ts           # Schema Drizzle completo (tutte le tabelle)
│   │   │   └── migrations/         # Migrazioni Drizzle Kit (produzione)
│   │   ├── auth/
│   │   │   ├── auth.ts             # Configurazione Auth.js v5 (credentials provider)
│   │   │   └── permissions.ts      # Regole RBAC centralizzate + checkRole()
│   │   ├── actions/
│   │   │   ├── client.ts           # Configurazione actionClient (next-safe-action)
│   │   │   ├── appointments.ts     # Server Actions: create, update, delete, move, addNote
│   │   │   ├── clients.ts          # Server Actions: create, update, delete (soft), addNote
│   │   │   ├── dogs.ts             # Server Actions: create, update, addNote
│   │   │   ├── services.ts         # Server Actions: create, update, delete
│   │   │   ├── locations.ts        # Server Actions: create, update sedi + postazioni + orari
│   │   │   ├── users.ts            # Server Actions: create, update, deactivate utenze
│   │   │   └── gdpr.ts             # Server Actions: exportClientData, deleteClientData (FR31-FR33)
│   │   ├── validations/
│   │   │   ├── appointments.ts     # Schema Zod: createAppointmentSchema, updateAppointmentSchema
│   │   │   ├── clients.ts          # Schema Zod: createClientSchema, updateClientSchema
│   │   │   ├── dogs.ts             # Schema Zod: createDogSchema, updateDogSchema
│   │   │   ├── services.ts         # Schema Zod: createServiceSchema, updateServiceSchema
│   │   │   ├── locations.ts        # Schema Zod: createLocationSchema, createStationSchema
│   │   │   └── users.ts            # Schema Zod: createUserSchema, updateUserSchema
│   │   ├── queries/
│   │   │   ├── appointments.ts     # Query functions: getAppointments, getByDate, getByStation
│   │   │   ├── clients.ts          # Query functions: searchClients, getClientById
│   │   │   ├── dogs.ts             # Query functions: getDogsByClient, getDogById
│   │   │   ├── services.ts         # Query functions: getServices
│   │   │   ├── locations.ts        # Query functions: getLocations, getStations
│   │   │   └── dashboard.ts        # Query functions: getDashboardStats
│   │   ├── utils/
│   │   │   ├── dates.ts            # Utility date/ora: formatDate, formatTime, isSlotAvailable
│   │   │   └── formatting.ts       # Utility formattazione: formatPrice, formatDuration
│   │   └── types/
│   │       └── index.ts            # Tipi condivisi: Appointment, Client, Dog, Service, etc.
│   ├── hooks/
│   │   ├── useAppointments.ts      # Hook TanStack Query per appuntamenti
│   │   ├── useClientSearch.ts      # Hook ricerca incrementale clienti
│   │   ├── useDashboard.ts         # Hook dati dashboard
│   │   └── useSchedule.ts          # Hook navigazione agenda (data corrente, sede)
│   └── middleware.ts               # Middleware Next.js: protezione route, redirect login
└── docs/                           # Documentazione progetto (se necessario)
```

### Architectural Boundaries

**API Boundaries:**

| Confine | Tipo | Descrizione |
|---------|------|-------------|
| Server Actions (`src/lib/actions/`) | Mutazioni | Tutte le operazioni CRUD passano per Server Actions con next-safe-action + Zod |
| API Route (`src/app/api/clients/search/`) | Query | Endpoint REST per ricerca incrementale con debounce |
| API Route (`src/app/api/auth/`) | Auth | Auth.js v5 route handler per login/logout/session |
| Middleware (`src/middleware.ts`) | Auth gate | Protezione route: redirect a `/login` se non autenticato |

**Component Boundaries:**

| Confine | Responsabilita' | Comunicazione |
|---------|-----------------|---------------|
| Server Components (page.tsx) | Caricamento iniziale dati, layout | Props → Client Components |
| Client Components (form, interazione) | Interazione utente, mutazioni | TanStack Query → Server Actions |
| Layout Components (Sidebar, Header) | Navigazione, contesto sede | React Context (sede corrente) |
| Schedule Components (Grid/Timeline) | Visualizzazione agenda | Props da page + hook useSchedule |

**Data Boundaries:**

| Confine | Accesso | Pattern |
|---------|---------|---------|
| Schema Drizzle (`src/lib/db/schema.ts`) | Definizione tabelle | Singola fonte di verita' per il database |
| Query Functions (`src/lib/queries/`) | Lettura dati | Funzioni pure che ricevono tenantId, restituiscono dati tipizzati |
| Server Actions (`src/lib/actions/`) | Scrittura dati | next-safe-action + Zod, sempre con tenantId dal JWT |
| Validations (`src/lib/validations/`) | Schemi condivisi | Zod schema usati sia client (RHF) che server (actions) |

### Requirements to Structure Mapping

| Area Funzionale | Route | Actions | Validations | Components | Queries |
|----------------|-------|---------|-------------|------------|---------|
| **Utenze (FR1-FR4)** | `users/page.tsx`, `login/page.tsx` | `users.ts` | `users.ts` | `user/UserForm.tsx` | — |
| **Sedi/Postazioni (FR5-FR8)** | `locations/page.tsx` | `locations.ts` | `locations.ts` | `location/LocationForm.tsx`, `StationForm.tsx`, `ScheduleForm.tsx` | `locations.ts` |
| **Listino (FR9-FR11)** | `services/page.tsx` | `services.ts` | `services.ts` | `service/ServiceForm.tsx`, `ServiceList.tsx` | `services.ts` |
| **Clienti (FR12-FR15)** | `clients/page.tsx`, `clients/[id]/page.tsx` | `clients.ts` | `clients.ts` | `client/ClientSearch.tsx`, `ClientForm.tsx`, `ClientDetail.tsx`, `ClientNotes.tsx` | `clients.ts` |
| **Cani (FR16-FR19)** | `dogs/[id]/page.tsx` | `dogs.ts` | `dogs.ts` | `dog/DogForm.tsx`, `DogDetail.tsx`, `DogNotes.tsx` | `dogs.ts` |
| **Appuntamenti (FR20-FR25)** | `appointments/new/page.tsx` | `appointments.ts` | `appointments.ts` | `appointment/AppointmentForm.tsx`, `AppointmentDetail.tsx`, `AppointmentNotes.tsx` | `appointments.ts` |
| **Agenda (FR26-FR29)** | `agenda/page.tsx` | — | — | `schedule/ScheduleGrid.tsx`, `ScheduleTimeline.tsx`, `DayNavigator.tsx`, `StationColumn.tsx`, `TimeSlot.tsx`, `AppointmentBlock.tsx` | `appointments.ts` |
| **Dashboard (FR30)** | `dashboard/page.tsx` | — | — | `dashboard/DashboardSummary.tsx`, `DashboardStats.tsx` | `dashboard.ts` |
| **GDPR (FR31-FR33)** | `clients/[id]/page.tsx` (azioni) | `gdpr.ts` | — | Azioni nel `ClientDetail.tsx` | — |

### Cross-Cutting Concerns Mapping

| Concern | File Principali | Impatto |
|---------|----------------|---------|
| **Autenticazione** | `middleware.ts`, `lib/auth/auth.ts`, `api/auth/[...nextauth]/route.ts` | Ogni route protetta |
| **RBAC** | `lib/auth/permissions.ts`, ogni Server Action | Ogni operazione con restrizione di ruolo |
| **Multi-tenant (tenantId)** | `lib/db/schema.ts` (ogni tabella), `lib/actions/client.ts` (actionClient), ogni query | Ogni accesso al database |
| **Validazione** | `lib/validations/*`, `lib/actions/*`, componenti form | Ogni input utente |
| **GDPR** | `lib/db/schema.ts` (soft delete, consenso), `lib/actions/gdpr.ts` | Entita' Cliente, operazioni di cancellazione/export |
| **Error Handling** | `lib/actions/client.ts` (actionClient), componenti form | Ogni mutazione, ogni form |
| **Performance (Optimistic Updates)** | `hooks/useAppointments.ts`, `hooks/useSchedule.ts` | Mutazioni appuntamento, agenda |

### Data Flow Example: Creazione Appuntamento

```
1. [AgendaPage] Server Component → carica appuntamenti del giorno (query Drizzle)
2. [ScheduleGrid] Client Component → mostra griglia con slot liberi/occupati
3. [Utente] Tocca slot libero → apre AppointmentForm
4. [ClientSearch] Type-ahead → API Route /api/clients/search (debounce 300ms)
5. [AppointmentForm] React Hook Form + Zod → valida input client-side
6. [Utente] Conferma → Server Action createAppointment (next-safe-action)
7. [Server Action] Zod ri-valida → checkRole() → verifica non-sovrapposizione → INSERT
8. [TanStack Query] Optimistic update → agenda si aggiorna istantaneamente
9. [Server Action] Ritorna risultato → TanStack Query conferma o rollback
10. [Toast] Feedback utente: "Appuntamento creato" / errore
```

### Development Workflow Integration

**Sviluppo Locale:**
- `npm run dev` — Next.js 16 con Turbopack (hot reload istantaneo)
- `.env.local` con `DATABASE_URL` verso Vercel Postgres (development branch)
- `npx drizzle-kit push` — applica schema al database di sviluppo

**Build e Deploy:**
- Push su branch → Vercel Preview Deployment automatico
- Merge su `main` → Vercel Production Deployment
- Migrazioni produzione: `npx drizzle-kit generate` → `npx drizzle-kit migrate`

**Test:**
- Test co-locati: `ComponentName.test.tsx` nella stessa directory del componente
- Pattern: un file test per componente/action, mai directory `__tests__` separata

## Architecture Validation Results

### Coherence Validation

**Compatibilita' delle Decisioni:**

| Decisione A | Decisione B | Compatibilita' |
|------------|------------|-----------------|
| Next.js 16 (App Router) | Server Actions + next-safe-action | Nativo, zero conflitti |
| Drizzle ORM | Vercel Postgres (Neon) | Supportato via `@neondatabase/serverless` driver |
| Auth.js v5 | JWT sessions con role/tenantId | Supportato nativamente, callback `jwt` e `session` |
| TanStack Query | Server Components | Complementari: SC per caricamento iniziale, TQ per interazioni client |
| React Hook Form + Zod | next-safe-action + Zod | Schema Zod condiviso — singola fonte di verita' |
| Tailwind CSS v4 | shadcn/ui | shadcn/ui usa Tailwind nativamente |
| Turbopack | Drizzle Kit | Indipendenti, nessun conflitto |

Nessuna incompatibilita' rilevata.

**Consistenza dei Pattern:**
- Naming conventions coerenti: `snake_case` DB, `camelCase` codice, `PascalCase` componenti — Drizzle gestisce il mapping automaticamente
- Server Action pattern (next-safe-action + Zod) applicato uniformemente a tutti i domini
- TanStack Query keys seguono struttura consistente `[dominio, azione, ...params]`
- Error handling stratificato: form → action → business → server — livelli chiari

**Allineamento Struttura:**
- Directory structure riflette ogni decisione architetturale
- Separation of concerns rispettata: `validations/` separati da `actions/` separati da `queries/`
- Route group `(auth)/` e `(public)/` allineati con la strategia di autenticazione middleware

### Requirements Coverage Validation

**Requisiti Funzionali (FR1-FR33):**

| FR | Descrizione | Supporto Architetturale |
|----|-------------|------------------------|
| FR1-FR2 | Gestione utenze (CRUD Admin) | `actions/users.ts` + `users/page.tsx` + checkRole('admin') |
| FR3 | Autenticazione | Auth.js v5 credentials + `login/page.tsx` |
| FR4 | Limiti per ruolo | `permissions.ts` + checkRole() in ogni action |
| FR5-FR8 | Sedi, postazioni, servizi abilitati, orari | `actions/locations.ts` + `locations/page.tsx` + form dedicati |
| FR9-FR11 | Listino servizi (CRUD + sola lettura) | `actions/services.ts` + `services/page.tsx` + RBAC |
| FR12-FR15 | Clienti (CRUD + note + ricerca) | `actions/clients.ts` + `clients/page.tsx` + `ClientSearch.tsx` + API search |
| FR16-FR19 | Cani (CRUD + note + storico) | `actions/dogs.ts` + `dogs/[id]/page.tsx` + `DogNotes.tsx` |
| FR20-FR25 | Appuntamenti (CRUD + non-sovrapposizione + note + durata auto) | `actions/appointments.ts` + `appointments/new/page.tsx` + logica server-side |
| FR26-FR29 | Agenda per sede/postazione + navigazione | `agenda/page.tsx` + `ScheduleGrid.tsx` + `ScheduleTimeline.tsx` + `DayNavigator.tsx` |
| FR30 | Dashboard riassuntiva | `dashboard/page.tsx` + `DashboardSummary.tsx` + `queries/dashboard.ts` |
| FR31-FR33 | GDPR (oblio + portabilita' + consenso) | `actions/gdpr.ts` + soft delete + export JSON + campi consenso in schema |

Copertura: **33/33 FR** — 100%

**Requisiti Non-Funzionali (NFR1-NFR12):**

| NFR | Requisito | Supporto |
|-----|-----------|----------|
| NFR1-NFR2 | Caricamenti/salvataggi istantanei | Server Components + TanStack Query optimistic updates |
| NFR3 | Appuntamento in <30s | Flusso ottimizzato: ricerca, selezione, pre-compilazione, conferma |
| NFR4 | 5 utenti concorrenti | JWT (zero query session), Vercel serverless auto-scale |
| NFR5-NFR6 | Autenticazione + password hashate | Auth.js v5 con bcrypt integrato |
| NFR7 | HTTPS | Vercel deploy con HTTPS nativo |
| NFR8 | RBAC | Middleware + checkRole() + permissions.ts |
| NFR9 | GDPR | Soft delete + export + consenso nello schema |
| NFR10 | Multi-giurisdizione | Architettura predisposta (campi consenso versionati) |
| NFR11 | Single-tenant MVP | tenantId presente ma singolo valore |
| NFR12 | Nessun vincolo verso multi-tenant | tenantId su tutte le entita' fin dall'MVP |

Copertura: **12/12 NFR** — 100%

### Implementation Readiness Validation

**Completezza delle Decisioni:**
- Tutte le tecnologie specificate con ruolo chiaro
- Pattern Server Action con esempio completo di codice
- Pattern TanStack Query keys documentati con esempi
- Naming conventions esaustive con tabelle ed esempi
- Anti-pattern esplicitamente vietati

**Completezza della Struttura:**
- Albero completo con ~80 file/directory specificati
- Ogni file mappato a requisiti funzionali specifici
- Confini architetturali documentati con tabelle

**Completezza dei Pattern:**
- 8 regole di enforcement per agenti AI
- Format patterns per date, prezzi, JSON
- Error handling su 4 livelli con esempi
- Loading states e lingua dell'interfaccia definiti

### Gap Analysis Results

**Gap Critici:** Nessuno identificato.

**Gap Importanti (non bloccanti):**

1. **Schema database non dettagliato** — Solo la tabella `appointments` e' mostrata come esempio. Le altre tabelle saranno definite nello story mapping, il pattern e' chiaro.

2. **Seed data / Onboarding flow** — Il journey di onboarding non ha un pattern wizard specifico. Risolvibile con componenti shadcn/ui standard nella story specifica.

3. **Framework di test** — Test co-locati definiti ma framework specifico (Vitest/Jest) e strategia e2e da definire nella story di setup progetto.

**Gap Nice-to-Have:**
- Storybook per sviluppo componenti isolato
- Strategia di logging strutturato nel dettaglio

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Contesto progetto analizzato in profondita'
- [x] Scala e complessita' valutate
- [x] Vincoli tecnici identificati
- [x] Concern trasversali mappati

**Architectural Decisions**
- [x] Decisioni critiche documentate con motivazione
- [x] Stack tecnologico completamente specificato
- [x] Pattern di integrazione definiti
- [x] Performance considerations affrontate

**Implementation Patterns**
- [x] Naming conventions stabilite
- [x] Structure patterns definiti
- [x] Communication patterns specificati
- [x] Process patterns documentati

**Project Structure**
- [x] Directory structure completa definita
- [x] Confini architetturali stabiliti
- [x] Punti di integrazione mappati
- [x] Mapping requisiti a struttura completo

### Architecture Readiness Assessment

**Stato Complessivo:** PRONTA PER L'IMPLEMENTAZIONE

**Livello di Confidenza:** Alto

**Punti di Forza:**
- Stack coerente e moderno con zero conflitti tra le tecnologie
- Pattern di implementazione concreti con esempi di codice
- Mapping requisiti a file esplicito — ogni FR ha un indirizzo preciso nel codice
- Predisposizione multi-tenant integrata fin dall'inizio senza overhead
- 8 regole di enforcement chiare per garantire consistenza tra agenti AI
- Allineamento completo con la UX spec

**Aree per Miglioramento Futuro:**
- Schema database completo (da definire nello story mapping)
- Framework di test e strategia (da definire nella story di setup)
- Monitoring e logging strutturato (da approfondire post-MVP)

### Implementation Handoff

**Linee Guida per Agenti AI:**
- Seguire tutte le decisioni architetturali esattamente come documentate
- Usare i pattern di implementazione in modo consistente su tutti i componenti
- Rispettare la struttura del progetto e i confini architetturali
- Riferirsi a questo documento per tutte le domande architetturali

**Prima Priorita' di Implementazione:**

```bash
npx create-next-app@16 dog-grooming --typescript --tailwind --eslint --app --src-dir --import-alias="@/*" --turbopack
```
