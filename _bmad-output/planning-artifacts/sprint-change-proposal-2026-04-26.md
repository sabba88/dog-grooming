# Sprint Change Proposal — Pianificazione Turni per Data di Calendario

**Data:** 2026-04-26  
**Progetto:** dog-grooming  
**Branch corrente:** 4-3-cancellazione-e-spostamento-appuntamenti  
**Classificazione scope:** Moderata

---

## Sezione 1: Riepilogo del Problema

### Problema

Il sistema di pianificazione dei turni degli operatori implementato nella story `2-4-assegnazione-collaboratori-sedi-calendario` (attualmente in `review`) si basa su un **modello settimanale ripetitivo**: per ogni operatore viene definita una settimana tipo (Lunedì–Domenica) che si replica invariata su ogni settimana del calendario. Ogni giorno della settimana può avere al massimo una fascia oraria con una sola sede assegnata.

**Il requisito effettivo è differente:**

1. Ogni operatore deve essere pianificabile **giorno per giorno sul calendario** (date specifiche, non giorni della settimana ripetuti)
2. Per ogni giorno di calendario possono esistere **più fasce lavorative** (es. mattina + pomeriggio)
3. Ogni fascia lavorativa può avere una **sede diversa** assegnata

### Contesto di scoperta

Il problema è emerso durante il review dello sprint status nel contesto del lavoro sulla story `4-3-cancellazione-e-spostamento-appuntamenti`. L'implementazione della story `2-4` ha materializzato un modello settimanale che sembrava corrispondente al requisito iniziale (sprint-change-proposal-2026-03-14: "assign collaborators to locations by day of week"), ma il comportamento reale del salone richiede flessibilità giornaliera indipendente.

### Evidenza tecnica

| Elemento | Posizione | Problema |
|----------|-----------|---------|
| `dayOfWeek INTEGER (0-6)` | `src/lib/db/schema.ts` — tabella `userLocationAssignments` | Modello settimanale fisso invece di data specifica |
| `saveWeeklyCalendar` action | `src/lib/actions/staff.ts` | Sostituisce l'intera settimana, non gestisce date individuali |
| `getIsoDayOfWeek(date)` helper | `src/lib/queries/staff.ts` | Converte data→giorno della settimana, perdendo l'informazione di data |
| Griglia 7 colonne Lun–Dom | `StaffScheduleCalendar.tsx` | Permette un solo turno per giorno della settimana |
| `WHERE dayOfWeek = getIsoDayOfWeek(date)` | `getStaffStatusForDate` query | Restituisce turno per giorno della settimana, non per data specifica |

---

## Sezione 2: Analisi dell'Impatto

### 2.1 Impatto sugli Epic

#### Epic 2 — Configurazione del Salone (in-progress) — Impatto: ALTO

**Story 2-4-assegnazione-collaboratori-sedi-calendario** (attualmente: `review` → deve tornare `in-progress`)

L'intera implementazione va rivista:
- Schema DB: colonna `dayOfWeek` → colonna `date` (data specifica)
- Server actions: `saveWeeklyCalendar` → `saveDayShifts(userId, date, shifts[])`
- Validazioni Zod: `dayOfWeek: z.number().int().min(0).max(6)` → `date: z.string().date()`
- UI: griglia settimanale → selettore calendario mensile con editor turni per data

#### Epic 4 — Agenda e Appuntamenti (in-progress)

**Story 4-1-vista-agenda-per-sede-e-persona** (attualmente: `review` → deve tornare `in-progress`) — Impatto: MEDIO

- La query `getStaffStatusForDate` filtra per `dayOfWeek`; deve filtrare per data specifica
- Il tipo di ritorno passa da singola fascia a array di fasce `[{ locationId, startTime, endTime }]`
- La visualizzazione agenda (`ScheduleGrid`, `ScheduleTimeline`) deve mostrare più bande evidenziate per persona
- Il `PersonHeader` deve visualizzare più fasce orarie/sedi per lo stesso giorno

