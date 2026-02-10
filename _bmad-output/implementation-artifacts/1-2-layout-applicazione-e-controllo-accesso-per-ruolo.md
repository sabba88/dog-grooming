# Story 1.2: Layout Applicazione e Controllo Accesso per Ruolo

Status: in-progress

## Story

As a **utente autenticato**,
I want **navigare l'applicazione con un'interfaccia chiara e vedere solo le funzionalita' del mio ruolo**,
so that **possa lavorare in modo efficiente senza confusione**.

## Acceptance Criteria

1. **Given** un utente autenticato accede all'applicazione su desktop (>= 1024px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una Sidebar a sinistra (220px) con le voci di navigazione (Agenda, Clienti, Cani, Servizi, Dashboard) e Impostazioni in fondo
   **And** la voce attiva ha sfondo #E8F0ED con bordo sinistro primary

2. **Given** un utente autenticato accede all'applicazione su mobile (< 768px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una Bottom Tab Bar con le voci principali (Agenda, Clienti, Cani, Home)
   **And** la voce attiva e' in colore primary #4A7C6F

3. **Given** un utente con ruolo Collaboratore
   **When** naviga nell'applicazione
   **Then** non vede e non puo' accedere alle pagine Gestione Utenze e Gestione Sedi/Postazioni, e non puo' modificare il Listino Servizi

4. **Given** un utente con ruolo Amministratore
   **When** naviga nell'applicazione
   **Then** ha accesso completo a tutte le funzionalita' e pagine

5. **Given** la utility checkRole() e' implementata in permissions.ts
   **When** una Server Action verifica il ruolo dell'utente
   **Then** la verifica usa la configurazione centralizzata dei permessi
   **And** un accesso non autorizzato restituisce un errore tipizzato senza dettagli tecnici

## Tasks / Subtasks

