# Sprint Change Proposal — Orari di Apertura Sede e Slot Agenda 15 Minuti

**Data:** 2026-04-26  
**Progetto:** dog-grooming  
**Branch corrente:** 4-3-cancellazione-e-spostamento-appuntamenti  
**Classificazione scope:** Moderata

---

## Sezione 1: Riepilogo del Problema

### Problema

L'agenda attuale mostra sempre l'intera giornata (00:00–23:30 in vista fissa a 24 ore) e usa slot da 30 minuti. Questo causa due problemi pratici per l'uso quotidiano del salone:

1. **Nessun orario di apertura per sede.** La tabella `locations` non ha campi per definire gli orari settimanali di apertura. FR8 del PRD prevedeva orari per postazione, poi rimossi nel CC-2026-03-14 senza un sostituto per la sede. Il salone lavora su fasce orarie specifiche (es. 9:00–13:00 e 15:00–19:00) che attualmente non sono configurabili.

2. **Agenda inutilizzabile nella pratica.** Con la vista a 24 ore, l'utente deve fare molto scroll per arrivare agli orari lavorativi. La griglia mostra decine di righe vuote inutili. Gli slot da 30 minuti non corrispondono alla granularità reale delle prenotazioni del salone.

### Requisito

- **Configurazione:** ogni sede deve avere orari di apertura settimanali, con **2 fasce per giorno** (es. mattina e pomeriggio con pausa pranzo)
- **Agenda:** mostrare solo il range `[fascia minima apertura – 1h, fascia massima chiusura + 1h]` della sede per il giorno selezionato
- **Slot:** granularità di **15 minuti** (da 30)

### Contesto di scoperta

Il requisito è emerso durante la story 4.3 (in-progress), quando il test dell'agenda ha evidenziato che lo scroll a 24 ore rende l'interfaccia impraticabile nel contesto reale del salone pilota.

### Stato attuale del codice

| Elemento | File | Problema |
|----------|------|---------|
| `globalOpen = '00:00'`, `globalClose = '23:30'` hardcoded | `src/components/schedule/ScheduleGrid.tsx` | Vista fissa 24h, non rispetta orari sede |
| `MINUTES_PER_SLOT = 30` | `src/lib/utils/schedule.ts` | Slot troppo larghi |
| `SLOT_HEIGHT_PX = 60` | `src/lib/utils/schedule.ts` | Da rivedere con cambio slot |
| Tabella `locations` senza orari | `src/lib/db/schema.ts` | Nessun dato di apertura disponibile |

---

## Sezione 2: Analisi dell'Impatto

### 2.1 Impatto sulle Epiche

#### Epica 2 — Configurazione del Salone (status: `done` → `in-progress`)

**Nuova Story 2.5 — Orari di Apertura Sede** (da aggiungere, status: `backlog`)

Richiede:
- Nuova tabella DB `location_business_hours`
- CRUD: query, validazioni Zod, server action, UI nella pagina Sedi
- Nessun rollback di story esistenti — è interamente additiva

#### Epica 4 — Agenda e Appuntamenti (status: `in-progress`)

**Story 4.1 — Vista Agenda** (status: `done` → richiede aggiornamento parziale)

Gli acceptance criteria descrivono "vista 24h dalle 00:00 alle 23:30" e "intervalli di 30 minuti". Entrambi vanno aggiornati. Il codice di Story 4.1 è già merged ma deve essere modificato.

**Story 4.3 — Cancellazione e Spostamento** (status: `in-progress`, branch corrente)

Impatto basso: la logica di cancellazione/spostamento non dipende dal range orario o dalla granularità degli slot. Tuttavia i componenti visuali (ScheduleGrid, EmptySlot) che visualizzano gli slot disponibili in modalità spostamento useranno i nuovi slot da 15 minuti una volta aggiornati.

> **Raccomandazione:** completare Story 4.3 con la granularità attuale, poi aggiornare gli slot e il range in un task dedicato nell'ambito della nuova Story 2.5 o come aggiornamento a 4.1.

### 2.2 Impatto sugli Artefatti

#### PRD

- **FR8** (attuale): "L'Amministratore può definire gli orari di apertura e chiusura per ciascuna postazione" → **da aggiornare** a sede
- **FR26** (attuale): "fasce orarie rispettano gli orari di apertura/chiusura di ogni postazione" → **da aggiornare** con orari sede, range dinamico e slot 15 min
- **Aggiungere FR36:** "L'agenda mostra solo il range orario ristretto della sede (fascia apertura – 1h, fascia chiusura + 1h), con slot da 15 minuti"

