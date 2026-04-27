# Sprint Change Proposal — Gestione Razze Canine e Prezzi Differenziati

**Data:** 2026-04-26
**Autore:** Samueles
**Workflow:** Correct Course
**Branch attivo:** 2-5-orari-apertura-sede

---

## Sezione 1: Issue Summary

### Problema

Il modello di pricing attuale prevede un prezzo fisso per servizio (campo `price` su `services`, intero in centesimi). Nella realtà di un salone di toelettatura il prezzo di ogni servizio varia in funzione della razza del cane: dimensioni, tipo di pelo, complessità del trattamento determinano tariffe differenti. Ad esempio, un bagno su un barboncino nano e un bagno su un pastore tedesco hanno costi molto diversi.

Il sistema attuale non permette di modellare questa variabilità. La pre-compilazione del prezzo in `AppointmentForm` usa il prezzo fisso del servizio, che sarà sistematicamente impreciso in qualsiasi salone con clientela eterogenea.

Contestualmente, non esiste un campo "razza" sul profilo del cane (`dogs`), rendendo impossibile qualsiasi logica di pricing differenziato per razza.

### Quando e Come Scoperto

Requisito identificato durante la pianificazione dello sprint successivo alla chiusura di Epica 3 (Gestione Clienti e Cani) e Epica 4 parziale. Le story 3-2 (Anagrafica Cani) e 4-2 (Creazione Appuntamento Rapido) sono già marcate done nel sprint-status.

### Evidenza

- `services.price`: campo intero singolo — nessuna variabilità per razza
- `dogs`: nessun campo `breedId` o simile
- `AppointmentForm`: pre-compila prezzo da `service.price`, ignora razza del cane
- Business reality: il salone pilota non può usare la pre-compilazione prezzo se gestisce razze diverse con tariffe diverse

---

## Sezione 2: Impact Analysis

### Epic Impact

| Epica | Impatto | Tipo |
|-------|---------|------|
| Epica 2 (Configurazione Salone) | Nuova Story 2.6; AC aggiuntivi su Story 2.1 già done | Estensione |
| Epica 3 (Gestione Clienti e Cani) | Nuova Story 3.3; AC aggiuntivi su Story 3.2 già done | Estensione |
| Epica 4 (Agenda e Appuntamenti) | Nuova Story 4.5; modifica AC Story 4.2 già done | Estensione |
| Epica 5, 6 | Nessun impatto | — |

### Story Impact

| Story | Stato Attuale | Modifica |
|-------|---------------|---------|
| Story 2.6 — Gestione Razze Canine | **nuova** (backlog) | CMS razze + prezzi per servizio da entrambe le direzioni |
| Story 3.3 — Razza nel Profilo Cane | **nuova** (backlog) | Campo razza su form e dettaglio cane |
| Story 4.5 — Prezzo Appuntamento per Razza | **nuova** (backlog) | Logica prezzo breed-aware in AppointmentForm |
| Story 2.1 — Gestione Listino Servizi | done | Modifica implementazione: sezione prezzi per razza nel dettaglio servizio |
| Story 3.2 — Anagrafica Cani | done | Modifica implementazione: campo breedId |
| Story 4.2 — Creazione Appuntamento Rapido | done | Modifica implementazione: prezzo da breed price con fallback a service price |

### Artifact Conflicts

| Artifact | Sezioni Impattate |
|----------|-------------------|
| PRD | FR9, FR16, FR25 — aggiornamento; nuovi FR37–FR40 |
| Architecture | Schema DB: nuove tabelle `breeds`, `service_breed_prices`; colonna `breedId` su `dogs`; nuovi file actions/validations/queries/components |
| Epics | Nuove story 2.6, 3.3, 4.5; AC aggiuntivi su 2.1, 3.2, 4.2 |
| UX Spec | Component Strategy: nuovi BreedForm, BreedList; update a ServiceForm, DogForm, AppointmentForm |

### Technical Impact

**Nuove tabelle:**
- `breeds` (id, name, tenantId, createdAt, updatedAt)
- `service_breed_prices` (id, serviceId, breedId, price, tenantId, createdAt, updatedAt) — unique (serviceId, breedId, tenantId)

**Colonna aggiunta:**
- `dogs.breedId` uuid nullable — FK → `breeds.id` ON DELETE SET NULL — retrocompatibile con cani esistenti

