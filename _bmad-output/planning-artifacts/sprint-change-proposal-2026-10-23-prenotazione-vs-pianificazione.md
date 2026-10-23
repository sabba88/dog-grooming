# Sprint Change Proposal — Separazione Prenotazione / Pianificazione

**Data:** 2026-10-23
**Autore:** Samueles
**Stato:** Implementato sul branch `dev` — migration non ancora applicata ai database

> **Scostamenti dal piano** (vedi Sezione 11 in fondo per lo stato per fase):
> - Il vassoio "Da pianificare" non usa il drag & drop dalla lista alla griglia, ma
>   riusa il meccanismo di spostamento gia' esistente ("Posiziona" → si tocca lo
>   slot). Funziona anche su mobile, dove il drag dalla lista non funzionerebbe.
> - `getServicesDistribution` resta su `innerJoin`: e' gia' l'esclusione esplicita
>   degli appuntamenti senza servizio che il piano chiedeva di aggiungere.

---

## Sezione 1 — Riepilogo del Problema

### Problema

Oggi esiste un solo punto di ingresso per creare un appuntamento: la griglia
dell'Agenda. Per prenotare bisogna **prima** scegliere una colonna (postazione o
collaboratore), **poi** compilare una scheda che chiede in cascata cliente →
cane → postazione → servizio → durata → prezzo → note, con quattro chiamate di
rete in sequenza e due regole di business bloccanti (sovrapposizione, sforamento
turno).

Questo è il flusso giusto per **pianificare**, ma è il flusso sbagliato per
**prenotare**. Al banco o al telefono serve registrare in pochi secondi:
*giorno, ora, cliente, cane*. Tutto il resto — chi lava, su quale postazione,
quale servizio esatto, a che prezzo — è una decisione che gli amministratori
prendono con calma nelle settimane precedenti.

### Evidenza nel codice

| Evidenza | Riferimento |
|---|---|
| Scheda appuntamento da 854 righe, 7 decisioni in cascata | `src/components/appointment/AppointmentForm.tsx` |
| 4 round-trip in sequenza: cani → postazioni → servizi → prezzo | `fetchDogsForClient`, `fetchStationsForLocation`, `fetchServicesForStation`, `fetchAppointmentPrice` |
| Nessuna rotta di creazione fuori dalla griglia | `src/app/(auth)/agenda/page.tsx` è l'unico entry point |
| `serviceId` e `price` sono `NOT NULL`: impossibile prenotare senza deciderli | `src/lib/db/schema.ts:176-186` |
| L'appuntamento non ha una sede: la sede si deduce dalla postazione | `appointments` non ha `location_id` |
| Un appuntamento senza postazione compare in **tutte** le sedi | `src/lib/queries/appointments.ts:123` — `or(eq(stations.locationId, …), isNull(appointments.stationId))` |

L'ultima riga è il vero blocco architetturale: nel modello nuovo la postazione
viene assegnata **dopo**, quindi *ogni* appuntamento appena prenotato sarebbe
privo di sede e verrebbe mostrato in ogni negozio del tenant.

---

## Sezione 2 — Modello Target

Tre fasi distinte, tre strumenti distinti:

| Fase | Sezione | Chi | Quando | Cosa si decide |
|---|---|---|---|---|
| **1. Prenotazione** | `/bookings` — *Prenotazioni* (nuova) | Tutti | Al banco / al telefono, in tempo reale | Giorno, ora, durata, cliente, cane |
| **2. Pianificazione** | `/agenda` — *Pianificazione* (rinominata) | Tutti | Offline, nelle settimane precedenti | Postazione, collaboratore, servizio, prezzo |
| **3. Esecuzione** | `/appointments/[id]/checkout` | Tutti | Il giorno stesso | Prodotti venduti, incasso |

L'appuntamento è quindi un oggetto che **si completa progressivamente**: nasce
scarno in fase 1, si arricchisce in fase 2, si chiude in fase 3.