#### Architettura — Schema DB

Nuova tabella `location_business_hours`:

```typescript
// NUOVA TABELLA
export const locationBusinessHours = pgTable('location_business_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedì (ISO 8601), 6=Domenica
  openTime: text('open_time').notNull(),  // "HH:mm" — orario apertura fascia
  closeTime: text('close_time').notNull(), // "HH:mm" — orario chiusura fascia
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
// Una riga = una fascia. Max 2 righe per stesso (locationId, dayOfWeek).
// Lunedì chiuso = nessuna riga per dayOfWeek=0.
```

#### Architettura — Utils Schedule

```typescript
// src/lib/utils/schedule.ts

// PRIMA:
export const SLOT_HEIGHT_PX = 60
export const MINUTES_PER_SLOT = 30

// DOPO:
export const SLOT_HEIGHT_PX = 30   // 30px per slot da 15 min → stessa proporzione visiva
export const MINUTES_PER_SLOT = 15

// generateTimeSlots: già usa MINUTES_PER_SLOT — si aggiorna automaticamente
// getAppointmentPosition: già usa MINUTES_PER_SLOT e SLOT_HEIGHT_PX — si aggiorna automaticamente
```

> **Nota:** Con SLOT_HEIGHT_PX=30 e MINUTES_PER_SLOT=15, un appuntamento da 30 min occupa 60px (2 slot × 30px), identico a prima. La proporzione visiva è preservata.

#### Architettura — Queries e Actions

- **Nuova query:** `getLocationBusinessHours(locationId, tenantId)` → array di `{ dayOfWeek, openTime, closeTime }[]`
- **Nuova action:** `upsertLocationBusinessHours(locationId, dayOfWeek, slots[])` in `src/lib/actions/locations.ts`
- **Nuova validazione:** `locationBusinessHoursSchema` in `src/lib/validations/locations.ts`
- **Aggiornare:** `getAgendaData` in `src/lib/actions/appointments.ts` → includere `businessHours` nella risposta; il range dinamico è calcolato lato client da `AgendaView`

#### UX — Pagina Sedi

La pagina `/locations` deve includere un editor degli orari di apertura per ogni sede. Struttura UI suggerita:

```
Sede: Milano Centro
[Sezione Postazioni]  [Sezione Orari di Apertura]

Orari di Apertura
┌──────────┬─────────────────────────────────────────┐
│ Lunedì   │  [09:00] – [13:00]  [+]  [15:00] – [19:00]  [×] │
│ Martedì  │  [09:00] – [19:00]         (nessuna pausa)   │
│ Mercoledì│  Chiuso                    [+ Apri giorno]   │
│ ...      │                                             │
└──────────┴─────────────────────────────────────────┘
[Salva orari]
```

Ogni giorno: max 2 fasce, pulsante "+" per aggiungere seconda fascia, "×" per rimuoverla. Giorno senza fasce = chiuso.

#### UX — Agenda (ScheduleGrid / AgendaView)

```
PRIMA:
  Range fisso: 00:00 – 23:30 (96 slot da 15 min = molto scroll)

DOPO:
  Range dinamico per giorno della settimana:
  - Calcola dayOfWeek dalla data selezionata
  - Carica fasce per la sede corrente
  - globalOpen = min(openTime) - 1 ora
  - globalClose = max(closeTime) + 1 ora
  - Fallback se nessun orario configurato: 08:00 – 20:00 (default ragionevole)

Esempio (sede aperta 9:00-13:00 e 15:00-19:00):
  → globalOpen = 08:00 (9:00 - 1h)
  → globalClose = 20:00 (19:00 + 1h)
  → Slot visualizzati: 08:00–20:00 = 12h × 4 slot/h = 48 slot × 30px = 1440px totale
  
Vs. attuale 24h: 96 slot × 30px = 2880px → dimezzato
```

---

## Sezione 3: Approccio Raccomandato

### Scelta: Opzione 1 — Aggiustamento Diretto

**Rationale:**