**Nuovi file:**
- `src/lib/actions/breeds.ts` — createBreed, updateBreed, deleteBreed, upsertBreedServicePrices
- `src/lib/validations/breeds.ts` — createBreedSchema, updateBreedSchema
- `src/lib/queries/breeds.ts` — getBreeds, getBreedById, getBreedWithPrices
- `src/app/(auth)/breeds/page.tsx` — pagina CMS Razze (Admin only)
- `src/components/breed/BreedForm.tsx`
- `src/components/breed/BreedList.tsx`

**File aggiornati:**
- `src/lib/db/schema.ts` — nuove tabelle + colonna breedId su dogs
- `src/lib/actions/services.ts` — upsert service_breed_prices da lato servizio
- `src/lib/actions/dogs.ts` — includere breedId nel create/update
- `src/lib/actions/appointments.ts` — logica prezzo breed-aware
- `src/lib/validations/services.ts` — aggiungere array breedPrices opzionale
- `src/lib/validations/dogs.ts` — aggiungere breedId opzionale
- `src/lib/queries/services.ts` — join con service_breed_prices
- `src/lib/queries/dogs.ts` — join con breeds
- `src/components/service/ServiceForm.tsx` — sezione prezzi per razza
- `src/components/dog/DogForm.tsx` — Combobox razza
- `src/components/appointment/AppointmentForm.tsx` — logica prezzo + indicatore razza

---

## Sezione 3: Recommended Approach

**Approccio: Direct Adjustment (Opzione 1)**

Il cambiamento è puramente additivo: nessuna story deve essere rollbackata, nessuna logica esistente viene rimossa. La logica di fallback `breed price → service base price` garantisce compatibilità con dati esistenti (cani senza razza, servizi senza prezzi per razza).

**Rationale:**
- Le nuove tabelle non rompono lo schema esistente
- Il campo `breedId` su `dogs` è nullable — retrocompatibile con tutti i cani esistenti
- I cani già creati senza razza continuano a usare il prezzo base del servizio senza modifiche
- Zero rischio di regressione sull'agenda e sugli appuntamenti esistenti

**Sequenza implementativa obbligatoria** (dipendenze rigide):

```
Story 2.6 (crea breeds + service_breed_prices)
    └── Story 3.3 (usa breeds per il Combobox su dogs)
            └── Story 4.5 (usa breedId del cane + service_breed_prices per il prezzo)
```

**Effort:** Medio — 3 nuove story + modifiche a 3 implementazioni esistenti
**Rischio:** Basso
**Timeline impact:** +1–2 sprint

---

## Sezione 4: Detailed Change Proposals

### 4.1 — PRD (`prd.md`)

#### 4.1.a — Aggiornamento FR9

Story: 2.1 / 2.6 | Sezione: Gestione Listino Servizi

OLD:
```
- **FR9:** L'Amministratore puo' creare servizi specificando nome, tariffa e tempo di esecuzione
```

NEW:
```
- **FR9:** L'Amministratore puo' creare servizi specificando nome, tariffa base e tempo di esecuzione; la tariffa base e' il prezzo di fallback quando non e' configurato un prezzo specifico per razza (vedi FR37–FR40)
```

---

#### 4.1.b — Aggiornamento FR16

Story: 3.2 / 3.3 | Sezione: Anagrafica Cani

OLD:
```
- **FR16:** L'Amministratore e il Collaboratore possono aggiungere cani associati a un cliente (relazione uno-a-molti)
```

NEW:
```
- **FR16:** L'Amministratore e il Collaboratore possono aggiungere cani associati a un cliente (relazione uno-a-molti); ogni cane puo' essere associato opzionalmente a una razza dal catalogo (FR39)
```

---

#### 4.1.c — Aggiornamento FR25

Story: 4.2 / 4.5 | Sezione: Gestione Appuntamenti

OLD:
```
- **FR25:** Il sistema calcola automaticamente la durata dell'appuntamento in base al tempo di esecuzione del servizio selezionato
```

NEW:
```
- **FR25:** Il sistema calcola automaticamente la durata dell'appuntamento in base al tempo di esecuzione del servizio selezionato e pre-compila il prezzo usando il prezzo specifico per razza del cane (se configurato), con fallback al prezzo base del servizio (FR40)
```

---

