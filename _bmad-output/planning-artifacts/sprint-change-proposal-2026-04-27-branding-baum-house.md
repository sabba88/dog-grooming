# Sprint Change Proposal — Branding Baum House: Logo e Palette Colori
**Data:** 2026-04-27
**Autore:** Samueles
**Scope:** Minor → Direct Implementation by Dev Team

---

## Sezione 1: Issue Summary

### Problema

La piattaforma dog-grooming utilizza attualmente un'identità visiva generica (verde salvia `#4A7C6F`, iniziali "DG") che non riflette il brand del salone pilota **Baum House**. Il tolettatore ha fornito il logo ufficiale del salone e richiede:

1. **Inserimento del logo** nella sidebar desktop (in basso a sinistra, sopra il pannello Impostazioni) e un aggiornamento coerente della zona header della sidebar
2. **Aggiornamento della palette colori** della piattaforma usando i colori estratti dal logo Baum House, in sostituzione del verde salvia attualmente usato

### Contesto di Scoperta

Richiesta diretta del tolettatore pilota Baum House durante il co-sviluppo della piattaforma. Nessuna story esistente ha rivelato il problema: è un'esigenza di personalizzazione brand emersa naturalmente dalla fase di adozione.

### Evidenza

Logo fornito: `793129cf-2713-4bfe-b8e2-c847d51f7861.webp`
- **"BAUM"** + silhouette cane integrata nella lettera M: colore teal `#4BBFC8`
- **"HOUSE"**: colore coral caldo `#E05C6B`

---

## Sezione 2: Impact Analysis

### Epic Impact

| Epic | Impatto | Tipo |
|------|---------|------|
| Epica 1 — Story 1.2 (Layout Applicazione) | DIRETTO: il logo va aggiunto al Sidebar | Modifica esistente |
| Tutti gli epic | INDIRETTO: cambio palette colori impatta ogni componente che usa `brand-primary` | Design token update |

Nessun epic invalidato. Nessun nuovo epic necessario. Nessuna risequenziazione.

### Story Impact

**Story 1.2: Layout Applicazione e Controllo Accesso per Ruolo**

L'Acceptance Criteria esistente descrive:
> "viene mostrata una Sidebar a sinistra (220px) con le voci di navigazione ... e Impostazioni in fondo"
> "la voce attiva ha sfondo #E8F0ED con bordo sinistro primary"

Impatto:
- Il colore `#E8F0ED` menzionato nei criteri viene sostituito da `#E5F7F9` (teal light Baum House)
- Il colore `#4A7C6F` menzionato nei criteri viene sostituito da `#4BBFC8`
- La sidebar deve mostrare il logo Baum House sopra Impostazioni

**Story 4.6 (in corso):** Nessun impatto funzionale. I componenti `WeeklyScheduleView`, `WeeklyPersonRow`, `WeeklyDayCell` usano le classi `brand-primary` tramite Tailwind — si aggiornano automaticamente con il cambio dei token.

### Artifact Conflicts

| Documento | Sezione | Impatto |
|-----------|---------|---------|
| `ux-design-specification.md` | Visual Design Foundation → Sistema Colori | Aggiornare tutta la tabella palette primaria e la tabella buchi agenda |
| `ux-design-specification.md` | Story 1.2 references ai colori hex | Aggiornare #4A7C6F → #4BBFC8 e #E8F0ED → #E5F7F9 |
| `architecture.md` | Design tokens nel blocco @theme inline | Aggiornare i valori hex nei commenti |
| `epics.md` | Story 1.2 Acceptance Criteria | Aggiornare i colori hex menzionati |

### Technical Impact

File di codice impattati:
- `src/app/globals.css` — definizione design tokens brand-* (intervento principale)
- `src/components/layout/Sidebar.tsx` — aggiunta logo + aggiornamento header
- `public/` — aggiungere asset logo (logo-baum-house.webp)

Nessun impatto su: schema DB, Server Actions, validations, queries, API routes, middleware.

---

## Sezione 3: Recommended Approach

### Percorso: Direct Adjustment (Opzione 1)

**Rationale:** Il cambiamento è puramente cosmetico/branding. Non tocca la logica di business, lo schema dati, le API né i flussi utente. I design token sono centralizzati in `globals.css` con classi Tailwind custom (`brand-primary`, `brand-primary-light`, etc.) usate in modo consistente nel codebase — un singolo aggiornamento si propaga a tutti i componenti senza modifiche individuali.

**Effort:** Basso
**Risk:** Basso (rollback immediato cambiando 4 righe in globals.css)
**Timeline:** 1-2 ore di implementazione + 30 minuti di QA visivo

---

## Sezione 4: Detailed Change Proposals

### Proposta A — Aggiornamento Palette Colori (globals.css)

**File:** `src/app/globals.css`

