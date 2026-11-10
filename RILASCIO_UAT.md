# Rilascio su UAT — procedura

Scritto il 10/11/2026. Serve a portare su UAT il lavoro fermo sul branch `dev` e a
renderlo utilizzabile dal cliente per i test. È autosufficiente: non serve nessun
contesto di sessioni precedenti.

Quando il rilascio è andato a buon fine questo file si può cancellare.

---

## 1. Da dove si parte

Il branch `dev` ha **19 commit che su `uat` non ci sono** (13 richieste del cliente
più tre funzionalità precedenti e alcune correzioni). Di questi, **16 non sono
ancora stati pushati** su GitHub.

Il merge `dev` → `uat` è un **fast-forward pulito**: su `uat` non c'è niente che non
sia già su `dev`. Verifica:

```bash
git log --oneline dev..uat | wc -l
```

Deve stampare `0`. Se stampa altro, qualcuno ha committato su `uat` e il merge non è
più banale: fermarsi e capire cosa è successo prima di proseguire.

Il database di UAT è indietro di **due migration**. Le differenze stanno tutte sulla
tabella `appointments`:

| colonna | dev | uat |
|---|---|---|
| `location_id` | c'è, NOT NULL | **assente** |
| `service_id`, `price`, `user_id` | facoltativi | **obbligatori** |
| `closed_at`, `closed_by_user_id` | ci sono | **assenti** |

Tutto il resto dello schema combacia. Servono quindi, in quest'ordine:

- `drizzle/0007_booking_planning_split.sql` — separazione prenotazione / pianificazione
- `drizzle/0008_appointment_closure.sql` — chiusura appuntamento

I **dati** di UAT invece sono già a posto: pelo e taglia sulle razze e la matrice
prezzi sono configurati (è dev che è stato allineato a UAT, non il contrario).
Non c'è nessun lavoro sui dati da fare.

---

## 2. Decisione già presa: la sede di ripiego della 0007

La `0007` aggiunge `location_id` agli appuntamenti. Per quelli che hanno una
postazione la sede si deduce da lì, per gli altri va scelta.

Su UAT le sedi sono **due** (`Castelplanio` e `AgriMoie`, stesso tenant) e **6167
appuntamenti su 6240 non hanno postazione**, quindi la scelta serve davvero.

**La sede decisa è `Castelplanio`**, ed è già scritta nel file della migration.
Il motivo: a Castelplanio appartengono tutti i 73 appuntamenti che una postazione
ce l'hanno, ha 210 turni contro 12, 9 fasce di apertura contro 2, 3 postazioni
contro 2.

La migration è stata provata a secco sui dati veri di UAT (solo conteggi, nessuna
scrittura): 73 appuntamenti dal punto 2, 6167 dal punto 3b, **zero orfani** su 6240.
Quindi passa.

> Per **prod** quel nome va riletto prima di lanciare la 0007: adesso contiene il
> nome di UAT. L'intestazione del file lo ricorda.

---

## 3. Cosa non fare

- **Non lanciare `npm run db:migrate:dev-to-uat`.** Fa `TRUNCATE` su tutte le
  tabelle di UAT e ci copia sopra dev. Cancellerebbe la configurazione prezzi.
- **Non usare `db:push:uat` per la 0007.** `push` metterebbe `location_id` NOT NULL
  su una colonna appena creata e vuota, e fallirebbe sui 6240 appuntamenti
  esistenti. La 0007 va eseguita a mano. Per la 0008 invece `push` va benissimo.
- **Non lasciare giorni fra il passo 2 e il passo 5.** In mezzo il codice vecchio
  ancora pubblicato su UAT non riesce più a creare appuntamenti, perché
  `location_id` è NOT NULL e lui non lo valorizza. Su un ambiente di test è
  accettabile, ma va chiuso in fretta.

---

## 4. I passi

### Passo 1 — Backup del database UAT

Dalla console Neon, sul branch `uat`: crea un branch o uno snapshot.
È l'unica rete di sicurezza: dal passo 2 in poi si scrive su 6240 righe.

