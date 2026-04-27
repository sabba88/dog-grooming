# Sprint Change Proposal — Vista Settimanale Agenda con Evidenza Buchi Operatori

**Data:** 2026-04-26
**Progetto:** dog-grooming
**Branch corrente:** 4-5-prezzo-appuntamento-per-razza
**Classificazione scope:** Minore

---

## Sezione 1: Riepilogo del Problema

### Problema

L'agenda attuale mostra esclusivamente la **vista giornaliera**: un giorno alla volta, con le persone come colonne e le fasce orarie come righe. Non esiste alcun modo per avere una panoramica settimanale dell'attività per operatore.

**Il requisito emerso:**

Marco (titolare) ha bisogno di vedere, per l'intera settimana, **quali ore di turno non sono ancora coperte da appuntamenti ("buchi")** per ciascun operatore. Questo permette di:
1. Ottimizzare il carico di lavoro proponendo appuntamenti nelle fasce libere
2. Identificare rapidamente gli operatori sottoutilizzati in certi giorni
3. Pianificare la settimana senza dover navigare giorno per giorno

### Contesto di scoperta

Emerso durante lo sprint corrente (story 4-5). Il tolettatore pilota usa l'agenda quotidianamente e sente la mancanza di una vista d'insieme settimanale, che nella realtà è il modo in cui pianifica il lavoro su carta.

### Evidenza tecnica

| Elemento | Posizione | Stato |
|----------|-----------|-------|
| `view: 'day' \| 'week'` prop | `ux-design-specification.md` — `ScheduleGrid` | Anticipato ma mai implementato |
| FR26: "agenda **giornaliera**" | `prd.md` | Limite di scope da rimuovere |
| "vista settimanale per sede/postazione" | `ux-design-specification.md` — Core UX | Obiettivo dichiarato mai tradotto in story |

---

## Sezione 2: Analisi dell'Impatto

### 2.1 Impatto sugli Epic

#### Epic 4 — Agenda e Appuntamenti (in-progress) — Impatto: BASSO-MEDIO

**Nessuna story esistente torna in-progress.** Si aggiunge una nuova story al termine dell'epic:

**Story 4-6-vista-settimanale-agenda** (nuova → status `backlog`)

Le story 4-4 (review) e 4-5 (review) rimangono inalterate. Story 4-6 dipende da 4-1 (done), ma può essere implementata indipendentemente da 4-4/4-5.

#### Tutti gli altri epic — Impatto: NULLO

Epic 1, 2, 3, 5, 6 non sono impattati.

### 2.2 Impatto sugli Artefatti

#### PRD — FR26 (modifica minore)

**FR26 attuale:** "L'Amministratore e il Collaboratore possono visualizzare l'agenda giornaliera organizzata per sede e persona, con slot da 15 minuti e range orario ristretto agli orari di apertura della sede"

**FR26 aggiornato:** aggiungere la vista settimanale come opzione (vedi M1).

**Nessun altro FR è in conflitto.** FR27 ("navigare l'agenda tra giorni diversi") si estende naturalmente alla navigazione tra settimane.

#### Architettura — Query

- Nuova funzione `getWeeklyAgendaData(weekStart, locationId, tenantId)` in `queries/appointments.ts` e `queries/staff.ts`
- Nuova utility `computeGaps(shifts, appointments)` in `utils/schedule.ts`
- Nessun cambiamento allo schema DB

#### Architettura — Componenti

- Nuovo componente `WeeklyScheduleView.tsx` in `components/schedule/`
- Aggiornamento `AgendaView.tsx`: toggle "Giorno | Settimana"
- `ScheduleGrid`, `ScheduleTimeline`, `AppointmentForm`: **invariati**

#### UX — Vista settimanale (nuovo concept)

Le props `view: 'day' | 'week'` esistono già in `ScheduleGrid` (UX spec). Il design della visualizzazione "buchi" è un concept nuovo da specificare (vedi M3).

---

## Sezione 3: Approccio Raccomandato

### Scelta: Opzione 1 — Direct Adjustment

**Rationale:**

| Criterio | Valutazione |
|----------|-------------|
| Feature addittiva | Sì — nessun codice esistente da riscrivere |
| Schema DB | Invariato — usa dati già presenti |
| Componenti esistenti | Riutilizzabili — `AppointmentBlock`, pattern query, palette colori |
| Dipendenze | Solo su Story 4-1 (done) |
| Dati di produzione | Nessun rischio — solo lettura |
| Rollback necessario | No |

**Rischio:** Basso
**Effort:** Medio (1 story autonoma, ~1 giorno implementazione)

**Opzione 2 (Rollback):** Non applicabile.
**Opzione 3 (MVP Review):** Non applicabile — la vista settimanale era già nel design originale (`view: 'week'` nelle props UX), questa story completa un obiettivo già dichiarato.

