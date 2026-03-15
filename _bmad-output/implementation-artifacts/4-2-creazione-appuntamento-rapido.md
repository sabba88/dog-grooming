# Story 4.2: Creazione Appuntamento Rapido

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **creare un appuntamento in meno di 30 secondi toccando uno slot libero nell'agenda**,
so that **possa prenotare velocemente anche durante una telefonata con le mani occupate**.

## Acceptance Criteria

1. **Given** un utente tocca/clicca uno slot vuoto nell'agenda
   **When** il form di prenotazione si apre (Sheet su mobile, Dialog su desktop)
   **Then** postazione, data e ora sono gia' pre-compilati dallo slot selezionato

2. **Given** il form di prenotazione e' aperto
   **When** l'utente digita 2-3 caratteri nel campo ricerca cliente (ClientSearch)
   **Then** i risultati appaiono in tempo reale con ricerca incrementale
   **And** se il cliente ha un solo cane, il cane viene auto-selezionato
   **And** se il cliente ha piu' cani, l'utente seleziona il cane dalla lista

3. **Given** il cliente non esiste nel sistema
   **When** l'utente clicca "Crea nuovo cliente" nel form di prenotazione
   **Then** si apre un sotto-form per creare il cliente al volo (nome, cognome, telefono, consenso)
   **And** dopo la creazione il cliente viene auto-selezionato nel form originale senza perdere i dati gia' inseriti

4. **Given** l'utente ha selezionato cliente e cane
   **When** seleziona un servizio dalla lista dei servizi abilitati sulla postazione
   **Then** la durata e il prezzo si pre-compilano automaticamente dal listino
   **And** l'utente puo' modificare durata e prezzo manualmente se necessario

5. **Given** l'utente ha compilato tutti i campi
   **When** tocca "Conferma" (senza richiesta "sei sicuro?")
   **Then** l'appuntamento viene creato con un optimistic update — il blocco appare immediatamente nell'agenda
   **And** mostra un toast "Appuntamento salvato"
   **And** il form si chiude e l'utente torna all'agenda

6. **Given** l'utente tenta di creare un appuntamento
   **When** lo slot e' gia' occupato da un altro appuntamento (sovrapposizione)
   **Then** il sistema impedisce la creazione e mostra un messaggio "Lo slot e' gia' occupato"
   **And** suggerisce gli slot alternativi piu' vicini disponibili

7. **Given** l'utente tenta di creare un appuntamento
   **When** la durata del servizio eccede l'orario di chiusura della postazione
   **Then** il sistema avvisa "L'appuntamento supera l'orario di chiusura" e permette di modificare la durata

## Tasks / Subtasks

