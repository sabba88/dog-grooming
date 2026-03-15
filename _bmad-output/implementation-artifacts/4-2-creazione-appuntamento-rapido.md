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
   **Then** persona, data e ora sono gia' pre-compilati dallo slot selezionato
   **And** la postazione e' un campo opzionale (non pre-compilato)

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
   **When** nessuna postazione e' selezionata
   **Then** la lista servizi mostra tutti i servizi del salone
   **When** l'utente seleziona opzionalmente una postazione
   **Then** la lista servizi si filtra per i servizi abilitati sulla postazione selezionata
   **And** al cambio servizio, la durata e il prezzo si pre-compilano automaticamente dal listino
   **And** l'utente puo' modificare durata e prezzo manualmente se necessario

5. **Given** l'utente ha compilato tutti i campi obbligatori (persona, cliente, cane, servizio, durata, prezzo)
   **When** tocca "Conferma" (senza richiesta "sei sicuro?")
   **Then** l'appuntamento viene creato e la query agenda viene invalidata per aggiornare la griglia
   **And** mostra un toast "Appuntamento salvato"
   **And** il form si chiude e l'utente torna all'agenda

6. **Given** l'utente tenta di creare un appuntamento
   **When** lo slot e' gia' occupato da un altro appuntamento della stessa persona (sovrapposizione per userId)
   **Then** il sistema impedisce la creazione e mostra un messaggio "Lo slot e' gia' occupato"
   **And** suggerisce gli slot alternativi piu' vicini disponibili

7. **Given** l'utente tenta di creare un appuntamento
   **When** la fine dell'appuntamento (ora + durata) eccede la fine del turno della persona per quel giorno
   **Then** il sistema avvisa "L'appuntamento supera la fine del turno" e permette di modificare la durata
   **And** se la persona non ha un turno assegnato per quel giorno, non viene applicata alcuna validazione sul turno

## Tasks / Subtasks

- [x] Task 1: Aggiungere selettore postazione opzionale e filtro servizi nel form (AC: #1, #4)
  - [x] 1.1 Aggiornare `PrefilledSlot` interface e `AgendaView` per passare anche `locationId` al form (ricavabile da `selectedLocationId` gia' disponibile in AgendaView). In `AppointmentForm.tsx`, aggiungere stato `selectedStationId: string | null` (default null) e creare una server action `fetchStationsForLocation(locationId)` (wrapper di `getStationsByLocation`) per caricare le postazioni della sede nel form
  - [x] 1.2 Quando `selectedStationId` e' valorizzato, caricare i servizi con `fetchServicesForStation(stationId)` (gia' esistente in actions); quando e' null, caricare tutti i servizi con `fetchAllServices()` (gia' esistente). Al cambio postazione, resettare il servizio selezionato
  - [x] 1.3 Passare `stationId` nel payload di `createAppointment` se selezionato (attualmente il form non lo invia mai)
  - [x] 1.4 Posizionare il selettore postazione DOPO la selezione cane e PRIMA della selezione servizio, con label "Postazione (opzionale)" e placeholder "Tutte le postazioni"

