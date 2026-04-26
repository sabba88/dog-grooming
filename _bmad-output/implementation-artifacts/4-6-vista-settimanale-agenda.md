# Story 4.6: Vista Settimanale Agenda con Evidenza Buchi Operatori

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **visualizzare l'agenda in formato settimanale con i buchi di ogni operatore evidenziati per ogni giorno**,
so that **possa identificare immediatamente le fasce disponibili e ottimizzare il carico di lavoro senza navigare giorno per giorno**.

## Acceptance Criteria

1. **Given** un utente è sull'agenda giornaliera
   **When** clicca sul toggle "Settimana" nell'header dell'agenda
   **Then** la vista passa alla visualizzazione settimanale (`WeeklyScheduleView`)
   **And** sono visibili i 7 giorni della settimana corrente come colonne
   **And** ogni operatore della sede corrente occupa una riga

2. **Given** un operatore ha turni configurati per una data della settimana (righe in `userLocationAssignments` per quella sede)
   **When** la vista settimanale viene renderizzata
   **Then** la cella mostra una barra proporzionale con zona coperta (ore con appuntamenti, grigio scuro) e zona buco (ore turno libere, pattern diagonale primary)
   **And** sotto la barra viene mostrato il totale ore di buco (es. "3h buco")

3. **Given** un operatore non ha turni configurati per una data (nessuna riga in `userLocationAssignments` per quella sede e data)
   **When** la vista settimanale viene renderizzata
   **Then** la cella mostra "Non asseg." con sfondo grigio chiaro

4. **Given** un utente vede la vista settimanale
   **When** clicca su una cella specifica (persona × giorno)
   **Then** la vista passa alla vista giornaliera per quella data (cambia `selectedDate` e torna a `viewMode = 'day'`)

5. **Given** un utente è in vista settimanale
   **When** clicca le frecce di navigazione settimana precedente / successiva
   **Then** la vista avanza o retrocede di 7 giorni

6. **Given** un utente è su mobile (< 768px) e in vista settimanale
   **When** la pagina viene renderizzata
   **Then** le persone sono elencate verticalmente con i 7 giorni in formato compatto (badge orizzontali)
   **And** tap su badge giorno → navigazione alla vista giornaliera per quella data

## Tasks / Subtasks