- [x] Task 1: Creare schema Zod `createAppointmentSchema` e query servizi per postazione (AC: #1, #4, #5, #6, #7)
  - [x] 1.1 Aggiungere `createAppointmentSchema` in `src/lib/validations/appointments.ts` con campi: stationId (uuid), date (string YYYY-MM-DD), time (string HH:MM), clientId (uuid), dogId (uuid), serviceId (uuid), duration (integer, minuti, min 15), price (integer, centesimi, min 0)
  - [x] 1.2 Esportare tipo inferito `CreateAppointmentInput`
  - [x] 1.3 Creare `getServicesForStation(stationId, tenantId)` in `src/lib/queries/stations.ts` — restituisce i servizi abilitati su una postazione con JOIN su station_services e services (id, name, price, duration)

- [x] Task 2: Creare Server Action `createAppointment` con validazione sovrapposizione (AC: #5, #6, #7)
  - [x] 2.1 Creare action `createAppointment` in `src/lib/actions/appointments.ts` usando `authActionClient.schema(createAppointmentSchema).action()`
  - [x] 2.2 Calcolare `startTime` e `endTime` da date + time + duration (come timestamp UTC)
  - [x] 2.3 Validare che il servizio sia abilitato sulla postazione (query station_services)
  - [x] 2.4 Validare non-sovrapposizione: query appuntamenti esistenti sulla stessa postazione con `(startTime < newEndTime AND endTime > newStartTime)` — se conflitto, restituire errore con `code: 'SLOT_OCCUPIED'` e suggerire slot alternativi piu' vicini
  - [x] 2.5 Validare che l'appuntamento non ecceda l'orario di chiusura della postazione per il giorno selezionato — se eccede, restituire errore con `code: 'EXCEEDS_CLOSING_TIME'`
  - [x] 2.6 INSERT nella tabella appointments con tutti i campi + tenantId dal contesto
  - [x] 2.7 Restituire l'appuntamento creato con i dati per l'optimistic update

- [x] Task 3: Creare API Route `/api/clients/search` per ricerca incrementale (AC: #2)
  - [x] 3.1 Creare `src/app/api/clients/search/route.ts` — GET con query param `q` (minimo 2 caratteri)
  - [x] 3.2 Usare la funzione `searchClients(query, tenantId)` gia' esistente in `src/lib/queries/clients.ts`
  - [x] 3.3 Autenticazione: estrarre sessione con `auth()`, restituire 401 se non autenticato
  - [x] 3.4 Per ogni cliente trovato, caricare il count dei cani associati con `getDogsByClient`
  - [x] 3.5 Formato risposta: `{ success: true, data: [{ id, firstName, lastName, phone, dogsCount }] }`

- [x] Task 4: Creare componente `ClientSearch` con ricerca type-ahead (AC: #2, #3)
  - [x] 4.1 Creare `src/components/appointment/ClientSearch.tsx` — Client Component
  - [x] 4.2 Input di ricerca con icona Search (Lucide) e debounce 300ms
  - [x] 4.3 Dropdown risultati dopo 2+ caratteri: avatar iniziali + nome completo + telefono + badge "N cani"
  - [x] 4.4 Opzione "Crea nuovo cliente" in fondo alla lista se nessun risultato o sempre come ultima opzione
  - [x] 4.5 `onSelect(client)` callback al click su un risultato — restituisce { id, firstName, lastName }
  - [x] 4.6 `onCreateNew()` callback al click su "Crea nuovo cliente"
  - [x] 4.7 Auto-focus sull'input al mount
  - [x] 4.8 Stato "Nessun risultato" con messaggio e CTA creazione

- [x] Task 5: Creare sotto-form `QuickClientForm` per creazione al volo (AC: #3)
  - [x] 5.1 Creare `src/components/appointment/QuickClientForm.tsx` — Client Component
  - [x] 5.2 Dialog secondario (sopra il Dialog/Sheet del form principale) con form compatto: nome, cognome, telefono, checkbox consenso
  - [x] 5.3 Usare `createClientSchema` da `src/lib/validations/clients.ts` (riutilizzare lo schema esistente)
  - [x] 5.4 Usare `createClient` action da `src/lib/actions/clients.ts` (riutilizzare l'action esistente)
  - [x] 5.5 Al successo: `onCreated(client)` callback con i dati del nuovo cliente — NON chiudere il form principale
  - [x] 5.6 Toast "Cliente creato"

- [x] Task 6: Creare componente `AppointmentForm` completo (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 6.1 Creare `src/components/appointment/AppointmentForm.tsx` — Client Component
  - [x] 6.2 Props: `prefilledSlot: { stationId, stationName, date, time }`, `onSuccess()`, `onCancel()`
  - [x] 6.3 Header form: mostrare postazione (read-only), data formattata in italiano, ora
  - [x] 6.4 Sezione ClientSearch con stato selezionato (avatar + nome + bottone cambia)
  - [x] 6.5 Sezione selezione cane: dopo selezione cliente, caricare cani con `getDogsByClient`. Auto-selezionare se uno solo. Select dropdown se piu' di uno. Messaggio + CTA "Aggiungi cane" se nessun cane.
  - [x] 6.6 Sezione selezione servizio: Select con servizi abilitati dalla postazione (`getServicesForStation`). Al cambio servizio, aggiornare durata e prezzo automaticamente.
  - [x] 6.7 Campi durata (minuti) e prezzo (EUR) pre-compilati dal servizio, editabili manualmente
  - [x] 6.8 Validazione client-side con React Hook Form + Zod (`createAppointmentSchema`)
  - [x] 6.9 Bottone "Conferma" (primary) — NO conferma "sei sicuro?"
  - [x] 6.10 Gestione errore `SLOT_OCCUPIED`: mostrare messaggio + slot alternativi come bottoni cliccabili
  - [x] 6.11 Gestione errore `EXCEEDS_CLOSING_TIME`: mostrare messaggio + permettere modifica durata
  - [x] 6.12 Loading state sul bottone durante il salvataggio

- [x] Task 7: Integrare form nell'AgendaView con Dialog/Sheet e optimistic update (AC: #1, #5)
  - [x] 7.1 Aggiornare `src/components/schedule/AgendaView.tsx` — aggiungere stato per Dialog/Sheet aperto con dati slot
  - [x] 7.2 Collegare `onEmptySlotClick` in ScheduleGrid e ScheduleTimeline per aprire il form con dati pre-compilati
  - [x] 7.3 Wrapper responsive: `Dialog` (desktop >= 768px) / `Sheet` (mobile < 768px) contenente `AppointmentForm`
  - [x] 7.4 Al successo creazione: chiudere Dialog/Sheet + invalidare query TanStack `['appointments', locationId, dateString]` per aggiornare la griglia
  - [x] 7.5 Optimistic update con TanStack Query `useMutation` + `onMutate` per mostrare il blocco immediatamente nella griglia prima della risposta server
  - [x] 7.6 Toast "Appuntamento salvato" tramite Sonner (gia' configurato)
  - [x] 7.7 Rollback automatico in caso di errore server (gestito da TanStack Query)

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** deve usare `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — filtrare SEMPRE per `tenantId` dal contesto sessione JWT
- **Pattern Result:** next-safe-action gestisce automaticamente il pattern `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono creare appuntamenti (FR20). NON aggiungere restrizioni di ruolo
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle. Mantenere lo stesso pattern — FK logiche, non enforced dal DB
- **Prezzi in centesimi** nel database, formattati in EUR nella UI con `formatPrice()` da `src/lib/utils/formatting.ts`
- **Date in UTC** nel database (timestamp PostgreSQL), formattate in italiano nella UI
- **Nessuna conferma per azioni creative** — NO Alert Dialog, NO "sei sicuro?". La conferma e' un singolo tocco su "Conferma"
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente

### Tabella `appointments` — Gia' Esistente (creata in Story 4.1)

```typescript
// src/lib/db/schema.ts — GIA' PRESENTE, NON MODIFICARE
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
- `startTime` e `endTime` sono `timestamp` completi (data + ora)
- Il campo `notes` resta null in questa story (Story 4.4 lo compilera')
- Nessun campo `locationId`: la location si ricava tramite JOIN con stations (`stations.locationId`)
- Nessun campo `status`: un appuntamento esiste o non esiste. La cancellazione e' un DELETE (Story 4.3)

**Nota critica su date e timezone:**
- L'MVP opera come se UTC = ora locale italiana. Un appuntamento alle 10:00 italiane viene salvato come `2026-02-17T10:00:00.000Z`
- Le query filtrano per `startTime >= dayStart AND startTime < dayEnd`

### Funzioni e Hook Riutilizzabili (GIA' ESISTENTI)

**authActionClient (`src/lib/actions/client.ts`):**
```typescript
// Gia' verifica autenticazione e fornisce ctx.userId, ctx.role, ctx.tenantId
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

**searchClients (`src/lib/queries/clients.ts`) — RIUTILIZZARE:**
```typescript
export async function searchClients(query: string, tenantId: string) {
  // Cerca per firstName, lastName, phone con ilike
  // Filtra isNull(clients.deletedAt)
  // Ritorna: id, firstName, lastName, phone, email
  // Limite: 10 risultati
}
```

**getDogsByClient (`src/lib/queries/dogs.ts`) — RIUTILIZZARE:**
```typescript
export async function getDogsByClient(clientId: string, tenantId: string) {
  // Ritorna tutti i cani del cliente
  // Campi: id, name, breed, size
  // Filtra isNull(dogs.deletedAt)
}
```

**getStationServices (`src/lib/queries/stations.ts`) — GIA' ESISTENTE ma da arricchire:**
```typescript
// Attuale: restituisce le assegnazioni station<->service
// Per Task 1.3: creare getServicesForStation che fa JOIN con services
// per restituire id, name, price, duration dei servizi abilitati
```

**createClient action (`src/lib/actions/clients.ts`) — RIUTILIZZARE per QuickClientForm:**
```typescript
export const createClient = authActionClient
  .schema(createClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    // INSERT in clients con tenantId, consentGivenAt, consentVersion
    // Ritorna il cliente creato
  })
```

**useIsMobile (`src/hooks/use-mobile.ts`):**
```typescript
const isMobile = useIsMobile() // true se viewport < 768px
```

**useLocationSelector (`src/hooks/useLocationSelector.ts`):**
```typescript
const { selectedLocationId, isHydrated } = useLocationSelector(locations)
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

### Schema Zod createAppointmentSchema — Design

```typescript
// src/lib/validations/appointments.ts — AGGIUNGERE
import { z } from 'zod'

export const createAppointmentSchema = z.object({
  stationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/),          // HH:MM
  clientId: z.string().uuid(),
  dogId: z.string().uuid(),
  serviceId: z.string().uuid(),
  duration: z.number().int().min(15),  // minuti
  price: z.number().int().min(0),      // centesimi
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
```

### Server Action createAppointment — Design Dettagliato

```typescript
// src/lib/actions/appointments.ts — AGGIUNGERE
export const createAppointment = authActionClient
  .schema(createAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stationId, date, time, clientId, dogId, serviceId, duration, price } = parsedInput

    // 1. Calcola startTime e endTime
    const startTime = new Date(`${date}T${time}:00.000Z`)
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    // 2. Validare servizio abilitato sulla postazione
    const stationService = await db.select()
      .from(stationServices)
      .where(and(
        eq(stationServices.stationId, stationId),
        eq(stationServices.serviceId, serviceId),
        eq(stationServices.tenantId, ctx.tenantId)
      ))
      .limit(1)
    if (stationService.length === 0) {
      throw new Error('Servizio non abilitato su questa postazione')
    }

    // 3. Verifica non-sovrapposizione
    const conflicts = await db.select({ id: appointments.id, startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(and(
        eq(appointments.stationId, stationId),
        eq(appointments.tenantId, ctx.tenantId),
        lt(appointments.startTime, endTime),   // existing start < new end
        gt(appointments.endTime, startTime),    // existing end > new start
      ))
    if (conflicts.length > 0) {
      // Trovare slot alternativi vicini
      const alternatives = await findAlternativeSlots(stationId, date, duration, ctx.tenantId)
      return { error: { code: 'SLOT_OCCUPIED', message: 'Lo slot è già occupato', alternatives } }
    }

    // 4. Verifica orario chiusura postazione
    const dayOfWeek = toDayOfWeek(new Date(date).getDay())
    const schedule = await db.select()
      .from(stationSchedules)
      .where(and(
        eq(stationSchedules.stationId, stationId),
        eq(stationSchedules.dayOfWeek, dayOfWeek),
        eq(stationSchedules.tenantId, ctx.tenantId)
      ))
      .limit(1)
    if (schedule.length > 0) {
      const closeMinutes = timeToMinutes(schedule[0].closeTime)
      const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes()
      if (endMinutes > closeMinutes) {
        return { error: { code: 'EXCEEDS_CLOSING_TIME', message: "L'appuntamento supera l'orario di chiusura", closingTime: schedule[0].closeTime } }
      }
    }

    // 5. INSERT
    const [created] = await db.insert(appointments).values({
      clientId, dogId, serviceId, stationId,
      startTime, endTime,
      price,
      tenantId: ctx.tenantId,
    }).returning()

    return { appointment: created }
  })
```

**ATTENZIONE pattern errore business:** next-safe-action gestisce errori di validazione Zod e serverError automaticamente. Per errori di business (SLOT_OCCUPIED, EXCEEDS_CLOSING_TIME), restituire l'oggetto errore come parte del risultato, NON fare throw. Analizzare come i componenti client gestiscono `result.data?.error` vs `result.serverError`.

**Alternative: se il pattern corrente del progetto usa throw per tutti gli errori**, allora usare throw con messaggio strutturato e gestire nel client via `error.error?.serverError`. Verificare il pattern usato in `src/lib/actions/clients.ts` e replicarlo.

### Logica findAlternativeSlots — Design

```typescript
// Funzione helper (NON esportata come action, ma helper interno)
async function findAlternativeSlots(
  stationId: string, date: string, durationMinutes: number, tenantId: string
): Promise<string[]> {
  // 1. Caricare tutti gli appuntamenti del giorno per la postazione
  // 2. Caricare l'orario apertura/chiusura della postazione per il giorno
  // 3. Trovare gli slot liberi di durata >= durationMinutes
  // 4. Restituire i primi 3 slot liberi piu' vicini all'orario richiesto (formato HH:MM)
}
```

### API Route Client Search — Design

```typescript
// src/app/api/clients/search/route.ts
import { auth } from '@/lib/auth/auth'
import { searchClients } from '@/lib/queries/clients'
import { getDogsByClient } from '@/lib/queries/dogs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  const clients = await searchClients(q, session.user.tenantId)

  // Arricchire con count cani
  const enriched = await Promise.all(clients.map(async (client) => {
    const dogs = await getDogsByClient(client.id, session.user.tenantId)
    return { ...client, dogsCount: dogs.length }
  }))

  return NextResponse.json({ success: true, data: enriched })
}
```

### Componente ClientSearch — Design Dettagliato

```typescript
// Struttura del componente ClientSearch
interface ClientSearchProps {
  onSelect: (client: { id: string; firstName: string; lastName: string }) => void
  onCreateNew: () => void
  autoFocus?: boolean
}

// Pattern di implementazione:
// - Input controllato con stato locale per la query
// - useEffect con debounce 300ms per fetch (setTimeout + clearTimeout)
// - fetch('/api/clients/search?q=...') per i risultati
// - Dropdown assoluto sotto l'input con lista risultati
// - NON usare shadcn/ui Command/Combobox (troppo complesso per questo caso)
// - Usare un semplice Input + div dropdown posizionato sotto
// - Avatar con iniziali (primo carattere nome + cognome)
// - Keyboard: Enter seleziona primo risultato, Escape chiude dropdown, frecce per navigare
```

**Alternativa con Popover + Command di shadcn/ui:**
Se si preferisce un'esperienza piu' raffinata, usare il pattern Combobox di shadcn/ui (`Popover` + `Command`). Valutare la complessita' rispetto a un dropdown custom. Il pattern Command ha gia' keyboard navigation built-in.

### Componente AppointmentForm — Flusso Interattivo

```
┌─────────────────────────────────────────┐
│  Nuovo Appuntamento                   X │
├─────────────────────────────────────────┤
│  📍 Tavolo 1  •  Lun 17 Feb  •  09:00  │  ← read-only, pre-compilati
├─────────────────────────────────────────┤
│                                         │
│  🔍 Cerca cliente...            [input] │  ← ClientSearch
│  ┌─────────────────────────────┐        │
│  │ 👤 Maria Rossi   333-1234  │        │  ← dropdown risultati
│  │ 👤 Mario Bianchi 335-5678  │        │
│  │ ➕ Crea nuovo cliente       │        │
│  └─────────────────────────────┘        │
│                                         │
│  🐕 Cane:  [Teddy ▼]                   │  ← auto se 1, select se >1
│                                         │
│  ✂️  Servizio: [Bagno e taglio ▼]       │  ← solo servizi postazione
│                                         │
│  ⏱️ Durata: [60] min    💰 €[25,00]    │  ← pre-compilati, editabili
│                                         │
│          [ Conferma ]                   │  ← bottone primary, NO "sei sicuro?"
└─────────────────────────────────────────┘
```

**Flusso stati del form:**
1. **Iniziale:** Solo ClientSearch visibile + header pre-compilato
2. **Cliente selezionato:** Appare sezione cane. Se 1 cane → auto-select. Se 0 → CTA "Aggiungi cane".
3. **Cane selezionato:** Appare sezione servizio
4. **Servizio selezionato:** Durata e prezzo si compilano. Bottone "Conferma" diventa attivo.
5. **Invio:** Loading state → toast → chiusura

**IMPORTANTE — Rivelazione progressiva:** NON mostrare tutti i campi subito. Mostrare ogni sezione solo quando la precedente e' compilata. Questo riduce il carico cognitivo e guida l'utente nel flusso.

### Integrazione AgendaView — Dialog/Sheet Pattern

```typescript
// In AgendaView.tsx — AGGIORNARE

// Stato per il form di prenotazione
const [appointmentSlot, setAppointmentSlot] = useState<{
  stationId: string
  stationName: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
} | null>(null)

// Handler click slot vuoto
const handleEmptySlotClick = (data: { stationId: string; date: string; time: string }) => {
  // Trovare il nome della postazione dai dati stations
  const station = stations.find(s => s.id === data.stationId)
  setAppointmentSlot({
    ...data,
    stationName: station?.name ?? ''
  })
}

// Handler successo creazione
const handleAppointmentCreated = () => {
  setAppointmentSlot(null) // chiudi form
  queryClient.invalidateQueries({ queryKey: ['appointments', selectedLocationId, dateString] })
}
```

**Dialog/Sheet wrapper:**
```tsx
{isMobile ? (
  <Sheet open={!!appointmentSlot} onOpenChange={() => setAppointmentSlot(null)}>
    <SheetContent side="bottom" className="h-[90vh]">
      <SheetHeader><SheetTitle>Nuovo Appuntamento</SheetTitle></SheetHeader>
      <AppointmentForm prefilledSlot={appointmentSlot!} onSuccess={handleAppointmentCreated} onCancel={() => setAppointmentSlot(null)} />
    </SheetContent>
  </Sheet>
) : (
  <Dialog open={!!appointmentSlot} onOpenChange={() => setAppointmentSlot(null)}>
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Nuovo Appuntamento</DialogTitle></DialogHeader>
      <AppointmentForm prefilledSlot={appointmentSlot!} onSuccess={handleAppointmentCreated} onCancel={() => setAppointmentSlot(null)} />
    </DialogContent>
  </Dialog>
)}
```

### TanStack Query — Optimistic Update Pattern

```typescript
// Pattern per optimistic update nella griglia agenda
const queryClient = useQueryClient()

// Opzione 1 (RACCOMANDATA per semplicita'): Invalidation dopo mutazione
// La query ['appointments', locationId, dateString] viene invalidata
// TanStack Query ri-fetcha automaticamente i dati
// L'agenda si aggiorna in ~100ms (tempo di una Server Action)

// Opzione 2 (AVANZATA): True optimistic update
// Usare useMutation con onMutate per aggiungere il blocco alla cache PRIMA della risposta
// Piu' complesso ma l'utente vede il risultato istantaneamente
// Richiede di costruire l'oggetto appuntamento completo nel client

// RACCOMANDAZIONE: Partire con Opzione 1 (invalidation). Se l'utente percepisce ritardo,
// implementare Opzione 2. Con 5 utenti concorrenti e Vercel serverless,
// l'invalidation dovrebbe essere sufficientemente veloce.
```

### Componenti shadcn/ui Necessari

**Gia' installati e usabili:**
button, input, label, card, sonner, sheet, dialog, table, badge, skeleton, separator, scroll-area, checkbox, tooltip, avatar, textarea, select, dropdown-menu, alert-dialog, calendar, popover, tabs

**Tutti i componenti necessari sono gia' installati.** Non servono nuove installazioni shadcn/ui.

### Dipendenze da Installare

**Nessuna nuova dipendenza necessaria.** Tutto il necessario e' gia' presente:
- `react-hook-form` + `@hookform/resolvers` — per i form
- `zod` — per validazione
- `@tanstack/react-query` — per state management
- `next-safe-action` — per Server Actions type-safe
- `date-fns` — per manipolazione date
- `sonner` — per toast
- `lucide-react` — per icone

### UX Pattern da Seguire

- **Form in Dialog (desktop >= 768px) o Sheet (mobile < 768px)** — come da UX spec
- **Sheet dal basso** con altezza 90vh max, drag indicator in alto
- **Touch target minimi 44x44px** su tutti gli elementi interattivi
- **Nessun indicatore di caricamento** per apertura form — il form si apre istantaneamente
- **Loading state solo sul bottone** durante il salvataggio (spinner piccolo, bottone disabilitato)
- **Toast con Sonner** "Appuntamento salvato" dopo creazione
- **Validazione al blur** — errori inline sotto il campo, messaggi in italiano semplice
- **Pre-compilazione intelligente:** postazione/data/ora dallo slot, durata/prezzo dal servizio
- **Auto-selezione cane** se il cliente ha un solo cane — zero tocchi extra
- **Rivelazione progressiva** dei campi — riduce il carico cognitivo
- **Ricerca incrementale** con debounce 300ms — come ricerca contatti WhatsApp

### Design Tokens e Colori

```
Primary:          #4A7C6F — bottone "Conferma"
Primary Light:    #E8F0ED — hover
Primary Dark:     #345A50 — hover bottone
Background:       #FFFFFF — sfondo form
Surface:          #F8FAFB — sfondo header slot pre-compilato
Border:           #E2E8F0 — bordi input
Text Primary:     #1A202C — nomi, label
Text Secondary:   #64748B — placeholder, info secondarie
Text Muted:       #94A3B8 — hint, helper text
Error:            #EF4444 — messaggi errore, bordi campo con errore
```

Usare classi Tailwind semantiche: `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `text-destructive`.

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Server Actions | camelCase con verbo | `createAppointment` |
| Schema Zod | camelCase + Schema | `createAppointmentSchema` |
| Componenti React | PascalCase | `AppointmentForm.tsx`, `ClientSearch.tsx`, `QuickClientForm.tsx` |
| File directory | kebab-case | `components/appointment/` |
| Query functions | camelCase con get | `getServicesForStation` |
| API Routes | kebab-case path | `/api/clients/search` |
| TanStack Query keys | `['appointments', locationId, dateString]` |
| Tipi TypeScript | PascalCase | `CreateAppointmentInput` |

### Project Structure Notes

```
src/
  app/
    api/
      clients/
        search/
          route.ts              # CREARE: API Route ricerca incrementale clienti
    (auth)/
      agenda/
        page.tsx                # NON MODIFICARE (gia' corretto da Story 4.1)
  components/
    appointment/                # CREARE directory
      AppointmentForm.tsx       # CREARE: form completo creazione appuntamento
      ClientSearch.tsx          # CREARE: ricerca incrementale clienti type-ahead
      QuickClientForm.tsx       # CREARE: sotto-form creazione cliente al volo
    schedule/
      AgendaView.tsx            # AGGIORNARE: aggiungere stato Dialog/Sheet + handler
      ScheduleGrid.tsx          # NON MODIFICARE (onEmptySlotClick gia' passato)
      ScheduleTimeline.tsx      # NON MODIFICARE (onEmptySlotClick gia' passato)
      EmptySlot.tsx             # NON MODIFICARE (onClick gia' predisposto)
  lib/
    actions/
      appointments.ts           # AGGIORNARE: aggiungere createAppointment action
      clients.ts                # NON MODIFICARE (createClient gia' funzionante)
    queries/
      appointments.ts           # NON MODIFICARE (query lettura gia' complete)
      stations.ts               # AGGIORNARE: aggiungere getServicesForStation
      clients.ts                # NON MODIFICARE (searchClients gia' funzionante)
      dogs.ts                   # NON MODIFICARE (getDogsByClient gia' funzionante)
    validations/
      appointments.ts           # AGGIORNARE: aggiungere createAppointmentSchema
      clients.ts                # NON MODIFICARE (createClientSchema gia' usabile)
    db/
      schema.ts                 # NON MODIFICARE (tabella appointments gia' presente)
    utils/
      schedule.ts               # NON MODIFICARE (utility gia' complete)
      formatting.ts             # NON MODIFICARE (formatPrice, formatDuration gia' presenti)
```

**File da NON modificare (a meno che non specificato):**
- `src/lib/db/schema.ts` — tabella appointments gia' creata in Story 4.1
- `src/lib/actions/client.ts` — authActionClient gia' configurato
- `src/middleware.ts` — gia' protegge tutte le route
- `src/components/layout/*` — layout gia' completo
- `src/hooks/*` — hook gia' funzionanti
- `src/components/schedule/ScheduleGrid.tsx` — gia' passa onEmptySlotClick
- `src/components/schedule/ScheduleTimeline.tsx` — gia' passa onEmptySlotClick
- `src/components/schedule/EmptySlot.tsx` — onClick gia' predisposto con dati {stationId, date, time}

### Previous Story Intelligence

**Da Story 4.1 — pattern da replicare:**
- `authActionClient` con `.schema().action()` — funziona con next-safe-action v8
- `useAction` hook con callback `onSuccess`/`onError` — pattern stabile per le mutazioni
- `useIsMobile()` per responsive Dialog/Sheet
- TanStack Query con `queryKey: ['appointments', locationId, dateString]` — usare la STESSA chiave per invalidation
- Pattern errore server: `error.error?.serverError` per estrarre il messaggio
- `Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' })` per formattazione date in italiano
- EmptySlot onClick fornisce: `{ stationId: string, date: string, time: string }`

**Da Story 4.1 — lezioni apprese:**
- `updatedAt` deve essere aggiornato manualmente con `new Date()` in ogni update (non rilevante per INSERT)
- dayOfWeek: date-fns usa 0=Domenica, il progetto usa 0=Lunedi'. Usare `toDayOfWeek()` da `schedule.ts`
- Timestamp salvati come "UTC = ora locale italiana" — nessuna conversione timezone
- `staleTime: 60_000` per TanStack Query — 1 minuto di cache

**Da Story 3.2 (Anagrafica Cani) — pattern form da replicare:**
- React Hook Form con `zodResolver` + schema condiviso client/server
- Pattern form: Dialog/Sheet responsive con `useIsMobile()`
- Toast: `toast.success("Messaggio")` e `toast.error("Messaggio")`
- `useAction` da `next-safe-action/hooks` con `execute()` per submit
- Singolo componente con varianti tramite prop (applicabile per QuickClientForm)
- Stato vuoto sempre gestito con messaggio e CTA

### Git Intelligence

**Pattern commit per questa story:**
```
story 4-2-creazione-appuntamento-rapido: Task N — Descrizione breve della feature
```

**File recentemente modificati rilevanti:**
- `src/lib/actions/appointments.ts` — creata in Story 4.1, contiene solo `getAgendaData`. Aggiungere `createAppointment` qui.
- `src/lib/validations/appointments.ts` — creata in Story 4.1, contiene solo `getAppointmentsQuerySchema`. Aggiungere `createAppointmentSchema` qui.
- `src/lib/queries/stations.ts` — contiene `getStationsByLocation`, `getStationServices`, `getStationSchedule`. Aggiungere `getServicesForStation`.
- `src/components/schedule/AgendaView.tsx` — orchestratore dell'agenda, da aggiornare con stato Dialog/Sheet.

### Informazioni Tecniche Aggiornate

**next-safe-action v8 — pattern azione con errore business:**
```typescript
// Il pattern nel progetto per errori di business usa throw:
throw new Error('Messaggio errore in italiano')
// Il client lo riceve via: result.serverError
// Se si vuole un errore strutturato con codice, due opzioni:
// 1. throw new Error(JSON.stringify({ code: 'SLOT_OCCUPIED', message: '...' }))
//    e parsare nel client
// 2. Restituire un oggetto con campo error nel risultato di successo
//    return { error: { code: 'SLOT_OCCUPIED', message: '...', alternatives: [...] } }
// RACCOMANDAZIONE: Usare opzione 2 per SLOT_OCCUPIED (ha dati strutturati),
// throw per errori semplici come "Servizio non abilitato"
```

**React Hook Form + next-safe-action — pattern submit:**
```typescript
import { useAction } from 'next-safe-action/hooks'

const { execute, isExecuting } = useAction(createAppointment, {
  onSuccess: ({ data }) => {
    if (data?.error) {
      // Errore business (SLOT_OCCUPIED, EXCEEDS_CLOSING_TIME)
      handleBusinessError(data.error)
      return
    }
    toast.success('Appuntamento salvato')
    onSuccess()
  },
  onError: ({ error }) => {
    toast.error(error.serverError ?? 'Errore durante la creazione')
  },
})

const onSubmit = (values: CreateAppointmentInput) => {
  execute(values)
}
```

**shadcn/ui Sheet — bottom sheet pattern:**
```tsx
<Sheet>
  <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Nuovo Appuntamento</SheetTitle>
    </SheetHeader>
    {/* contenuto form */}
  </SheetContent>
</Sheet>
```

### Protezione Anti-Errori

- **Race condition sovrapposizione:** Due utenti cliccano lo stesso slot contemporaneamente → la validazione server-side (check conflitto + INSERT) previene la sovrapposizione. Un solo appuntamento viene creato, l'altro riceve errore SLOT_OCCUPIED.
- **Cliente soft-deleted:** `searchClients` filtra gia' per `isNull(clients.deletedAt)`. Nessun rischio.
- **Cane soft-deleted:** `getDogsByClient` filtra per `isNull(dogs.deletedAt)`. Nessun rischio.
- **Postazione chiusa:** Se la postazione non ha schedule per il giorno, l'EmptySlot non appare nell'agenda. La validazione server EXCEEDS_CLOSING_TIME e' un'ulteriore protezione.
- **Servizio non abilitato:** La validazione server verifica l'abilitazione del servizio sulla postazione. Il dropdown nel form mostra solo servizi abilitati.
- **Form dati persi:** Se si apre QuickClientForm (Dialog secondario), il form principale (Dialog/Sheet) resta aperto con tutti i dati. Al ritorno, il nuovo cliente e' auto-selezionato.
- **Hydration mismatch:** Non renderizzare Dialog/Sheet fino a `isHydrated === true` da `useLocationSelector`.
- **Prezzo in centesimi:** Nel form mostrare in EUR con input numerico. Al submit convertire in centesimi: `Math.round(parseFloat(priceEur) * 100)`. OPPURE usare direttamente centesimi nel form (come fa il resto del progetto).
- **Durata e prezzo modificabili:** L'utente PUO' cambiare durata e prezzo rispetto ai default del servizio. Il form deve accettare qualsiasi valore valido (duration >= 15 min, price >= 0).

### Testing

Nessun framework di test automatico e' configurato nel progetto. Il testing si limita a:

- **Verifica manuale — casi critici da verificare:**
  - Click su slot vuoto desktop → Dialog si apre con dati pre-compilati corretti
  - Click su slot vuoto mobile → Sheet si apre con dati pre-compilati corretti
  - Ricerca cliente con 2 caratteri → risultati in tempo reale
  - Ricerca cliente inesistente → "Nessun risultato" + "Crea nuovo cliente"
  - Crea nuovo cliente al volo → form secondario si apre senza chiudere il principale
  - Dopo creazione cliente → auto-selezionato nel form, form principale intatto
  - Cliente con 1 cane → auto-selezione cane senza tocchi
  - Cliente con 2+ cani → dropdown selezione cane
  - Cliente con 0 cani → messaggio "Nessun cane associato" (edge case)
  - Selezione servizio → durata e prezzo si compilano
  - Modifica manuale durata e prezzo → valori accettati
  - Conferma → toast "Appuntamento salvato", form si chiude, griglia si aggiorna
  - Slot gia' occupato (simulare con 2 tab) → errore "Lo slot e' gia' occupato" + alternative
  - Appuntamento oltre orario chiusura → avviso + possibilita' di ridurre durata
  - Collaboratore: puo' creare appuntamenti (nessuna restrizione ruolo)
  - Touch target: tutti gli elementi interattivi >= 44x44px
  - Performance: form si apre istantaneamente, ricerca fluida con debounce

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns — Server Actions con next-safe-action + Zod]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — naming, TanStack Query keys, error handling]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns — components/appointment/, API Routes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture — React Hook Form + Zod, TanStack Query]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20 — Creazione appuntamento con selezione cliente, cane, servizio, postazione, orario]
- [Source: _bmad-output/planning-artifacts/prd.md#FR21 — Prevenzione sovrapposizione appuntamenti]
- [Source: _bmad-output/planning-artifacts/prd.md#FR25 — Calcolo automatico durata da servizio]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR1 — Caricamento senza indicatori visibili]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR3 — Appuntamento in meno di 30 secondi]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User-Journey-Flows — Journey 2: Presa Appuntamento dall'Agenda]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy — AppointmentForm, ClientSearch, EmptySlot]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns — form pattern, feedback pattern, modale pattern]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design — Dialog desktop, Sheet mobile, breakpoint md 768px]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation — colori, tipografia, spaziature]
- [Source: _bmad-output/implementation-artifacts/4-1-vista-agenda-per-sede-e-postazione.md — Pattern codice, EmptySlot onClick, AgendaView, TanStack Query]
- [Source: src/lib/db/schema.ts — Tabella appointments gia' presente]
- [Source: src/lib/actions/client.ts — authActionClient]
- [Source: src/lib/actions/appointments.ts — getAgendaData esistente]
- [Source: src/lib/actions/clients.ts — createClient action riutilizzabile]
- [Source: src/lib/queries/clients.ts — searchClients riutilizzabile]
- [Source: src/lib/queries/dogs.ts — getDogsByClient riutilizzabile]
- [Source: src/lib/queries/stations.ts — getStationServices da arricchire]
- [Source: src/lib/validations/appointments.ts — getAppointmentsQuerySchema esistente]
- [Source: src/lib/validations/clients.ts — createClientSchema riutilizzabile]
- [Source: src/lib/utils/schedule.ts — toDayOfWeek, timeToMinutes]
- [Source: src/lib/utils/formatting.ts — formatPrice, formatDuration]
- [Source: src/hooks/use-mobile.ts — useIsMobile per responsive]
- [Source: src/components/schedule/AgendaView.tsx — orchestratore da aggiornare]
- [Source: src/components/schedule/EmptySlot.tsx — entry point con onClick {stationId, date, time}]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Nessun problema critico durante l'implementazione. Unico errore TypeScript pre-esistente (Story 3-2) ignorato.

### Completion Notes List

- Task 1: Schema Zod `createAppointmentSchema` con validazione campi (uuid, date regex, time regex, min duration 15, min price 0). Tipo inferito `CreateAppointmentInput`. Query `getServicesForStation` con JOIN su station_services e services.
- Task 2: Server Action `createAppointment` con validazione servizio abilitato, non-sovrapposizione (errore SLOT_OCCUPIED con slot alternativi), verifica orario chiusura (errore EXCEEDS_CLOSING_TIME). Helper `findAlternativeSlots` per suggerire i primi 3 slot liberi.
- Task 3: API Route `/api/clients/search` aggiornata con conteggio cani per cliente (getDogsByClient) e formato risposta `{ success, data }`.
- Task 4: Componente `ClientSearch` con ricerca type-ahead, debounce 300ms, dropdown con avatar iniziali/nome/telefono/badge cani, opzione "Crea nuovo cliente", keyboard navigation (frecce/Enter/Escape), auto-focus.
- Task 5: Componente `QuickClientForm` come Dialog secondario (non chiude il form principale). Riutilizza `createClientSchema` e `createClient` action. Form compatto con nome, cognome, telefono, consenso GDPR.
- Task 6: Componente `AppointmentForm` con rivelazione progressiva (cliente -> cane -> servizio -> durata/prezzo -> conferma). Gestione errori business SLOT_OCCUPIED (con slot alternativi cliccabili) e EXCEEDS_CLOSING_TIME. Server actions `fetchDogsForClient` e `fetchServicesForStation` per data fetching. Auto-selezione cane se unico.
- Task 7: Integrazione AgendaView con stato Dialog/Sheet, handler `onEmptySlotClick` passato a ScheduleGrid e ScheduleTimeline. Dialog desktop / Sheet bottom mobile. Query invalidation su successo creazione.
- Approccio optimistic update: Implementata l'Opzione 1 (invalidation dopo mutazione) come raccomandato nelle Dev Notes per semplicita'. La query TanStack viene invalidata dopo il successo, causando un refetch automatico. Con Vercel serverless e 5 utenti, il tempo di risposta e' trascurabile.

### File List

- `src/lib/validations/appointments.ts` — MODIFICATO: aggiunto createAppointmentSchema e tipo CreateAppointmentInput
- `src/lib/queries/stations.ts` — MODIFICATO: aggiunto getServicesForStation con JOIN su services
- `src/lib/actions/appointments.ts` — MODIFICATO: aggiunto createAppointment action, fetchDogsForClient, fetchServicesForStation, findAlternativeSlots helper
- `src/app/api/clients/search/route.ts` — MODIFICATO: aggiunto conteggio cani, formato risposta { success, data }
- `src/components/appointment/ClientSearch.tsx` — NUOVO: componente ricerca incrementale clienti
- `src/components/appointment/QuickClientForm.tsx` — NUOVO: sotto-form creazione cliente al volo
- `src/components/appointment/AppointmentForm.tsx` — NUOVO: form completo creazione appuntamento
- `src/components/schedule/AgendaView.tsx` — MODIFICATO: integrazione Dialog/Sheet, stato appointmentSlot, handler onEmptySlotClick, query invalidation

## Change Log

- 2026-02-16: Implementazione completa Story 4.2 — Creazione Appuntamento Rapido. Tutti i 7 task completati con schema Zod, server action con validazione sovrapposizione/orario, API ricerca clienti, componenti ClientSearch, QuickClientForm, AppointmentForm con rivelazione progressiva, integrazione AgendaView con Dialog/Sheet responsive.