**Story 4-2-creazione-appuntamento-rapido** (attualmente: `review`) — Impatto: MEDIO

- La validazione del turno durante la creazione dell'appuntamento deve usare la data specifica
- La pre-compilazione della sede deve determinare in quale fascia della data specifica ricade l'orario dell'appuntamento

**Story 4-3-cancellazione-e-spostamento-appuntamenti** (attualmente: `in-progress`) — Impatto: BASSO

- La validazione `moveAppointment` (shift boundary check) usa `dayOfWeek` indirettamente tramite `getStaffStatusForDate`; una volta aggiornata la query, la modifica è automatica
- `findAlternativeSlots` deve cercare slot nelle fasce della data specifica

### 2.2 Impatto sugli Artefatti

#### PRD
- **FR34** (introdotto con sprint-change-proposal-2026-03-14): attualmente "Assign collaborators to locations by day of week" → da aggiornare

#### Architettura — Schema DB

```
PRIMA — userLocationAssignments:
  id | userId | locationId | dayOfWeek (INTEGER 0-6) | startTime (HH:mm) | endTime (HH:mm) | tenantId

DOPO — userLocationAssignments:
  id | userId | locationId | date (DATE - data specifica YYYY-MM-DD) | startTime (HH:mm) | endTime (HH:mm) | tenantId
```

> Nota: il modello "una riga = un turno" rimane valido. Le fasce multiple per giorno sono già supportate architetturalmente (più righe con stesso userId+date). Il cambiamento è minimale: si sostituisce `dayOfWeek` con `date`.

#### Architettura — Queries e Actions
- `getStaffStatusForDate`: cambio filtro + cambio tipo di ritorno (array di shifts)
- `saveWeeklyCalendar` → `saveDayShifts`
- Eliminare helper `getIsoDayOfWeek`
- Aggiunta validazione overlap: nessuna sovrapposizione di turni per stesso userId+date

#### UX — StaffScheduleCalendar
- Da: griglia 7 colonne (Lun-Dom) con un campo per giorno
- A: calendario mensile (shadcn/ui `Calendar`) con indicatori sui giorni con turni configurati + pannello multi-shift per data selezionata

#### UX — Agenda (ScheduleGrid / ScheduleTimeline)
- Ogni persona può avere più bande evidenziate nel grid (non una sola fascia verde)
- `PersonHeader`: da `"09:00-18:00"` a `"09:00-13:00 Sede A • 15:00-19:00 Sede B"` (se turni multipli)
- Logica status per slot: per ogni slot orario, determinare quale turno dell'operatore lo copre

---

## Sezione 3: Approccio Raccomandato

### Scelta: Opzione 1 — Direct Adjustment

**Rationale:**

| Criterio | Valutazione |
|----------|-------------|
| Dati di produzione | Nessuno — migration senza rischi |
| Entità del cambiamento schema | Minima: 1 colonna (`dayOfWeek` → `date`) |
| Architettura row-per-shift | Già corretta — supporta nativamente fasce multiple e sede per fascia |
| Rollback necessario | No — la struttura è salvagibile con modifica mirata |
| Impatto MVP | Zero — questa è la definizione corretta del MVP |

**Opzione 2 (Rollback):** Non necessaria. Il modello "una riga = un turno" è già quello giusto; non c'è logica da revertire, solo il campo `dayOfWeek` da sostituire.

**Opzione 3 (MVP Review):** Non applicabile. Il requisito è corretto e appartiene al MVP.

**Rischio:** Basso  
**Effort:** Medio (1 story rewrite + 3 story update)

---

## Sezione 4: Proposte di Modifica Dettagliate

### M1 — Schema DB (Story 2-4)

**Story:** 2-4-assegnazione-collaboratori-sedi-calendario  
**File:** `src/lib/db/schema.ts`

```typescript
// OLD:
dayOfWeek: integer('day_of_week').notNull(), // 0=Monday (ISO 8601)

// NEW:
date: date('date').notNull(), // YYYY-MM-DD — data specifica di calendario
```

