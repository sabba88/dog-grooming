---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# dog-grooming - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dog-grooming, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: L'Amministratore puo' creare nuove utenze assegnando il ruolo di Amministratore o Collaboratore
FR2: L'Amministratore puo' modificare e disattivare utenze esistenti
FR3: Ogni utente puo' autenticarsi nel sistema con le proprie credenziali
FR4: Il sistema limita le funzionalita' disponibili in base al ruolo dell'utente
FR5: L'Amministratore puo' creare e configurare sedi
FR6: L'Amministratore puo' creare postazioni per ciascuna sede
FR7: L'Amministratore puo' assegnare i servizi abilitati a ciascuna postazione
FR8: L'Amministratore puo' definire gli orari di apertura e chiusura per ciascuna postazione
FR9: L'Amministratore puo' creare servizi specificando nome, tariffa e tempo di esecuzione
FR10: L'Amministratore puo' modificare ed eliminare servizi dal listino
FR11: Il Collaboratore puo' consultare il listino servizi in sola lettura
FR12: L'Amministratore e il Collaboratore possono creare nuovi clienti con i relativi dati anagrafici
FR13: L'Amministratore e il Collaboratore possono modificare i dati di un cliente esistente
FR14: L'Amministratore e il Collaboratore possono aggiungere e consultare note libere su un cliente
FR15: L'Amministratore e il Collaboratore possono cercare un cliente in modo rapido
FR16: L'Amministratore e il Collaboratore possono aggiungere cani associati a un cliente (relazione uno-a-molti)
FR17: L'Amministratore e il Collaboratore possono modificare i dati di un cane esistente
FR18: L'Amministratore e il Collaboratore possono aggiungere e consultare note libere su un cane
FR19: L'Amministratore e il Collaboratore possono visualizzare lo storico delle note prestazione associate a un cane
FR20: L'Amministratore e il Collaboratore possono creare un appuntamento selezionando cliente, cane, servizio, postazione e fascia oraria
FR21: Il sistema impedisce la creazione di appuntamenti sovrapposti sulla stessa postazione
FR22: L'Amministratore e il Collaboratore possono cancellare un appuntamento esistente
FR23: L'Amministratore e il Collaboratore possono spostare un appuntamento a una nuova fascia oraria o data
FR24: L'Amministratore e il Collaboratore possono aggiungere note alla prestazione al termine di un appuntamento
FR25: Il sistema calcola automaticamente la durata dell'appuntamento in base al tempo di esecuzione del servizio selezionato
FR26: L'Amministratore e il Collaboratore possono visualizzare l'agenda giornaliera organizzata per sede e postazione
FR27: L'Amministratore e il Collaboratore possono navigare l'agenda tra giorni diversi
FR28: L'agenda mostra per ogni appuntamento il cliente, il cane e il servizio previsto
FR29: L'Amministratore e il Collaboratore possono identificare visivamente gli slot liberi e occupati
FR30: L'Amministratore e il Collaboratore possono accedere a una dashboard riassuntiva con una visione d'insieme dell'attivita'
FR31: Il sistema gestisce i dati personali dei clienti in conformita' GDPR
FR32: Il sistema supporta il diritto all'oblio — cancellazione dati cliente su richiesta
FR33: Il sistema supporta la portabilita' dei dati — esportazione dati cliente

### NonFunctional Requirements

NFR1: Le pagine si caricano senza necessita' di indicatori di caricamento visibili
NFR2: Le operazioni di salvataggio si completano senza ritardo percepibile
NFR3: La creazione di un appuntamento completo (dalla ricerca cliente alla conferma) e' realizzabile in meno di 30 secondi
NFR4: Il sistema supporta fino a 5 utenti concorrenti senza degradazione delle performance
NFR5: L'autenticazione degli utenti avviene tramite credenziali protette
NFR6: Le password sono memorizzate in forma crittografata (hash)
NFR7: I dati personali sono trasmessi su connessione cifrata (HTTPS)
NFR8: L'accesso alle funzionalita' e' controllato dal ruolo assegnato
NFR9: Il sistema e' conforme GDPR: consenso al trattamento, diritto all'oblio, portabilita' dei dati, informativa privacy
NFR10: L'architettura di sicurezza supporta conformita' multi-giurisdizione
NFR11: L'MVP supporta un singolo salone con un massimo di 5 utenti concorrenti
NFR12: L'architettura non introduce vincoli che impediscano l'evoluzione verso multi-tenant

### Additional Requirements

