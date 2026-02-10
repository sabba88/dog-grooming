---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - product-brief-dog-grooming-2026-02-06.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: saas_b2b
  domain: general
  complexity: low
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - dog-grooming

**Author:** Samueles
**Date:** 2026-02-06

## Executive Summary

Piattaforma web gestionale verticale per tolettature per cani, progettata per digitalizzare la gestione operativa di saloni che oggi lavorano su carta, chiamate e WhatsApp.

**Problema:** I titolari di tolettature in crescita non riescono a scalare con strumenti manuali. Appuntamenti persi, doppie prenotazioni, nessuna tracciabilita' dei clienti, reminder manuali — il caos aumenta con ogni nuova postazione o sede.

**Soluzione:** Una web app che permette di prendere appuntamenti in meno di 30 secondi, visualizzare l'agenda per sede e postazione, gestire anagrafiche clienti/cani con storico prestazioni. Due ruoli (Amministratore e Collaboratore) coprono le esigenze del titolare operativo e dei suoi collaboratori.

**Differenziatori:**
- Velocita' di prenotazione ottimizzata per chi lavora con le mani occupate
- Visione multi-sede pensata per attivita' in espansione
- Roadmap evolutiva verso AI e automazione (chatbot WhatsApp, suggerimenti intelligenti)
- Architettura pensata per evolvere in SaaS multi-tenant rivendibile

**Utenti target:**
- **Marco (Titolare Operativo):** 30-40 anni, bassa competenza tecnologica, gestisce il salone e lavora sui cani. Amministratore del sistema.
- **Sara (Collaboratrice):** 20-40 anni, part-time, ha bisogno di chiarezza sugli appuntamenti e accesso alle informazioni su clienti e cani. Collaboratore del sistema.

**Contesto progetto:** Greenfield, validazione idea, sviluppatore singolo con AI, nessun brand o azienda esistente. Il primo salone pilota co-sviluppa la piattaforma.

## Criteri di Successo

### Successo Utente

- Presa appuntamento completata in meno di 30 secondi
- Zero doppie prenotazioni sulla stessa postazione
- Visibilita' completa dell'agenda giornaliera per sede e postazione in un colpo d'occhio
- Riduzione delle chiamate perse grazie all'accesso condiviso tra titolare e collaboratori
- Adozione completa: abbandono della carta entro 30 giorni dall'onboarding (target >80% dei saloni)
- Momento "aha!": la prima giornata lavorativa gestita interamente in digitale

### Successo Business

- MVP validato e stabile con il salone pilota entro il mese 1
- Piattaforma SaaS pronta per la commercializzazione entro il mese 6
- 3-4 saloni attivi a 12 mesi, 5-6+ a 18 mesi
- Traguardo chiave: circa 10 saloni attivi — segnale di sostenibilita' del business
- Retention mensile >90%
- Ritmo di acquisizione: 1 nuovo salone ogni 2 mesi dal mese 6
- Due fonti di ricavo: abbonamenti SaaS + servizi di formazione

### Successo Tecnico

- Interfaccia essenziale e accattivante — design pulito senza sacrificare l'estetica
- Caricamenti e salvataggi percepiti come istantanei — nessun indicatore di caricamento necessario
- Sistema stabile e affidabile per l'uso quotidiano in ambiente lavorativo

### Risultati Misurabili

