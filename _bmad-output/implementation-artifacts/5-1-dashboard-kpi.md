# Dev Agent Record — Story 5.1: Dashboard KPI con Delta Mensile e Grafici

**Status:** Completed  
**Branch:** 4-6-vista-settimanale-agenda  
**Date:** 2026-04-27  
**Sprint Change Proposal:** sprint-change-proposal-2026-04-27-dashboard-kpi.md

---

## Summary

Sostituisce la dashboard placeholder con una pagina gestionale completa: 4 KPI card con delta mensile, grafico di andamento settimanale, grafico ricavi mensili e donut distribuzione servizi.

---

## File List

### Nuovi

| File | Tipo | Descrizione |
|------|------|-------------|
| `src/lib/queries/dashboard.ts` | Query | 4 funzioni aggregate: KPI, trend settimanale, ricavi mensili, distribuzione servizi |
| `src/components/dashboard/KpiCard.tsx` | Component (Server) | Card KPI con badge delta (▲ verde / ▼ rosso / — grigio) |
| `src/components/dashboard/WeeklyTrendChart.tsx` | Component (Client) | BarChart recharts — appuntamenti per settimana, ultime 8 settimane |
| `src/components/dashboard/MonthlyRevenueChart.tsx` | Component (Client) | AreaChart recharts — ricavi mensili, ultimi 6 mesi |
| `src/components/dashboard/ServicesDistributionChart.tsx` | Component (Client) | PieChart recharts — distribuzione servizi mese corrente, top 5 |
| `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-27-dashboard-kpi.md` | Documento | Sprint Change Proposal |

### Modificati

| File | Modifica |
|------|----------|
| `src/app/(auth)/dashboard/page.tsx` | Sostituito placeholder con Server Component completo |
| `_bmad-output/planning-artifacts/epics.md` | Story 5.1 ridefinita con nuovi AC |
| `package.json` | Aggiunta dipendenza `recharts@^3.8.1` |

---

## Architecture Decisions

- **Server Component** per la dashboard page: tutti i dati pre-fetchati con `Promise.all` — nessun indicatore di caricamento (soddisfa NFR1)
- **Chart components come Client Components** (`'use client'`): necessario per Recharts che richiede DOM APIs
- **Scope tenant-wide** (non filtrato per sede): la dashboard è una vista gestionale globale, non operativa per sede
- **Prezzi in centesimi → EUR**: conversione `/100` + `Intl.NumberFormat('it-IT', { currency: 'EUR' })`
- **Delta calcolo**: `Math.round(((curr - prev) / prev) * 100)` — se `prev === 0 && curr > 0` ritorna `100`

---

## Change Log

| Versione | Data | Autore | Descrizione |
|----------|------|--------|-------------|
| 1.0 | 2026-04-27 | Dev Agent | Implementazione completa Story 5.1 — dashboard KPI + grafici |