**Dall'Architecture:**
- Starter Template: `create-next-app@16` con TypeScript, Tailwind CSS v4, ESLint, App Router, src-dir, Turbopack — impatta Epic 1 Story 1
- Stack completo: Next.js 16 + TypeScript strict + Tailwind CSS v4 + shadcn/ui + Drizzle ORM + Auth.js v5 + Vercel Postgres (Neon) + TanStack Query + React Hook Form + next-safe-action + Zod
- Campo `tenantId` presente su tutte le entita' fin dall'MVP per predisposizione multi-tenant
- Tutte le Server Actions devono usare next-safe-action con validazione Zod — nessuna eccezione
- Schema Zod condiviso tra client (React Hook Form) e server (Server Actions)
- TanStack Query per stato client-side: optimistic updates, cache invalidation, refetching
- JWT sessions con userId, role, tenantId nel token
- RBAC: Middleware Next.js per protezione route + utility checkRole() nelle Server Actions
- GDPR implementato come: soft delete (deletedAt), export JSON, campi consenso (consentGivenAt, consentVersion)
- Pattern Result per error handling: `{ success: true, data } | { success: false, error }`
- CI/CD: Vercel built-in (push → preview, merge main → production)
- Monitoring: Vercel Analytics + Speed Insights
- Strategia migrazione: Drizzle Kit (db:push per dev, db:generate + db:migrate per produzione)
- Prezzi in centesimi nel database, formattati in EUR nella UI
- Date in UTC nel database, ISO 8601 nelle API, formattate in italiano nella UI
- Lingua interfaccia: italiano. Lingua codice: inglese.
- Struttura progetto definita con directory specifiche: actions/, validations/, queries/, components per feature

