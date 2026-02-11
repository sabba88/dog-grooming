# Story 1.3: Gestione Utenze

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare, modificare e disattivare utenze del mio salone**,
so that **possa gestire chi ha accesso al sistema e con quale ruolo**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Gestione Utenze
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista degli utenti con nome, email, ruolo e stato (attivo/disattivo)

2. **Given** un Amministratore clicca su "Nuovo Utente"
   **When** compila il form con nome, email, password e ruolo (Amministratore o Collaboratore)
   **Then** il sistema crea l'utente con password hashata e tenantId del salone corrente
   **And** mostra un toast "Utente creato"

3. **Given** un Amministratore clicca su "Nuovo Utente"
   **When** compila il form con un'email gia' esistente
   **Then** il sistema mostra un errore di validazione "Email gia' in uso"

4. **Given** un Amministratore seleziona un utente dalla lista
   **When** modifica il nome, email o ruolo e salva
   **Then** le modifiche vengono salvate
   **And** mostra un toast "Utente aggiornato"

5. **Given** un Amministratore seleziona un utente dalla lista
   **When** clicca su "Disattiva"
   **Then** viene mostrato un Alert Dialog di conferma "Disattivare l'utente [nome]?"
   **And** dopo conferma l'utente viene disattivato e non puo' piu' effettuare il login
   **And** mostra un toast "Utente disattivato"

6. **Given** un Collaboratore tenta di accedere alla pagina Gestione Utenze
   **When** il sistema verifica il ruolo
   **Then** l'accesso viene negato e l'utente viene reindirizzato a /agenda

## Tasks / Subtasks