#### 4.1.d — Nuova sezione: Gestione Razze Canine

Inserire dopo la sezione "Gestione Listino Servizi", prima di "Anagrafica Clienti"

NEW:
```
### Gestione Razze Canine

- **FR37:** L'Amministratore puo' creare, modificare ed eliminare razze canine nel sistema
- **FR38:** Durante la creazione o modifica di una razza, l'Amministratore puo' impostare un prezzo specifico per ciascun servizio presente nel listino al momento della configurazione; i servizi senza prezzo specifico utilizzano il prezzo base del servizio (FR9)
- **FR39:** Ogni cane puo' essere opzionalmente associato a una razza dal catalogo razze
- **FR40:** Il sistema pre-compila il prezzo dell'appuntamento usando il prezzo specifico per la razza del cane per quel servizio; in assenza di prezzo specifico, usa il prezzo base del servizio
```

---

### 4.2 — Architecture (`architecture.md`)

#### 4.2.a — Nuove tabelle nel Database Schema

Inserire nella sezione Naming Patterns → esempi schema Drizzle, dopo la tabella `userLocationAssignments`

NEW:
```typescript
// Catalogo razze canine — CMS gestito dall'Amministratore.
export const breeds = pgTable('breeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Prezzi specifici per razza per servizio.
// Se non esiste una riga per (serviceId, breedId), il sistema usa services.price come fallback.
// Unique constraint su (service_id, breed_id, tenant_id).
export const serviceBreedPrices = pgTable('service_breed_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  breedId: uuid('breed_id').notNull().references(() => breeds.id, { onDelete: 'cascade' }),
  price: integer('price').notNull(), // centesimi, come services.price
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// dogs table — aggiungere colonna breedId:
// breedId: uuid('breed_id').references(() => breeds.id, { onDelete: 'set null' })
// Nullable — retrocompatibile con cani esistenti senza razza.
```

---

#### 4.2.b — Aggiornamento Requirements to Structure Mapping

Aggiungere riga alla tabella "Requirements to Structure Mapping"

NEW:
```
| **Razze (FR37–FR40)** | `breeds/page.tsx` | `breeds.ts` (nuovo) | `breeds.ts` (nuovo) | `breed/BreedForm.tsx`, `BreedList.tsx` | `breeds.ts` (nuovo) |
```

---

#### 4.2.c — Aggiornamento Project Directory Structure

In `src/lib/actions/` aggiungere:
```
breeds.ts   # Server Actions: createBreed, updateBreed, deleteBreed, upsertBreedServicePrices
```

In `src/lib/validations/` aggiungere:
```
breeds.ts   # Schema Zod: createBreedSchema, updateBreedSchema
```

In `src/lib/queries/` aggiungere:
```
breeds.ts   # Query functions: getBreeds, getBreedById, getBreedWithPrices
```

In `src/components/` aggiungere directory:
```
breed/
  BreedForm.tsx   # Form creazione/modifica razza con prezzi per servizio
  BreedList.tsx   # Lista razze (Admin)
```

In `src/app/(auth)/` aggiungere:
```
breeds/
  page.tsx   # FR37–FR40: CMS Razze (solo Admin)
```

---

### 4.3 — Epics (`epics.md`)

#### 4.3.a — Nuova Story 2.6: Gestione Razze Canine

Inserire in Epica 2, dopo Story 2.5

