---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-02-06
author: Samueles
---

# Product Brief: dog-grooming

## Executive Summary

Dog-grooming e' una piattaforma web per la gestione operativa di tolettature per cani, progettata per supportare titolari in fase di crescita che necessitano di passare da una gestione manuale (carta, chiamate, WhatsApp) a un sistema digitale efficiente e scalabile multi-sede. L'MVP si concentra sulla presa appuntamenti rapida e su una visione chiara dell'agenda organizzata per sede e postazione. La visione a lungo termine e' trasformare la piattaforma in un prodotto SaaS verticale per il settore delle tolettature, scalabile e rivendibile ad altri operatori del mercato, con una roadmap evolutiva orientata all'integrazione di strumenti avanzati basati su AI e automazione della comunicazione con i clienti.

---

## Core Vision

### Problem Statement

I titolari di tolettature in crescita gestiscono appuntamenti, clienti e operativita' su carta e tramite canali frammentati (chiamate, WhatsApp, visite in negozio). Questo approccio manuale non scala: con l'aumento di postazioni, collaboratori e sedi, diventa insostenibile mantenere il controllo dell'agenda, tracciare i clienti e garantire un servizio organizzato.

### Problem Impact

- **Appuntamenti persi**: chiamate non risposte significano clienti persi e mancati incassi
- **Reminder manuali**: tempo speso a inviare promemoria uno per uno via WhatsApp
- **Nessuna tracciabilita'**: impossibile sapere quali clienti ritornano, quali hanno smesso di venire e perche'
- **Non scalabile**: con l'apertura di nuove sedi, la gestione cartacea diventa caotica
- **Sovrapposizioni e errori**: rischio concreto di doppie prenotazioni sulla stessa postazione

### Why Existing Solutions Fall Short

Esistono software per la gestione di tolettature sul mercato, ma non offrono una piattaforma pensata per evolvere con integrazioni avanzate di AI. Il titolare cerca una soluzione che parta da un MVP solido per la gestione operativa quotidiana e che cresca nel tempo integrando chatbot WhatsApp, chatbot per il sito web, suggerimenti intelligenti e analisi avanzata dei clienti - funzionalita' che le soluzioni esistenti non offrono o non integrano in modo nativo.

### Proposed Solution

Una piattaforma web con due livelli di utenza (amministratore e collaboratore) che permette di:
- **Gestire il listino servizi** con tariffe e tempi per ogni trattamento
- **Configurare le postazioni** per sede, con servizi abilitati e orari di apertura/chiusura
- **Gestire anagrafiche** di clienti e dei loro cani (relazione uno-a-molti)
- **Prendere appuntamenti in modo rapido** con visione chiara della disponibilita'
- **Visualizzare l'agenda per sede e postazione** con un quadro completo della giornata

L'architettura sara' progettata fin dall'inizio con un approccio multi-tenant, in modo che l'MVP sviluppato per il primo cliente possa essere facilmente scalato e offerto come piattaforma SaaS ad altre tolettature.

### Key Differentiators

- **Velocita' di prenotazione**: presa appuntamento ottimizzata per essere completata in pochi click
- **Visione multi-sede**: agenda unificata ma separata per sede, pensata per attivita' in espansione
- **Roadmap AI-driven**: evoluzione pianificata verso chatbot WhatsApp/web, suggerimenti automatici del prossimo appuntamento e analytics sui clienti
- **Costruito per crescere**: architettura pensata fin dall'MVP per supportare le integrazioni future
- **Modello SaaS scalabile**: l'MVP e' il primo passo verso una piattaforma rivendibile - ogni funzionalita' viene costruita pensando alla multi-tenancy e alla scalabilita' verso altri operatori del settore

---

## Target Users

### Primary Users

**Persona 1: Marco - Il Titolare Operativo**
- **Eta'**: 30-40 anni, di entrambi i generi
- **Contesto**: Titolare di una tolettatura, spesso e' l'unico operatore del salone. E' un operativo che lavora direttamente sui cani e contemporaneamente gestisce l'attivita'. Sta ampliando il business e sta per aprire una seconda sede.
- **Competenza tecnologica**: Bassa - usa lo smartphone per WhatsApp e social ma non e' abituato a software gestionali
- **Frustrazione principale**: Gestisce appuntamenti su carta, perde chiamate mentre lavora, non riesce a tracciare i clienti, invia reminder manualmente. Con la crescita dell'attivita', il caos aumenta
- **Motivazione**: Vuole un sistema veloce che gli permetta di prendere appuntamenti in pochi secondi tra un servizio e l'altro, avere visione chiara dell'agenda e scalare senza perdere il controllo
- **Momento "aha!"**: Quando apre l'agenda e vede tutta la giornata organizzata per postazione, senza doppie prenotazioni e senza dover cercare su fogli di carta
- **Ruolo nel sistema**: Amministratore - gestisce listino, postazioni, orari, utenze e tutte le funzionalita' operative
- **Decisore**: E' lui che decide se adottare il software

