# Story 4.1: Vista Agenda per Sede e Postazione

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **visualizzare l'agenda giornaliera organizzata per sede e postazione con slot liberi e occupati chiaramente identificabili**,
so that **possa avere il controllo completo della giornata a colpo d'occhio**.

## Acceptance Criteria

1. **Given** un utente accede alla pagina Agenda su desktop (>= 1024px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una griglia (ScheduleGrid) con postazioni come colonne e fasce orarie come righe (intervalli di 30 minuti)
   **And** le fasce orarie rispettano gli orari di apertura/chiusura di ogni postazione

2. **Given** un utente accede alla pagina Agenda su mobile (< 768px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una timeline verticale (ScheduleTimeline) con tab per filtrare per postazione
   **And** una DateStrip scorrevole in alto per navigare tra i giorni

3. **Given** un utente e' sull'agenda
   **When** la pagina si carica
   **Then** viene mostrata la giornata corrente della sede selezionata nell'Header
   **And** il caricamento avviene senza indicatori di caricamento visibili (NFR1)

4. **Given** esistono appuntamenti per la giornata visualizzata
   **When** l'agenda viene renderizzata
   **Then** ogni appuntamento e' mostrato come un blocco (AppointmentBlock) con bordo sinistro colorato per servizio, nome cliente, nome cane e nome servizio
   **And** l'altezza del blocco e' proporzionale alla durata dell'appuntamento

5. **Given** esistono slot senza appuntamenti nell'agenda
   **When** l'agenda viene renderizzata
   **Then** gli slot vuoti (EmptySlot) sono visivamente distinti con pattern a righe diagonali (desktop) o bordo tratteggiato (mobile)
   **And** sono chiaramente toccabili/cliccabili

6. **Given** un utente e' sull'agenda
   **When** naviga al giorno precedente o successivo (frecce su desktop, swipe/tocco su DateStrip mobile)
   **Then** l'agenda si aggiorna mostrando gli appuntamenti del giorno selezionato

7. **Given** un utente e' sull'agenda
   **When** seleziona una data specifica dal calendario
   **Then** l'agenda salta direttamente alla data selezionata

## Tasks / Subtasks

- [x] Task 1: Aggiungere tabella `appointments` nello schema Drizzle (AC: #4)
  - [x] 1.1 Aggiungere tabella `appointments` in `src/lib/db/schema.ts` con campi: id (uuid PK), clientId (uuid, not null), dogId (uuid, not null), serviceId (uuid, not null), stationId (uuid, not null), startTime (timestamp, not null), endTime (timestamp, not null), price (integer, not null — centesimi), notes (text, nullable — placeholder per Story 4.4), tenantId (uuid, not null), createdAt, updatedAt
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo

- [x] Task 2: Creare schemi Zod per parametri query agenda (AC: #1, #3, #6, #7)
  - [x] 2.1 Creare `src/lib/validations/appointments.ts` — `getAppointmentsQuerySchema` con locationId (uuid), date (string ISO date YYYY-MM-DD)
  - [x] 2.2 Esportare tipi inferiti: `GetAppointmentsQuery`

- [x] Task 3: Creare query functions per agenda (AC: #1, #3, #4)
  - [x] 3.1 Creare `src/lib/queries/appointments.ts` — `getAppointmentsByDateAndLocation(locationId, date, tenantId)`: fetch appuntamenti del giorno con JOIN su clients (firstName, lastName), dogs (name), services (name, duration) e stations (name, id) — filtro per stationId in stations della location
  - [x] 3.2 Creare `getStationsWithScheduleForDay(locationId, dayOfWeek, tenantId)`: restituisce le postazioni della sede con i loro orari di apertura/chiusura per il giorno specificato

- [x] Task 4: Creare utility functions per gestione orari e colori agenda (AC: #1, #2, #4, #5)
  - [x] 4.1 Creare `src/lib/utils/schedule.ts` — `generateTimeSlots(openTime, closeTime, intervalMinutes)`: genera array di slot orari (HH:mm) tra apertura e chiusura con intervallo di 30 minuti
  - [x] 4.2 `getGlobalTimeRange(stations)`: calcola l'orario minimo di apertura e massimo di chiusura tra tutte le postazioni, per definire le righe della griglia
  - [x] 4.3 `isSlotOccupied(slot, appointments)`: verifica se uno slot e' occupato da un appuntamento
  - [x] 4.4 `getAppointmentPosition(appointment, dayStart)`: calcola top e altezza del blocco in base a startTime/endTime relativi all'inizio della giornata
  - [x] 4.5 `SERVICE_COLORS`: palette colori pastello per i servizi (5 colori ciclici) con `getServiceColor(serviceId, allServiceIds)` per assegnazione deterministica

- [ ] Task 5: Creare componente DateNavigation per desktop (AC: #6, #7)
  - [ ] 5.1 Creare `src/components/schedule/DateNavigation.tsx` — Client Component
  - [ ] 5.2 Frecce sinistra/destra per giorno precedente/successivo
  - [ ] 5.3 Display data corrente formattata in italiano (es. "Lunedi' 17 Febbraio 2026")
  - [ ] 5.4 Bottone "Oggi" per tornare alla data corrente
  - [ ] 5.5 Popover con Calendar (shadcn/ui) per selezionare data specifica
  - [ ] 5.6 Installare componente `calendar` e `popover` di shadcn/ui se non presenti

- [ ] Task 6: Creare componente DateStrip per mobile (AC: #2, #6)
  - [ ] 6.1 Creare `src/components/schedule/DateStrip.tsx` — Client Component
  - [ ] 6.2 Barra scorrevole orizzontale con giorni (nome abbreviato + numero, es. "Lun 17")
  - [ ] 6.3 Giorno selezionato con sfondo primary
  - [ ] 6.4 Giorno corrente con dot indicator
  - [ ] 6.5 Mostrare 7 giorni centrati sulla data corrente, aggiornabili con scroll

- [ ] Task 7: Creare componente AppointmentBlock (AC: #4)
  - [ ] 7.1 Creare `src/components/schedule/AppointmentBlock.tsx` — Client Component
  - [ ] 7.2 Bordo sinistro 4px colorato per servizio (palette pastello)
  - [ ] 7.3 Sfondo pastello corrispondente al servizio
  - [ ] 7.4 Contenuto: nome cliente, nome cane, nome servizio — troncato con ellipsis se necessario
  - [ ] 7.5 Variante `grid`: compatta, altezza proporzionale alla durata (1 minuto = X px)
  - [ ] 7.6 Variante `timeline`: card con piu' dettagli (orario, prezzo formattato)
  - [ ] 7.7 onClick handler (predisposto per dettaglio appuntamento in Story 4.3)
  - [ ] 7.8 Hover: ombra elevata. Cursore pointer.

- [ ] Task 8: Creare componente EmptySlot (AC: #5)
  - [ ] 8.1 Creare `src/components/schedule/EmptySlot.tsx` — Client Component
  - [ ] 8.2 Variante `grid`: sfondo con pattern CSS a righe diagonali (`repeating-linear-gradient`)
  - [ ] 8.3 Variante `timeline`: bordo tratteggiato, testo "+ Slot libero"
  - [ ] 8.4 Hover: evidenziazione bordo primary. Cursore pointer.
  - [ ] 8.5 onClick handler con dati slot (stationId, date, time) — predisposto per Story 4.2

- [ ] Task 9: Creare componente ScheduleGrid per desktop (AC: #1, #4, #5)
  - [ ] 9.1 Creare `src/components/schedule/ScheduleGrid.tsx` — Client Component
  - [ ] 9.2 Layout CSS Grid: prima colonna per etichette orario, colonne successive per postazioni
  - [ ] 9.3 Header con nomi postazioni come intestazione colonne
  - [ ] 9.4 Righe a intervalli di 30 minuti tra orario minimo di apertura e massimo di chiusura globale
  - [ ] 9.5 Posizionamento AppointmentBlock con `position: absolute` dentro celle relative, top/height calcolati dalla durata
  - [ ] 9.6 EmptySlot per gli intervalli senza appuntamenti
  - [ ] 9.7 Linee orizzontali grigie (#E2E8F0) per separare le fasce orarie
  - [ ] 9.8 Indicatore "ora corrente" (linea rossa orizzontale) se il giorno visualizzato e' oggi

- [ ] Task 10: Creare componente ScheduleTimeline per mobile (AC: #2, #4, #5)
  - [ ] 10.1 Creare `src/components/schedule/ScheduleTimeline.tsx` — Client Component
  - [ ] 10.2 Tab per filtrare per postazione (Tabs shadcn/ui) + tab "Tutte"
  - [ ] 10.3 Lista verticale con label orario a sinistra e AppointmentBlock/EmptySlot a destra
  - [ ] 10.4 Scroll verticale per tutta la giornata
  - [ ] 10.5 Slot vuoti con bordo tratteggiato e testo "+ Slot libero"

- [ ] Task 11: Aggiornare pagina Agenda con orchestrazione completa (AC: #1, #2, #3, #6, #7)
  - [ ] 11.1 Aggiornare `src/app/(auth)/agenda/page.tsx` — Server Component che fetcha locations, stations con schedule, e appuntamenti per la data corrente e sede selezionata
  - [ ] 11.2 Creare `src/components/schedule/AgendaView.tsx` — Client Component orchestratore
  - [ ] 11.3 Stato data selezionata con `useState` (default: oggi)
  - [ ] 11.4 Integrazione con `useLocationSelector` per sede corrente
  - [ ] 11.5 `useIsMobile()` per switch ScheduleGrid/ScheduleTimeline
  - [ ] 11.6 TanStack Query per fetch appuntamenti al cambio data/sede: `useQuery({ queryKey: ['appointments', locationId, dateString] })`
  - [ ] 11.7 DateNavigation (desktop) o DateStrip (mobile) in alto
  - [ ] 11.8 Stato vuoto se nessuna postazione configurata: "Nessuna postazione configurata per questa sede — Vai a Impostazioni per configurare le postazioni"
  - [ ] 11.9 Stato vuoto se nessun appuntamento: la griglia mostra comunque le fasce orarie con tutti gli slot vuoti (questo E' il comportamento corretto, non un errore)

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono visualizzare l'agenda (FR26-FR29). NON aggiungere restrizioni di ruolo nelle query o nella pagina
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB
- **Prezzi in centesimi** nel database, formattati in EUR nella UI con `formatPrice()` da `src/lib/utils/formatting.ts`
- **Date in UTC** nel database (timestamp PostgreSQL), formattate in italiano nella UI con `Intl.DateTimeFormat('it-IT', ...)`
- **Orari postazione** in formato HH:mm (testo) nella tabella `station_schedules` — consistenza con startTime/endTime degli appuntamenti

### Design della Tabella `appointments`

```typescript
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),    // FK logica a clients
  dogId: uuid('dog_id').notNull(),          // FK logica a dogs
  serviceId: uuid('service_id').notNull(),  // FK logica a services
  stationId: uuid('station_id').notNull(),  // FK logica a stations
  startTime: timestamp('start_time').notNull(),  // data+ora inizio (UTC)
  endTime: timestamp('end_time').notNull(),      // data+ora fine (UTC)
  price: integer('price').notNull(),        // centesimi
  notes: text('notes'),                     // nota prestazione (Story 4.4)
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Note critiche sulla tabella:**
- `startTime` e `endTime` sono `timestamp` completi (data + ora) — per filtrare per giorno: `WHERE startTime >= inizioGiorno AND startTime < fineGiorno`
- Il campo `notes` e' predisposto per Story 4.4 (Note Prestazione) — in questa story resta sempre null
- Nessun campo `locationId` sulla tabella: la location si ricava tramite JOIN con stations (`stations.locationId`)
- Nessun campo `status` per ora — l'MVP non distingue stati appuntamento (scheduled/completed/cancelled). Semplificazione: un appuntamento esiste o non esiste. La cancellazione sara' un DELETE (Story 4.3)

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

**useLocationSelector (src/hooks/useLocationSelector.ts) — CRITICO PER AGENDA:**
```typescript
// Hook che gestisce la sede selezionata. Usato dal Header e dalla pagina Agenda.
const { selectedLocationId, setSelectedLocationId, isHydrated, locations } = useLocationSelector(locations)
// selectedLocationId salvato in localStorage con chiave 'selectedLocationId'
// isHydrated: true quando localStorage e' stato letto (evita flash SSR)
// Auto-seleziona la prima sede se nessuna e' selezionata
```

**useIsMobile (src/hooks/use-mobile.ts):**
```typescript
const isMobile = useIsMobile() // true se viewport < 768px
```

**Query getStationsByLocation (src/lib/queries/stations.ts):**
```typescript
getStationsByLocation(locationId, tenantId)
// Restituisce stazioni con servicesCount, schedulesCount, e array schedules
// Ogni schedule ha: dayOfWeek, openTime (HH:mm), closeTime (HH:mm)
```

**Formatting utilities (src/lib/utils/formatting.ts):**
```typescript
formatPrice(cents: number)     // "€ 15,00" — formato italiano
formatDuration(minutes: number) // "1h 30min" o "30min"
```

**Station Schedules — struttura esistente:**
```typescript
// stationSchedules ha dayOfWeek come integer:
// 0 = Lunedi', 1 = Martedi', ... 6 = Domenica
// ATTENZIONE: NON e' lo standard JS (dove 0 = Domenica)
// I DAYS_OF_WEEK in src/lib/validations/stations.ts confermano: 0=Lunedi', 6=Domenica
```

### Query getAppointmentsByDateAndLocation — Design

```typescript
// src/lib/queries/appointments.ts
import { db } from '@/lib/db'
import { appointments, clients, dogs, services, stations } from '@/lib/db/schema'
import { eq, and, gte, lt, isNull } from 'drizzle-orm'

export async function getAppointmentsByDateAndLocation(
  locationId: string,
  date: string, // YYYY-MM-DD
  tenantId: string
) {
  // Calcolare inizio e fine giorno in UTC
  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  return db.select({
    id: appointments.id,
    startTime: appointments.startTime,
    endTime: appointments.endTime,
    price: appointments.price,
    notes: appointments.notes,
    stationId: appointments.stationId,
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName,
    dogName: dogs.name,
    serviceName: services.name,
    serviceId: services.id,
  })
  .from(appointments)
  .innerJoin(stations, eq(appointments.stationId, stations.id))
  .innerJoin(clients, eq(appointments.clientId, clients.id))
  .innerJoin(dogs, eq(appointments.dogId, dogs.id))
  .innerJoin(services, eq(appointments.serviceId, services.id))
  .where(and(
    eq(stations.locationId, locationId),
    gte(appointments.startTime, dayStart),
    lt(appointments.startTime, dayEnd),
    eq(appointments.tenantId, tenantId)
  ))
  .orderBy(appointments.startTime)
}
```

**Nota critica su date e timezone:**
- L'MVP opera in fuso orario italiano (CET/CEST). Per semplicita', gli appuntamenti vengono salvati con timestamp che rappresentano l'ora locale italiana come se fosse UTC. Esempio: un appuntamento alle 10:00 italiane viene salvato come `2026-02-17T10:00:00.000Z`.
- Questo approccio e' sufficiente per un'applicazione single-timezone. La migrazione a timezone-aware potra' essere fatta in futuro se necessario.
- Le query filtrano per `startTime >= dayStart AND startTime < dayEnd` dove dayStart e dayEnd sono calcolati dalla data YYYY-MM-DD.

### Palette Colori Servizi — Blocchi Appuntamento

```typescript
// src/lib/utils/schedule.ts
export const SERVICE_COLORS = [
  { bg: '#DBEAFE', border: '#93C5FD', label: 'Azzurro' },   // Slot 0
  { bg: '#DCFCE7', border: '#86EFAC', label: 'Verde' },     // Slot 1
  { bg: '#E8DEF8', border: '#C4B5FD', label: 'Lavanda' },   // Slot 2
  { bg: '#FED7AA', border: '#FDBA74', label: 'Pesca' },     // Slot 3
  { bg: '#F1F5F9', border: '#CBD5E1', label: 'Grigio' },    // Slot 4
] as const

// Assegnazione deterministica: ordina serviceId alfabeticamente,
// assegna colore in base all'indice nell'array ordinato.
// Garantisce colore consistente per lo stesso servizio in ogni sessione.
export function getServiceColor(serviceId: string, allServiceIds: string[]) {
  const sorted = [...allServiceIds].sort()
  const index = sorted.indexOf(serviceId)
  return SERVICE_COLORS[index % SERVICE_COLORS.length]
}
```

### Pattern CSS ScheduleGrid — Griglia Desktop

```
┌──────────┬──────────────┬──────────────┬──────────────┐
│  Orario  │  Tavolo 1    │  Vasca       │  Tavolo 2    │  ← Header postazioni
├──────────┼──────────────┼──────────────┼──────────────┤
│  09:00   │ ▓▓▓▓▓▓▓▓▓▓▓▓│  ░░░░░░░░░░ │  ░░░░░░░░░░ │  ░ = EmptySlot (righe diagonali)
│  09:30   │ ▓ Maria R.  ▓│  ░░░░░░░░░░ │  ░░░░░░░░░░ │  ▓ = AppointmentBlock (colore servizio)
│  10:00   │ ▓ Teddy     ▓│  ▓▓▓▓▓▓▓▓▓▓ │  ░░░░░░░░░░ │
│  10:30   │ ▓ Bagno+Tag.▓│  ▓ Luca B.  ▓│  ░░░░░░░░░░ │
│  11:00   │  ░░░░░░░░░░ │  ▓ Rex      ▓│  ░░░░░░░░░░ │
│  11:30   │  ░░░░░░░░░░ │  ▓ Stripping▓│  ░░░░░░░░░░ │
│  ...     │              │              │              │
└──────────┴──────────────┴──────────────┴──────────────┘
```

**Implementazione CSS Grid:**
```css
/* Container griglia */
display: grid;
grid-template-columns: 60px repeat(N_POSTAZIONI, 1fr);
/* N_POSTAZIONI e' dinamico — calcolato dal numero di stazioni */

/* Ogni cella postazione ha position: relative per posizionamento assoluto dei blocchi */
/* Altezza cella = 30min slot = 60px (regolabile) */
/* AppointmentBlock: position absolute, top e height calcolati */
```

**Calcolo posizione AppointmentBlock:**
```typescript
const SLOT_HEIGHT_PX = 60 // altezza di un intervallo 30min in pixel
const MINUTES_PER_SLOT = 30

function getBlockStyle(startTime: Date, endTime: Date, dayStartMinutes: number) {
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()
  const offsetMinutes = startMinutes - dayStartMinutes
  const durationMinutes = endMinutes - startMinutes

  return {
    top: `${(offsetMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
    height: `${(durationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX}px`,
  }
}
```

### Pattern EmptySlot — Righe Diagonali CSS

```css
/* Desktop: pattern a righe diagonali */
background: repeating-linear-gradient(
  -45deg,
  transparent,
  transparent 4px,
  #F1F5F9 4px,
  #F1F5F9 5px
);

/* Mobile: bordo tratteggiato */
border: 2px dashed #E2E8F0;
```

### Pattern DateStrip Mobile

```
◄ [Sab 15] [Dom 16] [★Lun 17★] [Mar 18] [Mer 19] [Gio 20] [Ven 21] ►
                     ↑ oggi + selezionato (sfondo primary)
```

- Scroll orizzontale con `overflow-x: auto` e `scroll-snap-type: x mandatory`
- Ogni giorno e' un bottone 48x48px (touch target) con `scroll-snap-align: center`
- Giorno corrente: dot indicator sotto il numero
- Giorno selezionato: sfondo `#4A7C6F`, testo bianco

### TanStack Query — Pattern Fetch Appuntamenti

```typescript
// In AgendaView.tsx
const { data: appointments, isLoading } = useQuery({
  queryKey: ['appointments', selectedLocationId, dateString],
  queryFn: () => fetchAppointments(selectedLocationId, dateString),
  staleTime: 60_000, // 1 minuto
  enabled: !!selectedLocationId && isHydrated,
})

// fetchAppointments chiama un API Route o Server Action per ottenere i dati
// Pattern: API Route GET per le query di lettura (l'agenda e' una lettura)
```

**Alternativa Server Component + Client State:**
- Il caricamento iniziale avviene nel Server Component (agenda/page.tsx) che passa i dati iniziali
- Il Client Component (AgendaView) usa TanStack Query per i cambi data/sede successivi
- Pattern `initialData` di TanStack Query per evitare doppio fetch al primo render:

```typescript
useQuery({
  queryKey: ['appointments', locationId, dateString],
  queryFn: () => fetchAppointments(locationId, dateString),
  initialData: initialAppointments, // passato da Server Component solo per la data iniziale
})
```

### Dipendenza da Installare

```bash
npm install date-fns
```

**date-fns** per operazioni su date:
- `format(date, 'EEEE d MMMM yyyy', { locale: it })` → "Lunedi' 17 Febbraio 2026"
- `addDays(date, 1)` / `subDays(date, 1)` — navigazione
- `startOfDay(date)` / `endOfDay(date)` — range query
- `getDay(date)` — giorno della settimana (ATTENZIONE: `date-fns` usa 0=Domenica, il progetto usa 0=Lunedi')
- `isSameDay(date1, date2)` / `isToday(date)` — confronti

**ATTENZIONE giorno della settimana:**
```typescript
// date-fns: getDay() restituisce 0=Domenica, 1=Lunedi', ..., 6=Sabato
// Il progetto (stationSchedules.dayOfWeek): 0=Lunedi', 1=Martedi', ..., 6=Domenica
// Conversione necessaria:
function toDayOfWeek(dateFnsDay: number): number {
  return dateFnsDay === 0 ? 6 : dateFnsDay - 1
}
```

### Componenti shadcn/ui da Installare

```bash
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add tabs
```

**Gia' installati e usabili:**
button, input, label, card, sonner, sheet, dialog, table, badge, skeleton, separator, scroll-area, checkbox, tooltip, avatar, textarea, select, dropdown-menu, alert-dialog

### UX Pattern da Seguire

- **Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — per futura creazione appuntamento (Story 4.2)
- **Toast con Sonner** (gia' configurato in root layout) — per feedback azioni future
- **Touch target minimi 44x44px** su tutti gli elementi interattivi (slot vuoti, blocchi appuntamento, frecce navigazione)
- **Nessun indicatore di caricamento** (NFR1) — il Server Component pre-carica i dati, TanStack Query gestisce il transition senza spinner
- **Stato vuoto** con messaggio + CTA (nessuna postazione configurata)
- **Colore non come unico indicatore** — blocchi appuntamento: colore + testo servizio. Slot vuoti: pattern visivo + assenza contenuto
- **Data formattata in italiano** — usare `date-fns` con locale `it` o `Intl.DateTimeFormat('it-IT', ...)`
- **Scroll area** — usare `ScrollArea` (shadcn/ui) per lo scroll della griglia se il contenuto supera la viewport

### Design Tokens e UX

```
Primary:          var(--primary) — #4A7C6F — bordi attivi, bottoni, giorno selezionato
Primary Light:    #E8F0ED — hover, sfondi selezionati
Primary Dark:     #345A50 — hover bottoni
Background:       var(--background) — #FFFFFF — sfondo griglia
Surface:          var(--card) — #F8FAFB — sfondo card, header postazioni
Border:           var(--border) — #E2E8F0 — linee griglia, separatori fasce orarie
Text Primary:     var(--foreground) — #1A202C — nomi clienti, orari
Text Secondary:   var(--muted-foreground) — #64748B — nomi servizi, label orari
Text Muted:       #94A3B8 — placeholder, testo slot vuoti
Error:            var(--destructive) — #EF4444 — linea "ora corrente"
Blocchi Servizio: Palette pastello (vedi SERVICE_COLORS)
Empty Slot:       Pattern diagonale #F1F5F9 su #FFFFFF (desktop), bordo tratteggiato #E2E8F0 (mobile)
```

**IMPORTANTE:** Usare le classi Tailwind semantiche (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`), NON colori inline — tranne per i colori servizio che sono dinamici (inline style).

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle DB | snake_case plurale | `appointments` |
| Colonne DB | snake_case | `client_id`, `start_time`, `end_time` |
| Server Actions | camelCase con verbo | `createAppointment` (Story 4.2) |
| Schema Zod | camelCase + Schema | `getAppointmentsQuerySchema` |
| Componenti React | PascalCase | `ScheduleGrid.tsx`, `AppointmentBlock.tsx`, `AgendaView.tsx` |
| File directory | kebab-case | `components/schedule/` |
| Query functions | camelCase con get | `getAppointmentsByDateAndLocation` |
| Utility functions | camelCase | `generateTimeSlots`, `getServiceColor` |
| Hooks | use + PascalCase | `useSchedule` (se necessario) |
| TanStack Query keys | `['appointments', locationId, dateString]` |

### Project Structure Notes

```
src/
  app/
    (auth)/
      agenda/
        page.tsx                    # AGGIORNARE: da placeholder a Server Component con fetch dati
  components/
    schedule/                       # CREARE directory
      AgendaView.tsx                # CREARE: Client Component orchestratore (switch grid/timeline)
      ScheduleGrid.tsx              # CREARE: griglia desktop postazioni x fasce orarie
      ScheduleTimeline.tsx          # CREARE: timeline mobile con tab postazioni
      AppointmentBlock.tsx          # CREARE: blocco appuntamento colorato
      EmptySlot.tsx                 # CREARE: slot vuoto con pattern visivo
      DateNavigation.tsx            # CREARE: navigazione data desktop (frecce + calendario)
      DateStrip.tsx                 # CREARE: strip giorni mobile
  lib/
    db/
      schema.ts                     # AGGIORNARE: aggiungere tabella appointments
    queries/
      appointments.ts               # CREARE: getAppointmentsByDateAndLocation, getStationsWithScheduleForDay
    validations/
      appointments.ts               # CREARE: getAppointmentsQuerySchema
    utils/
      schedule.ts                   # CREARE: generateTimeSlots, getServiceColor, SERVICE_COLORS, getBlockStyle
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/auth/permissions.ts` — l'agenda e' gia' accessibile a entrambi i ruoli
- `src/lib/actions/client.ts` — authActionClient gia' configurato, non toccare
- `src/middleware.ts` — gia' protegge tutte le route autenticate
- `src/components/layout/Sidebar.tsx` — "Agenda" e' gia' nel menu con icona Calendar
- `src/components/layout/BottomBar.tsx` — "Agenda" e' gia' nella bottom bar
- `src/components/layout/Header.tsx` — il selettore sede e' gia' funzionante
- `src/hooks/useLocationSelector.ts` — gia' funzionante, usare direttamente

### Allineamento con la Struttura del Progetto

- I componenti schedule vanno in `components/schedule/` (coerente con l'architettura: componenti organizzati per feature/dominio)
- Le query vanno in `queries/appointments.ts` (plurale, coerente con `queries/clients.ts`, `queries/dogs.ts`)
- Le validazioni vanno in `validations/appointments.ts`
- Le utility vanno in `utils/schedule.ts` (specifiche per l'agenda)
- La pagina agenda e' gia' in `app/(auth)/agenda/page.tsx` — solo da aggiornare

### Previous Story Intelligence

**Da Story 3.2 (Anagrafica Cani) — pattern da replicare:**
- `authActionClient` con `.schema().action()` — funziona correttamente con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile (utile per future Stories 4.2-4.4)
- `useIsMobile()` hook per responsive — usare per switch ScheduleGrid/ScheduleTimeline
- `router.refresh()` per ricaricare i dati dal server dopo una mutazione
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- Componenti shadcn/ui `select`, `tabs` disponibili e funzionanti
- `Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' })` per formattazione date
- LEFT JOIN pattern in Drizzle — usare `innerJoin` per gli appuntamenti (un appuntamento DEVE avere cliente, cane, servizio)

**Da Story 3.2 — lezioni apprese:**
- updatedAt deve essere aggiornato manualmente con `new Date()` in ogni update
- tenantId ereditato dall'utente autenticato (JWT `ctx.tenantId`)
- `groupBy` completo necessario quando si usa `count()` con Drizzle
- Singolo componente che gestisce varianti (creazione/modifica) tramite prop — applicabile per variante grid/timeline
- Stato vuoto sempre gestito con messaggio e CTA

**Da Story 3.1 → 3.2 — continuita':**
- I clienti con `deletedAt` non devono apparire — la query appuntamenti usa `innerJoin` su clients, quindi i clienti soft-deleted non generano problemi (innerJoin li esclude naturalmente se il client non esiste)
- `isNull(clients.deletedAt)` aggiungere nella query per sicurezza

### Git Intelligence

**Pattern commit recenti (ultimi 10):**
```
story 3-2-anagrafica-cani: Task N — Descrizione breve della feature
fix: Descrizione fix
correct-course: Descrizione modifica piano
```

**Pattern da seguire per i commit di questa story:**
```
story 4-1-vista-agenda-per-sede-e-postazione: Task N — Descrizione breve della feature
```

**File recentemente modificati rilevanti:**
- `src/lib/db/schema.ts` — ultima modifica in Story 3.2 (Task 8), aggiungere appointments in fondo
- `src/lib/actions/client.ts` — aggiornato recentemente (fix station assignment), authActionClient stabile
- `src/lib/actions/stations.ts` — fix recente per assegnazione servizi/orari, pattern da seguire per query stazioni

### Informazioni Tecniche Aggiornate

**shadcn/ui + Tailwind CSS v4:**
- Il componente Calendar di shadcn/ui dipende da `react-day-picker` — verificare compatibilita' dopo installazione
- shadcn/ui ha sostituito `tailwindcss-animate` con `tw-animate-css` nelle versioni recenti
- Usare `data-slot` attributes per styling dei primitivi Radix

**React 19 + Next.js 16:**
- React Compiler attivo — memoizzazione automatica, NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- Server Components come default — i componenti della griglia sono Client Components (`'use client'`) perche' gestiscono interazioni
- `useId()` di React per collegare label e input accessibili

**TanStack Query v5:**
- `useSuspenseQuery` disponibile per stati di caricamento piu' puliti
- `staleTime` default nel progetto: 60 secondi (configurato in providers.tsx)
- Query keys strutturate: `['appointments', locationId, dateString]`
- `enabled` flag per disabilitare la query finche' `selectedLocationId` non e' disponibile (hydration)

**Performance griglia agenda:**
- La griglia agenda per l'MVP (max 3-5 postazioni, ~20 slot per postazione) non richiede virtualizzazione
- Se in futuro il numero di postazioni o slot cresce, considerare TanStack Virtual v3
- CSS Grid e' la scelta ottimale per la griglia desktop — rendering nativo del browser, nessun overhead JS

### Protezione Anti-Errori

- **Hydration mismatch:** `useLocationSelector` ha un flag `isHydrated` — NON renderizzare la griglia finche' `isHydrated` e' false. Mostrare skeleton o nulla.
- **Nessuna postazione:** Se una sede non ha postazioni con schedule, la griglia e' vuota. Mostrare stato vuoto con CTA "Configura postazioni".
- **Postazione senza orari:** Se una postazione non ha `stationSchedules` per il giorno selezionato, NON mostrare quella colonna nella griglia (e' chiusa quel giorno).
- **Appuntamento a cavallo di mezzanotte:** Non supportato nell'MVP — un appuntamento inizia e finisce lo stesso giorno.
- **Timezone:** Salvare e leggere sempre come se UTC = ora locale italiana. Non fare conversioni timezone.
- **dayOfWeek conversione:** `date-fns getDay()` usa 0=Domenica. Il progetto usa 0=Lunedi'. Creare utility `toDayOfWeek()` e usarla SEMPRE.
- **Slot vuoti vs appuntamenti:** La griglia mostra slot da 30 minuti. Un appuntamento puo' durare qualsiasi multiplo (30, 60, 90, 120 min). Gli slot vuoti sono gli intervalli tra un appuntamento e l'altro e tra apertura/chiusura.
- **Colori inline:** I colori dei blocchi appuntamento sono dinamici (basati sul servizio) — usare `style={{ backgroundColor, borderColor }}` inline, NON classi Tailwind
- **Touch target:** EmptySlot e AppointmentBlock devono avere altezza minima 44px anche se la durata e' breve (es. 15 min)
- **Nessun filtering per deletedAt sugli appuntamenti:** La tabella appointments non ha soft delete. Un appuntamento cancellato viene eliminato fisicamente (Story 4.3)

### Testing

Nessun framework di test automatico e' configurato nel progetto. Il testing per questa story si limita a:

- **Verifica manuale** — testare tutti i flussi come admin e come collaborator
- **Casi critici da verificare:**
  - Agenda con 0 appuntamenti → griglia con tutti slot vuoti, nessun errore
  - Agenda con appuntamenti → blocchi posizionati correttamente, colori per servizio
  - Cambio data (frecce, DateStrip, calendario) → aggiornamento griglia senza reload pagina
  - Cambio sede (Header) → aggiornamento griglia con postazioni della nuova sede
  - Postazione chiusa (nessun schedule per il giorno) → colonna non mostrata
  - Sede senza postazioni → stato vuoto con messaggio
  - Mobile: timeline con tab postazioni funzionanti
  - Mobile: DateStrip scorribile, giorno selezionabile
  - Desktop: griglia con colonne corrette, altezza blocchi proporzionale
  - Desktop: indicatore ora corrente visibile se giorno = oggi
  - Click su slot vuoto → `onClick` handler chiamato con dati corretti (predisposto per Story 4.2)
  - Click su appuntamento → `onClick` handler chiamato (predisposto per Story 4.3)
  - Collaborator: accesso completo all'agenda — nessuna restrizione
  - Performance: nessun loading spinner visibile al caricamento iniziale

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId, Drizzle pattern, timestamp UTC]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, naming, TanStack Query keys]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — directory organization, components/schedule/]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture — TanStack Query optimistic updates, Server Components]
- [Source: _bmad-output/planning-artifacts/prd.md#FR26 — Agenda giornaliera per sede e postazione]
- [Source: _bmad-output/planning-artifacts/prd.md#FR27 — Navigazione agenda tra giorni]
- [Source: _bmad-output/planning-artifacts/prd.md#FR28 — Agenda mostra cliente, cane, servizio]
- [Source: _bmad-output/planning-artifacts/prd.md#FR29 — Identificazione visiva slot liberi e occupati]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR1 — Caricamento senza indicatori visibili]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR3 — Appuntamento in meno di 30 secondi]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy — ScheduleGrid, ScheduleTimeline, AppointmentBlock, EmptySlot, DateStrip]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation — palette colori, SERVICE_COLORS, tipografia]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design — breakpoint md/lg, switch grid/timeline]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns — touch target 44px, feedback pattern]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User-Journey-Flows — Journey 2 e 4]
- [Source: _bmad-output/implementation-artifacts/3-2-anagrafica-cani.md — Pattern codice, authActionClient, useIsMobile, formatting utils]
- [Source: src/lib/db/schema.ts — Tabelle esistenti come riferimento pattern]
- [Source: src/lib/queries/stations.ts — getStationsByLocation con schedules]
- [Source: src/hooks/useLocationSelector.ts — Hook sede selezionata]
- [Source: src/hooks/use-mobile.ts — Hook responsive]
- [Source: src/lib/utils/formatting.ts — formatPrice, formatDuration]
- [Source: src/lib/validations/stations.ts — DAYS_OF_WEEK, pattern orari HH:mm]
- [Source: src/components/layout/Header.tsx — Selettore sede con useLocationSelector]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Aggiunta tabella `appointments` in schema.ts con tutti i campi richiesti (id, clientId, dogId, serviceId, stationId, startTime, endTime, price, notes, tenantId, createdAt, updatedAt). Schema pushed al DB con successo.

### File List

- `src/lib/db/schema.ts` — MODIFIED: aggiunta tabella appointments
- `src/lib/validations/appointments.ts` — CREATED: schema Zod getAppointmentsQuerySchema + tipo GetAppointmentsQuery
- `src/lib/queries/appointments.ts` — CREATED: getAppointmentsByDateAndLocation, getStationsWithScheduleForDay
- `src/lib/utils/schedule.ts` — CREATED: generateTimeSlots, getGlobalTimeRange, isSlotOccupied, getAppointmentPosition, SERVICE_COLORS, getServiceColor, toDayOfWeek, timeToMinutes