| Criterio | Valutazione |
|----------|-------------|
| Schema DB | Additivo — nuova tabella, nessuna migrazione distruttiva |
| Rollback necessario | No — Story 4.1 è completata ma le modifiche sono localizzate in utils/schedule.ts e ScheduleGrid |
| Impatto Story 4.3 | Minimo — la logica business è indipendente dal range/slot |
| Impatto MVP | Zero — migliora l'usabilità senza cambiare le funzionalità |
| Dati esistenti | Nessun dato di apertura da migrare — la tabella è nuova |

**Effort:** Medio  
**Risk:** Basso  

---

## Sezione 4: Proposte di Modifica Dettagliate

### M1 — Nuovo Schema DB `location_business_hours`

**File:** `src/lib/db/schema.ts`

```typescript
// AGGIUNGERE dopo la tabella `locations`:
export const locationBusinessHours = pgTable('location_business_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedì (ISO 8601), 6=Domenica
  openTime: text('open_time').notNull(),   // "HH:mm"
  closeTime: text('close_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Drizzle migration:** `npx drizzle-kit push` (nuova tabella, operazione non distruttiva)

**Rationale:** Una riga per fascia oraria. Lunedì con due fasce = 2 righe (dayOfWeek=0). Giorno chiuso = nessuna riga. Struttura identica a `userLocationAssignments` per consistenza del progetto.

---

### M2 — Validazione Zod

**File:** `src/lib/validations/locations.ts`

```typescript
// AGGIUNGERE:
export const locationBusinessHoursSlotSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine(d => d.closeTime > d.openTime, { message: "L'ora di chiusura deve essere dopo l'apertura" })

export const upsertLocationBusinessHoursSchema = z.object({
  locationId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  slots: z.array(locationBusinessHoursSlotSchema).max(2),
})
```

---

### M3 — Query

**File:** `src/lib/queries/locations.ts`

```typescript
// AGGIUNGERE:
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

---

### M4 — Server Action

**File:** `src/lib/actions/locations.ts`

```typescript
// AGGIUNGERE:
export const upsertLocationBusinessHours = authActionClient
  .schema(upsertLocationBusinessHoursSchema)
  .action(async ({ parsedInput: { locationId, dayOfWeek, slots }, ctx: { tenantId } }) => {
    await db.transaction(async (tx) => {
      await tx.delete(locationBusinessHours).where(
        and(
          eq(locationBusinessHours.locationId, locationId),
          eq(locationBusinessHours.dayOfWeek, dayOfWeek),
          eq(locationBusinessHours.tenantId, tenantId)
        )
      )
      if (slots.length > 0) {
        await tx.insert(locationBusinessHours).values(
          slots.map(s => ({ ...s, locationId, dayOfWeek, tenantId }))
        )
      }
    })
  })
```

---

### M5 — UI Pagina Sedi

**File da aggiornare/creare:** `src/components/location/BusinessHoursEditor.tsx` (nuovo)

Componente React che mostra una riga per ogni giorno (Lun–Dom):
- Se nessuna fascia: label "Chiuso" + pulsante "Apri"
- Se 1 fascia: time inputs apertura/chiusura + pulsante "+" per seconda fascia + "Salva"
- Se 2 fasce: entrambe le fasce + pulsante "×" per rimuovere la seconda

**File da aggiornare:** `src/app/(auth)/locations/page.tsx` — includere `BusinessHoursEditor` nel dettaglio sede (tab o sezione separata)

---

### M6 — Utils Schedule (slot 15 min)

**File:** `src/lib/utils/schedule.ts`

```typescript
// PRIMA:
export const SLOT_HEIGHT_PX = 60
export const MINUTES_PER_SLOT = 30

// DOPO:
export const SLOT_HEIGHT_PX = 30
export const MINUTES_PER_SLOT = 15
```

Le funzioni `generateTimeSlots`, `getAppointmentPosition` usano già queste costanti — si aggiornano automaticamente senza modifiche.

**Rationale proportione:** Un appuntamento da 30 min = 2 slot × 30px = 60px. Identico a prima visivamente, ma ora ogni slot da 15 min è selezionabile singolarmente.

---

### M7 — AgendaView: Range Dinamico

**File:** `src/components/schedule/AgendaView.tsx`