**Persona 2: Sara - La Collaboratrice**
- **Eta'**: 20-40 anni
- **Contesto**: Lavora nella tolettatura, spesso part-time. Si occupa di svolgere i servizi richiesti dai clienti. Non gestisce l'organizzazione del salone
- **Competenza tecnologica**: Bassa - simile al titolare, usa smartphone ma non e' esperta di gestionali
- **Frustrazione principale**: Non sa con certezza gli appuntamenti del giorno, deve chiedere al titolare. A volte non ha le informazioni sul cane o sul cliente
- **Motivazione**: Avere chiarezza sui propri appuntamenti e accedere velocemente alle informazioni su clienti e cani
- **Ruolo nel sistema**: Collaboratore - gestisce anagrafiche clienti e cani, consulta e gestisce appuntamenti

**Nota importante**: La maggior parte dei saloni sono micro-saloni gestiti dal solo titolare. L'obiettivo primario dell'MVP e' digitalizzare il lavoro manuale che il titolare gia' svolge quotidianamente, semplificandolo. La piattaforma deve replicare e migliorare i processi esistenti (carta, chiamate, WhatsApp) senza aggiungere complessita'.

### Secondary Users

**Persona 3: Receptionist (futuro)**
- Prevista per i saloni piu' grandi, si occupa esclusivamente della gestione degli appuntamenti
- Sara' rilevante nella fase di crescita della piattaforma SaaS

**Persona 4: Il Cliente finale (futuro)**
- In una fase successiva all'MVP, i clienti potranno prenotare autonomamente tramite chatbot WhatsApp, chatbot sul sito web o interfaccia di prenotazione online

### User Journey

**Percorso del Titolare (Marco):**
- **Discovery**: Il primo utente e' un titolare locale che co-sviluppa la piattaforma. Per i futuri clienti: sito web pubblico della piattaforma, canali social, partecipazione a fiere di settore, passaparola tra colleghi
- **Proposta di valore per il micro-salone**: "Fai quello che fai gia', ma senza carta" - il messaggio deve essere chiaro: non stiamo aggiungendo complessita', stiamo eliminando il caos
- **Onboarding**: Due modalita' previste: (1) **Self-service** - setup guidato e intuitivo per i titolari che vogliono procedere in autonomia; (2) **Formazione assistita** - servizio a pagamento di onboarding e formazione, pensato per il basso livello tecnologico degli utenti. La vendita del servizio di formazione rappresenta un'ulteriore fonte di ricavo per la piattaforma SaaS
- **Uso quotidiano**: Presa appuntamenti rapida tra un servizio e l'altro, consultazione agenda per sede/postazione, gestione clienti e cani
- **Momento di valore**: La prima giornata lavorativa gestita interamente dal digitale senza carta, senza chiamate perse, senza sovrapposizioni
- **Lungo termine**: Gestione multi-sede da un unico pannello, adozione delle funzionalita' avanzate (reminder automatici, analytics, chatbot)

---

## Success Metrics

### Metriche di Successo Utente

- **Tempo di presa appuntamento**: ridotto a meno di 30 secondi rispetto alla gestione manuale su carta/telefono
- **Zero doppie prenotazioni**: eliminazione completa delle sovrapposizioni sulla stessa postazione
- **Visibilita' agenda completa**: il titolare visualizza l'intera giornata per sede e postazione in un colpo d'occhio
- **Riduzione chiamate perse**: gli appuntamenti vengono gestiti anche quando il titolare e' operativo con un cane, grazie all'accesso condiviso con collaboratori
- **Adozione completa**: il salone smette di usare carta entro 30 giorni dall'onboarding (target >80% dei saloni)

### Business Objectives

**Timeline di progetto:**
- **Mese 1**: Sviluppo MVP in collaborazione con il primo titolare
- **Mesi 2-3**: Affiancamento per adoption, correzione bug, ottimizzazione flussi, implementazione funzionalita' aggiuntive
- **Mesi 4-6**: Trasformazione in SaaS - implementazione logiche di business multi-tenant, integrazione metodi di pagamento (abbonamenti), dashboard di controllo del sistema, preparazione alla commercializzazione
- **Dal mese 6**: Messa online della piattaforma SaaS con possibilita' di vendita ad altri saloni

**Obiettivi per fase:**
- **A 3 mesi**: MVP validato e stabile, primo salone completamente digitalizzato, funzionalita' aggiuntive integrate
- **A 6 mesi**: Piattaforma SaaS pronta per la commercializzazione con logiche di business, pagamenti e dashboard di controllo
- **A 12 mesi**: 3-4 saloni attivi (1 nuovo salone ogni 2 mesi dal mese 6)
- **A 18 mesi**: 5-6+ saloni attivi, prime integrazioni avanzate (analytics base)

**Fonti di ricavo:**
- Abbonamenti SaaS ricorrenti (mensili)
- Servizi di formazione e onboarding a pagamento

### Key Performance Indicators

