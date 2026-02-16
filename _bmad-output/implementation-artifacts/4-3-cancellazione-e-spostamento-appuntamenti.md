# Story 4.3: Cancellazione e Spostamento Appuntamenti

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **cancellare e spostare appuntamenti con facilita'**,
so that **possa riorganizzare l'agenda senza pasticci, come cancellature su un quaderno**.

## Acceptance Criteria

1. **Given** un utente tocca/clicca un appuntamento nell'agenda
   **When** il dettaglio dell'appuntamento si apre (Sheet su mobile, Dialog su desktop)
   **Then** vengono mostrate le informazioni complete (cliente, cane, servizio, data, ora, durata, prezzo)
   **And** le azioni disponibili: "Sposta", "Cancella"

2. **Given** un utente clicca su "Cancella" sul dettaglio di un appuntamento
   **When** l'Alert Dialog di conferma viene mostrato ("Cancellare l'appuntamento di [cliente] ([cane])?")
   **Then** dopo conferma l'appuntamento viene eliminato (DELETE dal database)
   **And** l'agenda si aggiorna immediatamente — lo slot torna libero
   **And** mostra un toast "Appuntamento cancellato"

3. **Given** un utente clicca su "Sposta" dal dettaglio di un appuntamento nell'agenda
   **When** il sistema entra in modalita' spostamento
   **Then** il dettaglio si chiude e l'agenda evidenzia gli slot disponibili (sfondo verde chiaro) e oscura quelli non disponibili
   **And** l'appuntamento originale viene mostrato con opacita' ridotta
   **And** un banner in alto indica "Seleziona il nuovo slot per [cliente] ([cane])" con bottone "Annulla"

4. **Given** un utente e' in modalita' spostamento
   **When** tocca un nuovo slot disponibile
   **Then** l'appuntamento viene spostato alla nuova posizione (UPDATE startTime/endTime nel database)
   **And** l'agenda si aggiorna immediatamente
   **And** mostra un toast "Appuntamento spostato"

5. **Given** un utente e' in modalita' spostamento
   **When** il nuovo slot selezionato e' gia' occupato (occupato nel frattempo da un altro utente)
   **Then** il sistema avvisa "Lo slot non e' piu' disponibile"
   **And** mostra gli slot alternativi piu' vicini

6. **Given** un utente e' in modalita' spostamento
   **When** tocca "Annulla" nel banner
   **Then** la modalita' spostamento si disattiva e l'agenda torna alla visualizzazione normale

## Tasks / Subtasks