```typescript
// AGGIUNGERE alla query TanStack:
// getAgendaData deve includere businessHours per la sede+giorno selezionato

// AGGIUNGERE utility:
function computeAgendaRange(
  businessHours: { dayOfWeek: number; openTime: string; closeTime: string }[],
  dayOfWeek: number,
): { globalOpen: string; globalClose: string } {
  const todaySlots = businessHours.filter(h => h.dayOfWeek === dayOfWeek)
  if (todaySlots.length === 0) {
    return { globalOpen: '08:00', globalClose: '20:00' } // fallback
  }
  const minOpen = todaySlots.reduce((min, s) => s.openTime < min ? s.openTime : min, '23:59')
  const maxClose = todaySlots.reduce((max, s) => s.closeTime > max ? s.closeTime : max, '00:00')
  return {
    globalOpen: subtractOneHour(minOpen),
    globalClose: addOneHour(maxClose),
  }
}
```

**ScheduleGrid.tsx:**

```typescript
// PRIMA:
const globalOpen = '00:00'
const globalClose = '23:30'

// DOPO:
// riceve globalOpen/globalClose come props da AgendaView
// calcolati dinamicamente da computeAgendaRange
```

---

### M8 — Aggiornamento AC Story 4.1

**Story 4.1 — Acceptance Criteria da aggiornare:**

```
AC #1 — PRIMA:
"fasce orarie come righe (intervalli di 30 minuti, vista 24h dalle 00:00 alle 23:30)"

AC #1 — DOPO:
"fasce orarie come righe (intervalli di 15 minuti); il range orario copre
dall'ora di prima apertura della sede meno 1h, all'ora di ultima chiusura della sede più 1h"

AC NUOVO (aggiungere):
"Given la sede non ha orari di apertura configurati
When l'agenda viene renderizzata
Then viene mostrato il range di fallback 08:00–20:00
And viene mostrata una nota 'Configura gli orari di apertura della sede per una vista ottimizzata'"
```

---

## Sezione 5: Implementation Handoff

**Classificazione scope: MODERATA**

### Responsabilità

| Ruolo | Azioni |
|-------|--------|
| **SM / PO** | Aggiungere Story 2.5 a `sprint-status.yaml` e `epics.md`; riaprire epic-2 a `in-progress`; aggiornare AC di Story 4.1 |
| **Architetto** | Aggiornare `architecture.md`: schema `location_business_hours`, pattern `computeAgendaRange`, costanti `MINUTES_PER_SLOT=15`/`SLOT_HEIGHT_PX=30` |
| **PM** | Aggiornare `prd.md`: FR8 (orari sede, non postazione), FR26 (slot 15 min + range dinamico), aggiungere FR36 |
| **Developer** | Story 2.5 (nuova), poi aggiornamento Story 4.1 (M6 + M7) |

### Sequenza di Implementazione Raccomandata

```
1. Completare Story 4.3 (branch corrente — non bloccata)
   └── Le modifiche visive (slot 15 min) arriveranno dopo, la logica è indipendente

2. Story 2.5 — Orari di Apertura Sede (NUOVA)
   └── Drizzle push: nuova tabella location_business_hours
   └── Validazioni + query + action
   └── UI BusinessHoursEditor nella pagina Sedi
   └── Test: aggiunta/modifica/rimozione fasce orarie

3. Aggiornamento Story 4.1 — Slot 15 min + Range Dinamico
   └── M6: MINUTES_PER_SLOT=15, SLOT_HEIGHT_PX=30 in schedule.ts
   └── M7: computeAgendaRange in AgendaView, props globalOpen/globalClose a ScheduleGrid
   └── Aggiornare getAgendaData per includere businessHours nella risposta
   └── Test: agenda con orari configurati vs. fallback; proporzioni blocchi invariate
```

### Success Criteria

- [ ] L'Amministratore può configurare fino a 2 fasce orarie per ogni giorno della settimana per ogni sede
- [ ] Un giorno senza fasce configurate è considerato "chiuso" (nessuna fascia visualizzata nell'agenda)
- [ ] L'agenda mostra solo il range `[prima apertura – 1h, ultima chiusura + 1h]`
- [ ] Se nessun orario configurato, l'agenda usa il range di fallback 08:00–20:00
- [ ] Gli slot dell'agenda sono da 15 minuti
- [ ] Un appuntamento da 30 min occupa visivamente la stessa altezza di prima (60px)
- [ ] La proporzione visiva dei blocchi appuntamento è preservata rispetto al cambio di slot

---

*Proposta generata il 2026-04-26 tramite workflow correct-course (BMad Method v6.0.0-Beta.7)*
