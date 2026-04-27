# Sprint Change Proposal — Agenda per Persone

**Data:** 2026-03-14
**Autore:** Bob (Scrum Master)
**Approvato da:** Samueles
**Stato:** Approvato

---

## 1. Riepilogo Problema

Durante l'implementazione dell'Epica 4 (Agenda e Appuntamenti), story 4-3 (Cancellazione e Spostamento), è emerso che il modello organizzativo del salone reale è basato sulle **persone** (chi lavora), non sulle **postazioni** (dove si lavora).

**Cambiamento richiesto:**
1. Rimuovere gli orari dalle postazioni
2. Assegnare collaboratori e amministratori a sedi (variabile per giorno della settimana, mai in contemporanea su più sedi)
3. Creare un calendario settimanale di disponibilità per collaboratori (informativo, nessuna logica di blocco)
4. L'agenda mostra persone come colonne (non postazioni), con vista 24h
5. Per ogni persona, evidenziare visivamente: attiva sulla sede (colore pieno), assegnata ad altra sede (colore chiaro), non assegnata (stato neutro)

**Tipo di cambiamento:** Nuovi requisiti emersi dallo stakeholder durante l'implementazione.

---

## 2. Analisi d'Impatto

### Impatto sulle Epiche

| Epica | Impatto | Dettaglio |
|-------|---------|-----------|
| **Epica 2** (Configurazione Salone) | Alto | Story 2.3 semplificata (rimossi orari), nuova Story 2.4 (assegnazione utenti-sedi + calendario) |
| **Epica 4** (Agenda e Appuntamenti) | Alto | Story 4.1 riscritta (agenda per persone 24h), Story 4.2 e 4.3 modificate |
| Epica 1 (Accesso e Sicurezza) | Basso | Utenti ora hanno relazione con sedi, auth/RBAC invariati |
| Epica 3 (Clienti e Cani) | Nessuno | Non impattata |
| Epica 5 (Dashboard) | Basso | Metriche da "per postazione" a "per persona" |
| Epica 6 (GDPR) | Nessuno | Non impattata |

### Impatto sugli Artefatti

**PRD:**
- FR modificati: FR6, FR8, FR20, FR21, FR26, FR29
- FR invariato: FR7 (servizi abilitati restano per postazione)
- FR nuovi: FR34 (assegnazione utenti a sedi), FR35 (visualizzazione stato persone in agenda)
- Sezioni narrative aggiornate: Executive Summary, Capacità Must-Have, Journey 1 e 4, Tracciabilità, Modello Permessi

**Architecture:**
- Schema DB: rimuovere `station_schedules`, creare `user_location_assignments`, modificare `appointments` (aggiungere `user_id`, rendere `station_id` opzionale)
- Project Structure: `StationColumn` → `PersonColumn`, nuovo `PersonHeader`, nuova directory `staff/`
- Actions/Validations: nuovi `staff.ts`
- Query Keys: nuove chiavi per `staff`
- Validazione sovrapposizione: da `stationId + timeRange` a `userId + timeRange`

**UX Design:**
- `ScheduleGrid`: colonne = persone, vista 24h, stati visivi per turno
- `ScheduleTimeline`: tab = persone con badge stato
- Nuovi componenti: `PersonColumn`, `PersonHeader`
- `AppointmentForm`: campo persona (pre-compilato), postazione opzionale
- Nuova pagina: Gestione Personale (calendario settimanale)
- Nuovi design tokens: palette stati persona (attivo/altrove/non assegnato)

**Codice implementato:**
- Story 2.3 (review): rimuovere parte orari, mantenere servizi abilitati
- Story 4.1, 4.2, 4.3 (review/in-progress): refactoring riferimenti `stationId` → `userId`

---

## 3. Approccio Raccomandato

**Percorso scelto: Aggiustamento Diretto**

Modificare le story esistenti e aggiungerne di nuove all'interno delle Epiche 2 e 4. Nessun rollback, nessuna riduzione scope MVP.

**Rationale:**
- Il codice è recente e in review/in-progress, facilmente modificabile
- Componenti UI, server actions e validazioni riutilizzabili al 70-80%
- Lo scope MVP non cambia: si sostituisce il modello (postazione → persona) senza aggiungere funzionalità
- L'ordine epiche resta invariato (Epica 2 prima di Epica 4)

**Alternative scartate:**
- Rollback: meno efficiente, il codice esistente è riutilizzabile
- Riduzione scope: non necessaria, il volume di lavoro è comparabile

**Effort:** Medio-Alto
**Rischio:** Medio (codice non in produzione, nessun utente impattato)

---

## 4. Proposte di Modifica Dettagliate

### 4.1 Schema Database

**RIMUOVERE** tabella `station_schedules`:
- Motivo: gli orari non sono più sulle postazioni

**CREARE** tabella `user_location_assignments`:
```typescript
export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=dom, 1=lun, ..., 6=sab
  startTime: text('start_time').notNull(),     // es. "09:00"
  endTime: text('end_time').notNull(),         // es. "18:00"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**MODIFICARE** tabella `appointments`:
```
OLD: stationId: uuid('station_id').notNull()
NEW: stationId: uuid('station_id')              // opzionale
     userId: uuid('user_id').notNull()           // persona che esegue