- [x] Task 1: Creare schema Zod per validazione utenze (AC: #2, #3, #4)
  - [x] 1.1 Creare `src/lib/validations/users.ts` — `createUserSchema` con name (min 2 char), email (email valida), password (min 6 char), role (enum admin/collaborator)
  - [x] 1.2 Creare `updateUserSchema` — name, email, role (password opzionale, solo se l'admin vuole cambiarla)
  - [x] 1.3 Esportare i tipi inferiti `CreateUserFormData` e `UpdateUserFormData`

- [x] Task 2: Creare Server Actions per gestione utenze (AC: #2, #3, #4, #5)
  - [x] 2.1 Creare `src/lib/actions/users.ts` con `authActionClient` da `client.ts`
  - [x] 2.2 Implementare `createUser` — verifica ruolo admin con `checkRole('admin')`, hash password con bcryptjs, insert con tenantId dal contesto sessione, gestione errore email duplicata
  - [x] 2.3 Implementare `updateUser` — verifica ruolo admin, aggiornamento selettivo (nome, email, ruolo), hash nuova password solo se fornita, gestione errore email duplicata, aggiornamento `updatedAt`
  - [x] 2.4 Implementare `deactivateUser` — verifica ruolo admin, set `isActive = false`, impedire auto-disattivazione (admin non puo' disattivare se stesso)
  - [x] 2.5 Implementare `reactivateUser` — verifica ruolo admin, set `isActive = true`

- [x] Task 3: Creare query functions per lista utenti (AC: #1)
  - [x] 3.1 Creare `src/lib/queries/users.ts` — `getUsers(tenantId)`: query tutti gli utenti del tenant, ordinati per nome, escluso il campo password dalla select
  - [x] 3.2 Creare `getUserById(userId, tenantId)` — singolo utente per il form di modifica, escluso password

- [x] Task 4: Creare componente UserForm (AC: #2, #3, #4)
  - [x] 4.1 Creare `src/components/user/UserForm.tsx` — Client Component con React Hook Form + Zod resolver
  - [x] 4.2 Campi: Nome (Input), Email (Input), Password (Input type="password", obbligatorio solo in creazione), Ruolo (Select con opzioni Amministratore/Collaboratore)
  - [x] 4.3 Il form si apre in Dialog (desktop) o Sheet (mobile) — usare `useIsMobile()` hook gia' presente
  - [x] 4.4 Validazione inline al blur, messaggi in italiano
  - [x] 4.5 Bottone primario "Crea Utente" (creazione) o "Salva Modifiche" (modifica)
  - [x] 4.6 Gestione errore server "Email gia' in uso" — mostrare sotto il campo email

- [x] Task 5: Creare la pagina Gestione Utenze (AC: #1, #6)
  - [x] 5.1 Sostituire il placeholder `src/app/(auth)/settings/users/page.tsx` — Server Component che carica la lista utenti
  - [x] 5.2 Mantenere la verifica ruolo server-side `checkPermission('manageUsers')` con redirect a /agenda
  - [x] 5.3 Header pagina con titolo "Gestione Utenze" e bottone "Nuovo Utente" (primario)
  - [x] 5.4 Lista utenti in tabella (desktop) o card impilate (mobile): nome, email, ruolo badge (Amministratore/Collaboratore), stato badge (Attivo/Disattivo)
  - [x] 5.5 Azioni per ogni riga: "Modifica" (apre UserForm pre-compilato), "Disattiva"/"Riattiva" (toggle stato)

- [x] Task 6: Implementare disattivazione con Alert Dialog (AC: #5)
  - [x] 6.1 Installare componente shadcn/ui Alert Dialog: `npx shadcn@latest add alert-dialog`
  - [x] 6.2 Creare Dialog di conferma: titolo "Disattivare l'utente [nome]?", descrizione "L'utente non potra' piu' accedere al sistema.", bottoni "Annulla" + "Disattiva" (distruttivo)
  - [x] 6.3 Dopo conferma: chiamare `deactivateUser`, mostrare toast "Utente disattivato", aggiornare lista
  - [x] 6.4 Impedire all'admin di disattivare se stesso — bottone non visibile/disabilitato sulla propria riga

- [x] Task 7: Gestione riattivazione utenti (AC: #5)
  - [x] 7.1 Per utenti disattivati, mostrare bottone "Riattiva" al posto di "Disattiva"
  - [x] 7.2 La riattivazione non richiede Alert Dialog (azione non distruttiva)
  - [x] 7.3 Dopo riattivazione: toast "Utente riattivato", aggiornare lista

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **checkRole('admin')** in OGNI Server Action di questa story — solo l'admin gestisce utenze
- **Password:** hash con bcryptjs (gia' installato, v2.4.x), salt rounds = 10

### Stack e Pattern dal Codice Esistente

**actionClient (src/lib/actions/client.ts):**
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

**Schema Zod (pattern da src/lib/validations/auth.ts):**
```typescript
// Messaggi in italiano, tipi inferiti esportati
export const loginSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
})
export type LoginFormData = z.infer<typeof loginSchema>
```

**Database schema users (src/lib/db/schema.ts):**
```typescript
// Tabella gia' esistente con tutti i campi necessari:
// id (uuid), email (unique), password (hash), name, role (enum admin/collaborator),
// tenantId (uuid), isActive (boolean), createdAt, updatedAt
```

**RBAC (src/lib/auth/permissions.ts):**
```typescript
// checkPermission('manageUsers') — gia' usato nella pagina placeholder
// checkRole('admin') — per verifica diretta nelle Server Actions
// La pagina settings/users gia' ha doppia protezione: middleware + server-side
```

**Auth.js (src/lib/auth/auth.ts):**
```typescript
// authorize() controlla user.isActive — un utente disattivato NON puo' fare login
// Il JWT contiene: userId, role, tenantId
```

### Design Tokens e UX

```
Primary:        #4A7C6F (verde salvia) — bottoni CTA, link, stati attivi
Primary Light:  #E8F0ED — sfondi selezionati, hover, badge
Primary Dark:   #345A50 — hover bottoni
Background:     #FFFFFF
Surface:        #F8FAFB — sfondo card, pannelli
Border:         #E2E8F0 — bordi, separatori
Text Primary:   #1A202C — testo principale
Text Secondary: #64748B — label, testo secondario
Text Muted:     #94A3B8 — placeholder
Error:          #EF4444 — errori, azioni distruttive
Success:        #22C55E — conferme
Font:           Inter
```

**UX Pattern da Seguire:**
- Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px) — usare hook `useIsMobile()` da `src/hooks/use-mobile.ts`
- Toast con Sonner (gia' configurato in root layout)
- Alert Dialog solo per azioni distruttive (disattivazione)
- Nessuna conferma per azioni creative (creazione, modifica)
- Validazione inline al blur, messaggi in italiano semplice
- Touch target minimi 44x44px
- Badge per ruolo e stato con colori semantici

### Previous Story Intelligence

**Da Story 1.1:**
- `next-auth@beta` (v5.0.0-beta.30) — Auth.js v5 installato
- `next-safe-action v8` — API middleware con `.use()` chain
- shadcn/ui: usare `sonner` per toast (non `toast` deprecato)
- `src/lib/db/seed.ts` crea utente admin con `tenantId` generato — usare lo STESSO tenantId per i nuovi utenti (dal JWT)
- Schema `users` gia' include `isActive` per gestione disattivazione — NON serve migrazione DB

**Da Story 1.2:**
- Pagina `settings/users/page.tsx` gia' esiste come placeholder con `checkPermission('manageUsers')` + redirect
- RBAC a 2 livelli gia' funzionante: middleware + server-side
- `useIsMobile()` hook disponibile in `src/hooks/use-mobile.ts`
- Componenti shadcn/ui gia' installati: button, input, label, card, sonner, sidebar, separator, sheet, tooltip, skeleton, scroll-area
- Componenti DA INSTALLARE per questa story: `alert-dialog`, `select`, `badge`, `table`, `dialog`, `dropdown-menu`
- `nav-items.ts` condiviso tra Sidebar e BottomBar — NON modificare

**Da Code Review Story 1.2:**
- I colori sono stati migrati a design tokens Tailwind (variabili CSS custom in `globals.css`) — usare le classi Tailwind, non i colori inline
- `aria-label` e `aria-current` aggiunti per WCAG — seguire stesso pattern

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Server Actions | camelCase con verbo | `createUser`, `updateUser`, `deactivateUser` |
| Schema Zod | camelCase + Schema | `createUserSchema`, `updateUserSchema` |
| Componenti React | PascalCase | `UserForm.tsx`, `UserList.tsx` |
| File directory | kebab-case | `components/user/` |
| Tipi inferiti | PascalCase + FormData | `CreateUserFormData` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      settings/
        users/
          page.tsx              # SOSTITUIRE: placeholder → pagina completa
  components/
    user/
      UserForm.tsx              # CREARE: form creazione/modifica utente
  lib/
    actions/
      users.ts                  # CREARE: Server Actions CRUD utenze
    validations/
      users.ts                  # CREARE: Schema Zod per utenze
    queries/
      users.ts                  # CREARE: Query functions lista utenti
```

### Protezione Anti-Errori

- **NON permettere** all'admin di disattivare se stesso — confrontare `ctx.userId` con l'id dell'utente target
- **NON esporre** la password hashata nelle query — escludere SEMPRE il campo `password` dalle select
- **Email duplicata:** gestire l'errore PostgreSQL unique constraint (code `23505`) e ritornare messaggio user-friendly "Email gia' in uso"
- **tenantId:** i nuovi utenti ereditano il tenantId dall'admin che li crea (dal JWT `ctx.tenantId`) — NON generare un nuovo tenantId
- **updatedAt:** aggiornare manualmente con `new Date()` in ogni update — il default `defaultNow()` funziona solo all'insert
- **Ruolo nel JWT:** la modifica del ruolo di un utente si riflette solo al prossimo login (JWT non viene invalidato) — comportamento accettato per MVP

### Componenti shadcn/ui da Installare

```bash
npx shadcn@latest add alert-dialog select badge table dialog dropdown-menu
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC-Middleware-Utility]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-dei-Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Modali-e-Overlay]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gerarchia-Bottoni]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1-FR2]
- [Source: _bmad-output/implementation-artifacts/1-1-inizializzazione-progetto-e-login.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/1-2-layout-applicazione-e-controllo-accesso-per-ruolo.md#Dev-Notes]
- [Source: src/lib/db/schema.ts — Tabella users esistente]
- [Source: src/lib/auth/permissions.ts — RBAC checkRole/checkPermission]
- [Source: src/lib/actions/client.ts — authActionClient pattern]
- [Source: src/lib/auth/auth.ts — Auth.js authorize controlla isActive]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Schema Zod `createUserSchema` e `updateUserSchema` con tipi inferiti
- ✅ Task 2: Server Actions CRUD (`createUser`, `updateUser`, `deactivateUser`, `reactivateUser`) con `authActionClient`
- ✅ Task 3: Query functions `getUsers` e `getUserById` con esclusione campo password
- ✅ Task 4: Componente `UserForm` con Dialog/Sheet, React Hook Form + Zod resolver
- ✅ Task 5: Pagina Gestione Utenze con tabella desktop, card mobile, `checkPermission('manageUsers')`
- ✅ Task 6: AlertDialog di conferma disattivazione, protezione auto-disattivazione (UI + Server), toast feedback
- ✅ Task 7: Bottone Riattiva per utenti disattivati, riattivazione diretta senza dialog, toast feedback
- 🔧 Fix: Corretto `z.enum` da `required_error` a `message` per compatibilita' Zod v4.3.6
- ⚠️ Nota: Nessun framework di test configurato nel progetto — test non scritti

### File List

- `src/lib/validations/users.ts` — Schema Zod per validazione utenze (creato Task 1, fix Zod v4 Task 6)
- `src/lib/actions/users.ts` — Server Actions CRUD utenze (creato Task 2)
- `src/lib/queries/users.ts` — Query functions lista utenti (creato Task 3)
- `src/components/user/UserForm.tsx` — Form creazione/modifica utente (creato Task 4)
- `src/components/user/UserList.tsx` — Lista utenti con tabella/card, AlertDialog, riattivazione (creato Task 5, completato Task 6-7)
- `src/app/(auth)/settings/users/page.tsx` — Pagina Gestione Utenze (modificato Task 5)
- `src/components/ui/alert-dialog.tsx` — Componente shadcn/ui AlertDialog (installato Task 6)
- `src/components/ui/badge.tsx` — Componente shadcn/ui Badge (installato Task 5)
- `src/components/ui/table.tsx` — Componente shadcn/ui Table (installato Task 5)
- `src/components/ui/dialog.tsx` — Componente shadcn/ui Dialog (installato Task 4)
- `src/components/ui/select.tsx` — Componente shadcn/ui Select (installato Task 4)
- `src/components/ui/dropdown-menu.tsx` — Componente shadcn/ui DropdownMenu (installato Task 5)

## Change Log

- 2026-02-11: Task 6-7 completati — Disattivazione con AlertDialog e riattivazione utenti. Fix compatibilita' Zod v4.
