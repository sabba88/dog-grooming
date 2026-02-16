# Sprint Change Proposal - 2026-02-16

**Progetto:** dog-grooming
**Autore:** Samueles
**Data:** 2026-02-16
**Classificazione scope:** Minor

## 1. Riepilogo Problema

**Trigger:** Durante l'implementazione dell'Epica 3 (Story 3.2 in corso), e' emersa la decisione di posticipare la Story 3.3 (Privacy e Conformita' GDPR) per concentrarsi sulle funzionalita' operative del prodotto (Agenda, Appuntamenti, Dashboard).

**Tipo di cambiamento:** Riordinamento strategico delle priorita'

**Contesto:** La Story 3.3 copre FR31-FR33 (soft delete, export JSON, filtro implicito record cancellati). Queste funzionalita' non sono bloccanti per le Epiche 4 e 5, che rappresentano il cuore operativo del prodotto. Il consenso base (consentGivenAt, consentVersion) e' gia' implementato nella Story 3.1.

## 2. Analisi Impatto

### Impatto Epiche
- **Epica 3**: Ridotta a Stories 3.1 e 3.2 (FR12-FR19). Puo' essere chiusa senza la GDPR.
- **Epica 4**: Nessun impatto. Le stories 4.1-4.4 non dipendono da soft delete o export dati.
- **Epica 5**: Nessun impatto. La dashboard aggrega appuntamenti.
- **Nuova Epica 6**: Creata per contenere la funzionalita' GDPR (FR31-FR33).

### Impatto Stories
- **Story 3.3**: Rinumerata come **Story 6.1** nella nuova Epica 6.
- Nessun codice da modificare (story era in backlog, mai iniziata).

### Conflitti Artefatti
- **PRD**: Nessun conflitto. FR31-FR33 restano nello scope MVP, cambia solo l'ordine.
- **Architettura**: Nessun conflitto. Il campo deletedAt verra' aggiunto quando si implementa la 6.1.
- **UI/UX**: Nessun conflitto. I pulsanti GDPR nel dettaglio cliente verranno aggiunti con la 6.1.

### Impatto Tecnico
Nessuno. Nessun codice implementato per la story 3.3.

## 3. Approccio Raccomandato

**Percorso scelto:** Aggiustamento Diretto

- Scorporare la Story 3.3 dall'Epica 3
- Creare la nuova Epica 6 "Privacy e Conformita' GDPR" con Story 6.1
- Posizionare l'Epica 6 dopo l'Epica 5 nella coda di implementazione

**Motivazione:**
- Le funzionalita' operative (Agenda, Dashboard) hanno priorita' per la validazione col salone pilota
- La GDPR e' importante ma non bloccante per il testing operativo
- Zero rischio: nessun codice da rollback, nessuna dipendenza rotta

**Sforzo:** Basso
**Rischio:** Basso
**Impatto timeline:** Nessuno (stesso scope totale, solo riordinato)

## 4. Modifiche Applicate

### epics.md
1. **Epica 3 descrizione**: Rimosso riferimento GDPR e FR31-FR33 dalla lista FRs coperti
2. **Story 3.3**: Rimossa dalla sezione Epica 3
3. **FR Coverage Map**: FR31-FR33 aggiornati da "Epica 3" a "Epica 6"
4. **Epic List**: Aggiunta Epica 6 con descrizione e FRs coperti
5. **Sezione dettagliata Epica 6**: Aggiunta con Story 6.1 (contenuto identico alla ex Story 3.3)

### sprint-status.yaml
1. Rimossa `3-3-privacy-e-conformita-gdpr: backlog` dall'Epica 3
2. Aggiunta sezione Epica 6 con `epic-6: backlog`, `6-1-privacy-e-conformita-gdpr: backlog`, `epic-6-retrospective: optional`

## 5. Handoff Implementazione

**Classificazione scope:** Minor — implementazione diretta dal team di sviluppo.

**Nuovo ordine di implementazione:**
1. ~~Epica 1~~ (in-progress, stories in review)
2. ~~Epica 2~~ (in-progress, stories in review)
3. **Epica 3** — completare Story 3.2 (in-progress), poi chiudere epica
4. **Epica 4** — Agenda e Appuntamenti (4 stories)
5. **Epica 5** — Dashboard (1 story)
6. **Epica 6** — Privacy e Conformita' GDPR (1 story)

**Criteri di successo:** Tutti i FR (FR1-FR33) implementati entro la fine dell'Epica 6. L'ordine permette di validare le funzionalita' operative col salone pilota prima di completare la GDPR.
