# Story 2.5: Orari di Apertura Sede

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **configurare gli orari di apertura settimanali della sede con fino a 2 fasce orarie per giorno**,
so that **l'agenda mostri solo le ore lavorative e non l'intera giornata**.

## Acceptance Criteria

1. **Given** un Amministratore e' nella pagina dettaglio di una sede (`/settings/locations/[id]`)
   **When** accede alla sezione Orari di Apertura
   **Then** vede una riga per ogni giorno della settimana (Lunedi'–Domenica, ordine ISO 8601)
   **And** ogni riga mostra le fasce orarie configurate (input `HH:mm` apertura–chiusura) o "Chiuso" se nessuna fascia

2. **Given** un Amministratore vuole configurare un giorno
   **When** imposta gli input apertura e chiusura e salva
   **Then** la fascia viene salvata per quel giorno della settimana
   **And** mostra un toast "Orari aggiornati"

3. **Given** un Amministratore vuole aggiungere una pausa
   **When** clicca "+" per aggiungere una seconda fascia allo stesso giorno (es. 09:00-13:00 e 15:00-19:00)
   **Then** entrambe le fasce vengono salvate
   **And** il sistema valida che le fasce non si sovrappongano (closeTime fascia 1 < openTime fascia 2)

4. **Given** un Amministratore rimuove tutte le fasce di un giorno
   **When** salva con array vuoto
   **Then** il giorno e' mostrato come "Chiuso" (nessuna riga DB per quel dayOfWeek)

5. **Given** una sede ha orari configurati (es. 09:00-13:00 e 15:00-19:00 per il lunedi')
   **When** l'agenda carica per quella sede in un lunedi'
   **Then** il range orario dell'agenda e' ristretto a [08:00, 20:00] (prima apertura 09:00 - 1h, ultima chiusura 19:00 + 1h)
   **And** gli slot visualizzati sono da 15 minuti

6. **Given** una sede non ha orari configurati
   **When** l'agenda carica per quella sede
   **Then** viene usato il range di fallback 08:00–20:00

## Tasks / Subtasks

- [x] Task 1: Schema DB e migrazione (AC: #1-6)
  - [x] 1.1 Aggiungere tabella `locationBusinessHours` in `src/lib/db/schema.ts` dopo la tabella `appointments`
  - [x] 1.2 Eseguire `npx drizzle-kit push` per creare la tabella nel DB (operazione non distruttiva)

- [x] Task 2: Validazioni Zod, query e server action (AC: #1-4)
  - [x] 2.1 Aggiungere `locationBusinessHoursSlotSchema` e `upsertLocationBusinessHoursSchema` in `src/lib/validations/locations.ts`
  - [x] 2.2 Aggiungere `getLocationBusinessHours(locationId: string, tenantId: string)` in `src/lib/queries/locations.ts`
  - [x] 2.3 Aggiungere `upsertLocationBusinessHours` server action in `src/lib/actions/locations.ts` — replace strategy: delete tutte le righe per `(locationId, dayOfWeek, tenantId)` poi insert nuove `slots` in unica transaction

- [x] Task 3: Componente BusinessHoursEditor e integrazione pagina Sedi (AC: #1-4)
  - [x] 3.1 Creare `src/components/location/BusinessHoursEditor.tsx` — Client Component
  - [x] 3.2 Props: `locationId: string`, `initialHours: { dayOfWeek: number; openTime: string; closeTime: string }[]`
  - [x] 3.3 State locale: `weekHours: Map<number, { openTime: string; closeTime: string }[]>` (dayOfWeek → fasce), inizializzato da `initialHours`
  - [x] 3.4 Rendering: 7 righe (0=Lun, 1=Mar, ..., 6=Dom), ogni riga mostra:
    - Se 0 fasce: label "Chiuso" + pulsante "Apri giorno" (aggiunge slot vuoto)
    - Se 1+ fasce: time inputs `openTime`/`closeTime` per ogni fascia + pulsante "Salva" per riga + "×" per rimuovere fascia
    - Se < 2 fasce: pulsante "+" per aggiungere seconda fascia
  - [x] 3.5 Click "Salva" (per giorno): chiamare `upsertLocationBusinessHours({ locationId, dayOfWeek, slots })`, toast "Orari aggiornati" / errore inline
  - [x] 3.6 Validazione client: per ogni fascia `closeTime > openTime`; se 2 fasce, `closeTime_1 <= openTime_2`
  - [x] 3.7 Aggiornare `src/app/(auth)/settings/locations/[id]/page.tsx`:
    - Aggiungere `getLocationBusinessHours(locationId, tenantId)` al fetch iniziale
    - Inserire `<BusinessHoursEditor>` sotto `<StationList>` nella pagina (stessa pagina, nuova sezione)
    - Wrappare in `<section>` con heading "Orari di Apertura"

- [x] Task 4: Utils schedule — slot 15 minuti (AC: #5-6)
  - [x] 4.1 In `src/lib/utils/schedule.ts`: `SLOT_HEIGHT_PX = 30` (da 60), `MINUTES_PER_SLOT = 15` (da 30)
  - [x] 4.2 Aggiungere `computeAgendaRange(businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[], dayOfWeek: number): { globalOpen: string; globalClose: string }` in `src/lib/utils/schedule.ts`
  - [x] 4.3 Aggiungere helper privati `addOneHour(time: string): string` e `subtractOneHour(time: string): string` per stringhe `"HH:mm"` (gestire overflow: min 00:00, max 23:45)
  - [x] 4.4 Verificare manualmente che `getAppointmentPosition` produca altezze corrette: un appuntamento da 30 min = 2 slot × 30px = 60px (invariato visivamente)

- [x] Task 5: AgendaView — range dinamico (AC: #5-6)
  - [x] 5.1 Aggiornare `getAgendaData` in `src/lib/actions/appointments.ts`:
    - Importare `getLocationBusinessHours` da `@/lib/queries/locations`
    - Aggiungere al `Promise.all`: `getLocationBusinessHours(locationId, ctx.tenantId)`
    - Restituire `{ appointments: appts, staff, businessHours }`
  - [x] 5.2 Aggiornare il tipo di risposta in `AgendaView.tsx`: aggiungere `businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[]` al tipo del query result
  - [x] 5.3 In `AgendaView.tsx`: calcolare `dayOfWeek` dalla `selectedDate` con `(getDay(selectedDate) + 6) % 7` (conversione da JS 0=Dom a ISO 0=Lun)
  - [x] 5.4 In `AgendaView.tsx`: chiamare `computeAgendaRange(data.businessHours, dayOfWeek)` per ottenere `{ globalOpen, globalClose }`, passarli come props a `ScheduleGrid` e `ScheduleTimeline`
  - [x] 5.5 Aggiornare `ScheduleGrid.tsx`: rimuovere costanti hardcoded `GLOBAL_OPEN = '00:00'` / `GLOBAL_CLOSE = '23:30'`; aggiungere props `globalOpen: string` e `globalClose: string` all'interfaccia `ScheduleGridProps`; usare queste props al posto delle costanti
  - [x] 5.6 Aggiornare `ScheduleTimeline.tsx` in modo analogo (stesso pattern di props)

## Dev Notes

### Schema DB

```typescript
// src/lib/db/schema.ts — AGGIUNGERE dopo la tabella `appointments`:

// Una riga = una fascia oraria. Max 2 righe per (locationId, dayOfWeek).
// Giorno chiuso = nessuna riga per quel dayOfWeek.
export const locationBusinessHours = pgTable('location_business_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi' (ISO 8601), 6=Domenica
  openTime: text('open_time').notNull(),   // "HH:mm"
  closeTime: text('close_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Drizzle push:** `npx drizzle-kit push` — nuova tabella, operazione non distruttiva, nessun dato da migrare.

### Validazioni Zod

```typescript
// src/lib/validations/locations.ts — AGGIUNGERE:

export const locationBusinessHoursSlotSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm richiesto"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm richiesto"),
}).refine(d => d.closeTime > d.openTime, { message: "L'ora di chiusura deve essere dopo l'apertura" })

export const upsertLocationBusinessHoursSchema = z.object({
  locationId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  slots: z.array(locationBusinessHoursSlotSchema).max(2, "Massimo 2 fasce per giorno"),
})
```

### Query

```typescript
// src/lib/queries/locations.ts — AGGIUNGERE:
import { locationBusinessHours } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function getLocationBusinessHours(locationId: string, tenantId: string) {
  return db.select({
    dayOfWeek: locationBusinessHours.dayOfWeek,
    openTime: locationBusinessHours.openTime,
    closeTime: locationBusinessHours.closeTime,
  })
  .from(locationBusinessHours)
  .where(and(
    eq(locationBusinessHours.locationId, locationId),
    eq(locationBusinessHours.tenantId, tenantId),
  ))
  .orderBy(asc(locationBusinessHours.dayOfWeek), asc(locationBusinessHours.openTime))
}
```

### Server Action

```typescript
// src/lib/actions/locations.ts — AGGIUNGERE:
import { locationBusinessHours } from '@/lib/db/schema'
import { upsertLocationBusinessHoursSchema } from '@/lib/validations/locations'

export const upsertLocationBusinessHours = authActionClient
  .schema(upsertLocationBusinessHoursSchema)
  .action(async ({ parsedInput: { locationId, dayOfWeek, slots }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    await db.transaction(async (tx) => {
      await tx.delete(locationBusinessHours).where(
        and(
          eq(locationBusinessHours.locationId, locationId),
          eq(locationBusinessHours.dayOfWeek, dayOfWeek),
          eq(locationBusinessHours.tenantId, ctx.tenantId)
        )
      )
      if (slots.length > 0) {
        await tx.insert(locationBusinessHours).values(
          slots.map(s => ({ ...s, locationId, dayOfWeek, tenantId: ctx.tenantId }))
        )
      }
    })
  })
```

### Utils Schedule — computeAgendaRange

```typescript
// src/lib/utils/schedule.ts — MODIFICARE:
export const SLOT_HEIGHT_PX = 30   // era 60 — invariato visivamente: 30min = 2slot × 30px = 60px
export const MINUTES_PER_SLOT = 15 // era 30

// AGGIUNGERE:
function subtractOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.max(0, h * 60 + m - 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(23 * 60 + 45, h * 60 + m + 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function computeAgendaRange(
  businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  dayOfWeek: number,
): { globalOpen: string; globalClose: string } {
  const todaySlots = businessHours.filter(h => h.dayOfWeek === dayOfWeek)
  if (todaySlots.length === 0) return { globalOpen: '08:00', globalClose: '20:00' }
  const minOpen = todaySlots.reduce((min, s) => s.openTime < min ? s.openTime : min, '23:59')
  const maxClose = todaySlots.reduce((max, s) => s.closeTime > max ? s.closeTime : max, '00:00')
  return { globalOpen: subtractOneHour(minOpen), globalClose: addOneHour(maxClose) }
}
```

### AgendaView — integrazione businessHours

```typescript
// src/components/schedule/AgendaView.tsx

// Aggiungere import:
import { getDay } from 'date-fns'
import { computeAgendaRange } from '@/lib/utils/schedule'

// Nel render, dopo che data?.businessHours e' disponibile:
// Conversione JS dayOfWeek (0=Dom) → ISO (0=Lun):
const dayOfWeek = (getDay(selectedDate) + 6) % 7
const { globalOpen, globalClose } = data?.businessHours
  ? computeAgendaRange(data.businessHours, dayOfWeek)
  : { globalOpen: '08:00', globalClose: '20:00' }

// Passare come props a ScheduleGrid e ScheduleTimeline:
<ScheduleGrid globalOpen={globalOpen} globalClose={globalClose} ... />
<ScheduleTimeline globalOpen={globalOpen} globalClose={globalClose} ... />
```

### ScheduleGrid — rimozione costanti hardcoded

```typescript
// src/components/schedule/ScheduleGrid.tsx

// RIMUOVERE:
const GLOBAL_OPEN = '00:00'
const GLOBAL_CLOSE = '23:30'

// AGGIUNGERE a ScheduleGridProps:
globalOpen: string
globalClose: string

// USARE le props al posto delle costanti in tutta la funzione
```

### Project Structure Notes

- File nuovi: `src/components/location/BusinessHoursEditor.tsx`
- File modificati: `src/lib/db/schema.ts`, `src/lib/validations/locations.ts`, `src/lib/queries/locations.ts`, `src/lib/actions/locations.ts`, `src/lib/actions/appointments.ts`, `src/lib/utils/schedule.ts`, `src/components/location/BusinessHoursEditor.tsx`, `src/components/schedule/ScheduleGrid.tsx`, `src/components/schedule/AgendaView.tsx`, `src/app/(auth)/settings/locations/[id]/page.tsx`
- **Non toccare** `src/components/schedule/ScheduleTimeline.tsx` a meno che non abbia le stesse costanti hardcoded (verificare)
- La tabella `locationBusinessHours` segue lo stesso pattern di `userLocationAssignments` (stessa struttura: righe per fascia, tenant isolation)

### Riferimento pattern esistenti

- Server action con `authActionClient`: vedere `src/lib/actions/staff.ts` `saveDayShifts` — stessa pattern replace-per-giorno (delete + insert in transaction)
- Client component con `useAction`: vedere `src/components/staff/StaffCalendarEditor.tsx` — UI a fasce orarie con stato locale, salvataggio per riga
- Stile time inputs: usare `<Input type="time" value={...} onChange={...} className="w-28" />` (shadcn Input)
- Toast: `import { toast } from 'sonner'` — `toast.success("Orari aggiornati")`
- Responsive: `useIsMobile()` da `@/hooks/use-mobile` (ma per questa pagina solo desktop è rilevante)

### Attenzione: dayOfWeek JS vs ISO

- `date-fns` `getDay()` restituisce `0=Domenica, 1=Lunedi', ..., 6=Sabato`
- Il DB usa ISO: `0=Lunedi', ..., 6=Domenica`
- **Conversione obbligatoria**: `const isoDay = (getDay(date) + 6) % 7`
- Questa conversione va applicata in `AgendaView.tsx` prima di passare a `computeAgendaRange`
- I labels UI dei giorni devono essere in ordine Lun-Dom: `['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica']` (indice = dayOfWeek ISO)

### Proporzionalita' visiva slot

Con `SLOT_HEIGHT_PX=30` e `MINUTES_PER_SLOT=15`:
- 1 slot = 15 min = 30px
- Appuntamento 30 min = 2 slot = 60px (identico a prima: era 1 slot × 60px)
- Appuntamento 60 min = 4 slot = 120px (era 2 slot × 60px = 120px — invariato)
- La funzione `getAppointmentPosition` usa `(durationMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX` — si aggiorna automaticamente

### References

- Sprint Change Proposal con design dettagliato: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-26-orari-apertura-sede.md`
- Schema DB in architettura: `_bmad-output/planning-artifacts/architecture.md#CC-2026-04-26b`
- Pattern server action replace-per-giorno: `src/lib/actions/staff.ts` (saveDayShifts)
- Pattern UI editor fasce: `src/components/staff/StaffCalendarEditor.tsx`
- Costanti schedule attuali: `src/lib/utils/schedule.ts:1-2` (SLOT_HEIGHT_PX=60, MINUTES_PER_SLOT=30)
- Costanti hardcoded da rimuovere: `src/components/schedule/ScheduleGrid.tsx:50-51` (GLOBAL_OPEN, GLOBAL_CLOSE)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Nessun blocco critico — TypeScript zero errori, lint ok su tutti i file modificati.

### Completion Notes List

- Task 1: Tabella `location_business_hours` aggiunta allo schema e creata nel DB con `drizzle-kit push` (operazione non distruttiva).
- Task 2: Schema Zod con validazione refine (closeTime > openTime, max 2 fasce), query con `orderBy(dayOfWeek, openTime)`, server action con delete+insert in transaction per pattern replace-per-giorno.
- Task 3: `BusinessHoursEditor` client component con stato locale Map, rendering 7 giorni ISO, validazione client per sovrapposizioni, salvataggio per singolo giorno con `useAction`. Pagina sede aggiornata con sezione "Orari di Apertura".
- Task 4: `SLOT_HEIGHT_PX` → 30, `MINUTES_PER_SLOT` → 15. `getAppointmentPosition` invariato — usa le costanti dinamicamente, quindi 30min = 2slot × 30px = 60px come prima. Aggiunta `computeAgendaRange` con helper `addOneHour`/`subtractOneHour`.
- Task 5: `getAgendaData` ora include `businessHours` nel Promise.all. `AgendaView` calcola dayOfWeek ISO con `(getDay(date) + 6) % 7`, chiama `computeAgendaRange`, passa `globalOpen`/`globalClose` come props a `ScheduleGrid` e `ScheduleTimeline`. Costanti hardcoded `GLOBAL_OPEN`/`GLOBAL_CLOSE` rimosse da entrambi i componenti.

### File List

- src/lib/db/schema.ts (modified — aggiunta tabella locationBusinessHours)
- src/lib/validations/locations.ts (modified — aggiunti locationBusinessHoursSlotSchema, upsertLocationBusinessHoursSchema)
- src/lib/queries/locations.ts (modified — aggiunta getLocationBusinessHours)
- src/lib/actions/locations.ts (modified — aggiunta upsertLocationBusinessHours)
- src/lib/actions/appointments.ts (modified — getAgendaData include businessHours)
- src/lib/utils/schedule.ts (modified — SLOT_HEIGHT_PX=30, MINUTES_PER_SLOT=15, computeAgendaRange, addOneHour, subtractOneHour)
- src/components/location/BusinessHoursEditor.tsx (new)
- src/components/schedule/ScheduleGrid.tsx (modified — rimossi GLOBAL_OPEN/CLOSE, aggiunte props globalOpen/globalClose)
- src/components/schedule/ScheduleTimeline.tsx (modified — rimossi GLOBAL_OPEN/CLOSE, aggiunte props globalOpen/globalClose)
- src/components/schedule/AgendaView.tsx (modified — businessHours da query, computeAgendaRange, props a grid/timeline)
- src/app/(auth)/settings/locations/[id]/page.tsx (modified — getLocationBusinessHours, sezione BusinessHoursEditor)
- _bmad-output/implementation-artifacts/2-5-orari-apertura-sede.md (modified — story aggiornata)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status → review)

## Change Log

- 2026-04-26: Implementazione completa story 2.5 — tabella DB locationBusinessHours, BusinessHoursEditor UI, agenda range dinamico con slot 15min