```markdown
### Story 2.6: Gestione Razze Canine

As a **Amministratore**,
I want **creare e gestire un catalogo di razze canine con prezzi specifici per servizio**,
So that **il salone possa tariffeare ogni servizio in modo differenziato per razza e il prezzo degli appuntamenti si pre-compili correttamente**.

**Acceptance Criteria:**

**Given** un Amministratore accede alla pagina Razze
**When** la pagina viene renderizzata
**Then** viene mostrata la lista delle razze con nome e numero di prezzi per servizio configurati
**And** l'accesso e' limitato al ruolo Amministratore (checkRole)

**Given** un Amministratore clicca su "Nuova Razza"
**When** il form si apre (Sheet mobile / Dialog desktop)
**Then** vede un campo per il nome della razza e la lista completa dei servizi esistenti, ciascuno con un campo prezzo opzionale (placeholder: "Usa prezzo base")

**Given** un Amministratore compila il nome e facoltativamente uno o piu' prezzi per servizio
**When** clicca "Salva"
**Then** la razza viene creata e i prezzi compilati vengono salvati in `service_breed_prices`
**And** mostra un toast "Razza creata"

**Given** un Amministratore seleziona una razza esistente
**When** modifica nome o prezzi per servizio e salva
**Then** le modifiche vengono salvate (upsert su service_breed_prices)
**And** mostra un toast "Razza aggiornata"

**Given** un Amministratore clicca "Elimina" su una razza
**When** viene mostrato Alert Dialog "Eliminare la razza [nome]? I cani associati perderanno la razza."
**Then** dopo conferma la razza viene eliminata
**And** i cani con quella razza hanno breedId impostato a null (ON DELETE SET NULL)
**And** i prezzi in service_breed_prices vengono eliminati (ON DELETE CASCADE)
**And** mostra un toast "Razza eliminata"

**Given** un Amministratore e' nel dettaglio di un servizio (pagina Servizi)
**When** accede alla sezione "Prezzi per Razza"
**Then** vede la lista di tutte le razze con il prezzo specifico configurato per questo servizio (se presente)
**And** le razze senza prezzo specifico mostrano "Usa prezzo base (€ X,XX)"
**And** puo' aggiungere, modificare o rimuovere il prezzo specifico per ogni razza

**Given** un Amministratore aggiunge o modifica un prezzo per razza dalla vista servizio
**When** salva
**Then** il prezzo viene aggiornato in service_breed_prices
**And** mostra un toast "Prezzo aggiornato"

**Given** viene creato un nuovo servizio dopo che esistono gia' delle razze
**When** l'Amministratore apre il form di una razza esistente
**Then** il nuovo servizio appare nella lista con il campo prezzo vuoto (usa prezzo base)
```

---

#### 4.3.b — Nuova Story 3.3: Razza nel Profilo Cane

Inserire in Epica 3, dopo Story 3.2

```markdown
### Story 3.3: Razza nel Profilo Cane

As a **Amministratore o Collaboratore**,
I want **associare una razza a ogni cane dal catalogo razze**,
So that **il prezzo degli appuntamenti si pre-compili correttamente in base alla razza del cane**.

**Acceptance Criteria:**

**Given** un utente crea o modifica un cane
**When** accede al campo "Razza" nel form
**Then** vede un Combobox con ricerca sul catalogo razze configurato dall'Amministratore
**And** il campo e' opzionale — un cane puo' non avere razza associata

**Given** un utente seleziona una razza dal Combobox e salva
**When** il cane viene salvato
**Then** il campo breedId viene persistito
**And** mostra un toast "Cane aggiornato" / "Cane creato"

**Given** un utente visualizza il dettaglio di un cane
**When** il cane ha una razza associata
**Then** la razza viene mostrata nel profilo del cane

**Given** una razza viene eliminata dal catalogo
**When** un cane aveva quella razza associata
**Then** il campo razza del cane risulta vuoto senza errori (nessuna interruzione del flusso)

**Given** non esistono razze nel catalogo
**When** un utente apre il campo razza nel form cane
**Then** il Combobox mostra "Nessuna razza configurata"
**And** se l'utente e' Amministratore, viene mostrato un link a "Gestione Razze"
```

---

#### 4.3.c — Nuova Story 4.5: Prezzo Appuntamento Differenziato per Razza

Inserire in Epica 4, dopo Story 4.4

```markdown
### Story 4.5: Prezzo Appuntamento Differenziato per Razza

As a **Amministratore o Collaboratore**,
I want **che il prezzo dell'appuntamento si pre-compili automaticamente in base alla razza del cane e al servizio selezionato**,
So that **la tariffa proposta rifletta le tariffe reali del salone senza richiedere inserimento manuale**.

**Acceptance Criteria:**

**Given** l'utente ha selezionato cliente, cane (con razza associata) e servizio nel form appuntamento
**When** il servizio viene selezionato
**Then** il prezzo si pre-compila con il prezzo specifico per quella razza e quel servizio (da service_breed_prices)
**And** il form mostra sotto il campo prezzo: "(prezzo razza: [nome razza])"

**Given** l'utente ha selezionato cliente, cane (senza razza o con razza senza prezzo specifico per quel servizio) e servizio
**When** il servizio viene selezionato
**Then** il prezzo si pre-compila con il prezzo base del servizio
**And** non viene mostrata nessuna etichetta aggiuntiva (comportamento invariato)

**Given** il prezzo e' stato pre-compilato (con o senza prezzo per razza)
**When** l'utente modifica manualmente il prezzo
**Then** il valore modificato viene usato senza sovrascrittura

**Given** l'utente cambia il cane selezionato
**When** il nuovo cane ha una razza diversa o nessuna razza
**Then** il prezzo si aggiorna automaticamente ricalcolando con la logica breed-aware
```