| KPI | Target | Misurazione |
|-----|--------|-------------|
| Saloni attivi sulla piattaforma | 3-4 a 12 mesi, 5-6+ a 18 mesi | Numero mensile |
| Nuovi saloni acquisiti | 1 ogni 2 mesi (dal mese 6) | Ritmo di acquisizione |
| Tasso di retention mensile | >90% | Saloni che rinnovano mese su mese |
| Appuntamenti gestiti per salone/mese | Da definire post-MVP | Volume medio di utilizzo |
| Tempo medio presa appuntamento | <30 secondi | Misurazione in-app |
| Tasso di adozione completa | >80% | % saloni che abbandonano la carta entro 30gg |
| MRR (Monthly Recurring Revenue) | Da definire post-pricing | Ricavo mensile ricorrente |
| Ricavi da formazione | Da tracciare dal mese 6 | Ricavo per onboarding venduto |

---

## MVP Scope

### Core Features (MVP - Mese 1)

**Gestione Utenze:**
- Creazione e gestione utenze con due ruoli: Amministratore e Collaboratore
- L'amministratore ha accesso a tutte le funzionalita', il collaboratore alle funzionalita' operative

**Gestione Listino Servizi:**
- Creazione e gestione dei servizi offerti con tariffe e tempi di esecuzione

**Gestione Sedi e Postazioni:**
- Configurazione sedi
- Creazione postazioni per sede con assegnazione dei servizi abilitati per ciascuna postazione
- Definizione orari di apertura e chiusura per postazione

**Anagrafica Clienti:**
- Gestione completa dell'anagrafica clienti con possibilita' di aggiungere note

**Anagrafica Cani:**
- Gestione anagrafica cani legati ai rispettivi clienti (relazione uno-a-molti) con possibilita' di aggiungere note

**Gestione Appuntamenti:**
- Presa appuntamento rapida (target: <30 secondi)
- Cancellazione appuntamenti
- Spostamento/riprogrammazione appuntamenti
- Vista agenda per sede e postazione

**Dashboard:**
- Dashboard riassuntiva con visione d'insieme dell'attivita'

### Versione Lancio (Mesi 2-6, prima della messa online)

**Fase 1 - Funzionalita' aggiuntive (Mesi 2-3):**
Integrazioni durante la fase di affiancamento con il tolettatore pilota:

- **Reminder automatici**: notifiche automatiche ai clienti per ricordare gli appuntamenti (WhatsApp/SMS)
- **Chatbot WhatsApp**: gestione delle prenotazioni tramite conversazione automatizzata su WhatsApp
- **Ulteriori integrazioni**: da valutare in base alle tempistiche di sviluppo e ai feedback del tolettatore pilota

**Fase 2 - Trasformazione SaaS (Mesi 4-6):**
Implementazione delle logiche necessarie per la commercializzazione:

- **Logiche di business multi-tenant**: isolamento dati per salone, gestione tenant, registrazione nuovi saloni
- **Integrazione metodi di pagamento**: gestione abbonamenti, fatturazione ricorrente, piani tariffari
- **Dashboard di controllo del sistema**: pannello amministrativo per monitorare i saloni, lo stato degli abbonamenti e le metriche della piattaforma

### Out of Scope (Futuro)

Funzionalita' esplicitamente escluse dall'MVP e dalla versione lancio, previste per fasi successive:

- Chatbot per il sito web
- Prenotazione autonoma del cliente tramite interfaccia web
- Analytics e reportistica avanzata
- Suggerimenti automatici del prossimo appuntamento
- Figura receptionist nel sistema

### MVP Success Criteria

L'MVP e' considerato riuscito quando:
- Il tolettatore pilota utilizza quotidianamente la piattaforma per la gestione degli appuntamenti
- La gestione cartacea e' completamente abbandonata
- I flussi operativi sono stabili e i bug critici risolti
- Il feedback del tolettatore pilota conferma che la piattaforma semplifica il lavoro quotidiano

La piattaforma e' pronta per la messa online (mese 6) quando:
- Le funzionalita' aggiuntive (reminder + chatbot WhatsApp) sono integrate e testate
- Le logiche di business SaaS sono implementate (multi-tenant, pagamenti, dashboard di controllo)
- Il tolettatore pilota ha validato l'esperienza complessiva durante i mesi di affiancamento
- L'architettura multi-tenant e' pronta per accogliere nuovi saloni con isolamento dati

### Future Vision

**Anno 1 (post-lancio, dal mese 6):**
- Acquisizione di 3-4 saloni (1 ogni 2 mesi)
- Consolidamento della piattaforma SaaS
- Servizio di formazione e onboarding a pagamento

**Anno 2-3:**
- Chatbot per il sito web
- Prenotazione autonoma del cliente
- Analytics e reportistica avanzata
- Suggerimenti automatici del prossimo appuntamento basati su AI
- Espansione del mercato e crescita della base clienti
- Possibile espansione verso settori affini (toelettatura gatti, centri veterinari)
