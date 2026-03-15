# Story 4.1: Vista Agenda per Sede e Persona

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **visualizzare l'agenda giornaliera organizzata per sede e persona, con vista 24 ore e stati visivi di disponibilita'**,
so that **possa avere il controllo completo della giornata e sapere chi lavora, dove e quando, a colpo d'occhio**.

## Acceptance Criteria

1. **Given** un utente accede alla pagina Agenda su desktop (>= 1024px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una griglia (ScheduleGrid) con **persone** come colonne e fasce orarie come righe (intervalli di 30 minuti, vista 24h dalle 00:00 alle 23:30)
   **And** l'header di ogni colonna mostra nome persona, ruolo e badge stato (attivo/altrove/non assegnato)

2. **Given** un utente accede alla pagina Agenda su mobile (< 768px)
   **When** la pagina viene renderizzata
   **Then** viene mostrata una timeline verticale (ScheduleTimeline) con tab per filtrare per persona
   **And** ogni tab mostra nome persona e badge stato
   **And** una DateStrip scorrevole in alto per navigare tra i giorni

3. **Given** un utente e' sull'agenda
   **When** la pagina si carica
   **Then** viene mostrata la giornata corrente della sede selezionata nell'Header
   **And** il caricamento avviene senza indicatori di caricamento visibili (NFR1)

4. **Given** esistono appuntamenti per la giornata visualizzata
   **When** l'agenda viene renderizzata
   **Then** ogni appuntamento e' mostrato come un blocco (AppointmentBlock) nella colonna della persona assegnata, con bordo sinistro colorato per servizio, nome cliente, nome cane e nome servizio
   **And** l'altezza del blocco e' proporzionale alla durata dell'appuntamento

5. **Given** esistono slot senza appuntamenti nell'agenda
   **When** l'agenda viene renderizzata
   **Then** gli slot vuoti (EmptySlot) sono visivamente distinti con pattern a righe diagonali (desktop) o bordo tratteggiato (mobile)
   **And** sono chiaramente toccabili/cliccabili

6. **Given** una persona e' assegnata alla sede selezionata per il giorno corrente
   **When** l'agenda viene renderizzata
   **Then** l'header della colonna ha sfondo `#E8F0ED` (verde chiaro) e la fascia oraria del turno e' evidenziata
   **And** le aree fuori turno sono visivamente attenuate ma comunque visibili (vista 24h)

7. **Given** una persona e' assegnata a un'altra sede per il giorno corrente
   **When** l'agenda viene renderizzata
   **Then** l'header della colonna ha sfondo `#FEF3C7` (giallo chiaro) con indicazione "Presso [Nome Sede]"
   **And** la colonna intera ha opacita' ridotta

8. **Given** una persona non ha assegnazione per il giorno corrente
   **When** l'agenda viene renderizzata
   **Then** l'header della colonna ha sfondo `#F9FAFB` (grigio chiaro) con indicazione "Non assegnato"
   **And** la colonna intera ha opacita' ridotta

9. **Given** un utente e' sull'agenda
   **When** naviga al giorno precedente o successivo (frecce su desktop, swipe/tocco su DateStrip mobile)
   **Then** l'agenda si aggiorna mostrando gli appuntamenti e gli stati persona del giorno selezionato

10. **Given** un utente e' sull'agenda
    **When** seleziona una data specifica dal calendario
    **Then** l'agenda salta direttamente alla data selezionata

## Tasks / Subtasks

- [x] Task 1: Aggiornare schema DB — aggiungere `userId` a `appointments`, rendere `stationId` opzionale (AC: #4)
  - [x] 1.1 Modificare tabella `appointments` in `src/lib/db/schema.ts`: aggiungere `userId: uuid('user_id').notNull()` (FK logica a users), rendere `stationId: uuid('station_id')` nullable (rimuovere `.notNull()`)
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare lo schema al database di sviluppo
  - [x] 1.3 Aggiornare `createAppointmentSchema` in `src/lib/validations/appointments.ts`: aggiungere campo `userId` (uuid, required), rendere `stationId` opzionale
  - [x] 1.4 Aggiornare `createAppointment` server action in `src/lib/actions/appointments.ts`: includere `userId` nell'INSERT, rendere `stationId` opzionale, cambiare overlap check da `stationId` a `userId`

- [x] Task 2: Creare nuova query `getAgendaDataByPersons` per agenda per persone (AC: #1, #3, #4, #6, #7, #8)
  - [x] 2.1 Creare `getAppointmentsByDateAndLocationGroupedByUser(locationId, date, tenantId)` in `src/lib/queries/appointments.ts` — fetch appuntamenti del giorno con JOIN su clients, dogs, services; includere `userId` nel SELECT; filtrare appuntamenti il cui `userId` sia tra le persone associate alla sede (query su `userLocationAssignments`) O il cui `stationId` appartenga a una postazione della sede
  - [x] 2.2 Aggiornare la server action `getAgendaData` in `src/lib/actions/appointments.ts` — sostituire il fetch di `stations` con il fetch di `staffStatus` usando `getStaffStatusForDate(locationId, date, tenantId)` da `src/lib/queries/staff.ts`; restituire `{ appointments, staff }` invece di `{ appointments, stations }`

- [ ] Task 3: Creare componente PersonHeader per header colonne persona (AC: #6, #7, #8)
  - [ ] 3.1 Creare `src/components/schedule/PersonHeader.tsx` — Client Component
  - [ ] 3.2 Props: `name: string`, `role: 'admin' | 'collaborator'`, `status: 'active' | 'elsewhere' | 'unassigned'`, `locationName?: string` (nome sede se elsewhere), `startTime?: string`, `endTime?: string` (turno se active)
  - [ ] 3.3 Sfondo condizionato: `#E8F0ED` (active), `#FEF3C7` (elsewhere), `#F9FAFB` (unassigned)
  - [ ] 3.4 Badge stato con testo: "Attivo [HH:mm - HH:mm]", "Presso [Sede]", "Non assegnato"
  - [ ] 3.5 Nome persona troncato con ellipsis, ruolo mostrato come badge piccolo

- [ ] Task 4: Aggiornare ScheduleGrid per vista 24h con colonne persona (AC: #1, #4, #5, #6, #7, #8)
  - [ ] 4.1 Aggiornare `src/components/schedule/ScheduleGrid.tsx` — sostituire l'interfaccia `Station` con interfaccia `Person` (id, name, role, status, assignment con startTime/endTime opzionali, locationName)
  - [ ] 4.2 Vista 24h fissa: `globalOpen = '00:00'`, `globalClose = '23:30'` — la griglia mostra sempre l'intera giornata
  - [ ] 4.3 Header colonne: usare `PersonHeader` al posto del nome postazione
  - [ ] 4.4 Colonne persona attiva: fascia turno con sfondo bianco (area attiva), aree fuori turno con sfondo `bg-muted/20` (attenuate ma visibili)
  - [ ] 4.5 Colonne persona elsewhere/unassigned: tutta la colonna con `opacity-50`
  - [ ] 4.6 Filtrare appuntamenti per `userId` (non piu' `stationId`) per popolare le colonne
  - [ ] 4.7 EmptySlot: passare `userId` e `userName` al posto di `stationId` nei dati dell'onClick handler
  - [ ] 4.8 Mantenere indicatore "ora corrente" (linea rossa) e grid lines

- [ ] Task 5: Aggiornare ScheduleTimeline per tab persone con stati (AC: #2, #4, #5, #6, #7, #8)
  - [ ] 5.1 Aggiornare `src/components/schedule/ScheduleTimeline.tsx` — sostituire tab postazioni con tab persone
  - [ ] 5.2 Tab "Tutte" (default) + un tab per persona, ogni tab con badge colorato per stato (pallino verde active, giallo elsewhere, grigio unassigned)
  - [ ] 5.3 Filtrare appuntamenti per `userId` selezionato (o mostrare tutti se tab "Tutte")
  - [ ] 5.4 Vista 24h: mostrare tutti gli slot dalla 00:00 alla 23:30
  - [ ] 5.5 Slot vuoti con `userId` e `userName` nei dati onClick

- [ ] Task 6: Aggiornare AgendaView orchestratore (AC: #1, #2, #3, #6, #7, #8, #9, #10)
  - [ ] 6.1 Aggiornare `src/components/schedule/AgendaView.tsx` — cambiare interfaccia dati da `stations` a `staff` (array di persone con status)
  - [ ] 6.2 Aggiornare TanStack Query: la `queryFn` deve mappare la risposta `staff` (non piu' `stations`)
  - [ ] 6.3 Passare `staff` e appuntamenti a `ScheduleGrid` (desktop) e `ScheduleTimeline` (mobile)
  - [ ] 6.4 Stato vuoto: se nessuna persona attiva, mostrare "Nessun collaboratore assegnato a questa sede per oggi — Vai a Impostazioni per configurare le assegnazioni"
  - [ ] 6.5 Aggiornare `handleEmptySlotClick`: cambiare da `stationId/stationName` a `userId/userName` nei dati passati al form
  - [ ] 6.6 Aggiornare `AppointmentForm prefilledSlot`: includere `userId` e `userName` al posto di `stationId` e `stationName`

- [ ] Task 7: Aggiornare EmptySlot per supportare userId (AC: #5)
  - [ ] 7.1 Aggiornare `src/components/schedule/EmptySlot.tsx` — accettare `userId` e `userName` come props (al posto di / in aggiunta a `stationId`)
  - [ ] 7.2 onClick handler: passare `userId` nei dati dell'evento

- [ ] Task 8: Aggiornare AppointmentForm per supportare userId (AC: #4)
  - [ ] 8.1 Aggiornare `src/components/appointment/AppointmentForm.tsx` — accettare `userId` e `userName` nel `prefilledSlot`, rendere `stationId` opzionale
  - [ ] 8.2 Mostrare nome persona come campo pre-compilato non editabile (la persona e' gia' determinata dalla colonna)
  - [ ] 8.3 Rendere il campo postazione opzionale (select con "Nessuna postazione" come default)
  - [ ] 8.4 Inviare `userId` nel payload di `createAppointment`

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono visualizzare l'agenda (FR26-FR29). NON aggiungere restrizioni di ruolo
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB
- **Prezzi in centesimi** nel database, formattati in EUR nella UI con `formatPrice()` da `src/lib/utils/formatting.ts`
- **Date in UTC** nel database (timestamp PostgreSQL), formattate in italiano nella UI
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente

### Cambiamento Architetturale: Da Postazione a Persona

**Contesto:** Il Change Proposal del 2026-03-14 ha ridefinito il modello organizzativo del salone. L'agenda ora mostra **persone** come colonne (non postazioni). Questo perche' il salone reale e' organizzato per "chi lavora", non per "dove si lavora".

**Impatto sullo schema `appointments`:**
```typescript
// PRIMA (vecchio modello):
stationId: uuid('station_id').notNull()

// DOPO (nuovo modello):
userId: uuid('user_id').notNull()     // persona che esegue — NUOVO
stationId: uuid('station_id')          // opzionale — .notNull() RIMOSSO
```

**Impatto sulla validazione sovrapposizione:**
- PRIMA: overlap check su `stationId + timeRange`
- DOPO: overlap check su `userId + timeRange` — una persona non puo' avere due appuntamenti sovrapposti

**Impatto sulla query agenda:**
- PRIMA: `getAppointmentsByDateAndLocation` filtra per `stations.locationId`
- DOPO: filtrare per persone associate alla sede (via `userLocationAssignments` per il giorno corrente) + JOIN su `users` per avere `userId` e `userName`

### Tabella `user_location_assignments` — GIA' ESISTENTE

```typescript
// src/lib/db/schema.ts (gia' presente)
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi' (ISO 8601), 6=Domenica
  startTime: text('start_time').notNull(),     // "HH:mm"
  endTime: text('end_time').notNull(),         // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Query `getStaffStatusForDate` — GIA' ESISTENTE

```typescript
// src/lib/queries/staff.ts — gia' implementata in Story 2.4
export type StaffStatus = 'active' | 'elsewhere' | 'unassigned'

export async function getStaffStatusForDate(locationId: string, date: Date, tenantId: string) {
  // Restituisce array di { id, name, email, role, status: StaffStatus, assignment: {...} | null }
  // status = 'active' se la persona ha un'assegnazione per questa sede+giorno
  // status = 'elsewhere' se assegnata a un'altra sede
  // status = 'unassigned' se nessuna assegnazione per il giorno
}
```

**CRITICO:** Usare questa funzione come base per la query dell'agenda. NON reimplementare la logica di stato.

### Query `getAppointmentsByDateAndLocation` — DA AGGIORNARE

La query attuale filtra appuntamenti tramite `innerJoin(stations, ...)` e `stations.locationId`. Con il nuovo modello:

```typescript
// Nuova logica: filtrare appuntamenti per userId delle persone associate alla sede
// 1. Ottenere gli userId delle persone con assegnazione alla sede (qualsiasi stato)
// 2. Filtrare appuntamenti per userId IN (lista persone)
// 3. Aggiungere userId nel SELECT per raggruppare nella griglia

export async function getAppointmentsByDateAndLocationGroupedByUser(
  locationId: string,
  date: string,
  tenantId: string
) {
  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  // Le persone attive del tenant
  // Gli appuntamenti del giorno il cui userId e' tra queste persone
  // JOIN con clients, dogs, services come prima
  // Includere appointments.userId nel risultato

  return db.select({
    id: appointments.id,
    startTime: appointments.startTime,
    endTime: appointments.endTime,
    price: appointments.price,
    notes: appointments.notes,
    userId: appointments.userId,       // NUOVO
    stationId: appointments.stationId, // ora opzionale
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName,
    dogName: dogs.name,
    serviceName: services.name,
    serviceId: services.id,
  })
  .from(appointments)
  .innerJoin(clients, eq(appointments.clientId, clients.id))
  .innerJoin(dogs, eq(appointments.dogId, dogs.id))
  .innerJoin(services, eq(appointments.serviceId, services.id))
  .where(and(
    gte(appointments.startTime, dayStart),
    lt(appointments.startTime, dayEnd),
    eq(appointments.tenantId, tenantId),
    isNull(clients.deletedAt)
    // NOTA: non filtrare piu' per stations.locationId
    // Gli appuntamenti sono raggruppati per userId dalla UI
  ))
  .orderBy(asc(appointments.startTime))
}
```

**NOTA IMPORTANTE:** Con il nuovo modello, gli appuntamenti non sono piu' filtrati per `locationId` tramite la stazione. Il filtro per sede avviene lato client: solo gli appuntamenti il cui `userId` corrisponde a una persona mostrata nell'agenda (restituita da `getStaffStatusForDate`) vengono visualizzati.

### Stack e Pattern dal Codice Esistente

**authActionClient (src/lib/actions/client.ts):**
```typescript
// Gia' configurato — fornisce ctx.userId, ctx.role, ctx.tenantId
```

**useLocationSelector (src/hooks/useLocationSelector.ts):**
```typescript
const { selectedLocationId, setSelectedLocationId, isHydrated, locations } = useLocationSelector(locations)
// selectedLocationId salvato in localStorage, isHydrated per evitare flash SSR
```

**useIsMobile (src/hooks/use-mobile.ts):**
```typescript
const isMobile = useIsMobile() // true se viewport < 768px
```

**getIsoDayOfWeek (src/lib/queries/staff.ts):**
```typescript
// Converte JS getDay() (0=Dom) in ISO 8601 (0=Lun)
export function getIsoDayOfWeek(date: Date): number
```

**toDayOfWeek (src/lib/utils/schedule.ts):**
```typescript
// Converte date-fns getDay() (0=Dom) in progetto (0=Lun)
// ATTENZIONE: stessa logica di getIsoDayOfWeek ma per date-fns
```

**Schedule utilities (src/lib/utils/schedule.ts):**
```typescript
// Tutte queste utility sono GIA' IMPLEMENTATE e riutilizzabili:
SLOT_HEIGHT_PX = 60          // altezza slot 30min in pixel
MINUTES_PER_SLOT = 30
generateTimeSlots(openTime, closeTime) // genera array ["HH:mm", ...]
getGlobalTimeRange(stations)           // DA AGGIORNARE: ricevera' persone, non stazioni
getAppointmentPosition(startTime, endTime, dayStartMinutes) // calcolo top/height
SERVICE_COLORS                          // 5 colori pastello
getServiceColor(serviceId, allServiceIds) // assegnazione deterministica
timeToMinutes(timeString)               // "09:30" → 570
```

**CRITICO — getGlobalTimeRange:** Con la vista 24h, questa funzione non serve piu' per calcolare il range. Il range e' fisso: `00:00 - 23:30`. Tuttavia, per le persone attive, il turno (startTime/endTime dall'assegnazione) delimita la zona evidenziata.

### Palette Colori Servizi — Invariata

```typescript
export const SERVICE_COLORS = [
  { bg: '#DBEAFE', border: '#93C5FD', label: 'Azzurro' },
  { bg: '#DCFCE7', border: '#86EFAC', label: 'Verde' },
  { bg: '#E8DEF8', border: '#C4B5FD', label: 'Lavanda' },
  { bg: '#FED7AA', border: '#FDBA74', label: 'Pesca' },
  { bg: '#F1F5F9', border: '#CBD5E1', label: 'Grigio' },
] as const
```

### Design Tokens Stati Persona — NUOVI

```
Active (questa sede):     sfondo header #E8F0ED, fascia turno evidenziata, colonna opacita' 100%
Elsewhere (altra sede):   sfondo header #FEF3C7, testo "Presso [Sede]", colonna opacity-50
Unassigned (non assegnato): sfondo header #F9FAFB, testo "Non assegnato", colonna opacity-50
```

### Pattern CSS ScheduleGrid — Vista 24h con Persone

```
┌──────────┬──────────────┬──────────────┬──────────────┐
│  Orario  │ 🟢 Marco A.  │ 🟡 Sara B.   │ ⚪ Luca C.   │
│          │ Admin         │ Collab.       │ Collab.      │
│          │ Attivo 9-18   │ Presso Sede 2 │ Non assegnato│
├──────────┼──────────────┼──────────────┼──────────────┤
│  00:00   │  ░░ fuori ░░ │  ░░░░(50%)░░ │  ░░░░(50%)░░ │
│  ...     │  ░░ turno ░░ │              │              │
│  09:00   │ █████████████│              │              │  ← inizio turno Marco
│  09:30   │ ▓ Appunt. 1 ▓│              │              │
│  10:00   │ ▓▓▓▓▓▓▓▓▓▓▓▓│              │              │
│  ...     │  (slot vuoti)│              │              │
│  18:00   │  ░░ fuori ░░ │              │              │  ← fine turno Marco
│  ...     │  ░░ turno ░░ │              │              │
│  23:30   │  ░░░░░░░░░░ │              │              │
└──────────┴──────────────┴──────────────┴──────────────┘
```

### TanStack Query — Pattern Aggiornato

```typescript
// In AgendaView.tsx — queryKey invariata, risposta cambia
const { data } = useQuery({
  queryKey: ['appointments', selectedLocationId, dateString],
  queryFn: async () => {
    const result = await getAgendaData({ locationId: selectedLocationId, date: dateString })
    // result.data ora contiene { appointments, staff } invece di { appointments, stations }
    return result?.data ?? null
  },
  enabled: !!selectedLocationId && isHydrated,
})

const appointments = data?.appointments ?? []
const staff = data?.staff ?? []  // array di { id, name, role, status, assignment }
```

### Componenti Esistenti — Cosa Cambia

| Componente | Stato | Azione |
|-----------|-------|--------|
| `AgendaView.tsx` | ESISTE | AGGIORNARE: stations → staff, interfacce, empty state |
| `ScheduleGrid.tsx` | ESISTE | AGGIORNARE: colonne persona, vista 24h, stati visivi |
| `ScheduleTimeline.tsx` | ESISTE | AGGIORNARE: tab persone con badge stato |
| `AppointmentBlock.tsx` | ESISTE | INVARIATO (solo cambia il campo di raggruppamento) |
| `EmptySlot.tsx` | ESISTE | AGGIORNARE: userId invece di stationId |
| `DateNavigation.tsx` | ESISTE | INVARIATO |
| `DateStrip.tsx` | ESISTE | INVARIATO |
| `PersonHeader.tsx` | NON ESISTE | CREARE |
| `AppointmentForm.tsx` | ESISTE | AGGIORNARE: userId prefilled, stationId opzionale |

### File da NON Modificare (invariati)

- `src/lib/auth/permissions.ts` — l'agenda e' accessibile a entrambi i ruoli
- `src/lib/actions/client.ts` — authActionClient gia' configurato
- `src/middleware.ts` — protezione route invariata
- `src/components/layout/Sidebar.tsx` — "Agenda" gia' nel menu
- `src/components/layout/BottomBar.tsx` — "Agenda" gia' nella bottom bar
- `src/components/layout/Header.tsx` — selettore sede funzionante
- `src/hooks/useLocationSelector.ts` — invariato
- `src/hooks/use-mobile.ts` — invariato
- `src/lib/queries/staff.ts` — gia' implementato, usare direttamente
- `src/lib/actions/staff.ts` — gia' implementato (Story 2.4)
- `src/lib/validations/staff.ts` — gia' implementato
- `src/components/schedule/DateNavigation.tsx` — invariato
- `src/components/schedule/DateStrip.tsx` — invariato

### Previous Story Intelligence

**Da Story 4.1 vecchia (per postazione) — codice da riutilizzare/adattare:**
- `generateTimeSlots`, `getAppointmentPosition`, `SERVICE_COLORS`, `getServiceColor` — riutilizzabili al 100%
- `AppointmentBlock.tsx` — riutilizzabile al 100% (varianti grid/timeline, colori, hover)
- `DateNavigation.tsx` e `DateStrip.tsx` — riutilizzabili al 100%
- Pattern CSS Grid per la griglia — adattare colonne da stazioni a persone
- Pattern TanStack Query — stessa struttura, dati diversi
- Pattern Empty Slot — adattare da stationId a userId

**Da Story 4.2 (creazione appuntamento) — codice impattato:**
- `AppointmentForm.tsx` — gia' funzionante, aggiungere `userId`, rendere `stationId` opzionale
- `createAppointment` server action — aggiungere `userId` nell'INSERT, overlap su `userId`
- `ClientSearch.tsx` e `QuickClientForm.tsx` — NON impattati

**Da Story 2.4 (assegnazione collaboratori) — codice da usare:**
- `getStaffStatusForDate()` — query pronta che restituisce persone con stato `active/elsewhere/unassigned`
- `getStaffByLocation()` — query ausiliaria
- `getIsoDayOfWeek()` — conversione giorno settimana
- `DAYS_OF_WEEK` in validations/staff.ts — 0=Lunedi', 6=Domenica (ISO 8601)

### Protezione Anti-Errori

- **Hydration mismatch:** `useLocationSelector` ha `isHydrated` — NON renderizzare finche' `isHydrated` e' false
- **Nessuna persona assegnata:** Se la sede non ha persone con assegnazione, mostrare stato vuoto con CTA "Configura assegnazioni"
- **Persona elsewhere/unassigned:** Mostrare la colonna ma con opacita' ridotta — la persona potrebbe comunque avere appuntamenti (assegnati manualmente)
- **Vista 24h performance:** La griglia 24h ha 48 slot × N persone. Per l'MVP (max 3-5 persone), nessuna virtualizzazione necessaria
- **dayOfWeek conversione:** Usare `getIsoDayOfWeek()` da `src/lib/queries/staff.ts` per convertire date JS. NON usare `getDay()` direttamente
- **Appuntamenti senza userId:** Dopo la migrazione schema, gli appuntamenti esistenti avranno `userId = NULL`. La query deve gestire questo caso con LEFT JOIN o filtro `IS NOT NULL` su `userId`
- **stationId nullable:** Dopo la migrazione, `stationId` diventa opzionale. Aggiornare tutti i riferimenti che assumono `stationId` non-null
- **Colori inline:** I colori dei blocchi appuntamento sono dinamici (basati sul servizio) — usare `style={{ backgroundColor, borderColor }}` inline
- **Touch target:** EmptySlot e AppointmentBlock devono avere altezza minima 44px
- **Tailwind semantico:** Usare classi Tailwind semantiche (`text-foreground`, `bg-card`), NON colori inline — tranne per colori servizio e stati persona (dinamici)

### Testing

Nessun framework di test automatico e' configurato nel progetto. Il testing si limita a:

- **Verifica manuale:**
  - Agenda con 0 appuntamenti → griglia con tutti slot vuoti, nessun errore
  - Agenda con appuntamenti → blocchi nella colonna della persona corretta, colori per servizio
  - Persona attiva: header verde, fascia turno evidenziata, fuori turno attenuato
  - Persona elsewhere: header giallo, "Presso [Sede]", colonna semi-trasparente
  - Persona unassigned: header grigio, "Non assegnato", colonna semi-trasparente
  - Cambio data (frecce, DateStrip, calendario) → aggiornamento griglia senza reload
  - Cambio sede (Header) → aggiornamento con persone della nuova sede
  - Sede senza persone assegnate → stato vuoto con messaggio
  - Mobile: timeline con tab persone e badge stato funzionanti
  - Mobile: DateStrip scorribile, giorno selezionabile
  - Desktop: griglia con colonne persone corrette, altezza blocchi proporzionale
  - Desktop: indicatore ora corrente visibile se giorno = oggi
  - Click su slot vuoto → onClick handler con `userId`, `date`, `time`
  - Click su appuntamento → onClick handler (predisposto per Story 4.3)
  - Collaborator: accesso completo — nessuna restrizione
  - Performance: nessun loading spinner visibile al caricamento iniziale

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Tabelle DB | snake_case plurale | `appointments` |
| Colonne DB | snake_case | `user_id`, `station_id` |
| Server Actions | camelCase con verbo | `getAgendaData` |
| Schema Zod | camelCase + Schema | `getAppointmentsQuerySchema` |
| Componenti React | PascalCase | `ScheduleGrid.tsx`, `PersonHeader.tsx` |
| File directory | kebab-case | `components/schedule/` |
| Query functions | camelCase con get | `getAppointmentsByDateAndLocationGroupedByUser` |
| TanStack Query keys | `['appointments', locationId, dateString]` |

### Project Structure Notes

```
src/
  components/
    schedule/
      AgendaView.tsx              # AGGIORNARE: stations → staff
      ScheduleGrid.tsx            # AGGIORNARE: colonne persona, vista 24h
      ScheduleTimeline.tsx        # AGGIORNARE: tab persone con badge
      PersonHeader.tsx            # CREARE: header colonna persona con stato
      AppointmentBlock.tsx        # INVARIATO
      EmptySlot.tsx               # AGGIORNARE: userId
      DateNavigation.tsx          # INVARIATO
      DateStrip.tsx               # INVARIATO
    appointment/
      AppointmentForm.tsx         # AGGIORNARE: userId, stationId opzionale
      ClientSearch.tsx            # INVARIATO
      QuickClientForm.tsx         # INVARIATO
  lib/
    db/
      schema.ts                   # AGGIORNARE: appointments.userId, stationId nullable
    queries/
      appointments.ts             # AGGIORNARE: query per persone
      staff.ts                    # INVARIATO (gia' implementato)
    actions/
      appointments.ts             # AGGIORNARE: getAgendaData, createAppointment
    validations/
      appointments.ts             # AGGIORNARE: userId in schema, stationId opzionale
    utils/
      schedule.ts                 # AGGIORNARE: getGlobalTimeRange (vista 24h)
```

### Git Intelligence

**Pattern commit recenti:**
```
story 4-2-creazione-appuntamento-rapido: Task N — Descrizione breve
story 2-4-assegnazione-collaboratori-sedi-calendario: Task N — Descrizione breve
```

**Pattern da seguire per i commit di questa story:**
```
story 4-1-vista-agenda-per-sede-e-persona: Task N — Descrizione breve della feature
```

**Branch naming:** `4-1-vista-agenda-per-sede-e-persona` (diverso dal vecchio `4-1-vista-agenda-per-sede-e-postazione`)

**File recentemente modificati rilevanti:**
- `src/lib/db/schema.ts` — ultima modifica Story 3.2, aggiungere userId in fondo alla tabella appointments
- `src/lib/actions/appointments.ts` — contiene TODO per riscrittura per persone
- `src/lib/queries/appointments.ts` — contiene TODO per riscrittura per persone
- `src/lib/queries/staff.ts` — gia' implementato con `getStaffStatusForDate`

### Informazioni Tecniche Aggiornate

**shadcn/ui + Tailwind CSS v4:**
- Componenti Calendar, Popover, Tabs gia' installati
- `tw-animate-css` per animazioni

**React 19 + Next.js 16:**
- React Compiler attivo — memoizzazione automatica
- Server Components come default — componenti griglia sono Client Components (`'use client'`)

**TanStack Query v5:**
- `staleTime` default 60 secondi
- Query keys strutturate: `['appointments', locationId, dateString]`
- `enabled` flag per disabilitare finche' `selectedLocationId` disponibile

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-14.md — Cambiamento architetturale postazione→persona]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4 — Story 4.1 requisiti originali]
- [Source: _bmad-output/planning-artifacts/prd.md#FR26 — Agenda giornaliera per sede e persona (aggiornato)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR29 — Stati persona nell'agenda (aggiornato)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR34 — Assegnazione utenti a sedi]
- [Source: _bmad-output/planning-artifacts/prd.md#FR35 — Evidenziazione visiva stato persona]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — tenantId, Drizzle pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, TanStack Query]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy — ScheduleGrid, ScheduleTimeline]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design — palette colori, SERVICE_COLORS]
- [Source: src/lib/db/schema.ts — Schema attuale con appointments e userLocationAssignments]
- [Source: src/lib/queries/staff.ts — getStaffStatusForDate, getStaffByLocation, getIsoDayOfWeek]
- [Source: src/lib/queries/appointments.ts — Query attuale da aggiornare]
- [Source: src/lib/actions/appointments.ts — Server actions con TODO per riscrittura]
- [Source: src/lib/utils/schedule.ts — Utility riutilizzabili]
- [Source: src/components/schedule/AgendaView.tsx — Orchestratore da aggiornare]
- [Source: src/components/schedule/ScheduleGrid.tsx — Griglia da aggiornare]
- [Source: src/components/appointment/AppointmentForm.tsx — Form da aggiornare]
- [Source: _bmad-output/implementation-artifacts/4-1-vista-agenda-per-sede-e-postazione.md — Story vecchia con lezioni apprese]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Aggiornato schema DB — aggiunto `userId` NOT NULL a `appointments`, reso `stationId` nullable. Aggiornata validazione Zod e server action `createAppointment` con overlap check su `userId`. Schema pushato al DB di sviluppo (4 appuntamenti esistenti troncati).
- Task 2: Creata query `getAppointmentsByDateAndLocationGroupedByUser` per fetch appuntamenti raggruppati per userId. Aggiornata `getAgendaData` per restituire `{ appointments, staff }` usando `getStaffStatusForDate`.

### File List

- src/lib/db/schema.ts (modificato)
- src/lib/validations/appointments.ts (modificato)
- src/lib/actions/appointments.ts (modificato)
- src/lib/queries/appointments.ts (modificato)