**OLD (righe 120–130):**
```css
@theme inline {
  --color-brand-primary: #4A7C6F;
  --color-brand-primary-light: #E8F0ED;
  --color-brand-primary-dark: #345A50;
  --color-brand-surface: #F8FAFB;
  --color-brand-border: #E2E8F0;
  --color-brand-text-primary: #1A202C;
  --color-brand-text-secondary: #64748B;
  --color-brand-text-muted: #94A3B8;
  --color-brand-error: #EF4444;
  --color-brand-success: #22C55E;
}
```

**NEW:**
```css
@theme inline {
  --color-brand-primary: #4BBFC8;
  --color-brand-primary-light: #E5F7F9;
  --color-brand-primary-dark: #347D85;
  --color-brand-coral: #E05C6B;
  --color-brand-surface: #F8FAFB;
  --color-brand-border: #E2E8F0;
  --color-brand-text-primary: #1A202C;
  --color-brand-text-secondary: #64748B;
  --color-brand-text-muted: #94A3B8;
  --color-brand-error: #EF4444;
  --color-brand-success: #22C55E;
}
```

**Rationale:** Sostituisce il verde salvia Baum House con i colori teal estratti dal logo. Aggiunge `brand-coral` come token per il colore HOUSE, disponibile per uso futuro (badge, accenti, evidenziazioni). Nessun colore semantico (error, success) viene modificato.

**Nota sui valori hex estratti visivamente dal logo:**
- `#4BBFC8` — teal medio del testo BAUM e silhouette cane
- `#E05C6B` — coral caldo del testo HOUSE
- `#E5F7F9` — teal chiaro derivato (background tints, sfondo voci attive)
- `#347D85` — teal scuro derivato (hover, bordi attivi)

> **⚠️ Nota implementativa:** I valori hex sono estratti visivamente dal file `.webp`. Si consiglia di verificare i valori esatti con un color picker sull'asset originale prima del commit definitivo.

---

### Proposta B — Logo Baum House nel Sidebar (Sidebar.tsx)

**File:** `src/components/layout/Sidebar.tsx`

#### B.1 — SidebarHeader: rimozione placeholder "DG"

Il blocco `SidebarHeader` attuale mostra un avatar generico "DG". Poiché il logo viene aggiunto nel footer, semplificare l'header rimuovendo il placeholder.

**OLD (righe 45–56):**
```tsx
<SidebarHeader className="p-4">
  <div className="flex items-center gap-2">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white text-sm font-bold">
      DG
    </div>
    {!isCollapsed && (
      <span className="text-sm font-semibold text-brand-text-primary">
        Dog Grooming
      </span>
    )}
  </div>
</SidebarHeader>
```

**NEW:**
```tsx
<SidebarHeader className="p-3">
  {!isCollapsed && (
    <span className="text-xs font-medium text-brand-text-muted uppercase tracking-wide px-1">
      Gestionale
    </span>
  )}
</SidebarHeader>
```

**Rationale:** L'identità visiva si sposta nel footer (logo reale). L'header diventa neutro per non duplicare il branding.

#### B.2 — SidebarFooter: aggiunta logo sopra Impostazioni

Aggiungere il logo Baum House come primo elemento del `SidebarFooter`, sopra il separatore e le voci footer.

**OLD (righe 91–121):**
```tsx
<SidebarFooter>
  {visibleFooterItems.length > 0 && (
    <>
      <SidebarSeparator />
      <SidebarMenu>
        {/* ... footerNavItems (Impostazioni) ... */}
      </SidebarMenu>
    </>
  )}

  <SidebarSeparator />

  <div className="p-2">
    {/* ... user info + logout ... */}
  </div>
</SidebarFooter>
```

**NEW:**
```tsx
<SidebarFooter>
  {/* Logo Baum House — sopra Impostazioni */}
  <div className="px-3 py-2">
    {isCollapsed ? (
      <div className="flex justify-center">
        <img
          src="/logo-baum-house.webp"
          alt="Baum House"
          className="h-8 w-8 object-contain"
        />
      </div>
    ) : (
      <img
        src="/logo-baum-house.webp"
        alt="Baum House"
        className="h-10 w-auto object-contain"
      />
    )}
  </div>

  {visibleFooterItems.length > 0 && (
    <>
      <SidebarSeparator />
      <SidebarMenu>
        {/* ... footerNavItems (Impostazioni) — invariato ... */}
      </SidebarMenu>
    </>
  )}

  <SidebarSeparator />

  <div className="p-2">
    {/* ... user info + logout — invariato ... */}
  </div>
</SidebarFooter>
```

**Rationale:** Posizionamento richiesto dall'utente: "in basso a sinistra sopra il pannello Impostazioni". L'immagine è adattiva: versione piccola (h-8) quando la sidebar è collassata a icone, versione piena (h-10, auto width) quando è espansa.