---

## Sezione 4: Proposte di Modifica Dettagliate

### M1 — PRD: Estensione FR26

**File:** `_bmad-output/planning-artifacts/prd.md`
**Sezione:** Agenda e Visualizzazione — FR26

```
VECCHIO:
- FR26: L'Amministratore e il Collaboratore possono visualizzare l'agenda giornaliera
  organizzata per sede e persona, con slot da 15 minuti e range orario ristretto
  agli orari di apertura della sede

NUOVO:
- FR26: L'Amministratore e il Collaboratore possono visualizzare l'agenda in due modalità:
  - **Vista giornaliera:** organizzata per sede e persona, con slot da 15 minuti e range
    orario ristretto agli orari di apertura della sede
  - **Vista settimanale:** panoramica dei 7 giorni, con per ogni operatore la sintesi
    giornaliera di turno, ore coperte da appuntamenti e ore di buco ("gap")
    visivamente evidenziate
```

**Rationale:** La feature era già prevista nell'UX spec (`view: 'day' | 'week'`). Aggiornare il FR allinea PRD e implementazione.

---

### M2 — Architettura: Nuove Query e Utility

**File:** `_bmad-output/planning-artifacts/architecture.md`
**Sezione:** Naming Patterns → esempi query, e Project Structure

```
AGGIUNGERE in queries/appointments.ts:
- getWeeklyAppointmentsByPerson(weekStart, weekEnd, locationId, tenantId)
  → Record<userId, Appointment[]> — appuntamenti per persona per settimana

AGGIUNGERE in queries/staff.ts:
- getWeeklyStaffShifts(weekStart, weekEnd, locationId, tenantId)
  → Record<userId, { date: string, shifts: { start: string, end: string }[] }[]>
  — turni per persona per ogni giorno della settimana

AGGIUNGERE in utils/schedule.ts:
- computeGaps(shifts: TimeInterval[], appointments: TimeInterval[]): TimeInterval[]
  — calcola le fasce del turno non coperte da appuntamenti
  — input: turni del giorno (array di {start, end}), appuntamenti (array di {start, end})
  — output: intervalli liberi ordinati
  — algoritmo: sottrazione di insiemi di intervalli

AGGIUNGERE in components/schedule/:
- WeeklyScheduleView.tsx  — vista settimanale (rows: persone, cols: giorni)
- WeeklyPersonRow.tsx     — riga singola persona nella vista settimanale
- WeeklyDayCell.tsx       — cella giorno per persona con barre turno/appuntamenti/buco
```

---

### M3 — UX: Design Vista Settimanale

**Componente:** `WeeklyScheduleView.tsx` (nuovo)

**Layout desktop (>= 768px):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [◀ Sett. prec.]   21–27 Aprile 2026   [Sett. succ. ▶]    [Giorno|Settimana] │
├───────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│           │  LUN 21  │  MAR 22  │  MER 23  │  GIO 24  │  VEN 25  │  SAB 26  │  DOM 27  │
├───────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Marco A.  │ [████░░] │ [██████] │    —     │ [███░░░] │ [████░░] │    —     │    —     │
│           │ 3h buco  │ 0h buco  │ Non asseg│ 5h buco  │ 2h buco  │          │          │
├───────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Sara B.   │ [████]   │    —     │ [██░░]   │ [████]   │    —     │ [██░░░░] │    —     │
│           │ 0h buco  │          │ 2h buco  │ 0h buco  │          │ 4h buco  │          │
└───────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Legenda barra:**
- `█` grigio scuro: ore coperte da appuntamenti (sul turno)
- `░` righe diagonali primary: **buco** (turno libero senza appuntamenti) — evidenziato
- `—` / cella vuota: persona non assegnata (sfondo grigio, "Non asseg.")

**Click su cella:** naviga alla vista giornaliera del giorno selezionato per quella persona

**Mobile (< 768px):**
- Scroll verticale con accordion per persona
- Ogni riga persona espandibile mostra i 7 giorni in formato compatto (icone/badge)
- Tap su giorno → vista giornaliera

**Design tokens per i buchi:**

```
Buco (gap):    sfondo: pattern diagonale primary #E8F0ED, bordo: #4A7C6F tratteggiato
Copertura:     sfondo: #1A202C (grigio scuro), altezza proporzionale alle ore coperte
Turno totale:  barra grigio chiaro #E2E8F0 come sfondo base
```

**Rationale:** La rappresentazione a barra proporzionale è immediata (come un Gantt compatto). Il buco in verde primary salta all'occhio. Il click su cella mantiene il flusso di lavoro naturale: "vedo il buco → navigo a quel giorno → creo l'appuntamento".

---

### M4 — Epics.md: Aggiunta Story 4-6

