# Sprint Change Proposal — Dashboard KPI con Delta Mensile e Grafici

**Data:** 2026-04-27
**Progetto:** dog-grooming
**Branch corrente:** 4-6-vista-settimanale-agenda
**Classificazione scope:** Medio

---

## Sezione 1: Riepilogo del Problema

### Problema

La Story 5.1 attuale prevede una dashboard rudimentale con 4 metriche giornaliere statiche (appuntamenti oggi, prossimo appuntamento, slot liberi, incasso giornaliero). Il proprietario del salone ha bisogno di una visione **gestionale** del business, non solo operativa della giornata.

**Il requisito emerso:**

Marco (titolare) vuole rispondere a domande come:
- "Sto crescendo rispetto al mese scorso?"
- "Quali servizi stanno rendendo di più questo mese?"
- "Il fatturato è in linea con il mese precedente?"
- "Ho più o meno appuntamenti rispetto ai mesi passati?"

La dashboard attuale (placeholder) non risponde a nessuna di queste domande.

### Contesto di scoperta

Emerso durante lo sprint di Story 4-6. Il titolare usa quotidianamente l'agenda e sente la mancanza di una vista strategica che supporti decisioni gestionali (pianificazione, comunicazione con i clienti, valutazione dei servizi).

### Evidenza tecnica

| Elemento | Posizione | Stato |
|----------|-----------|-------|
| `DashboardCard` componente | `ux-design-specification.md` | Dichiarato, mai implementato |
| FR30: "visione d'insieme dell'attività" | `prd.md` | Definizione troppo vaga per essere implementata |
| `dashboard/page.tsx` | `src/app/(auth)/dashboard/page.tsx` | Placeholder statico |
| `queries/dashboard.ts` | `src/lib/queries/` | Non esiste |

---

## Sezione 2: Analisi dell'Impatto

### 2.1 KPI Proposti

Basati su analisi dello schema DB (`appointments`, `clients`, `services`, `userLocationAssignments`):

**KPI con delta mese precedente:**

| KPI | Dati | Formula Delta |
|-----|------|---------------|
| Appuntamenti mese corrente | `COUNT(appointments WHERE month = now)` | `(curr - prev) / prev * 100%` |
| Incasso confermato mese | `SUM(price WHERE startTime <= now AND month = now)` | Idem |
| Previsione incasso mese | `SUM(price WHERE month = now)` inclusi futuri | Idem |
| Nuovi clienti mese | `COUNT(clients WHERE createdAt in month)` | `curr - prev` (assoluto) |

**KPI operativo (oggi):**
- Appuntamenti oggi (count rapido)

### 2.2 Grafici Proposti

| Grafico | Tipo | Dati | Periodo |
|---------|------|------|---------|
| Andamento appuntamenti | BarChart (Recharts) | COUNT per settimana | Ultime 8 settimane |
| Ricavi mensili | AreaChart (Recharts) | SUM(price) mese per mese | Ultimi 6 mesi |
| Distribuzione servizi | PieChart (Recharts) | COUNT + SUM per servizio | Mese corrente, top 5 |

### 2.3 Impatto sugli Epic

#### Epica 5 — Dashboard (backlog) — Impatto: ALTO (sostituzione story)

**Story 5.1 sostituita** con nuova definizione più ricca. Stessa ID, scope espanso.

#### Tutti gli altri epic — Impatto: NULLO

### 2.4 Impatto sugli Artefatti

#### Schema DB — Invariato

Tutti i dati necessari sono già nel DB:
- `appointments.price`, `appointments.startTime`, `appointments.endTime`
- `clients.createdAt`
- `services.name`

#### Nuove dipendenze

- `recharts@^2.15` — libreria grafici (Recharts, React 19-compatibile)

#### Nuovi file

- `src/lib/queries/dashboard.ts` — 4 funzioni di query aggregate
- `src/components/dashboard/KpiCard.tsx` — card con valore, etichetta, delta badge
- `src/components/dashboard/WeeklyTrendChart.tsx` — BarChart settimanale
- `src/components/dashboard/MonthlyRevenueChart.tsx` — AreaChart mensile
- `src/components/dashboard/ServicesDistributionChart.tsx` — PieChart servizi

#### File modificati

- `src/app/(auth)/dashboard/page.tsx` — sostituzione placeholder con Server Component completo

---

## Sezione 3: Approccio Raccomandato

### Scelta: Opzione 1 — Direct Adjustment

**Rationale:**

| Criterio | Valutazione |
|----------|-------------|
| Story 5.1 è placeholder | Sì — zero logica da preservare, sostituzione totale |
| Schema DB | Invariato |
| Nuove query | Solo aggregazioni READ, no side effects |
| Recharts | Libreria matura, React 19 compatible, zero breaking changes |
| Rollback necessario | No |