**Drizzle migration:** drop column `day_of_week`, add column `date DATE NOT NULL`

**Rationale:** Ogni riga rappresenta già un singolo turno. Sostituendo il giorno della settimana con la data specifica, le fasce multiple per lo stesso giorno diventano naturalmente supportate (più righe con stesso userId+date, orari diversi, sedi diverse).

---

### M2 — Validazioni Zod (Story 2-4)

**File:** `src/lib/validations/staff.ts`

```typescript
// OLD:
export const assignUserToLocationSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine(data => data.endTime > data.startTime, { message: "endTime must be after startTime" });

// NEW:
export const assignUserToLocationSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: z.string().date(), // YYYY-MM-DD
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine(data => data.endTime > data.startTime, { message: "endTime deve essere dopo startTime" });
```

```typescript
// OLD:
export const saveWeeklyCalendarSchema = z.object({
  userId: z.string().uuid(),
  assignments: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    locationId: z.string().uuid(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

// NEW:
export const saveDayShiftsSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(), // YYYY-MM-DD
  shifts: z.array(z.object({
    locationId: z.string().uuid(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })),
});
```

**Rationale:** Il salvataggio diventa per singola data, non per settimana intera. Il modello shifts[] per data è coerente con il concetto di fasce multiple per giorno.

---

### M3 — Server Actions (Story 2-4)

**File:** `src/lib/actions/staff.ts`

```typescript
// OLD: saveWeeklyCalendar — cancella tutto e reinserisce per userId
export const saveWeeklyCalendar = authActionClient
  .schema(saveWeeklyCalendarSchema)
  .action(async ({ parsedInput: { userId, assignments }, ctx: { tenantId } }) => {
    await db.transaction(async (tx) => {
      await tx.delete(userLocationAssignments).where(
        and(eq(userLocationAssignments.userId, userId), eq(userLocationAssignments.tenantId, tenantId))
      );
      if (assignments.length > 0) {
        await tx.insert(userLocationAssignments).values(
          assignments.map(a => ({ ...a, userId, tenantId }))
        );
      }
    });
  });

// NEW: saveDayShifts — cancella e reinserisce i turni per userId+date specifica
export const saveDayShifts = authActionClient
  .schema(saveDayShiftsSchema)
  .action(async ({ parsedInput: { userId, date, shifts }, ctx: { tenantId } }) => {
    await db.transaction(async (tx) => {
      await tx.delete(userLocationAssignments).where(
        and(
          eq(userLocationAssignments.userId, userId),
          eq(userLocationAssignments.date, date),
          eq(userLocationAssignments.tenantId, tenantId)
        )
      );
      if (shifts.length > 0) {
        await tx.insert(userLocationAssignments).values(
          shifts.map(s => ({ ...s, userId, date, tenantId }))
        );
      }
    });
  });
```

**Eliminare:** helper `getIsoDayOfWeek(date)` in `src/lib/queries/staff.ts` — non più necessario.

**Rationale:** La replace strategy rimane (atomica, semplice), ma è ora scoped alla data specifica invece che all'intera settimana dell'utente.

---

### M4 — Query `getStaffStatusForDate` (Story 4-1)

**File:** `src/lib/queries/staff.ts`

```typescript
// OLD — tipo di ritorno: singola fascia o null
// Filtro: WHERE dayOfWeek = getIsoDayOfWeek(date)
// Restituisce: { status: 'active'|'elsewhere'|'unassigned', locationId?, startTime?, endTime? }

// NEW — tipo di ritorno: array di fasce
// Filtro: WHERE date = specificDate
export type ShiftStatus = {
  locationId: string;
  locationName: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: 'active' | 'elsewhere'; // 'active' = questa sede, 'elsewhere' = altra sede
};

export type StaffDateStatus = {
  userId: string;
  userName: string;
  overallStatus: 'active' | 'elsewhere' | 'unassigned';
  shifts: ShiftStatus[]; // vuoto se unassigned
};

// La query ritorna i turni per userId+date, poi classifica ciascuno
// rispetto alla locationId della vista corrente
```

