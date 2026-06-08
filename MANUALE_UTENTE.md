# Manuale Utente — Baum House Grooming
**Versione 1.0 — Aprile 2026**

---

## Indice

1. [Accesso all'applicazione](#1-accesso-allapplicazione)
2. [Struttura dell'interfaccia](#2-struttura-dellinterfaccia)
3. [Ruoli utente](#3-ruoli-utente)
4. [Configurazione iniziale — checklist Admin](#4-configurazione-iniziale--checklist-admin)
5. [Impostazioni (solo Admin)](#5-impostazioni-solo-admin)
6. [Servizi](#6-servizi)
7. [Razze e prezzi (solo Admin)](#7-razze-e-prezzi-solo-admin)
8. [Personale e turni (solo Admin)](#8-personale-e-turni-solo-admin)
9. [Agenda](#9-agenda)
10. [Clienti](#10-clienti)
11. [Cani](#11-cani)
12. [Dashboard e KPI](#12-dashboard-e-kpi)
13. [Workflow operativo quotidiano](#13-workflow-operativo-quotidiano)
14. [Domande frequenti e risoluzione problemi](#14-domande-frequenti-e-risoluzione-problemi)

---

## 1. Accesso all'applicazione

### Come accedere

1. Aprire il browser e navigare all'indirizzo fornito
2. Inserire **email** e **password** ricevute dall'amministratore
3. Cliccare **Accedi**

Se le credenziali sono corrette, si viene reindirizzati direttamente all'**Agenda**.

> **Password dimenticata?** Contattare l'amministratore per il reset delle credenziali.

### Come uscire

Cliccare sul proprio nome utente nell'angolo in alto a destra → **Esci**.

---

## 2. Struttura dell'interfaccia

### Desktop

L'interfaccia è divisa in tre aree principali:

| Area | Descrizione |
|------|-------------|
| **Barra laterale sinistra** | Menu di navigazione principale. È collassabile (cliccare la freccia) per guadagnare spazio. |
| **Header superiore** | Mostra la sede selezionata (dropdown) e il nome utente. |
| **Area centrale** | Contenuto della pagina corrente. |

### Mobile

Su smartphone e tablet:

- La **barra laterale** si apre toccando l'icona menu (☰) in alto a sinistra
- In basso è presente una **navigation bar** con le voci principali: Agenda, Clienti, Cani, Dashboard
- I form si aprono come **pannelli scorrevoli dal basso**

### Selezione sede

Se l'azienda ha più sedi, nell'header compare un **dropdown** per selezionare la sede attiva. Tutti i dati visualizzati (agenda, personale, appuntamenti) si aggiornano in base alla sede scelta.

---

## 3. Ruoli utente

L'applicazione prevede due ruoli:

### Admin
Accesso completo a tutte le funzionalità:
- Agenda, Clienti, Cani, Servizi, Dashboard
- Personale (gestione turni)
- Razze e prezzi
- Impostazioni (sedi, utenti)

### Collaboratore
Accesso alle funzionalità operative quotidiane:
- Agenda, Clienti, Cani, Servizi, Dashboard
- **Non può** accedere a: Personale, Razze, Impostazioni

> Se un Collaboratore tenta di accedere a una pagina riservata all'Admin, viene reindirizzato automaticamente all'Agenda.

---

## 4. Configurazione iniziale — checklist Admin

Prima di iniziare a usare l'applicazione operativamente, completare questi passaggi nell'ordine indicato:

- [ ] **1. Creare i servizi** (Servizi → Nuovo Servizio) con nome, prezzo e durata
- [ ] **2. Creare la sede** (Impostazioni → Gestione Sedi → Nuova Sede)
- [ ] **3. Configurare le stazioni** della sede (es: Vasca 1, Tavolo toelettatura)
- [ ] **4. Assegnare i servizi** a ogni stazione
- [ ] **5. Impostare gli orari di apertura** per ogni giorno della settimana
- [ ] **6. Creare gli utenti collaboratori** (Impostazioni → Gestione Utenti → Nuovo Utente)
- [ ] **7. Assegnare i turni** ai collaboratori (Personale → cliccare collaboratore → calendario)
- [ ] **8. Aggiungere le razze** principali (Razze → Nuova Razza) — facoltativo
- [ ] **9. Configurare i prezzi per razza** — facoltativo

> Solo dopo questi passaggi sarà possibile creare appuntamenti correttamente dall'agenda.

---

## 5. Impostazioni (solo Admin)

Le Impostazioni si trovano in fondo alla barra laterale. Contengono due sezioni.

### Gestione Sedi

**Creare una nuova sede**

1. Cliccare **Nuova Sede**
2. Inserire nome e indirizzo
3. Cliccare **Salva**

**Configurare una sede**

Cliccare su una sede per accedere alla configurazione dettagliata.

**Stazioni**
Le stazioni sono le postazioni fisiche della sede (es: Vasca 1, Vasca 2, Tavolo toelettatura).

1. Cliccare **Aggiungi stazione**
2. Inserire il nome della stazione
3. Selezionare i **servizi disponibili** per quella stazione (tramite le checkbox)
4. Cliccare **Salva**

In fase di creazione appuntamento, il sistema mostrerà solo le stazioni che supportano il servizio selezionato.

> I servizi devono essere creati prima di poterli assegnare alle stazioni (vedi sezione 6).

**Orari di apertura**
Configurare gli orari per ogni giorno della settimana:

1. Attivare il toggle del giorno (es: Lunedì → Aperto)
2. Inserire orario inizio (es: 09:00) e orario fine (es: 18:00)
3. Cliccare **Salva**

Questi orari rappresentano i vincoli di disponibilità: non è possibile creare appuntamenti al di fuori degli orari di apertura.

---

### Gestione Utenti

**Creare un nuovo utente**

1. Cliccare **Nuovo Utente**
2. Compilare:
   - Email (deve essere univoca)
   - Password (minimo 8 caratteri)
   - Nome
   - Ruolo: Admin o Collaboratore
3. Cliccare **Salva**

Il nuovo utente potrà accedere immediatamente con le credenziali inserite.

**Disattivare un utente**

Quando un collaboratore non lavora più nell'azienda:
1. Cliccare il nome dell'utente
2. Cliccare **Disattiva**

L'utente non potrà più accedere. I suoi dati storici rimangono intatti.

Per riattivarlo: cliccare **Riattiva**.

> Non è possibile disattivare il proprio account.

---

## 6. Servizi

La pagina Servizi mostra il catalogo dei servizi offerti dall'azienda.

### Visualizzazione

Tabella con:
- Nome servizio (es: Bagno, Toelettatura completa, Solo taglio unghie)
- Prezzo standard (in EUR)
- Durata (in minuti)

### Creare o modificare un servizio (Admin only)

1. Cliccare **Nuovo Servizio**
2. Compilare: nome, prezzo, durata
3. Cliccare **Salva**

Per modificare un servizio esistente: cliccare l'icona di modifica nella riga corrispondente.

> I Collaboratori possono solo **visualizzare** i servizi, non crearli o modificarli.

---

## 7. Razze e prezzi (solo Admin)

La sezione Razze permette di gestire il catalogo delle razze canine e configurare prezzi personalizzati per servizio.

### Gestire le razze

1. Cliccare **Nuova Razza**
2. Inserire il nome della razza
3. Cliccare **Salva**

### Configurare prezzi personalizzati per razza

Per alcune razze può essere utile impostare un prezzo diverso da quello standard del servizio (es: Toelettatura per Golden Retriever = €65 invece di €55 standard).

1. Nella lista razze, cliccare la razza desiderata
2. Nella sezione **Prezzi specifici**, cliccare **Configura prezzo** accanto al servizio
3. Inserire il nuovo prezzo (in EUR)
4. Cliccare **Salva**

Il sistema userà automaticamente questo prezzo quando si crea un appuntamento per un cane di quella razza.

Per rimuovere l'override e tornare al prezzo standard: cliccare l'icona **Elimina** accanto al prezzo personalizzato.

---

## 8. Personale e turni (solo Admin)

La sezione Personale permette di assegnare i turni ai collaboratori per ogni sede.

> **Importante:** senza turni assegnati, il collaboratore non appare nell'agenda e non può essere associato a nuovi appuntamenti.

### Visualizzazione

Tabella con:
- Nome collaboratore
- Email
- Ruolo (Admin / Collaboratore)
- Numero di giorni con turno assegnato

### Assegnare un turno

1. Cliccare il nome del collaboratore
2. Nel calendario interattivo:
   - Selezionare la **data** desiderata
   - Scegliere la **sede** di riferimento
   - Inserire l'**orario inizio** (formato 24h, es: 09:00)
   - Inserire l'**orario fine** (es: 18:00)
3. Cliccare **Salva assegnazione**

Ripetere per ogni giorno lavorativo del collaboratore.

> I turni sono assegnati giorno per giorno (non come turni ricorrenti). È necessario configurarli anticipatamente per il periodo desiderato.

---

## 9. Agenda

L'agenda è il cuore dell'applicazione. Permette di visualizzare e gestire tutti gli appuntamenti.

### Viste disponibili

**Vista Settimana** (predefinita)
- Panoramica di 7 giorni con il numero di appuntamenti per ogni giorno
- Cliccare un giorno per aprire la vista dettagliata di quel giorno

**Vista Giorno**
- Mostra la griglia oraria del giorno selezionato
- Ogni **colonna** rappresenta un collaboratore presente in sede
- Ogni **riga** rappresenta uno slot orario
- Gli appuntamenti appaiono come blocchi colorati

### Navigare tra le date

- Usare le **frecce** (← →) per spostarsi al giorno/settimana precedente o successivo
- Cliccare la **data** al centro per aprire il calendario e saltare a una data specifica
- Il pulsante **Oggi** riporta alla data corrente

### Creare un appuntamento

1. Nella vista Giorno, cliccare uno **slot vuoto** nella colonna del collaboratore desiderato
2. Si apre il form "Nuovo Appuntamento":

**Step 1 — Cliente**
- Digitare il nome del cliente nel campo di ricerca
- Selezionare il cliente dalla lista suggerita
- Se il cliente non esiste ancora → cliccare **"Nuovo Cliente"** e compilare il form inline

**Step 2 — Cane**
- I cani del cliente vengono caricati automaticamente
- Selezionare il cane dal menu a tendina
- Se il cane non è ancora registrato → cliccare **"Aggiungi cane"**

**Step 3 — Servizio**
- Selezionare il servizio dal menu a tendina (es: Bagno, Toelettatura completa)
- La **durata** viene compilata automaticamente in base al servizio

**Step 4 — Stazione**
- Selezionare la postazione fisica (es: Vasca 1, Tavolo toelettatura)

**Step 5 — Prezzo**
- Il prezzo viene calcolato automaticamente
- Può essere modificato manualmente se necessario

3. Cliccare **Crea Appuntamento**

> **Attenzione:** Se lo slot selezionato è già occupato o supera l'orario del turno del collaboratore, il sistema mostra un messaggio con gli slot alternativi disponibili.

### Gestire un appuntamento esistente

Cliccare un appuntamento esistente per aprirne i dettagli. Sono disponibili le seguenti azioni:

**Visualizza dettagli**
Mostra: cliente, cane, servizio, orario, prezzo, note.

**Aggiungi nota**
- Cliccare "Aggiungi nota" (o l'apposita voce nel menu)
- Scrivere il testo nel campo note
- La nota viene salvata con autore e data

**Sposta appuntamento**
1. Dal menu dell'appuntamento → **Sposta**
2. Il sistema entra in modalità spostamento (viene mostrato un banner di conferma)
3. Cliccare il **nuovo slot** desiderato
4. Se il nuovo slot è libero → appuntamento spostato
5. Se il nuovo slot è occupato → il sistema suggerisce orari alternativi disponibili

**Cancella appuntamento**
1. Dal menu → **Cancella**
2. Confermare nell'avviso: "L'azione è irreversibile"
3. L'appuntamento viene eliminato immediatamente

---

## 10. Clienti

### Lista clienti

La pagina Clienti mostra tutti i clienti dell'azienda.

- **Ricerca:** usare la barra di ricerca in alto per trovare un cliente per nome
- **Desktop:** vista a tabella con nome, telefono, email, ultimo appuntamento
- **Mobile:** vista a card con le informazioni principali

### Creare un nuovo cliente

1. Cliccare **Nuovo Cliente**
2. Compilare il form:

| Campo | Obbligatorio | Note |
|-------|-------------|------|
| Nominativo | Sì | Nome e cognome del proprietario |
| Telefono | Sì | Numero principale |
| Secondo proprietario | No | Nome di un secondo contatto |
| Telefono secondo | No | Numero del secondo contatto |
| Terzo proprietario | No | Nome di un terzo contatto |
| Telefono terzo | No | Numero del terzo contatto |
| Email | No | Indirizzo email |

3. Cliccare **Salva** — il sistema registra automaticamente la data di consenso privacy

### Scheda cliente

Cliccare su un cliente per aprirne la scheda dettagliata.

**Sezione: Dati Anagrafici**
- Visualizza tutti i dati del cliente
- Cliccare **Modifica** per aggiornare nome, telefoni, email
- Cliccare **Salva** per confermare le modifiche

**Sezione: Cani**
- Elenco dei cani associati al cliente
- Cliccare **Aggiungi cane** per registrare un nuovo animale:
  - Nome (obbligatorio)
  - Razza (facoltativo)
  - Taglia: Piccola / Media / Grande
  - Data di nascita
  - Sesso: Maschio / Femmina
  - Sterilizzato: Sì / No
- Cliccare il nome di un cane per aprire la sua scheda

**Sezione: Note cliente**
- Elenco di tutte le note inserite dallo staff
- Cliccare **Aggiungi nota** per inserire un'annotazione (es: "cliente preferisce essere chiamato il giorno prima")
- Ogni nota riporta autore e data

**Sezione: Cronologia appuntamenti**
- Elenco di tutti gli appuntamenti (passati e futuri) associati al cliente
- Colonne: data, orario, servizio, cane, prezzo, note

---

## 11. Cani

### Lista cani

La pagina Cani mostra tutti gli animali registrati nel sistema.

- Filtri e ricerca per nome, razza o proprietario
- Cliccare su un cane per aprire la sua scheda

### Scheda cane

**Sezione: Dati Anagrafici**
- Nome, razza, taglia, sesso, data di nascita, sterilizzato
- Cliccare **Modifica** per aggiornare i dati

**Sezione: Note cane**
- Note specifiche sull'animale (es: "timoroso con altri cani", "allergia allo shampoo X")
- Cliccare **Aggiungi nota**

**Sezione: Storico servizi**
- Elenco di tutti i servizi eseguiti sull'animale
- Colonne: data, orario, servizio, prezzo, note
- Ordinato dal più recente

> **Navigazione rapida:** nella scheda cane è presente un breadcrumb. Cliccare il nome del proprietario per tornare alla sua scheda cliente.

---

## 12. Dashboard e KPI

La Dashboard fornisce una panoramica in tempo reale delle performance dell'azienda.

### Riquadri KPI (mese corrente)

| Metrica | Descrizione |
|---------|-------------|
| **Appuntamenti mese** | Numero totale di appuntamenti nel mese. Mostra la variazione percentuale rispetto al mese precedente. |
| **Incasso confermato** | Ricavo totale dagli appuntamenti del mese (in EUR). Con variazione % rispetto al mese scorso. |
| **Previsione incasso** | Stima del ricavo dagli appuntamenti ancora da completare nel mese. |
| **Nuovi clienti** | Numero di nuovi clienti registrati nel mese. |
| **Appuntamenti oggi** | Numero di appuntamenti nella giornata corrente. |

### Grafici

**Andamento settimanale**
- Grafico a linee con il numero di appuntamenti per ogni giorno degli ultimi 7 giorni
- Utile per identificare i giorni più carichi

**Distribuzione servizi (mese)**
- Grafico a torta con la percentuale dei servizi più richiesti
- Utile per capire quali servizi trainano il business

**Ricavi mensili (ultimi 6 mesi)**
- Grafico ad area con il trend dei ricavi mese per mese
- Utile per valutare l'andamento economico nel tempo

---

## 13. Workflow operativo quotidiano

### Workflow del Collaboratore

**Mattina — verifica agenda**
1. Accedere all'applicazione
2. La pagina di partenza è l'**Agenda** con la data odierna
3. Verificare gli appuntamenti del giorno nella propria colonna

**Durante la giornata — creare un appuntamento**
1. Cliccare lo slot orario desiderato nell'agenda
2. Cercare il cliente (o crearne uno nuovo)
3. Selezionare cane, servizio, stazione
4. Verificare il prezzo e confermare

**Durante la giornata — gestire un appuntamento**
- **Note:** aggiungere osservazioni sull'animale o sul servizio
- **Spostamento:** se il cliente chiama per cambiare orario → menu appuntamento → Sposta
- **Cancellazione:** menu appuntamento → Cancella → Conferma

**Fine giornata — check dashboard**
1. Aprire la **Dashboard**
2. Verificare gli incassi del giorno e i KPI mensili

---

### Workflow dell'Admin

**Inizio mese — pianificazione turni**
1. Aprire **Personale**
2. Per ogni collaboratore: cliccare il nome e assegnare i turni del mese

**Durante il mese — monitoraggio**
1. Controllare la **Dashboard** periodicamente
2. Verificare l'andamento degli appuntamenti, dei ricavi e dei nuovi clienti

**On-demand — gestione anagrafica**
- Aggiornare servizi e prezzi se necessario
- Aggiungere nuovi collaboratori se l'organico cambia
- Aggiornare gli orari di apertura per festività o variazioni stagionali

---

## 14. Domande frequenti e risoluzione problemi

### Problemi comuni

**"Slot occupato"**
> Lo slot orario selezionato è già prenotato da un altro appuntamento.
>
> **Soluzione:** il sistema suggerisce automaticamente gli orari alternativi disponibili. Selezionarne uno o scegliere un altro collaboratore.

**"Appuntamento supera fine turno"**
> La durata del servizio farebbe terminare l'appuntamento dopo l'orario di fine turno del collaboratore.
>
> **Soluzione:** scegliere uno slot precedente, o estendere il turno del collaboratore in Personale.

**"Nessun collaboratore disponibile"**
> Nessun collaboratore ha un turno assegnato per quella sede e data.
>
> **Soluzione:** andare in Personale → cliccare il collaboratore → assegnare un turno per quella data.

**"Credenziali non valide"**
> Email o password errata al login.
>
> **Soluzione:** verificare email e password. Se dimenticate, contattare l'amministratore per il reset.

---

### Domande frequenti

**Come sposto un appuntamento?**
Agenda → cliccare l'appuntamento → dal menu contestuale selezionare "Sposta" → cliccare il nuovo slot desiderato.

**Come modifico il prezzo di un appuntamento?**
Il prezzo è modificabile direttamente nel form durante la creazione. Dopo la creazione, non è possibile modificarlo via interfaccia: cancellare e ricreare l'appuntamento con il prezzo corretto.

**Come aggiungo un secondo cane allo stesso cliente?**
Clienti → cliccare il cliente → sezione "Cani" → pulsante "Aggiungi cane".

**Un collaboratore non appare nell'agenda: perché?**
Il collaboratore non ha un turno assegnato per quella data e sede. Andare in Personale → cliccare il collaboratore → assegnare il turno.

**Come configuro un giorno di chiusura?**
Impostazioni → Gestione Sedi → cliccare la sede → Orari di apertura → disattivare il toggle del giorno desiderato.

**Come elimino un cliente?**
L'eliminazione clienti non è disponibile via interfaccia. Contattare il supporto tecnico per l'archiviazione manuale.

**L'agenda mostra orari che non corrispondono all'apertura: perché?**
Verificare che gli orari di apertura siano configurati correttamente in Impostazioni → Gestione Sedi → cliccare sede → Orari di apertura.

---

## Note finali

Questa applicazione è ottimizzata per:
- **Desktop:** Chrome, Firefox, Edge (versioni recenti)
- **Mobile:** iOS Safari, Android Chrome

Per assistenza tecnica o segnalazione di problemi, contattare il team di sviluppo.

---

*Manuale Utente — Baum House Grooming — v1.0 — Aprile 2026*