### Decisioni prese (23/10/2026)

1. **Durata** — scelta rapida a bottoni `60 / 90 / 120` minuti più campo
   personalizzato. Preselezione: 60 min.
2. **Postazioni** — nessun vincolo di capacità. Le N corsie del calendario
   (N = numero di postazioni della sede) sono solo un riferimento visivo: si può
   sforare senza blocchi né avvisi. Nessuna postazione viene assegnata in
   prenotazione.
3. **Servizio e prezzo** — campi **opzionali** in prenotazione: chi ha fretta li
   salta, chi sa già cosa serve li compila subito.
4. **Accessi** — entrambe le sezioni visibili ad admin e collaboratori.

### Conseguenza diretta sulle regole di business

In prenotazione **non si applica nessuna** delle validazioni odierne:

- ~~sovrapposizione per collaboratore~~ (non c'è un collaboratore)
- ~~sovrapposizione per postazione~~ (non c'è una postazione)
- ~~sforamento turno~~ (non c'è un turno di riferimento)
- ~~servizio abilitato sulla postazione~~ (non c'è né servizio né postazione)

Le validazioni restano invariate **in pianificazione**, dove hanno senso.
Nota collaterale: il **punto 1 del backlog Maurizio** ("slot già occupato", mai
riprodotto) sparisce per definizione dal percorso di prenotazione.

---

## Sezione 3 — Impatto sullo Schema DB

### Migration `drizzle/0007_booking_planning_split.sql`

```sql
-- 1. Sede dell'appuntamento: oggi dedotta dalla postazione, che ora può mancare
ALTER TABLE appointments ADD COLUMN location_id uuid;

UPDATE appointments a
   SET location_id = s.location_id
  FROM stations s
 WHERE s.id = a.station_id
   AND a.location_id IS NULL;

-- Fallback per gli appuntamenti già privi di postazione:
-- prima sede del tenant (da verificare caso per caso prima del deploy)
UPDATE appointments a
   SET location_id = (
         SELECT l.id FROM locations l
          WHERE l.tenant_id = a.tenant_id
          ORDER BY l.created_at ASC
          LIMIT 1)
 WHERE a.location_id IS NULL;

ALTER TABLE appointments ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_location_id_fk
  FOREIGN KEY (location_id) REFERENCES locations(id);

CREATE INDEX appointments_location_start_idx
  ON appointments (tenant_id, location_id, start_time);

-- 2. Servizio e prezzo diventano facoltativi
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN price DROP NOT NULL;
```

### `src/lib/db/schema.ts`

```ts
export const appointments = pgTable('appointments', {
  // …
  locationId: uuid('location_id').notNull().references(() => locations.id), // NUOVO
  serviceId: uuid('service_id'),   // era .notNull()
  price: integer('price'),         // era .notNull()
  // …
})
```

### Stato "da pianificare" — derivato, non memorizzato

Non si introduce una colonna `status`: uno stato memorizzato va tenuto in sync a
mano e va fuori fase al primo bug. Lo stato è una funzione delle colonne:

```ts
// src/lib/utils/appointment.ts (nuovo)
export function isDaPianificare(a: {
  stationId: string | null
  userId: string | null
  serviceId: string | null
}) {
  return !a.stationId || !a.userId || !a.serviceId
}
```

---

## Sezione 4 — Impatto su Query e Action

### Query da correggere (`innerJoin services` → `leftJoin`, filtro sede)

| File | Funzione / riga | Modifica |
|---|---|---|
| `src/lib/queries/appointments.ts` | `getAppointmentById` (:31) | `innerJoin(services)` → `leftJoin` |
| | `getAppointmentsByDateAndLocation` (:71,:74) | `innerJoin(stations)` → filtro `eq(appointments.locationId, …)`; servizi in `leftJoin` |
| | `getAppointmentsByDateAndLocationGroupedByUser` (:118-123) | idem; **eliminare** l'`or(… isNull(stationId))` |
| | `getWeeklyAppointmentsByStation` (:150-154) | filtro per `locationId`, non più per join postazione |
| | `getWeeklyAppointmentsByPerson` (:186-190) | idem |
| | `getServiceNotesByDog` (:223) | `leftJoin(services)` |
| `src/lib/queries/clients.ts` | :135 | `leftJoin(services)` — storico cliente |
| `src/lib/queries/dashboard.ts` | :137 | revenue per servizio: `leftJoin` + esclusione esplicita dei NULL |

> `sum(appointments.price)` in `dashboard.ts` non richiede modifiche: SQL `SUM`
> ignora i NULL. Il **conteggio** appuntamenti invece li include, il che è
> corretto — un appuntamento prenotato esiste anche senza prezzo.

### Nuovi file lato server

| File | Contenuto |
|---|---|
| `src/lib/validations/bookings.ts` | `createBookingSchema`: `locationId, date, time, duration, clientId, dogId, serviceId?, price?, notes?` |
| `src/lib/queries/bookings.ts` | `getBookingsByDateAndLocation(locationId, date, tenantId)` — filtro diretto su `appointments.locationId`, `leftJoin` servizi |
| `src/lib/actions/bookings.ts` | `createBooking` (nessuna validazione di conflitto), `getBookingDayData` (appuntamenti + orari sede + conteggio postazioni) |

`createAppointment` / `updateAppointment` / `moveAppointment` restano come sono:
sono gli strumenti della **pianificazione** e le loro regole restano valide.
Unica aggiunta: devono valorizzare `locationId`.

---

## Sezione 5 — Nuova Sezione Prenotazioni

### Rotta e navigazione

- `src/app/(auth)/bookings/page.tsx` — server component, carica le sedi come fa `/agenda`
- `nav-items.ts`: *Prenotazioni* (icona `CalendarPlus`) **primo** elemento di
  `mainNavItems` e di `bottomBarItems`; *Agenda* diventa *Pianificazione*
- `pageTitles`: `'/bookings': 'Prenotazioni'`, `'/agenda': 'Pianificazione'`
- I 13 `redirect('/agenda')` (login, middleware, pagine admin-only, checkout)
  puntano a `/bookings`: è la schermata di lavoro quotidiana

### Componenti nuovi

| Componente | Righe stimate | Ruolo |
|---|---|---|
| `src/components/booking/BookingCalendar.tsx` | ~250 | Calendario giornaliero. Sfondo a N colonne (N = postazioni della sede) come riferimento visivo di capacità; gli appuntamenti si dispongono per corsie di sovrapposizione — se gli appuntamenti in contemporanea superano N, le corsie crescono e le colonne si stringono (segnale visivo di sforamento, **senza blocco**). Click su una cella vuota → form con ora preimpostata. |
| `src/components/booking/BookingForm.tsx` | ~200 | Ricerca cliente/cane (riusa `ClientDogSearch`), bottoni durata `60/90/120` + custom, servizio e prezzo in una sezione "Dettagli (opzionale)" richiudibile, note, Conferma. |
| `src/components/booking/BookingBlock.tsx` | ~80 | Blocco compatto: ora, cliente, cane, badge *Da pianificare*. |

### Riuso dall'esistente

`SLOT_HEIGHT_PX`, `MINUTES_PER_SLOT`, `layoutAppointments`, `timeToMinutes`,
`minutesToTime` (`src/lib/utils/schedule.ts`), `DateNavigation` / `DateStrip`,
`ClientDogSearch`, `QuickClientForm`, `QuickDogForm`, `useLocationSelector`,
`useIsMobile`.

### Intervallo orario della griglia

`computeAgendaRange` (`schedule.ts:238`) restituisce apertura −1h / chiusura +1h.
È esattamente la causa del **punto 12 del backlog Maurizio**: fuori da quella
finestra la griglia non viene renderizzata. Il calendario di prenotazione usa
invece l'intera fascia `07:00–22:00`, con gli orari di apertura evidenziati e il
fuori-orario in grigio ma **cliccabile**. Questo chiude il punto 12 sul percorso
di prenotazione; sulla pianificazione va allineato a parte.

---

## Sezione 6 — Pianificazione (ex Agenda)

L'Agenda **non viene smontata**: viste giorno/settimana, raggruppamento
postazioni/persone, drag & drop, spostamento, appuntamenti in parallelo restano
tali e quali. Cambia il ruolo e si aggiungono tre cose:

1. **Vassoio "Da pianificare"** — pannello laterale (o sheet su mobile) con gli
   appuntamenti del periodo che hanno `stationId`, `userId` o `serviceId` nulli.
   Da lì si trascinano direttamente sulla griglia.
2. **Badge sui blocchi** — `AppointmentBlock` mostra bordo tratteggiato e badge
   *Da pianificare* finché l'appuntamento è incompleto.
3. **Contatore in testata** — "12 da pianificare questa settimana".

`AppointmentForm` resta l'editor completo della fase 2. Non va riscritto: va solo
reso tollerante a `serviceId`/`price` nulli in ingresso (la modalità `edit` oggi
presume entrambi valorizzati, `AppointmentDetail.tsx:197`).

---

## Sezione 7 — Impatti Collaterali

| Area | File | Intervento |
|---|---|---|
| Dettaglio appuntamento | `AppointmentDetail.tsx` | Servizio e prezzo possono mancare: mostrare *"Da definire"* + CTA "Completa pianificazione"; Checkout disabilitato finché manca il servizio |
| Checkout | `appointments/[id]/checkout/page.tsx:33` | `innerJoin(services)` → `leftJoin`; se il servizio manca, reindirizzare alla pianificazione con messaggio |
| Checkout UI | `CheckoutClient.tsx` | Gestire `price: null` nel totale |
| Storico cliente | `queries/clients.ts:135` | `leftJoin`; etichetta *"Servizio da definire"* |
| Dashboard | `queries/dashboard.ts` | Verificare che il fatturato non conti i prezzi nulli come zero nei trend percentuali |

---

## Sezione 8 — Fasi di Implementazione

| Fase | Contenuto | Visibile all'utente | Dipendenze |
|---|---|---|---|
| **0** | Migration `0007` + `schema.ts` | No | — |
| **1** | Adeguamento query e action a `locationId` + campi nullable | No (comportamento invariato) | 0 |
| **2** | Sezione Prenotazioni: rotta, calendario, form, action | **Sì** | 1 |
| **3** | Pianificazione: rinomina, vassoio "Da pianificare", badge, contatore | **Sì** | 1 |
| **4** | Tenuta su dati incompleti: dettaglio, checkout, storico, dashboard | Sì | 1 |
| **5** | Navigazione: riordino voci, redirect su `/bookings` | Sì | 2 |

Le fasi 2, 3 e 4 sono indipendenti tra loro una volta chiusa la fase 1.

---

## Sezione 9 — Rischi e Punti Aperti

### Rischi

1. **Backfill `location_id`** — gli appuntamenti con postazione prendono la sede
   dalla postazione, senza ambiguità. Per quelli **senza** postazione la sede non è
   mai stata registrata da nessuna parte: la migration li assegna a una sede di
   ripiego **scelta per ambiente**, indicata per nome al punto 3 della migration.
   Su `dev` è *Castelplanio* (deciso il 23/10/2026); su `uat` e `prod` va decisa
   prima di eseguire. Se quel nome non esiste nel database, la migration si ferma
   con un errore esplicito (blocco `DO $$` al punto 4) invece di assegnare gli
   appuntamenti alla sede sbagliata.

   Per sapere quanti appuntamenti dipendono da quella scelta:
   ```sql
   SELECT tenant_id, count(*) FROM appointments WHERE station_id IS NULL GROUP BY 1;
   ```

   Se su uat o prod il numero fosse alto, esiste un ripiego migliore del nome fisso
   per gli appuntamenti che hanno un collaboratore: dedurre la sede dal turno di
   quel collaboratore in quella data (`user_location_assignments` ha `userId`,
   `date` e `locationId`). Non implementato: su dev non serve.
2. **Nessun vincolo di capacità** — scelta esplicita. Significa che una giornata
   può essere prenotata ben oltre la capacità reale del negozio senza che nessuno
   se ne accorga fino alla pianificazione. Il segnale visivo (corsie che si
   stringono) è l'unica difesa. Da rivedere dopo qualche settimana d'uso reale.
3. **Timezone** — gli orari sono salvati come UTC "nudo"
   (`${date}T${time}:00.000Z`). Il nuovo percorso deve usare la stessa
   convenzione, altrimenti gli appuntamenti prenotati slittano rispetto a quelli
   pianificati.
4. **`allowedSizes` sulle postazioni** — oggi configurabile ma non applicato da
   nessuna regola. Resta inapplicato. Se servisse, il posto è la pianificazione,
   non la prenotazione.

### Punti aperti da confermare

1. **Durata di default** — 60 minuti. Confermi, o la vuoi configurabile per sede?
2. **Prenotazione su giorni di chiusura** — ammessa (coerente con "nessun
   vincolo") o da bloccare?
3. **Vista settimanale in prenotazione** — serve, o basta la giornaliera con
   navigazione data?
4. **Modifica di una prenotazione** — dalla sezione Prenotazioni si può cambiare
   ora/durata/cliente, o si passa obbligatoriamente dalla Pianificazione?

---

## Sezione 10 — Stima

| Fase | Stima |
|---|---|
| 0 — Migration e schema | 0,5 g |
| 1 — Query e action | 1 g |
| 2 — Sezione Prenotazioni | 2,5 g |
| 3 — Pianificazione | 1,5 g |
| 4 — Tenuta dati incompleti | 1 g |
| 5 — Navigazione | 0,5 g |
| **Totale** | **~7 giorni/uomo** |

---

## Sezione 11 — Stato Implementazione (23/10/2026)

| Fase | Stato | Note |
|---|---|---|
| 0 — Migration e schema | Fatto | `drizzle/0007_booking_planning_split.sql` scritta. **Non eseguita su nessun database.** |
| 1 — Query e action | Fatto | 6 query di `appointments`, piu' `clients` e `dashboard` |
| 2 — Sezione Prenotazioni | Fatto | `/bookings`, calendario, form, 4 action |
| 3 — Pianificazione | Fatto | Rinomina, vassoio, badge, contatore |
| 4 — Tenuta dati incompleti | Fatto | Dettaglio, checkout, storico cliente, note cane, seed |
| 5 — Navigazione | Fatto | 12 redirect spostati su `/bookings` |

**Migration applicata su `dev` il 23/10/2026.** Un solo tenant, una sola sede
("Sede Castelplanio"), quindi il punto 3a ha coperto tutto: 6176 appuntamenti
assegnati, 0 orfani, `location_id` NOT NULL, `service_id` e `price` nullable.
Di quei 6176, **6165 erano privi di postazione** — i dati di dev arrivano dai seed,
che impostano sempre `stationId: null`. Su uat e prod la proporzione sara' diversa.

**Verifiche eseguite:**
- `tsc --noEmit` pulito; `npm run build` completo con la rotta `/bookings` generata;
  `npm run lint` senza nuove segnalazioni (resta l'unico errore preesistente in
  `src/components/ui/sidebar.tsx`, `Math.random` in render, non toccato).
- Query nuove interrogate sui dati reali di dev: `getBookingsByDateAndLocation`,
  `getStationCount`, `getAgendaData`, `getUnplannedAppointments`. L'`EXPLAIN` conferma
  che il nuovo indice `appointments_location_start_idx` viene usato (Index Scan).
- Percorso completo provato nel browser su `localhost:3000`: prenotazione creata
  (cliente + cane + durata, tre campi), blocco tratteggiato "Da pianificare" in
  calendario, vassoio in Pianificazione che riporta "Manca: servizio, postazione,
  collaboratore", apertura in modifica, cancellazione. Dato di prova rimosso.

**Bug trovato e corretto durante la prova:** `BookingForm` lanciava `loadDogs`
durante il render in modalita' modifica ("Cannot call startTransition while
rendering"). Spostato in un `useEffect`.

**Non verificato:** vista mobile; giornate con molti appuntamenti in contemporanea
(nei dati di dev l'import storico li mette quasi tutti alla stessa ora, caso poco
rappresentativo); uat e prod, dove la migration non e' stata eseguita.

**Prossimo passo** — eseguire la migration a mano (non `drizzle-kit push`, che
fallirebbe sul `SET NOT NULL`), nell'ordine dev → uat → prod. Su `dev` la sede di
ripiego e' gia' impostata su *Castelplanio* (deciso il 23/10/2026); su `uat` e `prod`
va cambiata al punto 3 della migration prima di eseguire, altrimenti il controllo al
punto 4 blocca tutto con un messaggio esplicito.

### Revisione del 24/10/2026 — calendario di prenotazione

Tre richieste dopo la prima prova:

1. **Orari ogni 15 minuti.** La colonna degli orari etichettava solo le ore piene.
   Ora ogni passo e' etichettato, con l'ora piena in grassetto e il quarto d'ora in
   grigio. 60 righe da `07:00` a `21:45`.
2. **Pannello dei turni.** Il calendario di prenotazione mostra, tra la colonna degli
   orari e le postazioni, le barre dei collaboratori in turno quel giorno — stessa
   resa grafica del pannello gia' presente in `ScheduleGrid`. In testata compare
   "N in turno". Il collaboratore **non** si assegna in prenotazione: l'informazione
   serve solo a capire quanto si puo' riempire la giornata.
   `getBookingDayData` chiama anche `getStaffStatusForDate`.
3. **Drag & drop.** Aggiunto al calendario di prenotazione: si trascina un blocco per
   cambiargli orario, con aggancio ai 15 minuti, anteprima tratteggiata e `Esc` per
   annullare. Le colonne non contano (la postazione si assegna in pianificazione),
   quindi conta solo lo spostamento verticale. Nuova action `moveBooking`, che come
   `createBooking` non fa controlli di sovrapposizione. Da touch il gesto resta
   riservato allo scorrimento: li' si sposta aprendo la scheda.

> Nota: **in Pianificazione il drag & drop non era mai stato tolto.** Il diff su
> `ScheduleGrid` tocca solo tre tipi diventati nullable e una prop nuova.

**Verificato nel browser** sul 22/09/2026 (giornata con 4 prenotazioni e 3 persone in
turno): orari al quarto d'ora, tre barre del personale dalle 09:00, trascinamento che
salva e `Esc` che annulla. Il drag simulato in un colpo solo dagli strumenti di prova
non innesca il gesto — serve una sequenza di `pointermove`, come produce un mouse
vero: **vale la pena una prova a mano con il mouse.**

### Fix collaterali entrati con questa modifica

- Gli appuntamenti senza postazione non compaiono piu' in **tutte** le sedi del tenant
  (bug preesistente, conseguenza di `isNull(appointments.stationId)` nel filtro sede).
- Spostare un appuntamento privo di collaboratore non invia piu' `userId: ''`, che
  la validazione avrebbe rifiutato.
- **Punto 12 del backlog Maurizio** chiuso sul percorso di prenotazione: il calendario
  copre 07:00–22:00 e il fuori-orario resta cliccabile. In Pianificazione il
  comportamento e' invariato (`computeAgendaRange`, ±1h).