---

### Proposta C — Asset Logo nel Progetto

**File:** `public/logo-baum-house.webp`

Copiare il file `793129cf-2713-4bfe-b8e2-c847d51f7861.webp` in `public/logo-baum-house.webp`.

**OLD:** Assente

**NEW:** `public/logo-baum-house.webp` — logo originale Baum House

**Rationale:** Il file viene servito come asset statico Next.js. Il nome descrittivo `logo-baum-house.webp` sostituisce il nome UUID originale per manutenibilità.

> **Opzionale:** Convertire il `.webp` in `.svg` se disponibile versione vettoriale, per migliore scalabilità e nitidezza su display retina.

---

### Proposta D — Aggiornamento Documenti di Progetto

#### D.1 — UX Design Specification

**File:** `_bmad-output/planning-artifacts/ux-design-specification.md`

Sezione "Palette Primaria":

**OLD:**
```markdown
| **Primary** | Verde salvia | `#4A7C6F` | Azioni principali, bottoni CTA, link, stati attivi |
| **Primary Light** | Salvia chiaro | `#E8F0ED` | Sfondi selezionati, hover, badge |
| **Primary Dark** | Verde scuro | `#345A50` | Testo su sfondo chiaro, hover dei bottoni |
```

**NEW:**
```markdown
| **Primary** | Teal Baum House | `#4BBFC8` | Azioni principali, bottoni CTA, link, stati attivi |
| **Primary Light** | Teal chiaro | `#E5F7F9` | Sfondi selezionati, hover, badge |
| **Primary Dark** | Teal scuro | `#347D85` | Testo su sfondo chiaro, hover dei bottoni |
| **Coral** | Coral Baum House | `#E05C6B` | Accenti, badge secondari, evidenziazioni |
```

Aggiornare anche tutti i riferimenti inline al colore `#4A7C6F` e `#E8F0ED` nella spec.

#### D.2 — Epics (Story 1.2 Acceptance Criteria)

**File:** `_bmad-output/planning-artifacts/epics.md`

Story 1.2 — Aggiornare i colori menzionati nei criteri:

**OLD:**
```
Then viene mostrata una Sidebar a sinistra (220px) con ...
And la voce attiva ha sfondo #E8F0ED con bordo sinistro primary
...
And la voce attiva e' in colore primary #4A7C6F
```

**NEW:**
```
Then viene mostrata una Sidebar a sinistra (220px) con ...
And la voce attiva ha sfondo #E5F7F9 con bordo sinistro primary
...
And la voce attiva e' in colore primary #4BBFC8
And il logo Baum House e' visibile nel footer della sidebar, sopra la voce Impostazioni
```

---

## Sezione 5: Implementation Handoff

### Classificazione Scope: **Minor**

Il cambiamento è:
- Puramente cosmetico (nessuna logica di business modificata)
- Centralizzato (design tokens in 1 file CSS, logo in 1 componente)
- Reversibile (4 righe in globals.css per rollback completo dei colori)
- A rischio zero per la funzionalità esistente

### Handoff: Development Team — Direct Implementation

| Azione | File | Priorità |
|--------|------|---------|
| 1. Copiare logo in `public/logo-baum-house.webp` | `public/` | Prima |
| 2. Aggiornare design tokens brand-* | `src/app/globals.css` | Prima |
| 3. Aggiornare Sidebar (header + footer logo) | `src/components/layout/Sidebar.tsx` | Seconda |
| 4. Aggiornare documenti planning | `epics.md`, `ux-design-specification.md` | Terza |

### Success Criteria

- [ ] Il logo Baum House è visibile nel footer della sidebar desktop, sopra "Impostazioni"
- [ ] Il logo si adatta correttamente alla sidebar collassata (versione icona) ed espansa (versione completa)
- [ ] Tutti i bottoni CTA, voci attive e indicatori usano il teal `#4BBFC8` invece del verde salvia `#4A7C6F`
- [ ] Il colore `brand-primary-light` (sfondo voci attive) è aggiornato a `#E5F7F9`
- [ ] La piattaforma è visivamente coerente su tutte le schermate testate (Agenda, Clienti, Cani, Dashboard)
- [ ] Nessuna regressione funzionale (form, ricerca, appuntamenti funzionano invariati)
- [ ] Il Collaboratore (`sara`) vede il logo nella sidebar (non solo l'Admin)

---

## Change Log

| Versione | Data | Autore | Note |
|----------|------|--------|------|
| 1.0 | 2026-04-27 | Samueles | Prima emissione |
| 1.1 | 2026-04-27 | Dev Agent | Implementato: globals.css, Sidebar.tsx, login/page.tsx, PersonHeader.tsx, ScheduleGrid.tsx, WeeklyDayCell.tsx, public/logo-baum-house.webp, epics.md, ux-design-specification.md, architecture.md |