### Passo 2 — Migration 0007 (a mano)

Apri l'SQL editor di Neon sul branch `uat`, incolla **tutto** il contenuto di
`drizzle/0007_booking_planning_split.sql` ed esegui. Le righe
`--> statement-breakpoint` sono commenti SQL, non danno fastidio.

Se qualcosa non torna, la migration si ferma da sola con il messaggio
*"Restano N appuntamenti senza sede"* invece di assegnarli alla sede sbagliata.

Verifica (deve dare `0`):

```sql
SELECT count(*) FROM appointments WHERE location_id IS NULL;
```

### Passo 3 — Migration 0008 (colonne della chiusura)

```bash
npm run db:push:uat
```

In alternativa, a mano come sopra con `drizzle/0008_appointment_closure.sql`.

Verifica (devono comparire `closed_at` e `closed_by_user_id`):

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'appointments' AND column_name LIKE 'closed%';
```

### Passo 4 — Push di `dev`

```bash
git push origin dev
```

### Passo 5 — Merge su `uat`

```bash
git checkout uat && git merge --ff-only dev && git push origin uat && git checkout dev
```

`--ff-only` è voluto: se il merge non è un fast-forward il comando fallisce invece
di creare un merge commit a sorpresa.

### Passo 6 — Deploy

**Da chiarire: non è documentato da nessuna parte come venga pubblicata l'app su
UAT.** Nel repository non ci sono workflow GitHub né `vercel.json`, e `.env.uat`
contiene solo `DATABASE_URL` e `AUTH_SECRET`, nessun indirizzo dell'applicazione.

- Se è un progetto Vercel agganciato al branch `uat`, il deploy parte da solo al
  push del passo 5 e non c'è altro da fare.
- Se invece UAT gira in locale contro quel database, il passo 6 non esiste: basta
  il merge.

---

## 5. Verifica finale, prima di passarlo al cliente

Le utenze già presenti su UAT sono `admin@dog-grooming.local` (admin) e `federica`,
`lisa`, `nicola` (collaboratori).

Da controllare a video:

1. **Agenda, vista postazioni** — su un giorno con appuntamenti deve comparire la
   colonna "Da assegnare" con gli appuntamenti senza postazione. Prima della 0007
   quegli appuntamenti non esistevano, quindi è normale che la colonna appaia solo
   dove ce ne sono.
2. **Click su una cella vuota** — in mezzo alla cella, non sul bordo destro: deve
   aprirsi "Nuovo Appuntamento".
3. **Vista persone** — sui blocchi si deve leggere la postazione, e a sinistra ci
   deve essere il pannello verticale dei turni.
4. **Dettaglio appuntamento** — deve esserci il riquadro "Chiusura appuntamento" con
   il prezzo dell'ultimo appuntamento dello stesso cane, e il pulsante "Nuovo
   appuntamento da questo".
5. **Elenco clienti** — filtri agganciati in alto mentre si scorre, avviso sui dati
   mancanti, pulsante "Esporta".
6. **Ricerca cliente** nel form appuntamento — cercando `ola` non deve uscire `Lola`.

---

## 6. Le 13 richieste che questo rilascio porta su UAT

1. Filtri sempre visibili nell'elenco clienti
2. Slot libero cliccabile su tutta la cella della griglia
3. Dati mancanti evidenziati nell'elenco clienti
4. Appuntamenti senza postazione visibili (colonna "Da assegnare")
5. Postazione di riferimento nella vista per persone
6. Nuovo appuntamento a partire da uno esistente
7. Selezione clienti ordinata per telefono quando si cerca un numero
8. Export per Excel di clienti, cani e appuntamenti
9. Ricerca per inizio di parola, non dentro la parola
10. Barre di presenza dei collaboratori anche nella vista per persone
11. Chi ha fatto il cane l'ultima volta
12. Chiusura appuntamento con conferma del prezzo
13. L'agenda si aggiorna dopo una modifica dal dettaglio