```

### 4.2 PRD — Requisiti Funzionali

**FR modificati:**
- FR6: "...creare postazioni per ciascuna sede (entità fisiche del salone)"
- FR8: "...configurare un calendario settimanale di disponibilità per ogni collaboratore, specificando sede assegnata e fascia oraria per ogni giorno (informativo, senza logica di blocco)"
- FR20: "...selezionando cliente, cane, servizio, persona e fascia oraria (la postazione è opzionale, suggerita dal servizio)"
- FR21: "...impedisce la creazione di appuntamenti sovrapposti sulla stessa persona"
- FR26: "...agenda giornaliera organizzata per sede e persona, con vista 24 ore"
- FR29: "...distinguere per ogni persona lo stato: attiva sulla sede, assegnata ad altra sede, non assegnata"

**FR nuovi:**
- FR34: Assegnazione utenti a sedi per giorno della settimana (un utente non può essere assegnato a più sedi nello stesso giorno)
- FR35: L'agenda mostra tutte le persone associate alla sede, con evidenziazione visiva dello stato di disponibilità

### 4.3 Architecture

- Rimuovere `station_schedules` da schema e riferimenti
- Aggiungere `user_location_assignments` con pattern Drizzle standard
- Modificare `appointments`: aggiungere `userId`, rendere `stationId` opzionale
- Rinominare `StationColumn` → `PersonColumn`, aggiungere `PersonHeader`
- Nuova directory `staff/` per componenti gestione personale
- Nuovi file: `actions/staff.ts`, `validations/staff.ts`
- Aggiornare TanStack Query Keys per `staff`
- Validazione sovrapposizione: per `userId` invece che `stationId`

### 4.4 UX Design

- `ScheduleGrid`: colonne = persone, vista 24h, 3 stati visivi turno
- `ScheduleTimeline`: tab = persone con badge stato
- Nuovi componenti: `PersonColumn`, `PersonHeader`
- `AppointmentForm`: persona pre-compilata, postazione opzionale
- Nuova pagina Gestione Personale: calendario settimanale editabile
- Design tokens: `#E8F0ED` (attivo), `#FEF3C7` (altrove), `#F9FAFB` (non assegnato)

### 4.5 Epics e Stories

**Epica 2:**
- Story 2.3 semplificata: "Gestione Postazioni con Servizi Abilitati" (rimossi orari)
- Story 2.4 nuova: "Assegnazione Collaboratori a Sedi e Calendario Disponibilità"
- FRs aggiornati: FR5, FR6, FR7, FR9, FR10, FR11, FR34

**Epica 4:**
- Story 4.1 riscritta: "Vista Agenda per Sede e Persona" (24h, stati visivi)
- Story 4.2 modificata: persona pre-compilata, postazione opzionale, sovrapposizione per persona
- Story 4.3 modificata: spostamento tra persone possibile
- FRs aggiornati: FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR35

---

## 5. Handoff Implementazione

### Classificazione Scope: **Moderato**

Richiede riorganizzazione backlog e aggiornamento artefatti prima dell'implementazione.

### Piano Handoff

| Fase | Responsabile | Azione | Priorità |
|------|-------------|--------|----------|
| 1 | PM (John) | Aggiornare PRD con FR modificati e nuovi (FR8, FR20, FR21, FR26, FR29, FR34, FR35) | Alta |
| 2 | Architect (Winston) | Aggiornare Architecture (schema DB, project structure, patterns) | Alta |
| 3 | UX Designer (Sally) | Aggiornare UX spec (componenti agenda, pagina staff, design tokens) | Alta |
| 4 | SM (Bob) | Aggiornare epics.md e sprint-status.yaml con story modificate/nuove | Alta |
| 5 | Dev (Amelia) | Story 2.3 modificata → Story 2.4 nuova → Story 4.1 riscritta → Story 4.2 → Story 4.3 | Sequenziale |

### Criteri di Successo

- [ ] Schema DB migrato: `station_schedules` rimossa, `user_location_assignments` creata, `appointments` aggiornata
- [ ] Agenda mostra persone come colonne con vista 24h
- [ ] 3 stati visivi persona funzionanti (attivo/altrove/non assegnato)
- [ ] Calendario settimanale collaboratori editabile
- [ ] Appuntamenti associati a persona, sovrapposizione validata per persona
- [ ] Postazione opzionale sull'appuntamento, servizi filtrati per postazione quando selezionata

### Sequenza Implementazione

```
Story 2.3 (mod) → Story 2.4 (nuova) → Story 4.1 (riscritta) → Story 4.2 (mod) → Story 4.3 (mod) → Story 4.4 (invariata)
```

---

## 6. Aggiornamenti Sprint Status

### Modifiche a `sprint-status.yaml`

```yaml
# Epica 2: aggiungere story 2.4
2-4-assegnazione-collaboratori-sedi-calendario: backlog

# Epica 4: story 4.1, 4.2, 4.3 tornano a ready-for-dev per riscrittura
4-1-vista-agenda-per-sede-e-persona: ready-for-dev
4-2-creazione-appuntamento-rapido: ready-for-dev
4-3-cancellazione-e-spostamento-appuntamenti: ready-for-dev
```