---

#### 4.3.d — Aggiornamento AC Story 2.1 (implementazione già done)

Aggiungere in fondo agli AC esistenti di Story 2.1

NEW (aggiungere):
```markdown
**Given** un Amministratore visualizza il dettaglio di un servizio
**When** accede alla sezione "Prezzi per Razza"
**Then** vede la lista di tutte le razze esistenti con il prezzo specifico per questo servizio (se configurato)
**And** le razze senza prezzo specifico mostrano "Usa prezzo base"
**And** puo' aggiungere, modificare o rimuovere il prezzo specifico per ogni razza

**Given** un Amministratore aggiunge o modifica un prezzo per razza
**When** salva
**Then** il prezzo viene aggiornato in service_breed_prices
**And** mostra un toast "Prezzo aggiornato"
```

---

#### 4.3.e — Aggiornamento AC Story 3.2 (implementazione già done)

Aggiungere agli AC del form creazione/modifica cane

NEW (aggiungere):
```markdown
**Given** un utente aggiunge o modifica un cane
**When** accede al campo "Razza" nel form
**Then** vede un Combobox con ricerca sul catalogo razze
**And** il campo e' opzionale
```

---

#### 4.3.f — Aggiornamento AC Story 4.2 (implementazione già done)

OLD:
```markdown
**Given** l'utente ha selezionato cliente e cane
**When** seleziona un servizio dalla lista dei servizi abilitati sulla postazione
**Then** la durata e il prezzo si pre-compilano automaticamente dal listino
**And** l'utente puo' modificare durata e prezzo manualmente se necessario
```

NEW:
```markdown
**Given** l'utente ha selezionato cliente e cane
**When** seleziona un servizio dalla lista dei servizi abilitati sulla postazione
**Then** la durata si pre-compila automaticamente dal listino
**And** il prezzo si pre-compila usando il prezzo specifico per la razza del cane (se configurato in service_breed_prices), con fallback al prezzo base del servizio
**And** se viene applicato un prezzo per razza, il form mostra "(prezzo razza: [nome razza])"
**And** l'utente puo' modificare durata e prezzo manualmente se necessario
```

---

## Sezione 5: Implementation Handoff

**Classificazione scope: Moderate**

Il cambiamento richiede l'aggiunta di 3 nuove story al backlog e modifiche a implementazioni già completate. Per un progetto single-developer, la coordinazione è interna ma le nuove story devono essere create e prioritizzate prima dell'implementazione.

### Responsabilità

| Attività | Chi | Quando |
|----------|-----|--------|
| Applicare edit proposals a epics.md | Dev/SM | Prima del prossimo sprint |
| Applicare edit proposals a prd.md | Dev/PO | Prima del prossimo sprint |
| Applicare edit proposals a architecture.md | Dev | Prima di Story 2.6 |
| Implementare Story 2.6 (Gestione Razze) | Dev | Sprint n+1 |
| Implementare Story 3.3 (Razza su Cane) | Dev | Dopo Story 2.6 done |
| Implementare Story 4.5 (Prezzo per Razza) | Dev | Dopo Story 3.3 done |

### Success Criteria

- Un Amministratore può creare razze con prezzi opzionali per ogni servizio
- Un Amministratore può gestire i prezzi per razza anche dalla vista servizio
- Un cane può avere una razza associata (campo opzionale, non rompe dati esistenti)
- AppointmentForm mostra il prezzo corretto per razza con fallback al prezzo base
- Cani e appuntamenti esistenti continuano a funzionare senza modifiche

### Aggiornamento sprint-status.yaml (dopo approvazione)

```yaml
  2-6-gestione-razze-canine: backlog
  3-3-razza-nel-profilo-cane: backlog
  4-5-prezzo-appuntamento-per-razza: backlog
```