**Dalla UX Design:**
- Conformita' accessibilita' WCAG 2.1 Livello AA
- Responsive: mobile-first per prenotazione, desktop-first per agenda
- Design system: shadcn/ui + Tailwind CSS con design tokens custom
- Componenti custom critici: ScheduleGrid (desktop), ScheduleTimeline (mobile), AppointmentBlock, EmptySlot, AppointmentForm, ClientSearch, DateStrip, DashboardCard
- Touch target minimi 44x44px per tutti gli elementi interattivi
- Font: Inter, scala tipografica definita (H1 24px → Caption 11px)
- Palette colori: verde salvia primary (#4A7C6F), palette neutra, semantica e pastello per blocchi agenda
- Breakpoint critici: md (768px) switch timeline/grid e Sheet/Dialog, lg (1024px) sidebar espansa
- Navigazione: Sidebar desktop (220px, collassabile), Bottom Tab Bar mobile (4-5 voci)
- Form in Sheet (mobile) o Dialog (desktop)
- Ricerca incrementale cliente tipo-ahead con debounce
- Pre-compilazione automatica durata e prezzo dal servizio selezionato
- Blocchi appuntamento colorati per servizio, proporzionali alla durata
- Slot vuoti con pattern visivo (righe diagonali) toccabili per creare appuntamento
- Nessuna conferma per azioni creative, Alert Dialog solo per azioni distruttive
- Toast (Sonner) per feedback discreto
- Validazione form inline al blur, messaggi in italiano semplice

### FR Coverage Map

FR1: Epica 1 - Creazione utenze con ruolo (Amministratore/Collaboratore)
FR2: Epica 1 - Modifica e disattivazione utenze
FR3: Epica 1 - Autenticazione con credenziali
FR4: Epica 1 - Limiti funzionalita' per ruolo (RBAC)
FR5: Epica 2 - Creazione e configurazione sedi
FR6: Epica 2 - Creazione postazioni per sede
FR7: Epica 2 - Assegnazione servizi abilitati a postazione
FR8: Epica 2 - Definizione orari apertura/chiusura postazione
FR9: Epica 2 - Creazione servizi con nome, tariffa, tempo
FR10: Epica 2 - Modifica ed eliminazione servizi
FR11: Epica 2 - Consultazione listino in sola lettura (Collaboratore)
FR12: Epica 3 - Creazione nuovi clienti
FR13: Epica 3 - Modifica dati cliente
FR14: Epica 3 - Note libere su cliente
FR15: Epica 3 - Ricerca rapida cliente
FR16: Epica 3 - Aggiunta cani associati a cliente (1:N)
FR17: Epica 3 - Modifica dati cane
FR18: Epica 3 - Note libere su cane
FR19: Epica 3 - Storico note prestazione per cane
FR20: Epica 4 - Creazione appuntamento (cliente, cane, servizio, postazione, orario)
FR21: Epica 4 - Prevenzione sovrapposizione appuntamenti
FR22: Epica 4 - Cancellazione appuntamento
FR23: Epica 4 - Spostamento appuntamento
FR24: Epica 4 - Note prestazione post-appuntamento
FR25: Epica 4 - Calcolo automatico durata da servizio
FR26: Epica 4 - Vista agenda giornaliera per sede e postazione
FR27: Epica 4 - Navigazione agenda tra giorni
FR28: Epica 4 - Agenda mostra cliente, cane, servizio per appuntamento
FR29: Epica 4 - Identificazione visiva slot liberi e occupati
FR30: Epica 5 - Dashboard riassuntiva attivita'
FR31: Epica 6 - Gestione dati personali conforme GDPR
FR32: Epica 6 - Diritto all'oblio (cancellazione dati)
FR33: Epica 6 - Portabilita' dati (esportazione)

## Epic List

### Epica 1: Accesso e Sicurezza del Sistema
Marco e Sara possono accedere al sistema in sicurezza, ciascuno con il proprio ruolo e le funzionalita' appropriate. Include l'inizializzazione del progetto con lo starter template definito dall'architettura (create-next-app@16).
**FRs coperti:** FR1, FR2, FR3, FR4

### Epica 2: Configurazione del Salone
Marco (Amministratore) configura completamente il suo salone: crea sedi, postazioni con orari e servizi abilitati, definisce il listino con tariffe e tempi. Sara (Collaboratore) consulta il listino in sola lettura. Al termine, il salone e' pronto per operare. Copre il Journey 1 — Setup del Salone.
**FRs coperti:** FR5, FR6, FR7, FR8, FR9, FR10, FR11

### Epica 3: Gestione Clienti e Cani
Marco e Sara gestiscono l'anagrafica completa: creano e modificano clienti e cani, aggiungono note libere, consultano lo storico delle note prestazione, cercano rapidamente i clienti.
**FRs coperti:** FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Epica 4: Agenda e Appuntamenti
Il cuore del prodotto. Marco prende appuntamenti in meno di 30 secondi dall'agenda, sposta e cancella con facilita', aggiunge note alle prestazioni. L'agenda mostra la giornata organizzata per sede e postazione con slot liberi e occupati visibili a colpo d'occhio. Copre i Journey 2 (Presa Appuntamento), 3 (Spostamento) e 4 (Giornata Collaboratrice).
**FRs coperti:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29

### Epica 5: Dashboard e Panoramica
Marco e Sara accedono a una vista d'insieme dell'attivita' del salone con le metriche chiave della giornata.
**FRs coperti:** FR30

### Epica 6: Privacy e Conformita' GDPR
Il salone opera nel rispetto della normativa sulla privacy. L'Amministratore gestisce il diritto all'oblio (soft delete dei dati cliente) e la portabilita' dei dati (esportazione JSON). Le query filtrano automaticamente i record cancellati.
**FRs coperti:** FR31, FR32, FR33

## Epica 1: Accesso e Sicurezza del Sistema

Marco e Sara possono accedere al sistema in sicurezza, ciascuno con il proprio ruolo e le funzionalita' appropriate. Include l'inizializzazione del progetto con lo starter template definito dall'architettura (create-next-app@16).

### Story 1.1: Inizializzazione Progetto e Login

As a **utente del sistema**,
I want **autenticarmi con le mie credenziali**,
So that **possa accedere al sistema in sicurezza**.

**Acceptance Criteria:**

**Given** il progetto e' inizializzato con create-next-app@16 e tutte le dipendenze (shadcn/ui, Drizzle ORM, Auth.js v5, TanStack Query, next-safe-action, Zod, React Hook Form)
**When** uno sviluppatore esegue `npm run dev`
**Then** l'applicazione si avvia correttamente con Turbopack

**Given** la tabella `users` esiste nel database con campi id, email, password (hash), name, role (enum: admin, collaborator), tenantId, createdAt, updatedAt
**When** un utente seed e' presente nel database
**Then** l'utente puo' effettuare il login

**Given** un utente non autenticato accede a qualsiasi pagina protetta
**When** il middleware intercetta la richiesta
**Then** l'utente viene reindirizzato alla pagina di login

**Given** un utente e' sulla pagina di login
**When** inserisce credenziali valide (email e password)
**Then** il sistema autentica l'utente, crea un JWT con userId, role e tenantId, e reindirizza alla pagina principale

**Given** un utente e' sulla pagina di login
**When** inserisce credenziali non valide
**Then** il sistema mostra un messaggio di errore in italiano ("Credenziali non valide") senza rivelare dettagli tecnici

**Given** un utente e' autenticato
**When** clicca su logout
**Then** la sessione viene terminata e l'utente viene reindirizzato alla pagina di login

### Story 1.2: Layout Applicazione e Controllo Accesso per Ruolo

As a **utente autenticato**,
I want **navigare l'applicazione con un'interfaccia chiara e vedere solo le funzionalita' del mio ruolo**,
So that **possa lavorare in modo efficiente senza confusione**.

**Acceptance Criteria:**

**Given** un utente autenticato accede all'applicazione su desktop (>= 1024px)
**When** la pagina viene renderizzata
**Then** viene mostrata una Sidebar a sinistra (220px) con le voci di navigazione (Agenda, Clienti, Cani, Servizi, Dashboard) e Impostazioni in fondo
**And** la voce attiva ha sfondo #E8F0ED con bordo sinistro primary

**Given** un utente autenticato accede all'applicazione su mobile (< 768px)
**When** la pagina viene renderizzata
**Then** viene mostrata una Bottom Tab Bar con le voci principali (Agenda, Clienti, Cani, Home)
**And** la voce attiva e' in colore primary #4A7C6F

**Given** un utente con ruolo Collaboratore
**When** naviga nell'applicazione
**Then** non vede e non puo' accedere alle pagine Gestione Utenze e Gestione Sedi/Postazioni, e non puo' modificare il Listino Servizi

**Given** un utente con ruolo Amministratore
**When** naviga nell'applicazione
**Then** ha accesso completo a tutte le funzionalita' e pagine

**Given** la utility checkRole() e' implementata in permissions.ts
**When** una Server Action verifica il ruolo dell'utente
**Then** la verifica usa la configurazione centralizzata dei permessi
**And** un accesso non autorizzato restituisce un errore tipizzato senza dettagli tecnici

### Story 1.3: Gestione Utenze

As a **Amministratore**,
I want **creare, modificare e disattivare utenze del mio salone**,
So that **possa gestire chi ha accesso al sistema e con quale ruolo**.

**Acceptance Criteria:**

**Given** un Amministratore accede alla pagina Gestione Utenze
**When** la pagina viene renderizzata
**Then** viene mostrata la lista degli utenti con nome, email, ruolo e stato (attivo/disattivo)

**Given** un Amministratore clicca su "Nuovo Utente"
**When** compila il form con nome, email, password e ruolo (Amministratore o Collaboratore)
**Then** il sistema crea l'utente con password hashata e tenantId del salone corrente
**And** mostra un toast "Utente creato"

**Given** un Amministratore clicca su "Nuovo Utente"
**When** compila il form con un'email gia' esistente
**Then** il sistema mostra un errore di validazione "Email gia' in uso"

**Given** un Amministratore seleziona un utente dalla lista
**When** modifica il nome, email o ruolo e salva
**Then** le modifiche vengono salvate
**And** mostra un toast "Utente aggiornato"

**Given** un Amministratore seleziona un utente dalla lista
**When** clicca su "Disattiva"
**Then** viene mostrato un Alert Dialog di conferma "Disattivare l'utente [nome]?"
**And** dopo conferma l'utente viene disattivato e non puo' piu' effettuare il login
**And** mostra un toast "Utente disattivato"

**Given** un Collaboratore tenta di accedere alla pagina Gestione Utenze
**When** il sistema verifica il ruolo
**Then** l'accesso viene negato e l'utente viene reindirizzato

## Epica 2: Configurazione del Salone

Marco (Amministratore) configura completamente il suo salone: crea sedi, postazioni con orari e servizi abilitati, definisce il listino con tariffe e tempi. Sara (Collaboratore) consulta il listino in sola lettura. Al termine, il salone e' pronto per operare. Copre il Journey 1 — Setup del Salone.

### Story 2.1: Gestione Listino Servizi

As a **Amministratore**,
I want **creare e gestire il listino dei servizi del mio salone specificando nome, tariffa e tempo di esecuzione**,
So that **possa definire l'offerta del salone e i collaboratori possano consultarla**.

**Acceptance Criteria:**

**Given** un Amministratore accede alla pagina Servizi
**When** la pagina viene renderizzata
**Then** viene mostrata la lista dei servizi con nome, tariffa (in EUR) e tempo di esecuzione

**Given** un Amministratore clicca su "Nuovo Servizio"
**When** compila il form con nome, tariffa e tempo di esecuzione
**Then** il sistema crea il servizio con tenantId del salone corrente e prezzo salvato in centesimi nel database
**And** mostra un toast "Servizio creato"

**Given** un Amministratore compila il form servizio
**When** lascia campi obbligatori vuoti o inserisce valori non validi (tariffa <= 0, tempo <= 0)
**Then** il sistema mostra errori di validazione inline in italiano

**Given** un Amministratore seleziona un servizio dalla lista
**When** modifica nome, tariffa o tempo e salva
**Then** le modifiche vengono salvate
**And** mostra un toast "Servizio aggiornato"

**Given** un Amministratore seleziona un servizio dalla lista
**When** clicca su "Elimina"
**Then** viene mostrato un Alert Dialog di conferma "Eliminare il servizio [nome]?"
**And** dopo conferma il servizio viene eliminato
**And** mostra un toast "Servizio eliminato"

**Given** un Collaboratore accede alla pagina Servizi
**When** la pagina viene renderizzata
**Then** vede la lista dei servizi in sola lettura, senza opzioni di creazione, modifica o eliminazione

### Story 2.2: Gestione Sedi

As a **Amministratore**,
I want **creare e configurare le sedi del mio salone**,
So that **possa organizzare l'attivita' per sede e i collaboratori possano sapere dove lavorano**.

**Acceptance Criteria:**

**Given** un Amministratore accede alla pagina Sedi
**When** la pagina viene renderizzata
**Then** viene mostrata la lista delle sedi con nome e indirizzo

**Given** un Amministratore clicca su "Nuova Sede"
**When** compila il form con nome e indirizzo
**Then** il sistema crea la sede con tenantId del salone corrente
**And** mostra un toast "Sede creata"

**Given** un Amministratore seleziona una sede dalla lista
**When** modifica nome o indirizzo e salva
**Then** le modifiche vengono salvate
**And** mostra un toast "Sede aggiornata"

**Given** esiste almeno una sede nel sistema
**When** un utente autenticato accede all'applicazione
**Then** l'Header mostra un selettore per la sede corrente
**And** la sede selezionata viene mantenuta nella sessione dell'utente

### Story 2.3: Gestione Postazioni con Servizi Abilitati e Orari

As a **Amministratore**,
I want **creare postazioni per ogni sede, assegnare i servizi abilitati e definire gli orari di apertura**,
So that **il salone sia completamente configurato e pronto per prendere appuntamenti**.

**Acceptance Criteria:**

**Given** un Amministratore e' nella pagina di una sede
**When** la sezione postazioni viene renderizzata
**Then** viene mostrata la lista delle postazioni con nome, servizi abilitati e orari

**Given** un Amministratore clicca su "Nuova Postazione"
**When** compila il form con nome della postazione
**Then** il sistema crea la postazione associata alla sede corrente con tenantId
**And** mostra un toast "Postazione creata"

**Given** un Amministratore seleziona una postazione
**When** assegna i servizi abilitati selezionandoli dal listino (creato in Story 2.1)
**Then** i servizi vengono associati alla postazione
**And** solo questi servizi saranno prenotabili su questa postazione

**Given** un Amministratore seleziona una postazione
**When** definisce gli orari di apertura e chiusura per ogni giorno della settimana
**Then** gli orari vengono salvati
**And** determinano le fasce orarie disponibili nell'agenda per questa postazione

**Given** un Amministratore modifica servizi abilitati o orari di una postazione
**When** salva le modifiche
**Then** le modifiche vengono applicate
**And** mostra un toast "Postazione aggiornata"

**Given** una postazione non ha servizi abilitati o orari definiti
**When** un utente visualizza l'agenda
**Then** la postazione non mostra slot prenotabili fino a completamento della configurazione

## Epica 3: Gestione Clienti e Cani

Marco e Sara gestiscono l'anagrafica completa: creano e modificano clienti e cani, aggiungono note libere, consultano lo storico delle note prestazione, cercano rapidamente i clienti.

### Story 3.1: Anagrafica Clienti

As a **Amministratore o Collaboratore**,
I want **creare, modificare e cercare clienti con le relative note**,
So that **possa gestire la rubrica del salone e avere tutte le informazioni a portata di mano**.

**Acceptance Criteria:**

**Given** un utente accede alla pagina Clienti
**When** la pagina viene renderizzata
**Then** viene mostrata la lista dei clienti con avatar (iniziali), nome, telefono e numero di cani associati

**Given** un utente clicca su "Nuovo Cliente"
**When** compila il form con nome, cognome, telefono, email (opzionale) e accetta il consenso al trattamento dati
**Then** il sistema crea il cliente con tenantId, consentGivenAt e consentVersion
**And** mostra un toast "Cliente creato"

**Given** un utente seleziona un cliente dalla lista
**When** accede al dettaglio del cliente
**Then** vede i dati anagrafici, la lista dei cani associati, le note libere e lo storico appuntamenti

**Given** un utente e' nel dettaglio di un cliente
**When** modifica i dati anagrafici e salva
**Then** le modifiche vengono salvate
**And** mostra un toast "Cliente aggiornato"

**Given** un utente e' nel dettaglio di un cliente
**When** aggiunge una nota libera
**Then** la nota viene salvata con data e autore
**And** e' visibile nello storico note del cliente

**Given** un utente digita 2 o piu' caratteri nel campo ricerca clienti
**When** la ricerca incrementale si attiva (debounce 300ms)
**Then** vengono mostrati i risultati corrispondenti con avatar, nome e numero cani
**And** i risultati si aggiornano in tempo reale ad ogni carattere aggiuntivo

**Given** un utente cerca un cliente che non esiste
**When** nessun risultato corrisponde
**Then** viene mostrato "Nessun risultato" con l'opzione "Crea nuovo cliente"

### Story 3.2: Anagrafica Cani

As a **Amministratore o Collaboratore**,
I want **gestire i cani associati ai clienti con note e storico prestazioni**,
So that **possa conoscere ogni cane e offrire un servizio personalizzato basato sullo storico**.

**Acceptance Criteria:**

**Given** un utente e' nel dettaglio di un cliente
**When** clicca su "Aggiungi Cane"
**Then** si apre un form per inserire nome, razza, taglia, eta' e note
**And** il cane viene associato al cliente (relazione uno-a-molti)

**Given** un utente e' nel dettaglio di un cliente
**When** la lista dei cani viene renderizzata
**Then** ogni cane mostra nome, razza e taglia

**Given** un utente seleziona un cane
**When** accede al dettaglio del cane
**Then** vede i dati del cane, le note libere e lo storico completo delle note prestazione

**Given** un utente e' nel dettaglio di un cane
**When** modifica i dati e salva
**Then** le modifiche vengono salvate
**And** mostra un toast "Cane aggiornato"

**Given** un utente e' nel dettaglio di un cane
**When** aggiunge una nota libera
**Then** la nota viene salvata con data e autore
**And** e' visibile nello storico note del cane

**Given** un utente e' nel dettaglio di un cane
**When** consulta lo storico delle note prestazione
**Then** vengono mostrate tutte le note delle prestazioni precedenti in ordine cronologico inverso
**And** ogni nota mostra data, servizio effettuato e testo della nota

## Epica 4: Agenda e Appuntamenti

Il cuore del prodotto. Marco prende appuntamenti in meno di 30 secondi dall'agenda, sposta e cancella con facilita', aggiunge note alle prestazioni. L'agenda mostra la giornata organizzata per sede e postazione con slot liberi e occupati visibili a colpo d'occhio. Copre i Journey 2 (Presa Appuntamento), 3 (Spostamento) e 4 (Giornata Collaboratrice).

### Story 4.1: Vista Agenda per Sede e Postazione

As a **Amministratore o Collaboratore**,
I want **visualizzare l'agenda giornaliera organizzata per sede e postazione con slot liberi e occupati chiaramente identificabili**,
So that **possa avere il controllo completo della giornata a colpo d'occhio**.

**Acceptance Criteria:**

**Given** un utente accede alla pagina Agenda su desktop (>= 1024px)
**When** la pagina viene renderizzata
**Then** viene mostrata una griglia (ScheduleGrid) con postazioni come colonne e fasce orarie come righe (intervalli di 30 minuti)
**And** le fasce orarie rispettano gli orari di apertura/chiusura di ogni postazione

**Given** un utente accede alla pagina Agenda su mobile (< 768px)
**When** la pagina viene renderizzata
**Then** viene mostrata una timeline verticale (ScheduleTimeline) con tab per filtrare per postazione
**And** una DateStrip scorrevole in alto per navigare tra i giorni

**Given** un utente e' sull'agenda
**When** la pagina si carica
**Then** viene mostrata la giornata corrente della sede selezionata nell'Header
**And** il caricamento avviene senza indicatori di caricamento visibili (NFR1)

**Given** esistono appuntamenti per la giornata visualizzata
**When** l'agenda viene renderizzata
**Then** ogni appuntamento e' mostrato come un blocco (AppointmentBlock) con bordo sinistro colorato per servizio, nome cliente, nome cane e nome servizio
**And** l'altezza del blocco e' proporzionale alla durata dell'appuntamento

**Given** esistono slot senza appuntamenti nell'agenda
**When** l'agenda viene renderizzata
**Then** gli slot vuoti (EmptySlot) sono visivamente distinti con pattern a righe diagonali (desktop) o bordo tratteggiato (mobile)
**And** sono chiaramente toccabili/cliccabili

**Given** un utente e' sull'agenda
**When** naviga al giorno precedente o successivo (frecce su desktop, swipe/tocco su DateStrip mobile)
**Then** l'agenda si aggiorna mostrando gli appuntamenti del giorno selezionato

**Given** un utente e' sull'agenda
**When** seleziona una data specifica dal calendario
**Then** l'agenda salta direttamente alla data selezionata

### Story 4.2: Creazione Appuntamento Rapido

As a **Amministratore o Collaboratore**,
I want **creare un appuntamento in meno di 30 secondi toccando uno slot libero nell'agenda**,
So that **possa prenotare velocemente anche durante una telefonata con le mani occupate**.

**Acceptance Criteria:**

**Given** un utente tocca/clicca uno slot vuoto nell'agenda
**When** il form di prenotazione si apre (Sheet su mobile, Dialog su desktop)
**Then** postazione, data e ora sono gia' pre-compilati dallo slot selezionato

**Given** il form di prenotazione e' aperto
**When** l'utente digita 2-3 caratteri nel campo ricerca cliente (ClientSearch)
**Then** i risultati appaiono in tempo reale con ricerca incrementale
**And** se il cliente ha un solo cane, il cane viene auto-selezionato
**And** se il cliente ha piu' cani, l'utente seleziona il cane dalla lista

**Given** il cliente non esiste nel sistema
**When** l'utente clicca "Crea nuovo cliente" nel form di prenotazione
**Then** si apre un sotto-form per creare il cliente al volo (nome, cognome, telefono, consenso)
**And** dopo la creazione il cliente viene auto-selezionato nel form originale senza perdere i dati gia' inseriti

**Given** l'utente ha selezionato cliente e cane
**When** seleziona un servizio dalla lista dei servizi abilitati sulla postazione
**Then** la durata e il prezzo si pre-compilano automaticamente dal listino
**And** l'utente puo' modificare durata e prezzo manualmente se necessario

**Given** l'utente ha compilato tutti i campi
**When** tocca "Conferma" (senza richiesta "sei sicuro?")
**Then** l'appuntamento viene creato con un optimistic update — il blocco appare immediatamente nell'agenda
**And** mostra un toast "Appuntamento salvato"
**And** il form si chiude e l'utente torna all'agenda

**Given** l'utente tenta di creare un appuntamento
**When** lo slot e' gia' occupato da un altro appuntamento (sovrapposizione)
**Then** il sistema impedisce la creazione e mostra un messaggio "Lo slot e' gia' occupato"
**And** suggerisce gli slot alternativi piu' vicini disponibili

**Given** l'utente tenta di creare un appuntamento
**When** la durata del servizio eccede l'orario di chiusura della postazione
**Then** il sistema avvisa "L'appuntamento supera l'orario di chiusura" e permette di modificare la durata

### Story 4.3: Cancellazione e Spostamento Appuntamenti

As a **Amministratore o Collaboratore**,
I want **cancellare e spostare appuntamenti con facilita'**,
So that **possa riorganizzare l'agenda senza pasticci, come cancellature su un quaderno**.

**Acceptance Criteria:**

**Given** un utente tocca/clicca un appuntamento nell'agenda
**When** il dettaglio dell'appuntamento si apre
**Then** vengono mostrate le informazioni complete (cliente, cane, servizio, data, ora, durata, prezzo)
**And** le azioni disponibili: "Modifica", "Sposta", "Cancella"

**Given** un utente clicca su "Cancella" sul dettaglio di un appuntamento
**When** l'Alert Dialog di conferma viene mostrato ("Cancellare l'appuntamento di [cliente] ([cane])?")
**Then** dopo conferma l'appuntamento viene eliminato
**And** l'agenda si aggiorna immediatamente (optimistic update) — lo slot torna libero
**And** mostra un toast "Appuntamento cancellato"

**Given** un utente clicca su "Sposta" dal dettaglio di un appuntamento nell'agenda
**When** il sistema entra in modalita' spostamento
**Then** l'agenda evidenzia gli slot disponibili (sfondo verde chiaro) e oscura quelli non disponibili
**And** l'appuntamento originale viene mostrato con opacita' ridotta

**Given** un utente e' in modalita' spostamento
**When** tocca un nuovo slot disponibile
**Then** l'appuntamento viene spostato alla nuova posizione
**And** l'agenda si aggiorna immediatamente (optimistic update)
**And** mostra un toast "Appuntamento spostato"

**Given** un utente e' nel dettaglio di un cliente (dalla rubrica, Epica 3)
**When** vede la lista appuntamenti del cliente e tocca "Sposta" su un appuntamento
**Then** il sistema lo porta sull'agenda con la modalita' spostamento attiva
**And** gli slot disponibili sono evidenziati per la scelta del nuovo orario

**Given** un utente e' in modalita' spostamento
**When** il nuovo slot selezionato e' gia' occupato (occupato nel frattempo da un altro utente)
**Then** il sistema avvisa "Lo slot non e' piu' disponibile"
**And** mostra gli slot alternativi piu' vicini

### Story 4.4: Note Prestazione

As a **Amministratore o Collaboratore**,
I want **aggiungere note sulla prestazione al termine di un appuntamento**,
So that **lo storico del cane si arricchisca di informazioni utili per le visite future**.

**Acceptance Criteria:**

**Given** un utente tocca un appuntamento nell'agenda
**When** accede al dettaglio dell'appuntamento
**Then** vede la sezione "Note Prestazione" con un campo testo per aggiungere una nota
**And** vede le note delle prestazioni precedenti dello stesso cane (storico da Epica 3)

**Given** un utente scrive una nota sulla prestazione
**When** salva la nota
**Then** la nota viene associata all'appuntamento con data, autore e servizio effettuato
**And** la nota appare nello storico delle note prestazione del cane (visibile da anagrafica cane, Story 3.2)
**And** mostra un toast "Nota salvata"

**Given** un utente consulta le note precedenti dal dettaglio dell'appuntamento
**When** le note vengono renderizzate
**Then** sono mostrate in ordine cronologico inverso con data, servizio e testo
**And** l'utente puo' identificare rapidamente informazioni rilevanti (es. "sensibile alle zampe posteriori")

**Given** un utente ha un appuntamento in corso
**When** long-press o right-click sull'appuntamento nell'agenda
**Then** appare un Dropdown Menu contestuale con le azioni rapide: "Dettaglio", "Aggiungi Nota", "Sposta", "Cancella"

## Epica 5: Dashboard e Panoramica

Marco e Sara accedono a una vista d'insieme dell'attivita' del salone con le metriche chiave della giornata.

### Story 5.1: Dashboard Riassuntiva

As a **Amministratore o Collaboratore**,
I want **accedere a una dashboard riassuntiva con le metriche chiave della giornata**,
So that **possa avere una visione d'insieme dell'attivita' del salone in un colpo d'occhio**.

**Acceptance Criteria:**

**Given** un utente accede alla pagina Dashboard
**When** la pagina viene renderizzata
**Then** vengono mostrate card riassuntive (DashboardCard) con le metriche della giornata corrente:
- Appuntamenti di oggi (conteggio totale)
- Prossimo appuntamento (cliente, cane, servizio, ora)
- Slot liberi rimanenti (conteggio)
- Incasso previsto della giornata (somma prezzi appuntamenti, formattato in EUR)

**Given** un utente accede alla Dashboard su desktop (>= 1024px)
**When** le card vengono renderizzate
**Then** sono disposte in griglia 2x2

**Given** un utente accede alla Dashboard su mobile (< 768px)
**When** le card vengono renderizzate
**Then** sono impilate verticalmente con scroll

**Given** non ci sono appuntamenti per la giornata corrente
**When** la Dashboard viene renderizzata
**Then** le card mostrano valori zero o stato vuoto con messaggio appropriato ("Nessun appuntamento oggi")
**And** nessun errore visivo o layout rotto

**Given** un utente consulta la Dashboard
**When** i dati vengono caricati
**Then** il caricamento avviene senza indicatori di caricamento visibili (NFR1)
**And** i dati sono aggregati dalla sede corrente selezionata nell'Header

## Epica 6: Privacy e Conformita' GDPR

Il salone opera nel rispetto della normativa sulla privacy. L'Amministratore gestisce il diritto all'oblio (soft delete dei dati cliente) e la portabilita' dei dati (esportazione JSON). Le query filtrano automaticamente i record cancellati.

### Story 6.1: Privacy e Conformita' GDPR

As a **Amministratore**,
I want **gestire i dati personali dei clienti in conformita' GDPR, inclusi diritto all'oblio e portabilita'**,
So that **il salone operi nel rispetto della normativa sulla privacy**.

**Acceptance Criteria:**

**Given** un Amministratore e' nel dettaglio di un cliente
**When** clicca su "Elimina Dati Cliente" (diritto all'oblio)
**Then** viene mostrato un Alert Dialog di conferma con descrizione dell'impatto: "Tutti i dati personali di [nome] verranno cancellati. Gli appuntamenti storici verranno anonimizzati. Questa azione e' irreversibile."
**And** dopo conferma il sistema esegue un soft delete (campo deletedAt) sui dati del cliente
**And** i dati personali non sono piu' visibili ne' ricercabili
**And** mostra un toast "Dati cliente eliminati"

**Given** un Amministratore e' nel dettaglio di un cliente
**When** clicca su "Esporta Dati Cliente" (portabilita')
**Then** il sistema genera un file JSON con tutti i dati del cliente: anagrafica, cani, note, storico appuntamenti
**And** il file viene scaricato dal browser

**Given** un nuovo cliente viene creato
**When** il form di creazione viene compilato
**Then** il campo consenso al trattamento e' obbligatorio
**And** il sistema registra consentGivenAt (timestamp) e consentVersion

**Given** un cliente ha subito soft delete (deletedAt valorizzato)
**When** un utente esegue una ricerca clienti
**Then** il cliente non appare nei risultati di ricerca

**Given** un cliente ha subito soft delete
**When** il sistema esegue query sui dati
**Then** tutte le query filtrano automaticamente i record con deletedAt valorizzato (filtro implicito)