- [x] Task 1: Creare Server Action `deleteAppointment` (AC: #2)
  - [x] 1.1 Aggiungere schema `deleteAppointmentSchema` in `src/lib/validations/appointments.ts` — campo: appointmentId (uuid)
  - [x] 1.2 Creare action `deleteAppointment` in `src/lib/actions/appointments.ts` usando `authActionClient.schema(deleteAppointmentSchema).action()`
  - [x] 1.3 Verificare che l'appuntamento esista e appartenga al tenant (query per id + tenantId)
  - [x] 1.4 Eseguire DELETE dalla tabella appointments (hard delete — nessun campo status/deletedAt sugli appuntamenti)
  - [x] 1.5 Restituire `{ success: true }` oppure throw Error se appuntamento non trovato

- [x] Task 2: Creare Server Action `rescheduleAppointment` con validazione sovrapposizione (AC: #4, #5)
  - [x] 2.1 Aggiungere schema `rescheduleAppointmentSchema` in `src/lib/validations/appointments.ts` — campi: appointmentId (uuid), stationId (uuid), date (string YYYY-MM-DD), time (string HH:MM)
  - [x] 2.2 Creare action `rescheduleAppointment` in `src/lib/actions/appointments.ts` usando `authActionClient.schema(rescheduleAppointmentSchema).action()`
  - [x] 2.3 Caricare l'appuntamento esistente per ottenere la durata (endTime - startTime)
  - [x] 2.4 Calcolare il nuovo `startTime` e `endTime` dalla nuova data + ora + durata originale
  - [x] 2.5 Validare non-sovrapposizione sulla nuova postazione (escludendo l'appuntamento stesso dalla query conflitti) — se conflitto, restituire errore con `code: 'SLOT_OCCUPIED'` e suggerire slot alternativi usando `findAlternativeSlots` (gia' esistente)
  - [x] 2.6 Validare che il nuovo slot non ecceda l'orario di chiusura della postazione
  - [x] 2.7 UPDATE nella tabella appointments: startTime, endTime, stationId (se cambiata), updatedAt = new Date()
  - [x] 2.8 Restituire l'appuntamento aggiornato

- [x] Task 3: Creare componente `AppointmentDetail` per dettaglio appuntamento (AC: #1)
  - [x] 3.1 Creare `src/components/appointment/AppointmentDetail.tsx` — Client Component
  - [x] 3.2 Props: `appointment: { id, clientFirstName, clientLastName, dogName, serviceName, serviceId, startTime, endTime, price, stationId, notes }`, `stationName: string`, `onClose()`, `onDelete()`, `onReschedule()`
  - [x] 3.3 Mostrare header con nome cliente e nome cane
  - [x] 3.4 Mostrare dettagli: postazione, data formattata in italiano, ora inizio-fine, servizio, durata calcolata, prezzo formattato con `formatPrice()`
  - [x] 3.5 Mostrare note se presenti (campo `notes`)
  - [x] 3.6 Due bottoni azione: "Sposta" (variant outline) e "Cancella" (variant destructive)
  - [x] 3.7 Al click "Cancella": aprire AlertDialog di conferma con testo "Cancellare l'appuntamento di [nome cliente] ([nome cane])?" — bottoni "Annulla" + "Cancella" (destructive)
  - [x] 3.8 Al click conferma cancellazione: chiamare `deleteAppointment` action, toast "Appuntamento cancellato", callback `onDelete()`
  - [x] 3.9 Al click "Sposta": callback `onReschedule()` — delegare la logica di spostamento ad AgendaView

- [ ] Task 4: Integrare AppointmentDetail nell'AgendaView con Dialog/Sheet (AC: #1, #2)
  - [ ] 4.1 Aggiungere stato `selectedAppointment` in AgendaView per l'appuntamento selezionato (dati completi dall'array appointments gia' in memoria)
  - [ ] 4.2 Aggiungere handler `handleAppointmentClick(id)` che trova l'appuntamento nell'array `appointments` e setta `selectedAppointment`
  - [ ] 4.3 Passare `onAppointmentClick={handleAppointmentClick}` a ScheduleGrid e ScheduleTimeline
  - [ ] 4.4 Wrapper responsive: `Dialog` (desktop) / `Sheet` (mobile) contenente `AppointmentDetail`
  - [ ] 4.5 Handler `handleDelete`: chiudere il Dialog/Sheet, invalidare query TanStack, toast gia' gestito in AppointmentDetail
  - [ ] 4.6 Handler `handleRescheduleStart`: chiudere il Dialog/Sheet, attivare modalita' spostamento (Step 5)

- [ ] Task 5: Implementare modalita' spostamento nell'AgendaView (AC: #3, #4, #5, #6)
  - [ ] 5.1 Aggiungere stato `rescheduleMode: { appointmentId: string, clientName: string, dogName: string, duration: number, stationId: string } | null` in AgendaView
  - [ ] 5.2 Quando `rescheduleMode` e' attivo, mostrare banner in alto con testo "Seleziona il nuovo slot per [cliente] ([cane])" e bottone "Annulla"
  - [ ] 5.3 Passare una prop `rescheduleMode` a ScheduleGrid/ScheduleTimeline per modificare il rendering: slot disponibili con sfondo verde chiaro, slot occupati oscurati, appuntamento originale con opacita' ridotta
  - [ ] 5.4 In modalita' spostamento, il click su EmptySlot chiama `handleRescheduleSlot` (invece di aprire il form creazione): esegue la action `rescheduleAppointment` con i dati del nuovo slot
  - [ ] 5.5 Al successo: disattivare `rescheduleMode`, invalidare query TanStack, toast "Appuntamento spostato"
  - [ ] 5.6 Se errore `SLOT_OCCUPIED`: mostrare toast con messaggio errore (gli slot alternativi sono gia' visibili nell'agenda)
  - [ ] 5.7 Bottone "Annulla" nel banner: resetta `rescheduleMode` a null
  - [ ] 5.8 Passare `rescheduleAppointmentId` a ScheduleGrid/ScheduleTimeline per applicare opacita' ridotta sull'AppointmentBlock corrispondente

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono cancellare/spostare appuntamenti (FR22, FR23). NON aggiungere restrizioni di ruolo
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB
- **Cancellazione = DELETE** — Gli appuntamenti vengono ELIMINATI dal database (hard delete). Non esiste un campo `status` o `deletedAt` sulla tabella appointments. Un appuntamento esiste o non esiste
- **Prezzi in centesimi** nel database, formattati in EUR nella UI con `formatPrice()` da `src/lib/utils/formatting.ts`
- **Date in UTC** nel database (timestamp PostgreSQL), formattate in italiano nella UI
- **Alert Dialog SOLO per azioni distruttive** — La cancellazione richiede conferma. Lo spostamento NO
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- **updatedAt** deve essere aggiornato manualmente con `new Date()` in ogni UPDATE (lezione da Story 4.1)

### Tabella `appointments` — Gia' Esistente

```typescript
// src/lib/db/schema.ts — GIA' PRESENTE, NON MODIFICARE
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),
  dogId: uuid('dog_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  stationId: uuid('station_id').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  price: integer('price').notNull(),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Note critiche sulla tabella:**
- Nessun campo `status` o `cancelledAt`: la cancellazione e' un DELETE
- Nessun campo `locationId`: la location si ricava tramite JOIN con stations (`stations.locationId`)
- `startTime` e `endTime` sono `timestamp` completi (data + ora UTC = ora locale italiana)
- La durata per lo spostamento si calcola da `endTime - startTime` (non e' un campo separato)

### Funzioni e Hook Riutilizzabili (GIA' ESISTENTI)

**authActionClient (`src/lib/actions/client.ts`):**
```typescript
export const authActionClient = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
  const session = await auth()
  if (!session?.user) throw new Error('Non autenticato')
  return next({
    ctx: { userId: session.user.id, role: session.user.role, tenantId: session.user.tenantId }
  })
})
```

**findAlternativeSlots (`src/lib/actions/appointments.ts`) — RIUTILIZZARE per spostamento:**
```typescript
// Gia' esistente come helper interno — trova i primi 3 slot liberi piu' vicini
async function findAlternativeSlots(
  stationId: string, date: string, durationMinutes: number, tenantId: string
): Promise<string[]>
```

**getAppointmentsByDateAndLocation (`src/lib/queries/appointments.ts`) — GIA' USATA:**
```typescript
// Ritorna appuntamenti con JOIN: clients, dogs, services, stations
// Campi: id, startTime, endTime, price, notes, stationId, clientFirstName, clientLastName, dogName, serviceName, serviceId
```

**Formato dati appuntamento gia' disponibile in AgendaView (NO nuova query necessaria):**
L'array `appointments` nell'AgendaView contiene gia' tutti i dati necessari per il dettaglio:
`{ id, startTime, endTime, price, notes, stationId, clientFirstName, clientLastName, dogName, serviceName, serviceId }`
NON serve creare una nuova query `getAppointmentById` — basta trovare l'appuntamento nell'array gia' caricato.

**useIsMobile (`src/hooks/use-mobile.ts`):**
```typescript
const isMobile = useIsMobile() // true se viewport < 768px
```

**Formatting utilities (`src/lib/utils/formatting.ts`):**
```typescript
formatPrice(cents: number)     // "€ 15,00"
formatDuration(minutes: number) // "1h 30min" o "30min"
```

**Schedule utilities (`src/lib/utils/schedule.ts`):**
```typescript
toDayOfWeek(dateFnsDay: number)  // Converte date-fns (0=Dom) a progetto (0=Lun)
timeToMinutes(time: string)      // "09:30" → 570
```

### Pattern Errore Business (da Story 4.2)

```typescript
// Per errori strutturati con dati (SLOT_OCCUPIED), restituire nel risultato:
return {
  error: {
    code: 'SLOT_OCCUPIED' as const,
    message: "Lo slot e' gia' occupato",
    alternatives,
  },
}

// Per errori semplici, usare throw:
throw new Error('Appuntamento non trovato')

// Client-side, gestire con useAction:
const { execute, isPending } = useAction(rescheduleAppointment, {
  onSuccess: ({ data }) => {
    if (data?.error) {
      // Errore business
      handleBusinessError(data.error)
      return
    }
    toast.success('Appuntamento spostato')
  },
  onError: ({ error }) => {
    toast.error(error.error?.serverError ?? 'Errore')
  },
})
```

### Componente AppointmentDetail — Design Dettagliato

```
┌─────────────────────────────────────────┐
│  Maria Rossi — Teddy                 X │  ← header con nomi
├─────────────────────────────────────────┤
│                                         │
│  📍 Tavolo 1                            │
│  📅 Lun 17 Feb 2026                     │
│  🕐 09:00 — 10:00 (1h)                 │
│  ✂️  Bagno e taglio                     │
│  💰 € 25,00                            │
│                                         │
│  📝 Note: "Pelo annodato, usare..."     │  ← solo se notes non null
│                                         │
├─────────────────────────────────────────┤
│   [ Sposta ]        [ Cancella ]       │  ← outline / destructive
└─────────────────────────────────────────┘
```

### Modalita' Spostamento — Flusso Interattivo

```
┌─ BANNER ──────────────────────────────────────────────────┐
│  📍 Seleziona il nuovo slot per Maria Rossi (Teddy)  [X] │
└───────────────────────────────────────────────────────────┘

┌─ AGENDA ─────────────────────────────────────┐
│  Tavolo 1       │  Tavolo 2       │         │
│  ┌───────────┐  │  ┌───────────┐  │         │
│  │ Mario B.  │  │  │ LIBERO    │  │         │  ← sfondo verde chiaro
│  │ (occupato)│  │  │ (tocca per│  │         │      su slot disponibili
│  └───────────┘  │  │ spostare) │  │         │
│  ┌───────────┐  │  └───────────┘  │         │
│  │ Maria R.  │  │  ┌───────────┐  │         │  ← opacita' 50%
│  │ (in spost)│  │  │ LIBERO    │  │         │      sull'appuntamento
│  │ opacity50%│  │  │ ✨         │  │         │      originale
│  └───────────┘  │  └───────────┘  │         │
└──────────────────────────────────────────────┘
```

**Flusso stati:**
1. **Utente clicca appuntamento** → si apre AppointmentDetail
2. **Utente clicca "Sposta"** → AppointmentDetail si chiude, `rescheduleMode` si attiva, banner appare
3. **Utente tocca slot vuoto** → `rescheduleAppointment` viene chiamato, se successo l'agenda si aggiorna
4. **Se errore** → toast con errore, rimane in modalita' spostamento
5. **Utente clicca "Annulla"** → `rescheduleMode` si disattiva, agenda torna normale

### Integrazione AgendaView — Stato da Aggiungere

```typescript
// In AgendaView.tsx — AGGIORNARE (aggiungere al codice esistente)

// Stato per dettaglio appuntamento
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

// Stato per modalita' spostamento
const [rescheduleMode, setRescheduleMode] = useState<{
  appointmentId: string
  clientName: string
  dogName: string
  duration: number       // minuti, calcolati da endTime - startTime
  stationId: string
} | null>(null)

// Handler click appuntamento
const handleAppointmentClick = (id: string) => {
  if (rescheduleMode) return  // in modalita' spostamento, ignora click su appuntamenti
  const appointment = appointments.find(a => a.id === id)
  if (appointment) setSelectedAppointment(appointment)
}

// Handler cancellazione
const handleDelete = () => {
  setSelectedAppointment(null)
  queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
}

// Handler inizio spostamento
const handleRescheduleStart = () => {
  if (!selectedAppointment) return
  const durationMs = selectedAppointment.endTime.getTime() - selectedAppointment.startTime.getTime()
  setRescheduleMode({
    appointmentId: selectedAppointment.id,
    clientName: `${selectedAppointment.clientFirstName} ${selectedAppointment.clientLastName}`,
    dogName: selectedAppointment.dogName,
    duration: Math.round(durationMs / 60000),
    stationId: selectedAppointment.stationId,
  })
  setSelectedAppointment(null)  // chiudi dettaglio
}
```

### Modifica Props ScheduleGrid e ScheduleTimeline

```typescript
// Aggiungere queste props a ScheduleGrid e ScheduleTimeline:
interface ScheduleGridProps {
  // ... props esistenti
  onAppointmentClick?: (id: string) => void      // GIA' PRESENTE ma non passata da AgendaView
  rescheduleAppointmentId?: string | null          // NUOVO: per opacita' ridotta
}

// ScheduleGrid gia' supporta onAppointmentClick ma AgendaView non lo passa ancora.
// ScheduleTimeline gia' supporta onAppointmentClick ma AgendaView non lo passa ancora.
```

**ATTENZIONE:** ScheduleGrid e ScheduleTimeline hanno GIA' le prop `onAppointmentClick` nelle loro interfacce. AgendaView semplicemente non le passa ancora. Bisogna solo aggiungere il passaggio del handler.

### Modifica EmptySlot per Modalita' Spostamento

In modalita' spostamento, il click su EmptySlot deve:
1. Chiamare `rescheduleAppointment` invece di aprire il form creazione
2. Lo slot deve avere uno stile visivo diverso (sfondo verde chiaro)

**Approccio consigliato:** NON modificare EmptySlot.tsx. Gestire la logica nel handler `onEmptySlotClick` in AgendaView. Se `rescheduleMode` e' attivo, il handler chiama `rescheduleAppointment`. Altrimenti, apre il form di creazione come gia' funziona.

Per lo stile visivo degli slot in modalita' spostamento: passare una prop `isRescheduleMode` a ScheduleGrid/ScheduleTimeline e lasciare che gestiscano il CSS condizionale sugli EmptySlot. OPPURE, se la modifica e' troppo invasiva, omettere lo stile visivo verde chiaro e usare solo il banner come indicatore di modalita'. Valutare la complessita'.

### Componenti shadcn/ui Necessari

**Gia' installati e usabili:**
button, input, label, card, sonner, sheet, dialog, table, badge, skeleton, separator, scroll-area, checkbox, tooltip, avatar, textarea, select, dropdown-menu, **alert-dialog**, calendar, popover, tabs

**alert-dialog** — CRITICO per conferma cancellazione. Exports disponibili: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`

### Dipendenze da Installare

**Nessuna nuova dipendenza necessaria.** Tutto il necessario e' gia' presente.

### UX Pattern da Seguire

- **AppointmentDetail in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — stesso pattern del form creazione
- **Alert Dialog per cancellazione** — con testo chiaro dell'impatto ("Cancellare l'appuntamento di Maria Rossi (Teddy)?")
- **NO conferma per spostamento** — lo spostamento e' un'azione non distruttiva
- **Toast con Sonner** — "Appuntamento cancellato" e "Appuntamento spostato"
- **Banner spostamento** — visibile in cima all'agenda durante la modalita' spostamento, con bottone "Annulla"
- **Opacita' ridotta** sull'appuntamento originale durante lo spostamento (opacity-50)
- **Touch target minimi 44x44px** su tutti gli elementi interattivi
- **Invalidation TanStack Query** dopo ogni mutazione (stessa chiave `['appointments', locationId, dateString]`)

### Design Tokens e Colori

```
Primary:          #4A7C6F — bottone "Sposta"
Destructive:      var(--destructive) — bottone "Cancella", bordo AlertDialog
Background:       #FFFFFF — sfondo dettaglio
Surface:          #F8FAFB — sfondo header dettaglio
Border:           #E2E8F0 — bordi
Text Primary:     #1A202C — nomi, label
Text Secondary:   #64748B — info secondarie
Text Muted:       #94A3B8 — hint
Reschedule Available: bg-green-50 border-green-200 — slot disponibili in modalita' spostamento
Reschedule Origin:    opacity-50 — appuntamento originale durante spostamento
```

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Server Actions | camelCase con verbo | `deleteAppointment`, `rescheduleAppointment` |
| Schema Zod | camelCase + Schema | `deleteAppointmentSchema`, `rescheduleAppointmentSchema` |
| Componenti React | PascalCase | `AppointmentDetail.tsx` |
| File directory | kebab-case | `components/appointment/` |
| Tipi TypeScript | PascalCase | `RescheduleAppointmentInput` |

### Project Structure Notes

```
src/
  components/
    appointment/
      AppointmentDetail.tsx     # CREARE: dettaglio appuntamento con azioni
      AppointmentForm.tsx       # NON MODIFICARE (gia' funzionante da Story 4.2)
      ClientSearch.tsx          # NON MODIFICARE
      QuickClientForm.tsx       # NON MODIFICARE
    schedule/
      AgendaView.tsx            # AGGIORNARE: aggiungere stati selectedAppointment e rescheduleMode, handlers, Dialog/Sheet dettaglio, banner spostamento, logica condizionale EmptySlot click
      ScheduleGrid.tsx          # AGGIORNARE MINIMAMENTE: passare rescheduleAppointmentId per opacita', assicurarsi che onAppointmentClick sia propagato
      ScheduleTimeline.tsx      # AGGIORNARE MINIMAMENTE: stesso di ScheduleGrid
      AppointmentBlock.tsx      # AGGIORNARE MINIMAMENTE: aggiungere prop opzionale `isRescheduling` per opacita' ridotta
      EmptySlot.tsx             # NON MODIFICARE (il click e' gestito dal handler in AgendaView)
  lib/
    actions/
      appointments.ts           # AGGIORNARE: aggiungere deleteAppointment e rescheduleAppointment
    validations/
      appointments.ts           # AGGIORNARE: aggiungere deleteAppointmentSchema e rescheduleAppointmentSchema
    queries/
      appointments.ts           # NON MODIFICARE (i dati sono gia' disponibili nell'array appointments)
    db/
      schema.ts                 # NON MODIFICARE
    utils/
      schedule.ts               # NON MODIFICARE
      formatting.ts             # NON MODIFICARE
```

**File da NON modificare:**
- `src/lib/db/schema.ts` — tabella appointments gia' completa
- `src/lib/actions/client.ts` — authActionClient gia' configurato
- `src/lib/queries/appointments.ts` — query lettura gia' completa
- `src/components/appointment/AppointmentForm.tsx` — form creazione gia' funzionante
- `src/components/appointment/ClientSearch.tsx` — ricerca gia' funzionante
- `src/components/appointment/QuickClientForm.tsx` — form rapido gia' funzionante
- `src/components/schedule/EmptySlot.tsx` — onClick gia' predisposto

### Previous Story Intelligence

**Da Story 4.2 — pattern da replicare:**
- `authActionClient` con `.schema().action()` — pattern stabile
- `useAction` hook con callback `onSuccess`/`onError` per mutazioni
- `useIsMobile()` per responsive Dialog/Sheet
- TanStack Query con `queryKey: ['appointments', locationId, dateString]` — usare la STESSA chiave per invalidation
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- `Intl.DateTimeFormat('it-IT', ...)` per formattazione date in italiano
- Dialog desktop / Sheet bottom mobile — stesso wrapper responsivo
- `findAlternativeSlots` gia' disponibile come helper interno per SLOT_OCCUPIED
- Errori business restituiti come oggetto nel risultato (non throw)

**Da Story 4.2 — lezioni apprese:**
- `updatedAt` deve essere aggiornato manualmente con `new Date()` in ogni UPDATE
- dayOfWeek: date-fns usa 0=Domenica, il progetto usa 0=Lunedi'. Usare `toDayOfWeek()` da `schedule.ts`
- Timestamp salvati come "UTC = ora locale italiana" — nessuna conversione timezone
- Invalidation della query e' sufficiente (no true optimistic update necessario per 5 utenti)
- `onCancel` prop nel form non era usata — non aggiungere prop inutili

**Da Story 4.1 — pattern componenti griglia:**
- `onAppointmentClick` prop GIA' presente su ScheduleGrid e ScheduleTimeline ma NON passata da AgendaView
- AppointmentBlock ha onClick che riceve solo `id: string`
- ScheduleGrid posiziona i blocchi con CSS Grid e `getAppointmentPosition()`
- ScheduleTimeline usa tab per postazione con componente `StationTimeline`

### Git Intelligence

**Pattern commit per questa story:**
```
story 4-3-cancellazione-e-spostamento-appuntamenti: Task N — Descrizione breve della feature
```

**File recentemente modificati rilevanti (da Story 4.2):**
- `src/lib/actions/appointments.ts` — contiene getAgendaData, createAppointment, fetchDogsForClient, fetchServicesForStation, findAlternativeSlots
- `src/lib/validations/appointments.ts` — contiene getAppointmentsQuerySchema, createAppointmentSchema
- `src/components/schedule/AgendaView.tsx` — orchestratore dell'agenda con Dialog/Sheet per AppointmentForm
- `src/components/appointment/AppointmentForm.tsx` — form creazione con rivelazione progressiva

### Informazioni Tecniche Aggiornate

**next-safe-action v8 — pattern DELETE:**
```typescript
export const deleteAppointment = authActionClient
  .schema(deleteAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { appointmentId } = parsedInput

    const deleted = await db.delete(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, ctx.tenantId)
      ))
      .returning({ id: appointments.id })

    if (deleted.length === 0) {
      throw new Error('Appuntamento non trovato')
    }

    return { success: true }
  })
```

**Drizzle ORM — UPDATE con returning:**
```typescript
const [updated] = await db.update(appointments)
  .set({
    startTime: newStartTime,
    endTime: newEndTime,
    stationId: newStationId,
    updatedAt: new Date(),
  })
  .where(and(
    eq(appointments.id, appointmentId),
    eq(appointments.tenantId, ctx.tenantId)
  ))
  .returning()
```

**shadcn/ui AlertDialog — pattern conferma cancellazione:**
```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancellare l'appuntamento?</AlertDialogTitle>
      <AlertDialogDescription>
        L'appuntamento di {clientName} ({dogName}) verra' cancellato.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annulla</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Cancella
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Protezione Anti-Errori

- **Race condition spostamento:** Due utenti spostano verso lo stesso slot → la validazione server-side previene la sovrapposizione. Il secondo riceve errore SLOT_OCCUPIED
- **Appuntamento gia' cancellato:** Se l'appuntamento e' gia' stato cancellato da un altro utente, il DELETE non trova righe e restituisce errore "Appuntamento non trovato"
- **Spostamento oltre orario chiusura:** La validazione server verifica che il nuovo slot + durata non ecceda l'orario di chiusura
- **Dati stale nell'AppointmentDetail:** I dati vengono dall'array `appointments` che e' gia' in cache TanStack Query. Dopo invalidation si aggiornano automaticamente
- **Click durante spostamento:** In modalita' spostamento, il click su un appuntamento viene ignorato (solo EmptySlot e' cliccabile)
- **Spostamento su altra postazione:** Lo spostamento puo' avvenire su qualsiasi postazione visibile nell'agenda (non solo quella originale). Il campo `stationId` viene aggiornato

### Testing

Nessun framework di test automatico e' configurato nel progetto. Il testing si limita a:

- **Verifica manuale — casi critici da verificare:**
  - Click su appuntamento desktop → Dialog si apre con dettagli corretti
  - Click su appuntamento mobile → Sheet si apre con dettagli corretti
  - Cancellazione con conferma → appuntamento eliminato, slot torna libero, toast
  - Cancellazione annullata → nessuna modifica
  - Spostamento: click "Sposta" → banner appare, dettaglio si chiude
  - Spostamento: click su slot vuoto → appuntamento spostato, toast, banner sparisce
  - Spostamento: click "Annulla" → modalita' spostamento disattivata, agenda normale
  - Spostamento su slot occupato → errore "Lo slot non e' piu' disponibile"
  - Spostamento oltre orario chiusura → errore appropriato
  - Spostamento su altra postazione → stationId aggiornato correttamente
  - Opacita' ridotta sull'appuntamento originale durante spostamento
  - Rendering corretto sia desktop che mobile in modalita' spostamento
  - Collaboratore: puo' cancellare e spostare (nessuna restrizione ruolo)
  - Touch target: tutti gli elementi interattivi >= 44x44px

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/prd.md#FR22 — Cancellazione appuntamento]
- [Source: _bmad-output/planning-artifacts/prd.md#FR23 — Spostamento appuntamento a nuova fascia oraria o data]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns — Server Actions con next-safe-action + Zod]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — TanStack Query, optimistic updates, error handling]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User-Journey-Flows — Journey 3: Spostamento Appuntamento]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns — Alert Dialog per azioni distruttive]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pattern-Interazione-Agenda — Tocco su appuntamento apre dettaglio]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy — AppointmentBlock onClick, stati hover/selezionato/in-spostamento]
- [Source: _bmad-output/implementation-artifacts/4-2-creazione-appuntamento-rapido.md — Pattern codice, useAction, Dialog/Sheet, findAlternativeSlots]
- [Source: _bmad-output/implementation-artifacts/4-1-vista-agenda-per-sede-e-postazione.md — ScheduleGrid onAppointmentClick, AppointmentBlock, EmptySlot]
- [Source: src/lib/db/schema.ts — Tabella appointments (no status field, hard delete)]
- [Source: src/lib/actions/appointments.ts — createAppointment, findAlternativeSlots da riutilizzare]
- [Source: src/lib/actions/client.ts — authActionClient]
- [Source: src/lib/validations/appointments.ts — Schema esistenti]
- [Source: src/lib/utils/schedule.ts — toDayOfWeek, timeToMinutes]
- [Source: src/lib/utils/formatting.ts — formatPrice, formatDuration]
- [Source: src/components/schedule/AgendaView.tsx — orchestratore da aggiornare]
- [Source: src/components/schedule/ScheduleGrid.tsx — onAppointmentClick gia' presente nelle props]
- [Source: src/components/schedule/ScheduleTimeline.tsx — onAppointmentClick gia' presente nelle props]
- [Source: src/components/schedule/AppointmentBlock.tsx — onClick(id) callback]
- [Source: src/components/ui/alert-dialog.tsx — AlertDialog per conferma cancellazione]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Aggiunto `deleteAppointmentSchema` (Zod) e action `deleteAppointment` con hard DELETE + verifica tenant. TypeScript OK.
- Task 2: Aggiunto `rescheduleAppointmentSchema` (Zod) e action `rescheduleAppointment` con validazione sovrapposizione (esclusione self), validazione orario chiusura, findAlternativeSlots per SLOT_OCCUPIED, e UPDATE con updatedAt. TypeScript OK.
- Task 3: Creato `AppointmentDetail.tsx` — Client Component con dettaglio completo (postazione, data IT, ora, servizio, durata, prezzo, note), bottoni Sposta/Cancella, AlertDialog conferma cancellazione con `deleteAppointment` action e toast. TypeScript OK.

### File List

- src/lib/validations/appointments.ts (modified)
- src/lib/actions/appointments.ts (modified)
- src/components/appointment/AppointmentDetail.tsx (created)