**File:** `_bmad-output/planning-artifacts/epics.md`
**Sezione:** Epica 4

```
AGGIUNGERE dopo Story 4.5:

### Story 4.6: Vista Settimanale Agenda con Evidenza Buchi Operatori

As a **Amministratore o Collaboratore**,
I want **visualizzare l'agenda in formato settimanale con i buchi di ogni operatore evidenziati
per ogni giorno**,
So that **possa identificare immediatamente le fasce disponibili e ottimizzare il carico
di lavoro senza navigare giorno per giorno**.

**Acceptance Criteria:**

**Given** un utente è sull'agenda giornaliera
**When** clicca sul toggle "Settimana" nell'header dell'agenda
**Then** la vista passa alla visualizzazione settimanale (WeeklyScheduleView)
**And** sono visibili i 7 giorni della settimana corrente come colonne
**And** ogni operatore della sede corrente occupa una riga

**Given** un operatore ha turni configurati per una data della settimana
**When** la vista settimanale viene renderizzata
**Then** la cella mostra una barra proporzionale con:
  - zona coperta = ore con appuntamenti schedulati (grigio scuro)
  - zona buco = ore del turno senza appuntamenti (pattern diagonale primary #E8F0ED)
**And** sotto la barra viene mostrato il totale ore di buco (es. "3h buco")

**Given** un operatore non ha turni configurati per una data
**When** la vista settimanale viene renderizzata
**Then** la cella mostra "Non asseg." con sfondo grigio chiaro

**Given** un utente vede la vista settimanale
**When** clicca su una cella specifica (persona × giorno)
**Then** la vista passa alla giornata giornaliera per quella data

**Given** un utente è in vista settimanale
**When** clicca le frecce di navigazione
**Then** la vista avanza o retrocede di 7 giorni (settimana precedente / successiva)

**Given** un utente è su mobile (< 768px) e in vista settimanale
**When** la pagina viene renderizzata
**Then** le persone sono elencate verticalmente con i 7 giorni in formato compatto (badge orizzontali)
**And** tap su giorno → navigazione alla vista giornaliera
```

---

### M5 — sprint-status.yaml: Aggiunta Story 4-6

```yaml
# AGGIUNGERE in epic-4:
4-6-vista-settimanale-agenda: backlog  # nuovo: vista settimanale con gap operatori
```

---

## Sezione 5: Implementation Handoff

**Classificazione scope: MINORE**

La feature è interamente addittiva. Non modifica storie esistenti, non cambia lo schema DB, non richiede migration. Può essere sviluppata da sola dopo il completamento di 4-5.

### Responsabilità per ruolo

| Ruolo | Azioni |
|-------|--------|
| **SM / PO** | Aggiornare `sprint-status.yaml`: aggiungere story 4-6 `backlog`; aggiornare epic 4 in `epics.md` con story 4-6 testo completo |
| **PM** | Aggiornare `prd.md`: FR26 estensione (vedi M1) |
| **Architetto** | Aggiornare `architecture.md`: nuove query/utility/componenti (vedi M2) |
| **Developer** | Implementare story 4-6: query + utility + componente + toggle agenda |

### Sequenza di implementazione raccomandata

```
Story 4-6 (NUOVA — dopo completamento 4-5)
  └── 1. Utility computeGaps() in utils/schedule.ts
  └── 2. Query getWeeklyAgendaData() (appointments + staff shifts per settimana)
  └── 3. Componenti WeeklyDayCell, WeeklyPersonRow, WeeklyScheduleView
  └── 4. Aggiornamento AgendaView: toggle Giorno/Settimana + navigazione settimanale
  └── 5. Test: operatori con/senza turni, buchi calcolati correttamente, click → navigazione giornaliera
```

**Dipendenze tecnica:**
- Richiede Story 4-1 (done ✓)
- Non dipende da 4-4, 4-5 (possono procedere in parallelo)
- Nessuna migration DB

### Success Criteria

- [ ] Il toggle "Giorno | Settimana" è visibile nell'header dell'agenda
- [ ] La vista settimanale mostra tutti gli operatori della sede su 7 giorni
- [ ] Per ogni cella (persona × giorno): barra proporzionale con zona coperta + zona buco
- [ ] Le ore di buco sono mostrate come numero (es. "3h buco") e visivamente evidenziate
- [ ] Le celle senza turno mostrano "Non asseg." con sfondo grigio
- [ ] Click su cella → navigazione alla vista giornaliera per quella data
- [ ] Navigazione settimana precedente / successiva funzionante
- [ ] Mobile: layout verticale compatto funzionante
- [ ] Performance: query settimanale senza indicatori di caricamento visibili (NFR1)

---

*Proposta generata il 2026-04-26 tramite workflow correct-course (BMad Method v6.0.0-Beta.7)*