| Metrica | Target | Quando |
|---------|--------|--------|
| Tempo presa appuntamento | < 30 secondi | MVP |
| Doppie prenotazioni | Zero | MVP |
| Adozione completa (abbandono carta) | > 80% dei saloni | Entro 30gg da onboarding |
| Saloni attivi | 3-4 | 12 mesi |
| Saloni attivi | ~10 (sostenibilita') | 18-24 mesi |
| Retention mensile | > 90% | Dal mese 6 |

## Scope Prodotto e Strategia di Sviluppo

### Filosofia MVP

**Approccio:** Problem-solving / Validazione idea

Doppio obiettivo: (1) risolvere il problema operativo quotidiano del tolettatore pilota e (2) validare che i tolettatori siano disposti a pagare per un gestionale digitale. Il prodotto viene prima dell'azienda.

**Risorse:** Sviluppatore singolo con sistemi agentici AI. Scope MVP rigorosamente contenuto.

### Fase 1 — MVP (Mese 1)

**Journey Supportati:**
- Marco — Setup del salone (onboarding)
- Marco — Presa appuntamento rapida (happy path)
- Marco — Spostamento e riorganizzazione (edge case)
- Sara — Giornata della collaboratrice

**Capacita' Must-Have:**
- Gestione utenze (Amministratore / Collaboratore)
- Gestione listino servizi (tariffe e tempi)
- Configurazione sedi e postazioni (servizi abilitati, orari)
- Anagrafica clienti con note
- Anagrafica cani con note (legati ai clienti, uno-a-molti)
- Presa appuntamento rapida (target <30 secondi)
- Cancellazione e spostamento appuntamenti
- Vista agenda per sede e postazione
- Note sulla prestazione con storico consultabile da anagrafica
- Dashboard riassuntiva

### Fase 2 — Growth (Mesi 2-6, in parallelo al test MVP)

- Reminder automatici ai clienti (WhatsApp/SMS)
- Chatbot WhatsApp per prenotazioni automatizzate
- Architettura multi-tenant (isolamento dati, registrazione nuovi saloni)
- Integrazione pagamenti (abbonamenti, fatturazione ricorrente)
- Dashboard di controllo sistema per monitoraggio piattaforma

### Fase 3 — Espansione (Futuro)

- Chatbot per il sito web
- Prenotazione autonoma del cliente via interfaccia web
- Analytics e reportistica avanzata
- Suggerimenti automatici del prossimo appuntamento (AI)
- Ruolo receptionist nel sistema
- Espansione verso settori affini (toelettatura gatti, centri veterinari)

### Mitigazione Rischi

**Rischio tecnico — Interfaccia prenotazione:**
L'interfaccia dell'agenda/prenotazione e' il cuore del prodotto. Mitigazione: prototipare come primo deliverable e validare col tolettatore pilota prima di costruire il resto.

**Rischio di mercato — Carta "sufficiente":**
I micro-saloni potrebbero non percepire il bisogno. Nessun brand esistente. Mitigazione: il tolettatore pilota e' il banco di prova. Validazione tramite adozione reale, acquisizione tramite passaparola.

**Rischio risorse — Singolo sviluppatore:**
Alta produttivita' con AI ma singolo punto di fallimento. Mitigazione: scope contenuto, nessun over-engineering, architettura semplice che possa evolvere.

## User Journeys

### Journey 1: Marco — Il Setup del Salone (Onboarding)

**Scena iniziale:** E' sera, Marco ha chiuso il salone. Ha deciso di provare la piattaforma — da solo o durante una sessione di formazione a pagamento. Ha davanti il suo listino scritto a mano e gli orari di apertura in testa.

**Azione:** Marco crea la sua prima sede, aggiunge le postazioni (tavolo da toelettatura, vasca), assegna i servizi abilitati con tariffe e tempi, imposta gli orari. Poi inserisce i primi clienti e i loro cani dal suo quaderno.

**Momento critico:** Marco vede per la prima volta l'agenda vuota, organizzata per postazione. Domani potra' prendere appuntamenti direttamente qui.

**Risoluzione:** Il salone e' configurato. Marco e' pronto per la sua prima giornata digitale.

### Journey 2: Marco — La Chiamata tra un Cane e l'Altro (Happy Path)

**Scena iniziale:** Marco sta asciugando un Golden Retriever. Il telefono squilla — una cliente abituale vuole fissare un appuntamento per il suo barboncino.

**Azione:** Marco si asciuga le mani, apre l'app, cerca la cliente, seleziona il cane, sceglie il servizio, vede la disponibilita', tocca lo slot libero e conferma. Meno di 30 secondi.

**Momento critico:** La cliente non ha nemmeno finito di dire "va bene giovedi'?" che Marco ha gia' confermato.

**Risoluzione:** Marco torna al Golden Retriever. L'appuntamento e' salvato, visibile a Sara, nessuna doppia prenotazione possibile.

### Journey 3: Marco — Spostare e Riorganizzare (Edge Case)

**Scena iniziale:** Lunedi' mattina, Marco apre l'agenda: mercoledi' ha un buco di due ore nel pomeriggio, la mattina e' piena. Un cliente chiama per spostare da mercoledi' mattina a venerdi'.

**Azione:** Marco sposta l'appuntamento a venerdi'. Poi compatta la giornata di mercoledi' anticipando un appuntamento del pomeriggio alla mattina.

**Momento critico:** La giornata e' riorganizzata in pochi tocchi, senza cancellature sul quaderno.

**Risoluzione:** Marco ha il controllo sulla sua agenda.

### Journey 4: Sara — La Giornata della Collaboratrice

**Scena iniziale:** Sara arriva al salone alle 9. Prima della piattaforma doveva chiedere a Marco "cosa ho oggi?". Ora apre l'app.

**Azione:** Sara vede i suoi appuntamenti con cliente, cane e servizio. Apre i dettagli del primo cane — le note delle prestazioni precedenti dicono: "Teddy — sensibile alle zampe posteriori, usare il pettine a denti larghi".

**Momento critico:** A fine servizio, Sara aggiunge una nota: "Oggi Teddy aveva un arrossamento dietro l'orecchio sinistro, segnalato alla proprietaria". La nota restera' nello storico consultabile dall'anagrafica.

**Risoluzione:** Sara lavora in autonomia, informata e precisa. Le note costruiscono uno storico prezioso per il salone.

### Tracciabilita' Journey → Capacita'

| Journey | Capacita' Rivelate |
|---------|-------------------|
| Marco — Setup | Configurazione sedi, postazioni, servizi, orari, anagrafica clienti/cani |
| Marco — Happy Path | Ricerca rapida cliente/cane, selezione servizio, vista disponibilita', prenotazione in <30s |
| Marco — Edge Case | Spostamento appuntamenti, riorganizzazione agenda, vista slot liberi |
| Sara — Quotidiano | Vista appuntamenti, dettagli cliente/cane, storico note prestazioni, aggiunta note post-servizio |

## Requisiti di Piattaforma

### Modello di Permessi (RBAC)

**Amministratore:**
- Accesso completo a tutte le funzionalita'
- Gestione listino servizi, sedi, postazioni, orari, utenze
- Tutte le funzionalita' operative

**Collaboratore:**
- Creazione e modifica appuntamenti
- Gestione clienti e cani
- Aggiunta note alle prestazioni
- Visualizzazione agenda di tutte le postazioni
- Consultazione listino (sola lettura)
- NO accesso a: listino, sedi/postazioni/orari, utenze

### Modello Tenant

- **MVP:** Single-tenant per il salone pilota
- **Growth:** Multi-tenant con isolamento dati, piani tariffari da definire

### Integrazioni

- **MVP:** Standalone, nessuna integrazione esterna
- **Growth:** WhatsApp/SMS, gateway di pagamento

### Compliance

- **GDPR** fin dall'MVP: consenso al trattamento, diritto all'oblio, portabilita' dati, informativa privacy
- **Visione internazionale:** architettura predisposta per conformita' multi-giurisdizione

### Considerazioni Implementative

- Web app responsive (smartphone e desktop), nessuna app nativa
- Interfaccia ottimizzata per utenti con bassa competenza tecnologica
- Performance percepita come istantanea
- Architettura predisposta per evoluzione multi-tenant

## Requisiti Funzionali

### Gestione Utenze e Accessi

- **FR1:** L'Amministratore puo' creare nuove utenze assegnando il ruolo di Amministratore o Collaboratore
- **FR2:** L'Amministratore puo' modificare e disattivare utenze esistenti
- **FR3:** Ogni utente puo' autenticarsi nel sistema con le proprie credenziali
- **FR4:** Il sistema limita le funzionalita' disponibili in base al ruolo dell'utente

### Gestione Sedi e Postazioni

- **FR5:** L'Amministratore puo' creare e configurare sedi
- **FR6:** L'Amministratore puo' creare postazioni per ciascuna sede
- **FR7:** L'Amministratore puo' assegnare i servizi abilitati a ciascuna postazione
- **FR8:** L'Amministratore puo' definire gli orari di apertura e chiusura per ciascuna postazione

### Gestione Listino Servizi

- **FR9:** L'Amministratore puo' creare servizi specificando nome, tariffa e tempo di esecuzione
- **FR10:** L'Amministratore puo' modificare ed eliminare servizi dal listino
- **FR11:** Il Collaboratore puo' consultare il listino servizi in sola lettura

### Anagrafica Clienti

- **FR12:** L'Amministratore e il Collaboratore possono creare nuovi clienti con i relativi dati anagrafici
- **FR13:** L'Amministratore e il Collaboratore possono modificare i dati di un cliente esistente
- **FR14:** L'Amministratore e il Collaboratore possono aggiungere e consultare note libere su un cliente
- **FR15:** L'Amministratore e il Collaboratore possono cercare un cliente in modo rapido

### Anagrafica Cani

- **FR16:** L'Amministratore e il Collaboratore possono aggiungere cani associati a un cliente (relazione uno-a-molti)
- **FR17:** L'Amministratore e il Collaboratore possono modificare i dati di un cane esistente
- **FR18:** L'Amministratore e il Collaboratore possono aggiungere e consultare note libere su un cane
- **FR19:** L'Amministratore e il Collaboratore possono visualizzare lo storico delle note prestazione associate a un cane

### Gestione Appuntamenti

- **FR20:** L'Amministratore e il Collaboratore possono creare un appuntamento selezionando cliente, cane, servizio, postazione e fascia oraria
- **FR21:** Il sistema impedisce la creazione di appuntamenti sovrapposti sulla stessa postazione
- **FR22:** L'Amministratore e il Collaboratore possono cancellare un appuntamento esistente
- **FR23:** L'Amministratore e il Collaboratore possono spostare un appuntamento a una nuova fascia oraria o data
- **FR24:** L'Amministratore e il Collaboratore possono aggiungere note alla prestazione al termine di un appuntamento
- **FR25:** Il sistema calcola automaticamente la durata dell'appuntamento in base al tempo di esecuzione del servizio selezionato

### Agenda e Visualizzazione

- **FR26:** L'Amministratore e il Collaboratore possono visualizzare l'agenda giornaliera organizzata per sede e postazione
- **FR27:** L'Amministratore e il Collaboratore possono navigare l'agenda tra giorni diversi
- **FR28:** L'agenda mostra per ogni appuntamento il cliente, il cane e il servizio previsto
- **FR29:** L'Amministratore e il Collaboratore possono identificare visivamente gli slot liberi e occupati

### Dashboard

- **FR30:** L'Amministratore e il Collaboratore possono accedere a una dashboard riassuntiva con una visione d'insieme dell'attivita'

### Privacy e Dati Personali

- **FR31:** Il sistema gestisce i dati personali dei clienti in conformita' GDPR
- **FR32:** Il sistema supporta il diritto all'oblio — cancellazione dati cliente su richiesta
- **FR33:** Il sistema supporta la portabilita' dei dati — esportazione dati cliente

## Requisiti Non-Funzionali

### Performance

- **NFR1:** Le pagine si caricano senza necessita' di indicatori di caricamento visibili
- **NFR2:** Le operazioni di salvataggio si completano senza ritardo percepibile
- **NFR3:** La creazione di un appuntamento completo (dalla ricerca cliente alla conferma) e' realizzabile in meno di 30 secondi
- **NFR4:** Il sistema supporta fino a 5 utenti concorrenti senza degradazione delle performance

### Sicurezza

- **NFR5:** L'autenticazione degli utenti avviene tramite credenziali protette
- **NFR6:** Le password sono memorizzate in forma crittografata (hash)
- **NFR7:** I dati personali sono trasmessi su connessione cifrata (HTTPS)
- **NFR8:** L'accesso alle funzionalita' e' controllato dal ruolo assegnato
- **NFR9:** Il sistema e' conforme GDPR: consenso al trattamento, diritto all'oblio, portabilita' dei dati, informativa privacy
- **NFR10:** L'architettura di sicurezza supporta conformita' multi-giurisdizione

### Scalabilita'

- **NFR11:** L'MVP supporta un singolo salone con un massimo di 5 utenti concorrenti
- **NFR12:** L'architettura non introduce vincoli che impediscano l'evoluzione verso multi-tenant