**Rationale:** Con fasce multiple per giorno un operatore può essere "attivo" in mattinata presso Sede A e "altrove" nel pomeriggio (Sede B). Il tipo di ritorno deve riflettere questa granularità per fascetta oraria.

---

### M5 — UI StaffCalendarEditor (Story 2-4)

**Componente:** `StaffScheduleCalendar.tsx` → rinominare/riscrivere come `StaffCalendarEditor.tsx`

```
PRIMA — StaffScheduleCalendar:
  ┌────────────────────────────────────────┐
  │  LUN  MAR  MER  GIO  VEN  SAB  DOM    │
  │  [forma orario + sede per ogni giorno] │
  │                         [Salva settimana] │
  └────────────────────────────────────────┘

DOPO — StaffCalendarEditor:
  ┌─────────────────────────────────────────────────┐
  │         Aprile 2026                             │
  │  [Calendario mensile con • sui giorni con turni]│
  │                                                 │
  │  Turni per Martedì 26 Aprile 2026              │
  │  ┌─────────────────────────────────────────┐   │
  │  │ 09:00 – 13:00  [Sede A ▼]  [× Rimuovi] │   │
  │  │ 15:00 – 18:00  [Sede B ▼]  [× Rimuovi] │   │
  │  └─────────────────────────────────────────┘   │
  │  [+ Aggiungi fascia]              [Salva giorno]│
  └─────────────────────────────────────────────────┘
```

**shadcn/ui components utilizzati:** `Calendar` (già presente), `Card`, `Button`, `Select` (per sede), time inputs esistenti.

**Rationale:** Il calendario mensile permette di navigare date specifiche. L'indicatore visivo (dot) sui giorni con turni configurati dà visibilità immediata al piano. Il pannello turni per data selezionata supporta nativamente fasce multiple con sede indipendente.

---

### M6 — Visualizzazione Agenda Multi-Fascia (Story 4-1)

**ScheduleGrid.tsx (desktop):**

```
PRIMA:
  Ogni persona → una banda verde (startTime–endTime del singolo turno)

DOPO:
  Ogni persona → N bande, una per ogni fascia del giorno
  - Banda verde:  fascia attiva a questa sede
  - Banda gialla: fascia presso altra sede
  - Resto:        grigio muted (fuori turno)
```

**PersonHeader.tsx:**

```
PRIMA:
  "Sara Bianchi"
  "09:00 – 18:00"    ← singola fascia

DOPO:
  "Sara Bianchi"
  "09:00-13:00 Sede A  •  15:00-18:00 Sede B"  ← fasce multiple
  (se tutte stessa sede: "09:00-13:00 • 15:00-18:00  Sede A")
```

**Rationale:** Rispecchia la realtà operativa dove un operatore può lavorare in due sessioni distinte in sedi diverse nello stesso giorno.

---

### M7 — Validazione Appuntamenti per Data Specifica (Stories 4-2 e 4-3)

**`moveAppointment` (4-3) — shift boundary check:**

```typescript
// OLD:
// WHERE userId = newUserId AND dayOfWeek = getIsoDayOfWeek(newDate)

// NEW:
// WHERE userId = newUserId AND date = newDate
// trova quale shift copre l'orario newTime–(newTime+duration)
// se nessuno shift copre l'orario → errore OUTSIDE_SHIFT
```

**`createAppointment` / `quickBookAppointment` (4-2) — validazione e pre-fill sede:**

```typescript
// OLD:
// Valida turno per dayOfWeek; pre-compila sede dal turno settimanale

// NEW:
// 1. Carica shifts per userId+date specifica
// 2. Trova shift che copre startTime–endTime dell'appuntamento
// 3. Pre-compila locationId dal shift trovato
// 4. Se nessun shift copre l'orario → warning (appuntamento fuori turno)
```