- [x] Task 2: Aggiungere validazione turno persona nel server action (AC: #7)
  - [x] 2.1 In `createAppointment` (src/lib/actions/appointments.ts), dopo la validazione sovrapposizione, caricare l'assegnazione della persona per il giorno selezionato: query `userLocationAssignments` dove `userId`, `dayOfWeek` corrispondono (usare `getIsoDayOfWeek` da `src/lib/queries/staff.ts` per il calcolo del giorno)
  - [x] 2.2 Se l'assegnazione esiste E `endTime` dell'appuntamento (in minuti UTC) > `endTime` del turno (in minuti via `timeToMinutes`), restituire errore `{ code: 'EXCEEDS_SHIFT_TIME', message: "L'appuntamento supera la fine del turno", shiftEndTime: assignment.endTime }`
  - [x] 2.3 Se la persona NON ha assegnazione per quel giorno, NON applicare la validazione turno (l'appuntamento viene creato comunque)
  - [x] 2.4 Aggiornare la gestione errore in `AppointmentForm.tsx`: rinominare il check da `EXCEEDS_CLOSING_TIME` a `EXCEEDS_SHIFT_TIME`, mostrare il messaggio con la fine del turno

- [x] Task 3: Correggere bug e problemi minori nel flusso creazione (AC: #3, #5)
  - [x] 3.1 In `QuickClientForm.tsx`, sostituire il Dialog annidato con un approccio che eviti problemi di z-index/stacking: usare lo stesso pattern Dialog/Sheet ma con `modal={false}` oppure usare un approccio a step nel form principale (mostrare il form creazione cliente AL POSTO della ricerca cliente, non come Dialog sopra Dialog)
  - [x] 3.2 In `AppointmentForm.tsx`, rimuovere la gestione dell'errore `EXCEEDS_CLOSING_TIME` (sostituito da `EXCEEDS_SHIFT_TIME` nel Task 2.4) e verificare che `onCancel` venga invocato correttamente quando l'utente chiude il form
  - [x] 3.3 Verificare che il flusso completo funzioni end-to-end: slot click → form → ricerca cliente → selezione cane → (opzionale) selezione postazione → selezione servizio → conferma → toast → chiusura → griglia aggiornata

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

### Contesto Cambio Modello: Postazione → Persona (CC-2026-03-14)

Il modello organizzativo del salone e' basato sulle **persone** (chi lavora), non sulle **postazioni** (dove si lavora). Questo impatta direttamente la Story 4.2:

- **`appointments.userId`** (NOT NULL) — persona che esegue l'appuntamento. Pre-compilato dallo slot cliccato nell'agenda
- **`appointments.stationId`** (NULLABLE) — postazione opzionale. L'utente puo' selezionarla nel form, ma non e' obbligatoria
- **Sovrapposizione** validata per `userId + timeRange` (NON piu' per stationId)
- **Turno persona** da `userLocationAssignments` — validare che l'appuntamento non ecceda la fine del turno
- **Servizi:** Se postazione selezionata → filtrati per postazione. Se nessuna postazione → tutti i servizi del salone

### Stato Attuale del Codice (Post Story 4-1)

Gran parte del flusso di creazione appuntamento e' **gia' implementato** dalla vecchia Story 4-2 e aggiornato durante la riscrittura di Story 4-1. I task di questa story coprono SOLO il delta rimanente.

**Componenti GIA' funzionanti — NON riscrivere, solo modificare dove indicato nei task:**

| Componente | Stato | File |
|-----------|-------|------|
| `createAppointmentSchema` | Gia' aggiornato (userId, stationId opzionale) | `src/lib/validations/appointments.ts` |
| `createAppointment` action | Gia' aggiornato (overlap su userId) | `src/lib/actions/appointments.ts` |
| `findAlternativeSlots` | Gia' implementato | `src/lib/actions/appointments.ts` (helper interno) |
| `fetchDogsForClient` | Funzionante | `src/lib/actions/appointments.ts` |
| `fetchAllServices` | Funzionante | `src/lib/actions/appointments.ts` |
| `fetchServicesForStation` | Funzionante | `src/lib/actions/appointments.ts` |
| `ClientSearch` | Completo | `src/components/appointment/ClientSearch.tsx` |
| `QuickClientForm` | Funzionante (bug Dialog stacking) | `src/components/appointment/QuickClientForm.tsx` |
| `AppointmentForm` | Funzionante (manca postazione opzionale) | `src/components/appointment/AppointmentForm.tsx` |
| `AgendaView` | Dialog/Sheet integrato | `src/components/schedule/AgendaView.tsx` |
| `EmptySlot` | Passa userId/userName | `src/components/schedule/EmptySlot.tsx` |
| `AgendaView` | Ha `selectedLocationId` disponibile | `src/components/schedule/AgendaView.tsx` |
| `/api/clients/search` | Funzionante con dogsCount | `src/app/api/clients/search/route.ts` |

### Tabella `appointments` — Schema Attuale

```typescript
// src/lib/db/schema.ts — GIA' AGGIORNATO in Story 4-1
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),
  dogId: uuid('dog_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  userId: uuid('user_id').notNull(),       // persona che esegue (NEW in 4-1)
  stationId: uuid('station_id'),           // postazione opzionale (NULLABLE in 4-1)
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  price: integer('price').notNull(),       // centesimi
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Tabella `user_location_assignments` — Per Validazione Turno

```typescript
// src/lib/db/schema.ts — GIA' ESISTENTE da Story 2-4
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi (ISO 8601), 6=Domenica
  startTime: text('start_time').notNull(),     // "HH:mm"
  endTime: text('end_time').notNull(),         // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Funzioni e Hook Riutilizzabili (GIA' ESISTENTI)

**authActionClient (`src/lib/actions/client.ts`):**
```typescript
// Gia' verifica autenticazione e fornisce ctx.userId, ctx.role, ctx.tenantId
```

**getStationsByLocation (`src/lib/queries/stations.ts`):**
```typescript
export async function getStationsByLocation(locationId: string, tenantId: string)
// Ritorna array di stazioni con servicesCount per la sede
```

**getServicesForStation (`src/lib/queries/stations.ts`):**
```typescript
export async function getServicesForStation(stationId: string, tenantId: string)
// Ritorna { id, name, price, duration } dei servizi abilitati sulla postazione
```

**getIsoDayOfWeek (`src/lib/queries/staff.ts`):**
```typescript
export function getIsoDayOfWeek(date: Date): number
// Converte JS getDay() (0=Dom) a ISO 8601 (0=Lun, 6=Dom)
```

**timeToMinutes (`src/lib/utils/schedule.ts`):**
```typescript
export function timeToMinutes(time: string): number
// "09:30" → 570
```

**formatPrice / formatDuration (`src/lib/utils/formatting.ts`):**
```typescript
formatPrice(cents: number)      // "€ 15,00"
formatDuration(minutes: number) // "1h 30min" o "30min"
```

**useIsMobile (`src/hooks/use-mobile.ts`):**
```typescript
const isMobile = useIsMobile() // true se viewport < 768px
```

### AppointmentForm — Flusso Interattivo Aggiornato

```
┌─────────────────────────────────────────┐
│  Nuovo Appuntamento                   X │
├─────────────────────────────────────────┤
│  👤 Giulia R.  •  Lun 17 Feb  •  09:00 │  ← persona + data + ora (read-only)
├─────────────────────────────────────────┤
│                                         │
│  🔍 Cerca cliente...            [input] │  ← ClientSearch
│                                         │
│  🐕 Cane:  [Teddy ▼]                   │  ← auto se 1, select se >1
│                                         │
│  📍 Postazione: [Tutte le postaz. ▼]   │  ← OPZIONALE (nuovo)
│                                         │
│  ✂️  Servizio: [Bagno e taglio ▼]       │  ← filtrato per postazione se selezionata
│                                         │
│  ⏱️ Durata: [60] min    💰 €[25,00]    │  ← pre-compilati, editabili
│                                         │
│          [ Conferma ]                   │  ← bottone primary
└─────────────────────────────────────────┘
```

**Flusso stati del form (rivelazione progressiva):**
1. **Iniziale:** ClientSearch visibile + header persona/data/ora pre-compilato
2. **Cliente selezionato:** Appare sezione cane. Se 1 cane → auto-select
3. **Cane selezionato:** Appare selettore postazione (opzionale) + servizio
4. **Servizio selezionato:** Durata e prezzo si compilano. Bottone "Conferma" attivo
5. **Invio:** Loading → toast → chiusura

### Pattern Errore Business — next-safe-action v8

```typescript
// Il pattern nel progetto per errori di business usa return (non throw):
// Errori strutturati con codice e dati aggiuntivi:
return { error: { code: 'SLOT_OCCUPIED', message: '...', alternatives: [...] } }
return { error: { code: 'EXCEEDS_SHIFT_TIME', message: '...', shiftEndTime: '...' } }

// Il client gestisce via result.data?.error:
onSuccess: ({ data }) => {
  if (data?.error) {
    handleBusinessError(data.error)
    return
  }
  toast.success('Appuntamento salvato')
}
```

### Previous Story Intelligence

**Da Story 4.1 (riscritta) — lezioni apprese:**
- `getIsoDayOfWeek()` per conversione giorno (NON `getDay()` direttamente)
- Timestamp salvati come "UTC = ora locale italiana" — nessuna conversione timezone
- TanStack Query key: `['appointments', locationId, dateString]` — usare la STESSA chiave per invalidation
- `staleTime: 60_000` per TanStack Query
- EmptySlot onClick fornisce: `{ userId: string, userName: string, date: string, time: string }`
- Pattern errore server: `result.data?.error` per errori business

**Da Story 4.1 Task 8 — gia' fatto su AppointmentForm:**
- Prefill con userId/userName (icona User invece di MapPin)
- Caricamento tutti servizi tenant via `fetchAllServices` (senza filtro postazione)
- stationId rimosso dal payload submit (da ripristinare come opzionale)

**Da Story 4.2 originale — codice gia' funzionante:**
- ClientSearch con debounce 300ms, keyboard navigation, avatar iniziali
- QuickClientForm con Dialog secondario (ha bug stacking)
- Rivelazione progressiva dei campi nel form
- Gestione errore SLOT_OCCUPIED con slot alternativi cliccabili

### Naming Conventions

| Elemento | Convenzione | Esempio |
|----------|------------|---------|
| Server Actions | camelCase con verbo | `createAppointment` |
| Schema Zod | camelCase + Schema | `createAppointmentSchema` |
| Componenti React | PascalCase | `AppointmentForm.tsx` |
| File directory | kebab-case | `components/appointment/` |
| Query functions | camelCase con get | `getServicesForStation` |
| TanStack Query keys | `['appointments', locationId, dateString]` |

### Project Structure Notes

```
src/
  components/
    appointment/
      AppointmentForm.tsx       # AGGIORNARE: aggiungere postazione opzionale, fix errori
      ClientSearch.tsx          # NON MODIFICARE
      QuickClientForm.tsx       # AGGIORNARE: fix Dialog stacking
    schedule/
      AgendaView.tsx            # NON MODIFICARE (integrazione gia' completa)
      ScheduleGrid.tsx          # NON MODIFICARE
      ScheduleTimeline.tsx      # NON MODIFICARE
      EmptySlot.tsx             # NON MODIFICARE
  lib/
    actions/
      appointments.ts           # AGGIORNARE: aggiungere validazione turno persona
    validations/
      appointments.ts           # NON MODIFICARE (schema gia' aggiornato)
    queries/
      stations.ts               # NON MODIFICARE (getStationsByLocation, getServicesForStation gia' esistenti)
      staff.ts                  # NON MODIFICARE (getIsoDayOfWeek gia' esistente)
    db/
      schema.ts                 # NON MODIFICARE (appointments.userId, stationId nullable gia' presenti)
    utils/
      schedule.ts               # NON MODIFICARE
      formatting.ts             # NON MODIFICARE
```

### Testing

Nessun framework di test automatico configurato. Verifica manuale — casi critici:

- Click su slot vuoto → form si apre con persona/data/ora pre-compilati
- Ricerca cliente con 2 caratteri → risultati in tempo reale
- Crea nuovo cliente al volo → form secondario senza problemi stacking
- Cliente con 1 cane → auto-selezione
- Selettore postazione opzionale: "Tutte le postazioni" come default
- Selezione postazione → servizi filtrati per quella postazione
- Nessuna postazione → tutti i servizi del salone
- Cambio postazione → reset servizio selezionato
- Selezione servizio → durata e prezzo si compilano
- Conferma → toast, form chiude, griglia si aggiorna
- Sovrapposizione persona → errore "slot occupato" + alternative
- Appuntamento oltre fine turno persona → avviso "supera fine turno"
- Persona senza turno assegnato → nessun avviso turno (appuntamento creato)
- Touch target >= 44x44px su tutti gli elementi interattivi

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-14.md — Cambio modello postazione → persona]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2 — Acceptance Criteria originali]
- [Source: _bmad-output/planning-artifacts/architecture.md — Server Actions, TanStack Query, Zod patterns]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20 — Creazione appuntamento con persona e postazione opzionale]
- [Source: _bmad-output/planning-artifacts/prd.md#FR21 — Prevenzione sovrapposizione per persona]
- [Source: _bmad-output/planning-artifacts/prd.md#FR34 — Assegnazione utenti a sedi]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AppointmentForm — Componente form prenotazione]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ClientSearch — Ricerca incrementale clienti]
- [Source: _bmad-output/implementation-artifacts/4-1-vista-agenda-per-sede-e-persona.md — Story precedente, pattern e lezioni]
- [Source: src/lib/db/schema.ts — Tabella appointments con userId e stationId nullable]
- [Source: src/lib/actions/appointments.ts — createAppointment con overlap userId]
- [Source: src/components/appointment/AppointmentForm.tsx — Form attuale da aggiornare]
- [Source: src/components/appointment/QuickClientForm.tsx — Dialog stacking da fixare]
- [Source: src/lib/queries/stations.ts — getStationsByLocation, getServicesForStation]
- [Source: src/lib/queries/staff.ts — getIsoDayOfWeek]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nessun problema di debug significativo riscontrato.

### Completion Notes List

- **Task 1:** Aggiunto selettore postazione opzionale nel form AppointmentForm. Aggiornata interfaccia PrefilledSlot con locationId, passato da AgendaView. Creata server action fetchStationsForLocation. Implementato filtro servizi dinamico (per postazione o tutti). stationId ora viene inviato nel payload createAppointment quando selezionato.
- **Task 2:** Aggiunta validazione turno persona in createAppointment. Dopo il check sovrapposizione, viene caricata l'assegnazione della persona per il giorno (userLocationAssignments) e verificato che l'appuntamento non ecceda la fine del turno. Se la persona non ha assegnazione, nessuna validazione turno. Errore EXCEEDS_SHIFT_TIME gestito nel form con messaggio e fine turno.
- **Task 3:** Risolto bug Dialog stacking in QuickClientForm: sostituito Dialog annidato con rendering inline (approccio a step). Il form creazione cliente appare AL POSTO della ricerca cliente, evitando problemi z-index. Rimossa gestione errore EXCEEDS_CLOSING_TIME (sostituita da EXCEEDS_SHIFT_TIME). Build e lint verificati con successo.

### File List

- `src/components/appointment/AppointmentForm.tsx` (modificato)
- `src/components/appointment/QuickClientForm.tsx` (modificato)
- `src/components/schedule/AgendaView.tsx` (modificato)
- `src/lib/actions/appointments.ts` (modificato)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modificato)

## Change Log

- 2026-03-15: Implementazione completa Story 4-2 — selettore postazione opzionale, filtro servizi, validazione turno persona, fix Dialog stacking QuickClientForm