- [x] Task 1: Installare componenti shadcn/ui necessari (AC: #1, #2)
  - [x] 1.1 Aggiungere il componente Sidebar di shadcn/ui: `npx shadcn@latest add sidebar`
  - [x] 1.2 Aggiungere componenti supplementari se necessari: `npx shadcn@latest add tooltip separator scroll-area sheet`
  - [x] 1.3 Installare Lucide React (icone) se non gia' presente: verificare in package.json

- [x] Task 2: Creare il layout autenticato `(auth)/layout.tsx` (AC: #1, #2)
  - [x] 2.1 Creare `src/app/(auth)/layout.tsx` — layout wrapper per tutte le pagine protette
  - [x] 2.2 Il layout deve includere: Sidebar (desktop), BottomBar (mobile), Header
  - [x] 2.3 Utilizzare le classi responsive Tailwind: `hidden md:flex` per sidebar, `md:hidden` per bottom bar
  - [x] 2.4 Il contenuto principale deve avere `pb-20 md:pb-0` per evitare sovrapposizione con la bottom bar su mobile
  - [x] 2.5 Il layout deve leggere la sessione per ottenere il ruolo dell'utente e passarlo ai componenti di navigazione

- [x] Task 3: Creare il componente Sidebar desktop (AC: #1, #3, #4)
  - [x] 3.1 Creare `src/components/layout/Sidebar.tsx`
  - [x] 3.2 Utilizzare i componenti shadcn/ui Sidebar (SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarFooter)
  - [x] 3.3 Larghezza: 220px espansa, 56px collassata (icone)
  - [x] 3.4 Voci di navigazione con icone Lucide: Agenda (Calendar), Clienti (Users), Cani (Dog/PawPrint), Servizi (Scissors), Dashboard (LayoutDashboard)
  - [x] 3.5 Voce "Impostazioni" (Settings) nel SidebarFooter in fondo
  - [x] 3.6 Voce attiva: sfondo `#E8F0ED`, testo `#4A7C6F`, bordo sinistro 3px primary — usare `usePathname()` per determinare la voce attiva
  - [x] 3.7 Filtrare le voci in base al ruolo: Collaboratore NON vede "Impostazioni" (che contiene Utenze, Sedi/Postazioni)
  - [x] 3.8 Mostrare nome utente e ruolo nel footer della sidebar con opzione logout

- [x] Task 4: Creare il componente BottomBar mobile (AC: #2, #3, #4)
  - [x] 4.1 Creare `src/components/layout/BottomBar.tsx`
  - [x] 4.2 Barra fissa in basso (`fixed bottom-0 left-0 right-0`), 4 voci: Agenda (Calendar), Clienti (Users), Cani (PawPrint), Home (LayoutDashboard)
  - [x] 4.3 Voce attiva: icona + label in `#4A7C6F`, le altre in `#94A3B8`
  - [x] 4.4 Touch target minimo 44x44px per ogni voce
  - [x] 4.5 Sfondo bianco con bordo superiore `#E2E8F0`
  - [x] 4.6 Visibile solo sotto md (768px): `className="md:hidden"`

- [x] Task 5: Creare il componente Header (AC: #1, #2)
  - [x] 5.1 Creare `src/components/layout/Header.tsx`
  - [x] 5.2 Contenuto: titolo pagina corrente (dinamico dal pathname), nome utente, bottone logout
  - [x] 5.3 Su mobile: aggiungere SidebarTrigger (hamburger menu) per accesso menu esteso
  - [x] 5.4 Predisporre lo spazio per il selettore sede (sara' implementato in Epica 2)

- [x] Task 6: Creare le pagine placeholder per le route autenticate (AC: #1)
  - [x] 6.1 Creare `src/app/(auth)/agenda/page.tsx` — placeholder "Agenda" (sara' implementata in Epica 4)
  - [x] 6.2 Creare `src/app/(auth)/clients/page.tsx` — placeholder "Clienti" (sara' implementata in Epica 3)
  - [x] 6.3 Creare `src/app/(auth)/dogs/page.tsx` — placeholder "Cani" (sara' implementata in Epica 3)
  - [x] 6.4 Creare `src/app/(auth)/services/page.tsx` — placeholder "Servizi" (sara' implementata in Epica 2)
  - [x] 6.5 Creare `src/app/(auth)/dashboard/page.tsx` — placeholder "Dashboard" (sara' implementata in Epica 5)
  - [x] 6.6 Creare `src/app/(auth)/settings/page.tsx` — placeholder "Impostazioni" (Admin only)
  - [x] 6.7 Creare `src/app/(auth)/settings/users/page.tsx` — placeholder "Gestione Utenze" (sara' implementata in Story 1.3)
  - [x] 6.8 Creare `src/app/(auth)/settings/locations/page.tsx` — placeholder "Gestione Sedi" (sara' implementata in Epica 2)
  - [x] 6.9 Aggiornare `src/app/page.tsx` per redirigere a `/agenda` (la pagina principale dell'app)

- [ ] Task 7: Implementare RBAC sulle route (AC: #3, #4, #5)
  - [ ] 7.1 Aggiornare `src/lib/auth/permissions.ts` — aggiungere mappa dei permessi per route: definire quali route sono accessibili per ruolo
  - [ ] 7.2 Le route admin-only: `/settings`, `/settings/users`, `/settings/locations`
  - [ ] 7.3 Aggiornare `src/middleware.ts` per verificare il ruolo nelle route admin-only e redirigere se non autorizzato
  - [ ] 7.4 Ogni pagina admin-only deve anche verificare il ruolo server-side come doppia protezione (non affidarsi solo al middleware)
  - [ ] 7.5 Messaggio di redirect/errore senza dettagli tecnici — redirigere a `/agenda` se il collaboratore tenta di accedere a una route admin

- [ ] Task 8: Aggiornare pagina di login per redirect post-login (AC: #1)
  - [ ] 8.1 Dopo il login, redirigere a `/agenda` invece che a `/` (la home dell'app e' l'agenda)
  - [ ] 8.2 Verificare che il logout rediriga a `/login`

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `next-safe-action` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — nessuna eccezione
- **Pattern Result:** `{ success: true, data } | { success: false, error }` per le risposte
- **Lingua UI:** Italiano (label, messaggi, placeholder). **Lingua codice:** Inglese
- **Componenti shadcn/ui** nella directory `src/components/ui/` — NON modificare i file generati
- **Componenti custom** nella directory `src/components/layout/` per Sidebar, BottomBar, Header

### Stack Rilevante per Questa Story

| Layer | Tecnologia | Note |
|-------|-----------|------|
| Framework | Next.js 16 (App Router) | Layout system con route groups `(auth)/` |
| Styling | Tailwind CSS v4 | Responsive: `md:` (768px), `lg:` (1024px) |
| Componenti | shadcn/ui Sidebar | `npx shadcn@latest add sidebar` — basato su Radix UI |
| Icone | Lucide React | Integrato con shadcn/ui |
| Auth | Auth.js v5 | `useSession()` per ottenere ruolo utente lato client |
| RBAC | permissions.ts | `checkRole()` gia' implementata in Story 1.1 |

### Design Tokens

```
Primary:        #4A7C6F (verde salvia)
Primary Light:  #E8F0ED (sfondo voce attiva)
Primary Dark:   #345A50 (hover bottoni)
Background:     #FFFFFF
Surface:        #F8FAFB
Border:         #E2E8F0
Text Primary:   #1A202C
Text Secondary: #64748B
Text Muted:     #94A3B8 (icone inattive bottom bar)
Font:           Inter
```

### Specifiche UX Sidebar Desktop

- Larghezza espansa: 220px, collassata: 56px (solo icone)
- Voci navigazione con icona + label (espansa) o solo icona (collassata)
- Voce attiva: sfondo `#E8F0ED`, testo `#4A7C6F`, bordo sinistro 3px `#4A7C6F`
- Voci inattive: testo `#64748B`, icone `#64748B`
- Hover voci inattive: sfondo `#F8FAFB`
- Footer sidebar: nome utente + ruolo + bottone logout
- Breakpoint lg (1024px): sidebar espansa con label
- Breakpoint md-lg (768px-1023px): sidebar collassata a icone

### Specifiche UX Bottom Tab Bar Mobile

- 4 voci: Agenda, Clienti, Cani, Home (Dashboard)
- Voce attiva: icona + label in `#4A7C6F`
- Voci inattive: icona + label in `#94A3B8`
- Touch target minimo: 44x44px
- Posizione: fissa in basso
- Sfondo: bianco con bordo superiore `#E2E8F0`
- Altezza: ~64px

### Mappa Navigazione per Ruolo

| Voce | Route | Admin | Collaboratore |
|------|-------|-------|---------------|
| Agenda | /agenda | ✅ | ✅ |
| Clienti | /clients | ✅ | ✅ |
| Cani | /dogs | ✅ | ✅ |
| Servizi | /services | ✅ | ✅ (sola lettura) |
| Dashboard | /dashboard | ✅ | ✅ |
| Impostazioni | /settings | ✅ | ❌ |
| Gestione Utenze | /settings/users | ✅ | ❌ |
| Gestione Sedi | /settings/locations | ✅ | ❌ |

**Nota:** Il Collaboratore puo' VEDERE la pagina Servizi ma NON puo' creare/modificare/eliminare servizi. Questa restrizione sara' implementata nelle Server Actions dell'Epica 2, non nella navigazione.

### Previous Story Intelligence (Story 1.1)

**Learnings critici da Story 1.1:**
- `next-auth@5` installato come `next-auth@beta` (v5.0.0-beta.30) — usare questo tag
- `next-safe-action v8`: API middleware cambiata da constructor a `.use()` chain
- shadcn/ui: componente `toast` deprecato, usare `sonner` (gia' installato)
- Next.js 16.1.6: middleware file convention deprecata (warning ma funzionante)
- `src/middleware.ts` gia' esiste e protegge le route — ESTENDERE, non ricreare
- `src/lib/auth/permissions.ts` gia' esiste con `checkRole()` — ESTENDERE, non ricreare
- `src/app/providers.tsx` include `QueryClientProvider` + `SessionProvider` — gia' pronto
- `src/app/page.tsx` attualmente mostra la sessione e il bottone logout — DA SOSTITUIRE con redirect a /agenda

**File creati da Story 1.1 da NON sovrascrivere:**
- `src/middleware.ts` — estendere con logica RBAC per route admin
- `src/lib/auth/permissions.ts` — estendere con mappa route-permessi
- `src/lib/auth/auth.ts` — NON toccare
- `src/app/providers.tsx` — NON toccare
- `src/app/layout.tsx` — NON toccare (root layout con font, providers, Toaster)
- `src/app/globals.css` — potrebbe necessitare di aggiunta custom properties per sidebar
- `src/components/ui/*` — NON modificare file shadcn generati

**File da Story 1.1 da MODIFICARE:**
- `src/app/page.tsx` — sostituire con redirect a `/agenda`
- `src/middleware.ts` — aggiungere logica RBAC per route protette per ruolo
- `src/lib/auth/permissions.ts` — aggiungere mappa permessi per route

### Convenzioni Naming

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Componenti React | PascalCase | `Sidebar.tsx`, `BottomBar.tsx`, `Header.tsx` |
| File route | kebab-case | `(auth)/agenda/page.tsx` |
| Directory | kebab-case | `components/layout/` |
| Props interface | PascalCase | `SidebarProps`, `NavItem` |
| Funzioni | camelCase | `getNavItems`, `isActiveRoute` |

### Project Structure Notes

Questa story crea i componenti di layout che saranno usati da TUTTE le pagine autenticate successive.

```
src/
  app/
    page.tsx                    # MODIFICARE: redirect a /agenda
    (auth)/
      layout.tsx                # CREARE: layout autenticato (sidebar + header + bottom bar)
      agenda/
        page.tsx                # CREARE: placeholder
      clients/
        page.tsx                # CREARE: placeholder
      dogs/
        page.tsx                # CREARE: placeholder
      services/
        page.tsx                # CREARE: placeholder
      dashboard/
        page.tsx                # CREARE: placeholder
      settings/
        page.tsx                # CREARE: placeholder (admin only)
        users/
          page.tsx              # CREARE: placeholder (admin only, Story 1.3)
        locations/
          page.tsx              # CREARE: placeholder (admin only, Epica 2)
  components/
    layout/
      Sidebar.tsx               # CREARE: navigazione desktop
      BottomBar.tsx             # CREARE: navigazione mobile
      Header.tsx                # CREARE: header con titolo e utente
  lib/
    auth/
      permissions.ts            # ESTENDERE: mappa route-permessi
  middleware.ts                  # ESTENDERE: RBAC per route admin
```

### Icone Lucide per la Navigazione

```typescript
import {
  Calendar,      // Agenda
  Users,         // Clienti
  PawPrint,      // Cani (o Dog se disponibile)
  Scissors,      // Servizi
  LayoutDashboard, // Dashboard / Home
  Settings,      // Impostazioni
  LogOut,        // Logout
  Menu,          // Hamburger mobile
  ChevronLeft,   // Collassa sidebar
} from 'lucide-react'
```

### Pattern Critico: Layout NON e' il Gate di Sicurezza

Il layout `(auth)/layout.tsx` serve per la UI (sidebar, header) ma NON e' il punto di sicurezza. La sicurezza e' garantita da:
1. `middleware.ts` — prima linea: redirect a /login se non autenticato + RBAC route
2. `checkRole()` nelle Server Actions — seconda linea: verifica ruolo per operazioni
3. Il layout legge la sessione solo per mostrare/nascondere voci navigazione

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC-Middleware-Utility]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-di-Navigazione]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4-Limiti-per-Ruolo]
- [Source: _bmad-output/implementation-artifacts/1-1-inizializzazione-progetto-e-login.md#Dev-Notes]
- [Source: https://ui.shadcn.com/docs/components/sidebar - shadcn/ui Sidebar]
- [Source: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups - Route Groups]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1: Installati componenti shadcn/ui (sidebar, separator, sheet, tooltip, skeleton, scroll-area). lucide-react gia' presente (v0.563.0). Hook use-mobile.ts generato automaticamente.
- Task 2: Creato (auth)/layout.tsx — Server Component che legge la sessione, passa userRole e userName ai componenti di navigazione. Usa SidebarProvider con larghezze custom (220px/56px) e SidebarInset per il contenuto. Padding bottom-20 su mobile per BottomBar.
- Task 3: Creato Sidebar.tsx con shadcn/ui Sidebar (collapsible="icon"). Nav items definiti in nav-items.ts condiviso. Voce attiva styled con #E8F0ED bg, #4A7C6F text, 3px left border. Filtraggio voci per ruolo. Footer con nome/ruolo utente e logout.
- Task 4: Creato BottomBar.tsx — barra fissa in basso, 4 voci (Agenda, Clienti, Cani, Home), touch target 64px altezza, voce attiva #4A7C6F, inattive #94A3B8, md:hidden.
- Task 5: Creato Header.tsx — titolo pagina dinamico da pathname, nome utente, SidebarTrigger. Spazio riservato per selettore sede (Epica 2).
- Task 6: Create 8 pagine placeholder (agenda, clients, dogs, services, dashboard, settings, settings/users, settings/locations). Pagine admin-only (settings/*) includono verifica ruolo server-side con redirect a /agenda. Aggiornato page.tsx root per redirect a /agenda.

### Change Log

### File List

- src/components/ui/sidebar.tsx (nuovo)
- src/components/ui/separator.tsx (nuovo)
- src/components/ui/sheet.tsx (nuovo)
- src/components/ui/tooltip.tsx (nuovo)
- src/components/ui/skeleton.tsx (nuovo)
- src/components/ui/scroll-area.tsx (nuovo)
- src/hooks/use-mobile.ts (nuovo)
- src/app/(auth)/layout.tsx (nuovo)
- src/components/layout/Sidebar.tsx (nuovo)
- src/components/layout/BottomBar.tsx (nuovo)
- src/components/layout/Header.tsx (nuovo)
- src/components/layout/nav-items.ts (nuovo)
- src/app/(auth)/agenda/page.tsx (nuovo)
- src/app/(auth)/clients/page.tsx (nuovo)
- src/app/(auth)/dogs/page.tsx (nuovo)
- src/app/(auth)/services/page.tsx (nuovo)
- src/app/(auth)/dashboard/page.tsx (nuovo)
- src/app/(auth)/settings/page.tsx (nuovo)
- src/app/(auth)/settings/users/page.tsx (nuovo)
- src/app/(auth)/settings/locations/page.tsx (nuovo)
- src/app/page.tsx (modificato — redirect a /agenda)