**Rationale:** Con turni per data specifica, la pre-compilazione della sede deve essere derivata dal turno della data dell'appuntamento, non da un pattern settimanale.

---

## Sezione 5: Implementation Handoff

**Classificazione scope: MODERATA**

### Responsabilità per ruolo

| Ruolo | Azioni |
|-------|--------|
| **SM / PO** | Aggiornare `sprint-status.yaml`: `2-4` → `in-progress`, `4-1` → `in-progress`; aggiornare story file `2-4` con nuovi AC (vedi sotto) |
| **Architetto** | Aggiornare `architecture.md`: schema `userLocationAssignments`, return type `getStaffStatusForDate`, eliminare helper `getIsoDayOfWeek` |
| **PM** | Aggiornare `prd.md`: FR34 ("by day of week" → "per data di calendario, fasce multiple, sede per fascia") |
| **Developer** | Drizzle migration + implementazione stories 2-4 (rewrite), 4-1 (update), 4-2 (update), 4-3 (update) |

### Aggiornamento AC Story 2-4

```
AC VECCHI (da rimuovere/aggiornare):
- Admin può visualizzare/modificare la settimana tipo dell'operatore
- Non è possibile assegnare la stessa sede due volte nello stesso giorno della settimana

AC NUOVI:
- GIVEN l'admin è nella pagina Staff, WHEN seleziona un operatore e una data nel calendario,
  THEN vede le fasce lavorative configurate per quella data specifica
- GIVEN l'admin sta editando i turni di una data, WHEN aggiunge una fascia,
  THEN può specificare sede, ora inizio e ora fine indipendentemente
- GIVEN l'admin sta editando i turni di una data, WHEN tenta di aggiungere una fascia che si sovrappone,
  THEN riceve un errore di validazione
- GIVEN l'admin salva i turni di una data, WHEN ha più fasce configurate,
  THEN tutte le fasce sono salvate e associate alla data specifica (non al giorno della settimana)
- GIVEN non ci sono fasce configurate per una data, THEN la data non mostra indicatori nel calendario
```

### Sequenza di implementazione raccomandata

```
1. Story 2-4 (REWRITE)
   └── Drizzle migration: dayOfWeek → date
   └── Aggiornare schema.ts, validations/staff.ts, actions/staff.ts, queries/staff.ts
   └── Nuovo componente StaffCalendarEditor.tsx
   └── Test: aggiunta/rimozione turni per date diverse

2. Story 4-1 (UPDATE)
   └── Aggiornare getStaffStatusForDate: filtro + return type
   └── Aggiornare ScheduleGrid: multi-band per persona
   └── Aggiornare PersonHeader: display fasce multiple
   └── Test: agenda con operatori multi-fascia

3. Story 4-2 (UPDATE)
   └── Aggiornare quickBookAppointment: validazione + pre-fill sede per data specifica
   └── Test: creazione appuntamento fuori/dentro turno

4. Story 4-3 (CONTINUE — già in-progress)
   └── La modifica è automatica una volta aggiornata getStaffStatusForDate
   └── Verificare moveAppointment shift boundary check con nuova query
   └── Completare Task 3 (integrazione UI) con la nuova logica
```

### Success Criteria

- [ ] Un operatore può avere turni diversi per ogni giorno del calendario (nessuna ripetizione settimanale)
- [ ] Per ogni giorno è possibile aggiungere più fasce orarie indipendenti
- [ ] Ogni fascia può avere una sede diversa
- [ ] Il calendario Staff mostra visivamente i giorni con turni configurati
- [ ] L'agenda mostra tutte le fasce orarie per ogni persona nel giorno visualizzato
- [ ] La creazione e lo spostamento di appuntamenti validano il turno per la data specifica
- [ ] La pre-compilazione della sede in fase di prenotazione usa il turno della data dell'appuntamento

---

*Proposta generata il 2026-04-26 tramite workflow correct-course (BMad Method v6.0.0-Beta.7)*