- [x] Task 1: Aggiungere utility `computeGaps` in `src/lib/utils/schedule.ts` (AC: #2)
  - [x] 1.1 Definire interfaccia `TimeInterval { start: number; end: number }` (minuti)
  - [x] 1.2 Implementare `computeGaps(shifts: TimeInterval[], appointments: TimeInterval[]): TimeInterval[]`
    - Per ogni fascia del turno, sottrai i segmenti coperti dagli appuntamenti
    - Restituisce i segmenti liberi (buchi) all'interno delle fasce turno
    - Algoritmo: ordina entrambe le liste per start, per ogni shift interval scansiona gli appuntamenti sovrapposti e "sottrai"
  - [x] 1.3 Aggiungere utility `minutesToHoursLabel(minutes: number): string` — es. 90 → "1h 30min", 120 → "2h"

- [x] Task 2: Aggiungere query `getWeeklyAppointmentsByPerson` in `src/lib/queries/appointments.ts` (AC: #2)
  - [x] 2.1 Firma: `getWeeklyAppointmentsByPerson(weekStart: string, weekEnd: string, locationId: string, tenantId: string)`
    - `weekStart` e `weekEnd` in formato `"yyyy-MM-dd"` (es. `"2026-04-27"` e `"2026-05-03"`)
    - La query deve filtrare solo gli appuntamenti degli utenti che hanno almeno un turno su `locationId` nella settimana
    - Ritorna array flat ordinato per `startTime` con campi: `id, userId, startTime, endTime, dateString`
    - `dateString` calcolato come `format(startTime, 'yyyy-MM-dd')` lato applicazione dopo la query
  - [x] 2.2 Implementare con Drizzle: `WHERE startTime >= weekStartUTC AND startTime < weekEndUTC AND tenantId = ?`
    - `weekStartUTC = new Date(weekStart + 'T00:00:00.000Z')`, `weekEndUTC = new Date(weekEnd + 'T23:59:59.999Z')`
    - Includere `isNull(clients.deletedAt)` come nelle altre query
  - [x] 2.3 Ritorno trasformato: `Record<userId, { id: string; startTime: Date; endTime: Date; date: string }[]>`
    - Raggruppare client-side dopo la query (o con una Map) per evitare query N+1

- [x] Task 3: Aggiungere query `getWeeklyStaffShifts` in `src/lib/queries/staff.ts` (AC: #2, #3)
  - [x] 3.1 Firma: `getWeeklyStaffShifts(weekStart: string, weekEnd: string, locationId: string, tenantId: string)`
    - Filtra `userLocationAssignments WHERE locationId = ? AND date BETWEEN weekStart AND weekEnd AND tenantId = ?`
    - Ritorna i turni raggruppati per userId e per data
  - [x] 3.2 Tipo di ritorno: `Record<userId, { date: string; shifts: { startTime: string; endTime: string }[] }[]>`
    - Ogni entry `date` può avere più fasce (es. 09:00-13:00 e 15:00-19:00)
  - [x] 3.3 Implementare con Drizzle e `gte`/`lte` su `userLocationAssignments.date`

- [x] Task 4: Aggiungere server action `fetchWeeklyAgendaData` in `src/lib/actions/appointments.ts` (AC: #1)
  - [x] 4.1 Schema Zod: `z.object({ locationId: z.string().uuid(), weekStart: z.string() })` in `validations/appointments.ts`
  - [x] 4.2 Action: usa `authActionClient`, riceve `locationId` e `weekStart`
    - Calcola `weekEnd = addDays(parseISO(weekStart), 6)` → `format(weekEnd, 'yyyy-MM-dd')`
    - Chiama in `Promise.all`:
      1. `getActiveUsers(tenantId)` — lista persone
      2. `getWeeklyStaffShifts(weekStart, weekEnd, locationId, tenantId)` — turni per persona per data
      3. `getWeeklyAppointmentsByPerson(weekStart, weekEnd, locationId, tenantId)` — appuntamenti per persona
  - [x] 4.3 Ritorna: `{ staff: User[], staffShifts: Record<userId, ...>, appointments: Record<userId, ...> }`

- [x] Task 5: Creare componente `WeeklyDayCell.tsx` in `src/components/schedule/` (AC: #2, #3)
  - [x] 5.1 Props: `{ shifts: { startTime: string; endTime: string }[]; appointments: { startTime: Date; endTime: Date }[]; date: string; onClick: () => void }`
  - [x] 5.2 Se `shifts.length === 0`: render "Non asseg." con `bg-muted text-muted-foreground text-xs text-center py-2 rounded`
  - [x] 5.3 Altrimenti: calcolare con `computeGaps`:
    - Convertire shifts e appointments in `TimeInterval[]` (minuti)
    - Sommare durata totale turno = somma `(end - start)` di tutti gli shift
    - Calcolare gaps = `computeGaps(shiftIntervals, appointmentIntervals)`
    - Totale buco = somma durata gaps in minuti
  - [x] 5.4 Render barra proporzionale (larghezza 100% della cella, altezza fissa 40px):
    - Zona coperta (appointments): `bg-gray-700` proporzionale
    - Zona buco (gaps): sfondo `#E8F0ED` con bordo tratteggiato `#4A7C6F` proporzionale
    - Zona non-turno (fuori dal turno): `bg-background` o trasparente
    - La barra è un flex row con sezioni proporzionali al turno totale
  - [x] 5.5 Sotto la barra: label `"{X}h buco"` (usa `minutesToHoursLabel`), testo `text-xs text-primary font-medium`; se buco = 0 min: `"0h buco"` in `text-muted-foreground`
  - [x] 5.6 Wrap in `button` con `onClick` → navigazione giornaliera (AC: #4)
  - [x] 5.7 Etichetta data nel header colonna (es. "Lun 27/04") con formato `Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })`

- [x] Task 6: Creare componente `WeeklyPersonRow.tsx` in `src/components/schedule/` (AC: #1, #2)
  - [x] 6.1 Props: `{ person: { id: string; name: string; role: 'admin' | 'collaborator' }; weekDates: string[]; shiftsPerDate: Record<string, { startTime: string; endTime: string }[]>; appointmentsPerDate: Record<string, { startTime: Date; endTime: Date }[]>; onDayClick: (date: string) => void }`
  - [x] 6.2 Desktop: riga con nome persona a sinistra (prima colonna fissa) + 7 `WeeklyDayCell` nelle colonne successive
  - [x] 6.3 Mobile (< 768px): accordeon verticale — nome persona come header, 7 badge orizzontali compatti (giorno abbreviato + indicatore buco) scorribili orizzontalmente
  - [x] 6.4 Badge mobile: `"Lu 2h"` in formato compatto, colore primary se ha buco > 0, grigio se 0 buco, outline se non assegnato

- [x] Task 7: Creare componente `WeeklyScheduleView.tsx` in `src/components/schedule/` (AC: #1, #2, #3, #5)
  - [x] 7.1 Props: `{ weekDates: string[]; staff: User[]; staffShifts: Record<userId, ...>; appointments: Record<userId, ...>; onDayClick: (date: string) => void; onPrevWeek: () => void; onNextWeek: () => void; currentWeekLabel: string }`
  - [x] 7.2 Header: frecce prev/next settimana + label settimana (es. "21–27 apr 2026")
  - [x] 7.3 Griglia desktop: colonne = 7 giorni + 1 colonna nome (CSS grid `"180px repeat(7, 1fr)"`)
    - Prima riga: header con etichette giorni (Lun 27/04, Mar 28/04, ...)
    - Righe successive: una `WeeklyPersonRow` per persona
  - [x] 7.4 Mobile: lista verticale di `WeeklyPersonRow` con badge orizzontali
  - [x] 7.5 Stato di caricamento: skeleton mentre `useQuery` è in loading
  - [x] 7.6 Empty state: se `staff.length === 0`, mostra messaggio "Nessun collaboratore configurato per questa sede"

- [x] Task 8: Aggiornare `AgendaView.tsx` con toggle e navigazione settimanale (AC: #1, #4, #5)
  - [x] 8.1 Aggiungere stato: `const [viewMode, setViewMode] = useState<'day' | 'week'>('day')`
  - [x] 8.2 Aggiungere stato: `const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))` (lunedì = giorno 1)
  - [x] 8.3 Aggiungere `useQuery` per vista settimanale:
    ```typescript
    const { data: weeklyData } = useQuery({
      queryKey: ['agenda-weekly', selectedLocationId, format(weekStart, 'yyyy-MM-dd')],
      queryFn: async () => {
        if (!selectedLocationId) return null
        const result = await fetchWeeklyAgendaData({
          locationId: selectedLocationId,
          weekStart: format(weekStart, 'yyyy-MM-dd'),
        })
        return result?.data ?? null
      },
      enabled: !!selectedLocationId && isHydrated && viewMode === 'week',
    })
    ```
  - [x] 8.4 Aggiungere toggle "Giorno | Settimana" nell'header (vicino a `DateNavigation`/`DateStrip`):
    - Usa shadcn/ui `ToggleGroup` o due `Button` con `variant="outline"` + `variant="default"` a seconda del viewMode attivo
    - Su mobile: toggle compatto (icone "Giorno"/"Settimana" o abbreviazioni "G"/"S")
  - [x] 8.5 Calcolare `weekDates: string[]` (7 date da weekStart a weekStart+6) con `addDays + format`
  - [x] 8.6 Handler `handleDayClick(date: string)`: setta `setSelectedDate(parseISO(date))`, `setViewMode('day')`
  - [x] 8.7 Handler `handlePrevWeek`: `setWeekStart(prev => subWeeks(prev, 1))`
  - [x] 8.8 Handler `handleNextWeek`: `setWeekStart(prev => addWeeks(prev, 1))`
  - [x] 8.9 In `viewMode === 'week'`: render `WeeklyScheduleView` al posto di `ScheduleGrid`/`ScheduleTimeline`
  - [x] 8.10 In `viewMode === 'week'`: il toggle spostamento appuntamento non è applicabile — nascondere il banner spostamento e disabilitare la modalità di spostamento quando si cambia in view settimanale

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** usa `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — dal `ctx.tenantId` nell'action
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- **Lingua UI:** Italiano (label, messaggi, toast). **Lingua codice:** Inglese
- **NO nuove tabelle DB** — questa story non richiede migrazioni. Usa `appointments` e `userLocationAssignments` già esistenti

### Schema DB Rilevante (già esistente, nessuna migrazione)

```typescript
// userLocationAssignments — turni collaboratori per data specifica
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  locationId: uuid('location_id').notNull(),
  date: date('date').notNull(),           // data specifica YYYY-MM-DD
  startTime: text('start_time').notNull(), // "HH:mm"
  endTime: text('end_time').notNull(),     // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// appointments (rilevante per questa story)
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),      // ← persona responsabile (non postazione)
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  // ...altri campi
})
```

### Algoritmo `computeGaps` — Dettaglio Implementativo

```typescript
interface TimeInterval { start: number; end: number } // minuti dall'inizio giornata

export function computeGaps(
  shifts: TimeInterval[],      // fasce turno ordinate per start
  appointments: TimeInterval[] // appuntamenti ordinati per start
): TimeInterval[] {
  const gaps: TimeInterval[] = []

  for (const shift of shifts) {
    let covered = [...appointments]
      .filter(a => a.end > shift.start && a.start < shift.end) // sovrapposti al turno
      .map(a => ({
        start: Math.max(a.start, shift.start),
        end: Math.min(a.end, shift.end),
      }))
      .sort((a, b) => a.start - b.start)

    let cursor = shift.start
    for (const segment of covered) {
      if (cursor < segment.start) {
        gaps.push({ start: cursor, end: segment.start })
      }
      cursor = Math.max(cursor, segment.end)
    }
    if (cursor < shift.end) {
      gaps.push({ start: cursor, end: shift.end })
    }
  }

  return gaps
}

export function minutesToHoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}
```

### Calcolo Barra Proporzionale in `WeeklyDayCell`

```typescript
// Esempio: turno 09:00-13:00 (240min) + 15:00-19:00 (240min) = 480min totale
// Appuntamenti: 09:30-10:30 (60min) + 11:00-12:00 (60min)
// Gaps = 09:00-09:30, 10:30-11:00, 12:00-13:00, 15:00-19:00 = 30+30+60+240 = 360min buco

// La barra non è una timeline 24h: è relativa al turno totale.
// Usa flex-row con flex-basis proporzionale a (durata segmento / turno totale * 100%)
// Segmenti: ordinare per start tutti (shifts + appointments), colorare di conseguenza
// Alternativa più semplice: mostrare solo il totale buco come label (no barra dettagliata)
// → SCELTA: implementare la barra dettagliata per l'AC #2

// Struttura barra: analizza ogni minuto del turno →
// "coperto da appuntamento" → bg-gray-700
// "libero (buco)" → bg-[#E8F0ED] border border-dashed border-[#4A7C6F]
```

### Design Token Vista Settimanale

| Elemento | Token |
|----------|-------|
| Sfondo buco (gap zone) | `#E8F0ED` (stesso di PersonHeader active) |
| Bordo buco | `#4A7C6F` tratteggiato (`border-dashed`) |
| Zona coperta (appuntamenti) | `bg-gray-700` |
| Non assegnato | `bg-muted text-muted-foreground` |
| Label buco | `text-primary font-medium text-xs` |
| Header colonna giorno | `text-muted-foreground text-xs font-medium` |

### Navigazione Settimana — Calcolo Settimana

```typescript
import { startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, format } from 'date-fns'

// Settimana che inizia il lunedì (weekStartsOn: 1 per date-fns)
const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
const weekDates = Array.from({ length: 7 }, (_, i) =>
  format(addDays(weekStart, i), 'yyyy-MM-dd')
)

// Label settimana
const weekLabel = `${format(weekStart, 'd MMM', { locale: it })}–${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: it })}`
// → "27 apr–3 mag 2026"
// Importare la locale italiana: import { it } from 'date-fns/locale'
```

### Toggle Giorno/Settimana — Implementazione

```tsx
// In AgendaView, vicino a DateNavigation/DateStrip
<div className="flex items-center gap-2">
  <Button
    variant={viewMode === 'day' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('day')}
  >
    Giorno
  </Button>
  <Button
    variant={viewMode === 'week' ? 'default' : 'outline'}
    size="sm"
    onClick={() => {
      // Sincronizza weekStart con selectedDate quando si passa alla vista settimanale
      setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }))
      setViewMode('week')
    }}
  >
    Settimana
  </Button>
</div>
```

### Dipendenze da Stories Precedenti

- **Story 2.4 (Assegnazione Collaboratori Sedi e Calendario):** ha creato `userLocationAssignments` con `date` specifico (non `dayOfWeek`). Prerequisito soddisfatto — questa story legge quei dati.
- **Story 4.1 (Vista Agenda Giornaliera):** ha implementato `AgendaView.tsx`, `ScheduleGrid.tsx`, `ScheduleTimeline.tsx`, `computeAgendaRange`, `getStaffStatusForDate`. Questa story ESTENDE `AgendaView` senza riscriverla.
- **Story 2.5 (Orari Apertura Sede):** ha implementato `locationBusinessHours`. Questa story NON usa gli orari di apertura sede per la barra — usa i turni effettivi degli operatori.

### Stato Corrente del Codice (Post Story 4.5)

| File | Stato | Azione richiesta |
|------|-------|-----------------|
| `src/components/schedule/AgendaView.tsx` | Vista giornaliera funzionante, nessun toggle | MODIFICARE: aggiungere toggle + viewMode + weekly query |
| `src/lib/utils/schedule.ts` | `computeAgendaRange`, `timeToMinutes`, `generateTimeSlots` presenti | AGGIUNGERE: `computeGaps`, `minutesToHoursLabel` |
| `src/lib/queries/appointments.ts` | `getAppointmentsByDateAndLocationGroupedByUser` presente | AGGIUNGERE: `getWeeklyAppointmentsByPerson` |
| `src/lib/queries/staff.ts` | `getStaffStatusForDate` presente con logica per data specifica | AGGIUNGERE: `getWeeklyStaffShifts` |
| `src/lib/actions/appointments.ts` | `getAgendaData` presente | AGGIUNGERE: `fetchWeeklyAgendaData` |
| `src/lib/validations/appointments.ts` | `fetchBreedPriceForService` schema aggiunto in 4.5 | AGGIUNGERE: `fetchWeeklyAgendaDataSchema` |
| `src/components/schedule/WeeklyScheduleView.tsx` | NON ESISTE | CREARE |
| `src/components/schedule/WeeklyPersonRow.tsx` | NON ESISTE | CREARE |
| `src/components/schedule/WeeklyDayCell.tsx` | NON ESISTE | CREARE |

### Logica Query `getWeeklyAppointmentsByPerson`

```typescript
// NOTA: gli appuntamenti non filtrano per locationId direttamente —
// gli appuntamenti hanno userId e stationId (opzionale).
// Per la vista settimanale: recupera TUTTI gli appuntamenti dei collaboratori attivi
// nel range settimanale per il tenant, poi nella action filtra per la sede selezionata
// verificando che l'utente abbia un turno su quella sede (oppure includi tutti).

// APPROCCIO PIÙ SEMPLICE: recupera tutti gli appuntamenti del tenant nel range,
// la action li raggruppa per userId.
// Il filtro per "collaboratori di questa sede" avviene tramite getWeeklyStaffShifts
// (solo chi ha turni su locationId appare nella lista staff della WeeklyScheduleView).

export async function getWeeklyAppointmentsByPerson(
  weekStart: string,
  weekEnd: string,
  tenantId: string
): Promise<{ id: string; userId: string; startTime: Date; endTime: Date }[]> {
  const start = new Date(weekStart + 'T00:00:00.000Z')
  const end = new Date(weekEnd + 'T23:59:59.999Z')

  return db
    .select({
      id: appointments.id,
      userId: appointments.userId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(and(
      gte(appointments.startTime, start),
      lt(appointments.startTime, end),
      eq(appointments.tenantId, tenantId),
    ))
    .orderBy(asc(appointments.startTime))
}
```

### Logica Action `fetchWeeklyAgendaData`

```typescript
// In src/lib/actions/appointments.ts
export const fetchWeeklyAgendaData = authActionClient
  .schema(fetchWeeklyAgendaDataSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, weekStart } = parsedInput
    const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')

    const [allUsers, staffShiftsRaw, allAppointments] = await Promise.all([
      getActiveUsers(ctx.tenantId),
      getWeeklyStaffShifts(weekStart, weekEnd, locationId, ctx.tenantId),
      getWeeklyAppointmentsByPerson(weekStart, weekEnd, ctx.tenantId),
    ])

    // Solo gli utenti che hanno almeno un turno su questa sede in questa settimana
    const staffWithShifts = allUsers.filter(u => staffShiftsRaw[u.id]?.length > 0)

    // Raggruppa appuntamenti per userId
    const appointmentsByUser: Record<string, typeof allAppointments> = {}
    for (const appt of allAppointments) {
      if (!appointmentsByUser[appt.userId]) appointmentsByUser[appt.userId] = []
      appointmentsByUser[appt.userId].push(appt)
    }

    return {
      staff: staffWithShifts,
      staffShifts: staffShiftsRaw,
      appointments: appointmentsByUser,
    }
  })
```

### File da NON Modificare

- `src/lib/db/schema.ts` — nessuna migrazione necessaria
- `src/components/schedule/ScheduleGrid.tsx` — non toccare
- `src/components/schedule/ScheduleTimeline.tsx` — non toccare
- `src/components/appointment/AppointmentForm.tsx` — non toccare
- Tutti i componenti della vista giornaliera — non toccare

### Testing (Manuale)

Casi critici da verificare:
- Toggle Giorno → Settimana → visualizza 7 colonne con persone nelle righe
- Toggle Settimana → Giorno → torna alla vista giornaliera sulla data corrente
- Clic su cella → passa alla vista giornaliera per quella data specifica
- Operatore con turno e appuntamenti → barra mostra zona coperta + buco con label "Xh buco"
- Operatore con turno ma ZERO appuntamenti → barra tutta buco, label con il totale ore turno
- Operatore SENZA turno per quella data → "Non asseg." grigio
- Navigazione settimana precedente/successiva → aggiorna tutte le celle
- Mobile: badge orizzontali compatti, tap → giornaliera

### Project Structure Notes

```
src/
  components/
    schedule/
      AgendaView.tsx             # MODIFICARE: toggle viewMode, weekStart state, weekly query
      WeeklyScheduleView.tsx     # CREARE: orchestratore vista settimanale
      WeeklyPersonRow.tsx        # CREARE: riga persona con 7 celle giorno
      WeeklyDayCell.tsx          # CREARE: cella (persona × giorno) con barra proporzionale
  lib/
    utils/
      schedule.ts                # AGGIUNGERE: computeGaps, minutesToHoursLabel
    queries/
      appointments.ts            # AGGIUNGERE: getWeeklyAppointmentsByPerson
      staff.ts                   # AGGIUNGERE: getWeeklyStaffShifts
    actions/
      appointments.ts            # AGGIUNGERE: fetchWeeklyAgendaData
    validations/
      appointments.ts            # AGGIUNGERE: fetchWeeklyAgendaDataSchema
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.6 — Acceptance Criteria completi]
- [Source: _bmad-output/planning-artifacts/architecture.md#CC-2026-04-27 — Specifiche tecniche vista settimanale: query, utility computeGaps, componenti, design tokens]
- [Source: _bmad-output/planning-artifacts/architecture.md — Stack: date-fns, TanStack Query, next-safe-action, authActionClient pattern]
- [Source: src/components/schedule/AgendaView.tsx — Struttura attuale: viewMode da aggiungere, useQuery pattern, toggle da inserire]
- [Source: src/components/schedule/ScheduleGrid.tsx — Pattern CSS grid con colonne operatori, PersonHeader, AppointmentBlock]
- [Source: src/components/schedule/PersonHeader.tsx — STATUS_BG token #E8F0ED per stato active]
- [Source: src/lib/utils/schedule.ts — timeToMinutes, computeAgendaRange, SLOT_HEIGHT_PX, MINUTES_PER_SLOT]
- [Source: src/lib/queries/staff.ts — getStaffStatusForDate pattern, StaffStatus/ShiftInfo tipi, getActiveUsers]
- [Source: src/lib/queries/appointments.ts — getAppointmentsByDateAndLocationGroupedByUser pattern]
- [Source: _bmad-output/implementation-artifacts/4-5-prezzo-appuntamento-per-razza.md — authActionClient, React Compiler, no useMemo/useCallback]
- [Source: _bmad-output/implementation-artifacts/2-4-assegnazione-collaboratori-sedi-calendario.md — userLocationAssignments schema con date specifiche]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Nessun debug critico richiesto. Build TypeScript e Next.js passati al primo tentativo.

### Completion Notes List

- Task 1: Aggiunte `TimeInterval`, `computeGaps`, `minutesToHoursLabel` in `src/lib/utils/schedule.ts`. Algoritmo esatto da Dev Notes implementato senza modifiche.
- Task 2: Aggiunta `getWeeklyAppointmentsByPerson` in `appointments.ts` con join clients (per `isNull(clients.deletedAt)`) e filtro `isNotNull(userId)`.
- Task 3: Aggiunta `getWeeklyStaffShifts` in `staff.ts` — raggruppa turni per `userId → [{date, shifts}]`. Importati `gte`/`lte`.
- Task 4: Aggiunto schema `fetchWeeklyAgendaDataSchema` in validations; action `fetchWeeklyAgendaData` con `Promise.all` per parallelismo. Importato `addDays`/`parseISO`/`format` da `date-fns`.
- Task 5: Creato `WeeklyDayCell.tsx` — barra proporzionale con segmenti `covered`/`gap`, label "Xh buco", helper `formatDayHeader` esportato.
- Task 6: Creato `WeeklyPersonRow.tsx` — desktop via CSS `contents` per integrazione nella griglia, mobile con badge orizzontali scrollabili.
- Task 7: Creato `WeeklyScheduleView.tsx` — navigazione prev/next settimana, griglia CSS con colonne `180px repeat(7, 1fr)`, skeleton di caricamento, empty state.
- Task 8: Aggiornato `AgendaView.tsx` — stati `viewMode`/`weekStart`, query settimanale con `enabled: viewMode === 'week'`, toggle Giorno/Settimana, handler `handleDayClick`/`handlePrevWeek`/`handleNextWeek`, banner spostamento nascosto in vista settimanale.

### File List

- `src/lib/utils/schedule.ts` — MODIFICATO: aggiunto `TimeInterval`, `computeGaps`, `minutesToHoursLabel`
- `src/lib/queries/appointments.ts` — MODIFICATO: aggiunto `getWeeklyAppointmentsByPerson`
- `src/lib/queries/staff.ts` — MODIFICATO: aggiunto `getWeeklyStaffShifts`, importati `gte`/`lte`
- `src/lib/validations/appointments.ts` — MODIFICATO: aggiunto `fetchWeeklyAgendaDataSchema`
- `src/lib/actions/appointments.ts` — MODIFICATO: aggiunto `fetchWeeklyAgendaData`, importati `addDays`/`parseISO`/`format`/`getActiveUsers`/`getWeeklyStaffShifts`/`getWeeklyAppointmentsByPerson`
- `src/components/schedule/WeeklyDayCell.tsx` — CREATO
- `src/components/schedule/WeeklyPersonRow.tsx` — CREATO
- `src/components/schedule/WeeklyScheduleView.tsx` — CREATO
- `src/components/schedule/AgendaView.tsx` — MODIFICATO: toggle viewMode, stati settimanali, query, handlers

## Change Log

| Data | Descrizione |
|------|-------------|
| 2026-04-27 | Implementazione completa story 4.6 — vista settimanale con barra proporzionale buchi operatori, toggle Giorno/Settimana, navigazione settimana prev/next, clic cella → giornaliera, layout mobile con badge compatti |