**Rischio:** Basso  
**Effort:** Medio (1 giornata — 5 file nuovi + 1 aggiornamento)

---

## Sezione 4: Proposte di Modifica Dettagliate

### M1 — Story 5.1: Nuova Definizione

```
VECCHIO:
Story 5.1: Dashboard con 4 card giornaliere statiche (appuntamenti oggi,
prossimo appuntamento, slot liberi, incasso previsto giornata).

NUOVO:
Story 5.1: Dashboard KPI con delta mensile e grafici di tendenza.

KPI Cards (4):
- Appuntamenti mese corrente + delta % vs mese precedente
- Incasso confermato mese + delta % vs mese precedente
- Previsione incasso mese (inclusi futuri) + delta % vs mese precedente
- Nuovi clienti mese + delta assoluto vs mese precedente

KPI Operativo (1):
- Appuntamenti oggi

Grafici:
- BarChart: andamento settimanale appuntamenti (ultime 8 settimane)
- AreaChart: ricavi mensili (ultimi 6 mesi)
- PieChart: distribuzione servizi mese corrente (top 5)
```

### M2 — Architettura: Nuove Query Dashboard

```
AGGIUNGERE queries/dashboard.ts:
- getDashboardKPIs(tenantId): KPI mese corrente + precedente + oggi
- getWeeklyAppointmentsTrend(tenantId): count per settimana, ultime 8
- getMonthlyRevenueTrend(tenantId): sum price per mese, ultimi 6
- getServicesDistribution(tenantId): count + revenue per servizio, mese corrente

AGGIUNGERE dipendenza: recharts@^2.15
```

### M3 — UX: Layout Dashboard

```
Desktop (>= 1024px):
┌──────────────────────────────────────────────────────────────┐
│  Dashboard — Aprile 2026                                      │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│ Appt.    │ Incasso  │ Prevision│ Nuovi clienti                │
│ mese     │ conferm. │ mese     │ mese                         │
│ 42 ▲15%  │ €1.234   │ €1.890   │ 8 ▲2 vs prev                │
│          │ ▲8%      │ ▼3%      │                              │
├──────────┴──────────┴──────────┴──────────────────────────────┤
│ Appuntamenti oggi: 5                                          │
├─────────────────────────────┬────────────────────────────────┤
│ Andamento settimanale       │ Servizi mese corrente          │
│ (BarChart 8 settimane)      │ (PieChart top 5)               │
├─────────────────────────────┴────────────────────────────────┤
│ Ricavi mensili — ultimi 6 mesi (AreaChart)                   │
└──────────────────────────────────────────────────────────────┘

Mobile (< 768px):
- KPI cards impilate (1 colonna)
- Charts a piena larghezza, scrollabili verticalmente
```

---

## Sezione 5: Implementation Handoff

**Classificazione scope: MEDIO**

### Responsabilità per ruolo

| Ruolo | Azioni |
|-------|--------|
| **PM** | Aggiornare `prd.md`: FR30 estensione con KPI + grafici |
| **Architetto** | Aggiornare `architecture.md`: nuove query dashboard + dipendenza recharts |
| **Developer** | Implementare tutto il piano M1-M3 |

### Sequenza di implementazione

```
Story 5.1 (SOSTITUZIONE — story completamente nuova)
  └── 1. npm install recharts
  └── 2. src/lib/queries/dashboard.ts (4 funzioni)
  └── 3. src/components/dashboard/KpiCard.tsx
  └── 4. src/components/dashboard/WeeklyTrendChart.tsx
  └── 5. src/components/dashboard/MonthlyRevenueChart.tsx
  └── 6. src/components/dashboard/ServicesDistributionChart.tsx
  └── 7. src/app/(auth)/dashboard/page.tsx (Server Component completo)
  └── 8. epics.md: Story 5.1 aggiornata
```

### Success Criteria

- [ ] 4 KPI cards visibili con valore corrente mese e badge delta
- [ ] Badge delta verde (▲) se positivo, rosso (▼) se negativo, grigio se invariato
- [ ] KPI "Appuntamenti oggi" separato e ben visibile
- [ ] BarChart settimanale renderizzato con ultime 8 settimane
- [ ] AreaChart mensile renderizzato con ultimi 6 mesi
- [ ] PieChart distribuzione servizi renderizzato
- [ ] Layout desktop: KPI 4-colonne, grafici 2+1 + full width
- [ ] Layout mobile: tutto impilato verticalmente
- [ ] Nessun indicatore di caricamento (Server Component, dati pre-fetchati)
- [ ] Prezzi formattati in EUR (it-IT)

---

*Proposta generata il 2026-04-27 tramite workflow correct-course (BMad Method v6.0.0-Beta.7)*
