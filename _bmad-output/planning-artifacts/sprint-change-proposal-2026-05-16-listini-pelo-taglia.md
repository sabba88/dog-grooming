# Sprint Change Proposal — Logica Prezzi Pelo/Taglia

**Data:** 2026-05-16
**Autore:** Samueles
**Stato:** Bozza — In attesa di approvazione

---

## Sezione 1 — Riepilogo del Problema

### Problema

La logica attuale di pricing dei servizi utilizza la **razza del cane** come unica dimensione differenziante del prezzo (tabella `service_breed_prices`). Questo modello non rispecchia la realtà operativa dei saloni di tolettatura, dove il prezzo di un servizio dipende fondamentalmente da due dimensioni fisiche del cane:

1. **Pelo** — la lunghezza del manto: Corto, Medio, Lungo
2. **Taglia** — la dimensione del cane: Toy, Piccola, Media, Grande, Gigante

Un Labrador pelo corto taglia grande ha un prezzo diverso da un Labrador pelo lungo; e due razze diverse della stessa taglia e tipo di pelo hanno spesso lo stesso prezzo. La razza rimane un campo anagrafico utile ma **non è la variabile corretta per calcolare il prezzo**.

Inoltre manca un meccanismo per la **maggiorazione sulla durata**: servizi che richiedono più tempo (es. per pelo molto folto) devono poter aggiungere un incremento per ogni 30 minuti aggiuntivi.

### Contesto

Scoperto durante la revisione del modello di business, prima del merge delle story 3.3, 4.5 e 4.6 (tutte in stato `review`). Questo è il momento ottimale per correggere la logica: le story chiave non sono ancora in produzione.

### Evidenza

La tabella corrente `service_breed_prices` lega `serviceId` × `breedId` → prezzo. Questo richiederebbe configurare un prezzo per ogni combinazione di (servizio × razza), diventando impraticabile con decine di razze. La nuova logica 3×5 (pelo × taglia) copre tutti i casi con soli 15 prezzi per servizio, rispecchiando come i tolettatori pensano al listino.

---

## Sezione 2 — Analisi dell'Impatto

### Impatto sulle Epiche

| Epica | Stato Attuale | Impatto |
|-------|--------------|---------|
| Epica 1 — Accesso e Sicurezza | `done` | Nessun impatto |
| Epica 2 — Configurazione Salone | `done` | Riaperta: Story 2.1 modificata, Story 2.6 ridotta, nuova Story 2.7 |
| Epica 3 — Clienti e Cani | `in-progress` | Story 3.3 riscritta (era in `review`) |
| Epica 4 — Agenda e Appuntamenti | `in-progress` | Story 4.5 riscritta (era in `review`) |
| Epica 5 — Dashboard | `in-progress` | Nessun impatto |
| Epica 6 — GDPR | `backlog` | Nessun impatto |

### Impatto sulle Story

| Story | Stato | Azione Richiesta |
|-------|-------|-----------------|
| 2.1 — Gestione Listino Servizi | `done` | Aggiungere gestione matrice 3×5 + campo maggiorazione 30min |
| 2.6 — Gestione Razze Canine | `done` | Rimuovere sezione prezzi per servizio; razza diventa solo catalogo |
| 2.7 — Config. Tabelle Maggiorazione | non esiste | **Nuova story** — configurazione maggiorazioni Pelo/Taglia |
| 3.3 — Razza nel Profilo Cane | `review` | **Riscritta**: aggiungere campi Pelo e Taglia al profilo cane |
| 4.5 — Prezzo Appuntamento per Razza | `review` | **Riscritta**: logica prezzo basata su pelo/taglia del cane |

### Impatto sugli Artifact

**PRD:** FR9, FR37, FR38, FR40 modificati; FR41–FR42 nuovi.

**Architecture:** 
- Tabella `service_breed_prices` → sostituita da `service_price_matrix`
- Nuova tabella `pricing_surcharges`
- Tabella `dogs` → nuovi campi `coat_type`, `size_type`
- Tabella `services` → nuovo campo `duration_surcharge_per_30min`

**UX/Design:**
- `ServiceForm`: sostituire sezione "Prezzi per Razza" con editor matrice 3×5
- `BreedForm`: rimuovere sezione prezzi per servizio
- `DogForm`: aggiungere Select per Pelo e Taglia
- `AppointmentForm`: aggiornare logica prezzo pre-compilato

**Impatto Tecnico:**
- Migrazione DB: drop `service_breed_prices`, create `service_price_matrix` + `pricing_surcharges` + nuovi campi
- Nessun dato `service_breed_prices` da migrare (logica incompatibile — i prezzi vanno riconfigurati)
- I dati esistenti di `breeds` non vengono toccati

---

## Sezione 3 — Approccio Raccomandato

**Approccio selezionato: Direct Adjustment**

Le story 3.3 e 4.5 sono in `review` e possono essere riscritte senza impatto sulla produzione. La story 2.6 è `done` ma la modifica è chirurgica (rimozione della sezione prezzi, non della razza come entità). Il DB richiede una migrazione con drop della tabella `service_breed_prices` e creazione delle nuove tabelle.

**Stima effort:** Alto (nuove tabelle, componenti, migrazione) ma concentrato su poche story ben identificate.

**Stima rischio:** Medio-basso — le story in review assorbono la maggior parte del costo; la migrazione DB è one-way ma non distruttiva sui dati anagrafica.

**Timeline stimata:** 4–6 story aggiuntive/modificate, sequenziate come indicato nella Sezione 5.

---

## Sezione 4 — Proposte di Modifica Dettagliate

---

### MODIFICA A — PRD: Requisiti Funzionali

#### FR9 (Gestione Listino Servizi)

**VECCHIO:**
> FR9: L'Amministratore può creare servizi specificando nome, tariffa base e tempo di esecuzione; la tariffa base è il prezzo di fallback quando non è configurato un prezzo specifico per razza (vedi FR37–FR40)

**NUOVO:**
> FR9: L'Amministratore può creare servizi specificando nome, prezzo base (pelo corto + taglia Toy), tempo di esecuzione base e maggiorazione per 30 minuti aggiuntivi; il prezzo base è il fallback quando não è configurata la matrice prezzi pelo/taglia

**Rationale:** Il prezzo non è più legato alla razza ma alla combinazione pelo/taglia. Il prezzo base corrisponde alla combinazione minima (corto + Toy).

---

#### FR37 (Gestione Razze)

**VECCHIO:**
> FR37: L'Amministratore può creare, modificare ed eliminare razze canine nel sistema

**NUOVO:**
> FR37: L'Amministratore può creare, modificare ed eliminare razze canine nel sistema (catalogo anagrafico; la razza non determina il prezzo del servizio)

**Rationale:** La razza rimane un campo di anagrafica utile ma non influenza più il calcolo del prezzo.

---

#### FR38 (Prezzi per Razza → Matrice Pelo/Taglia)

**VECCHIO:**
> FR38: Durante la creazione o modifica di una razza, l'Amministratore può impostare un prezzo specifico per ciascun servizio presente nel listino al momento della configurazione; i servizi senza prezzo specifico utilizzano il prezzo base del servizio (FR9)

**NUOVO:**
> FR38: Per ogni servizio, l'Amministratore può configurare una matrice prezzi 3×5 (Pelo: Corto/Medio/Lungo × Taglia: Toy/Piccola/Media/Grande/Gigante) con 15 combinazioni di prezzo; il sistema può pre-calcolare i prezzi della matrice applicando le tabelle di maggiorazione al prezzo base (FR41); i prezzi della matrice sono sempre sovrascrivibili manualmente

**Rationale:** La matrice 3×5 copre tutti i casi reali del salone in modo sistematico.

---

#### FR39 (invariato)

> FR39: Ogni cane può essere opzionalmente associato a una razza dal catalogo razze

---

#### FR40 (Pre-compilazione prezzo appuntamento)

**VECCHIO:**
> FR40: Il sistema pre-compila il prezzo dell'appuntamento usando il prezzo specifico per la razza del cane per quel servizio; in assenza di prezzo specifico, usa il prezzo base del servizio

**NUOVO:**
> FR40: Il sistema pre-compila il prezzo dell'appuntamento cercando nella matrice prezzi del servizio la combinazione (pelo del cane, taglia del cane); in assenza di una cella nella matrice o di pelo/taglia sul cane, usa il prezzo base del servizio; se il servizio ha una maggiorazione per durata (FR42), questa viene aggiunta per ogni 30 minuti oltre la durata base

---

#### FR41 (NUOVO — Tabelle di Maggiorazione)

> FR41: L'Amministratore può configurare le tabelle di maggiorazione per le dimensioni Pelo e Taglia; i valori di default sono: Taglia Toy +0%, Piccola +0%, Media +20%, Grande +40%, Gigante +60%; Pelo Corto +0%, Medio +20%, Lungo +20%; queste maggiorazioni sono usate per pre-calcolare la matrice prezzi di un servizio a partire dal prezzo base

---

#### FR42 (NUOVO — Maggiorazione per Durata)

> FR42: Ogni servizio può avere una maggiorazione per ogni 30 minuti aggiuntivi rispetto alla durata base; questa maggiorazione viene aggiunta al prezzo dell'appuntamento in proporzione ai 30 minuti extra selezionati al momento della prenotazione

---

### MODIFICA B — Architecture: Schema Database

#### B.1 — Tabella `services` (campo aggiunto)

```typescript
// AGGIUNGERE a services in schema.ts
durationSurchargePer30min: integer('duration_surcharge_per_30min').notNull().default(0), // centesimi
```

**Rationale:** Ogni servizio ha un prezzo aggiuntivo per ogni 30min extra. Default 0 = nessuna maggiorazione.

---

#### B.2 — Tabella `service_breed_prices` (ELIMINATA)

```
// DA ELIMINARE: service_breed_prices
// Migrazione: DROP TABLE service_breed_prices
// Nessuna migrazione dati necessaria (logica incompatibile)
```

---

#### B.3 — Nuova tabella `service_price_matrix`

```typescript
// SOSTITUISCE service_breed_prices
export const servicePriceMatrix = pgTable('service_price_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  coatType: text('coat_type').notNull(), // 'short' | 'medium' | 'long'
  sizeType: text('size_type').notNull(), // 'toy' | 'small' | 'medium' | 'large' | 'giant'
  price: integer('price').notNull(), // centesimi
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
// UNIQUE constraint: (service_id, coat_type, size_type, tenant_id)
// ON DELETE CASCADE da services.id
```

---

#### B.4 — Nuova tabella `pricing_surcharges`

```typescript
// Tabelle di maggiorazione configurabili per tenant (valori di default pre-inseriti come seed)
export const pricingSurcharges = pgTable('pricing_surcharges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dimension: text('dimension').notNull(), // 'coat' | 'size'
  valueKey: text('value_key').notNull(),
  // coat: 'short' | 'medium' | 'long'
  // size: 'toy' | 'small' | 'medium' | 'large' | 'giant'
  surchargePercent: integer('surcharge_percent').notNull().default(0), // es. 20 = +20%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
// UNIQUE constraint: (tenant_id, dimension, value_key)
// Seed di default (inseriti alla creazione tenant):
// coat: short=0, medium=20, long=20
// size: toy=0, small=0, medium=20, large=40, giant=60
```

---

#### B.5 — Tabella `dogs` (campi aggiunti)

```typescript
// AGGIUNGERE a dogs in schema.ts
coatType: text('coat_type'), // 'short' | 'medium' | 'long' | null — nullable
sizeType: text('size_type'), // 'toy' | 'small' | 'medium' | 'large' | 'giant' | null — nullable
```

**Rationale:** Il pelo e la taglia sono attributi del singolo cane (non della razza). Nullable per retrocompatibilità con i cani già inseriti.

---

#### B.6 — Logica di calcolo prezzo (pseudo-codice server-side)

```typescript
// In queries/services.ts (nuova funzione)
async function getAppointmentPrice(
  serviceId: string,
  dogCoatType: string | null,
  dogSizeType: string | null,
  durationMinutes: number,
  tenantId: string
): Promise<number> {
  const service = await getService(serviceId, tenantId)
  
  if (!dogCoatType || !dogSizeType) {
    // Fallback: prezzo base
    return service.basePrice + getExtraDurationSurcharge(service, durationMinutes)
  }
  
  // Cerca nella matrice
  const matrixCell = await getServicePriceMatrixCell(serviceId, dogCoatType, dogSizeType, tenantId)
  
  const basePrice = matrixCell?.price ?? service.basePrice
  return basePrice + getExtraDurationSurcharge(service, durationMinutes)
}

function getExtraDurationSurcharge(service: Service, durationMinutes: number): number {
  if (!service.durationSurchargePer30min) return 0
  const extra30minBlocks = Math.floor(Math.max(0, durationMinutes - service.baseDuration) / 30)
  return extra30minBlocks * service.durationSurchargePer30min
}
```

---

#### B.7 — Nuovi file e modifiche a file esistenti (Architecture)

| File | Tipo di Modifica |
|------|-----------------|
| `lib/db/schema.ts` | Aggiungere `servicePriceMatrix`, `pricingSurcharges`; modificare `services` e `dogs` |
| `lib/actions/services.ts` | Aggiungere `upsertServicePriceMatrix`, `computePriceMatrix` (calcola da maggiorazioni) |
| `lib/actions/breeds.ts` | Rimuovere `upsertBreedServicePrices` |
| `lib/actions/dogs.ts` | Aggiornare `createDog`/`updateDog` per includere `coatType`, `sizeType` |
| `lib/actions/settings.ts` (NUOVO) | `updatePricingSurcharges` — aggiorna tabelle maggiorazione |
| `lib/validations/services.ts` | Aggiungere `servicePriceMatrixSchema`, `durationSurchargePer30min` |
| `lib/validations/dogs.ts` | Aggiungere `coatType`, `sizeType` opzionali |
| `lib/queries/services.ts` | Aggiungere `getServicePriceMatrix`, `getAppointmentPrice` |
| `lib/queries/settings.ts` (NUOVO) | `getPricingSurcharges` |
| `components/service/ServiceForm.tsx` | Sostituire "Prezzi per Razza" con `ServicePriceMatrixEditor` |
| `components/service/ServicePriceMatrixEditor.tsx` (NUOVO) | Tabella 3×5 interattiva |
| `components/dog/DogForm.tsx` | Aggiungere Select Pelo e Select Taglia |
| `components/breed/BreedForm.tsx` | Rimuovere sezione prezzi per servizio |
| `components/appointment/AppointmentForm.tsx` | Aggiornare logica prezzo: usa coatType/sizeType del cane |
| `app/(auth)/settings/page.tsx` | Aggiungere sezione "Tabelle Maggiorazione" |
| `lib/types/index.ts` | Aggiungere tipi `CoatType`, `SizeType`, `ServicePriceMatrix`, `PricingSurcharge` |

---

### MODIFICA C — Story 2.1: Gestione Listino Servizi (MODIFICA)

**Story:** 2.1 — Gestione Listino Servizi
**Stato attuale:** `done`
**Azione:** Aggiungere acceptance criteria per la matrice prezzi e la maggiorazione durata.

**Nuovi Acceptance Criteria da aggiungere:**

```
Story: [2.1] Gestione Listino Servizi
Section: Acceptance Criteria — AGGIUNTE

NEW:
Given un Amministratore visualizza il dettaglio di un servizio
When accede alla sezione "Listino Pelo/Taglia"
Then vede una tabella 3×5 con:
  - Righe: Pelo Corto / Pelo Medio / Pelo Lungo
  - Colonne: Toy / Piccola / Media / Grande / Gigante
  - Ogni cella mostra il prezzo configurato (o vuota se non configurata)
And vede un campo "Prezzo base (Pelo Corto, Toy)" che corrisponde alla cella (corto, toy)
And vede un campo "Maggiorazione per 30min aggiuntivi"
And vede il pulsante "Ricalcola da maggiorazioni" che popola la tabella applicando le % configurate in FR41

Given un Amministratore modifica uno o più prezzi nella tabella 3×5 e salva
When clicca "Salva"
Then i prezzi vengono salvati in service_price_matrix (upsert per ogni cella compilata)
And mostra un toast "Listino aggiornato"

Given un Amministratore clicca "Ricalcola da maggiorazioni"
When il prezzo base è valorizzato
Then il sistema calcola per ogni cella: prezzo = basePrice × (1 + size_surcharge% + coat_surcharge%) / 100
And popola la tabella senza sovrascrivere automaticamente — mostra anteprima con pulsante "Applica"
And l'utente può modificare singole celle prima di salvare

OLD (da rimuovere):
Given un Amministratore visualizza il dettaglio di un servizio
When accede alla sezione "Prezzi per Razza"
Then vede la lista di tutte le razze esistenti con il prezzo specifico per questo servizio (se configurato)
[...sezione prezzi per razza completa]
```

**Rationale:** La gestione prezzi si sposta dalla vista razza alla vista servizio, con la matrice 3×5 come strumento principale.

---

### MODIFICA D — Story 2.6: Gestione Razze Canine (RIDUZIONE SCOPE)

**Story:** 2.6 — Gestione Razze Canine
**Stato attuale:** `done`
**Azione:** Rimuovere la parte relativa ai prezzi per servizio. La razza diventa un puro catalogo anagrafico.

```
Story: [2.6] Gestione Razze Canine
Section: Acceptance Criteria — RIMOSSE

OLD (da rimuovere):
Given un Amministratore visualizza il dettaglio di un servizio (pagina Servizi)
When accede alla sezione "Prezzi per Razza"
Then vede la lista di tutte le razze con il prezzo specifico configurato per questo servizio (se presente)
And le razze senza prezzo specifico mostrano "Usa prezzo base (€ X,XX)"
And può aggiungere, modificare o rimuovere il prezzo specifico per ogni razza

Given un Amministratore aggiunge o modifica un prezzo per razza dalla vista servizio
When salva
Then il prezzo viene aggiornato in service_breed_prices
And mostra un toast "Prezzo aggiornato"

Given viene creato un nuovo servizio dopo che esistono già delle razze
When l'Amministratore apre il form di una razza esistente
Then il nuovo servizio appare nella lista con il campo prezzo vuoto (usa prezzo base)

OLD (da rimuovere — nel form razza):
Given un Amministratore clicca su "Nuova Razza"
When il form si apre (Sheet mobile / Dialog desktop)
Then vede un campo per il nome della razza E la lista completa dei servizi esistenti,
  ciascuno con un campo prezzo opzionale (placeholder: "Usa prezzo base")

NEW (sostituisce la parte del form):
Given un Amministratore clicca su "Nuova Razza"
When il form si apre (Sheet mobile / Dialog desktop)
Then vede solo il campo per il nome della razza
And NON vede campi prezzo (la razza è solo un identificatore anagrafico)
```

**Rationale:** La razza non è più responsabile del prezzo. Il form diventa semplice (solo nome), eliminando la complessità dei prezzi per servizio.

**Impatto DB:**
- La tabella `service_breed_prices` viene droppata nella migrazione
- I dati esistenti in `service_breed_prices` vengono persi — i prezzi vanno reconfigurati nella nuova matrice pelo/taglia

---

### NUOVA STORY E — Story 2.7: Configurazione Tabelle di Maggiorazione

**Story:** 2.7 — Configurazione Tabelle di Maggiorazione Pelo/Taglia (NUOVA)
**Epica:** Epica 2 — Configurazione del Salone

```
As a **Amministratore**,
I want **configurare le percentuali di maggiorazione per ogni tipo di pelo e taglia**,
So that **il sistema possa pre-calcolare automaticamente la matrice prezzi di ogni servizio
  a partire dal prezzo base**.

Acceptance Criteria:

Given un Amministratore accede alla sezione Impostazioni → Tabelle di Maggiorazione
When la pagina viene renderizzata
Then vede due tabelle: "Maggiorazioni Taglia" e "Maggiorazioni Pelo"
And i valori di default sono già pre-caricati:
  Taglia: Toy +0%, Piccola +0%, Media +20%, Grande +40%, Gigante +60%
  Pelo: Corto +0%, Medio +20%, Lungo +20%

Given un Amministratore modifica una percentuale e salva
When clicca "Salva"
Then il valore viene aggiornato in pricing_surcharges (upsert)
And mostra un toast "Tabelle aggiornate"
And le successive chiamate a "Ricalcola da maggiorazioni" (Story 2.1) usano i nuovi valori

Given un Amministratore salva valori con % negative o > 500%
When il form viene validato
Then il sistema mostra errore di validazione "La maggiorazione deve essere tra 0% e 500%"

Given un salone viene creato per la prima volta (onboarding)
When il sistema inizializza i dati del tenant
Then le tabelle di maggiorazione vengono pre-popolate con i valori di default
And l'Amministratore può modificarle in qualsiasi momento
```

---

### MODIFICA F — Story 3.3: Pelo e Taglia nel Profilo Cane (RISCRITTA)

**Story:** 3.3 — Razza, Pelo e Taglia nel Profilo Cane
**Stato attuale:** `review` → **Riscritta**
**Epica:** Epica 3

```
Story: [3.3] Pelo e Taglia nel Profilo Cane (riscritta da "Razza nel Profilo Cane")

OLD title: "Razza nel Profilo Cane"
NEW title: "Razza, Pelo e Taglia nel Profilo Cane"

As a **Amministratore o Collaboratore**,
I want **associare razza, tipo di pelo e taglia a ogni cane**,
So that **il prezzo degli appuntamenti si pre-compili correttamente in base a pelo e taglia del cane**.

Acceptance Criteria:

Given un utente crea o modifica un cane
When accede al form
Then vede i campi (MODIFICATI rispetto all'AC originale):
  - "Razza": Combobox con ricerca sul catalogo razze (invariato)
  - "Tipo di Pelo": Select con opzioni Corto / Medio / Lungo (NUOVO, opzionale)
  - "Taglia": Select con opzioni Toy / Piccola / Media / Grande / Gigante (NUOVO, opzionale)
  - Entrambi i nuovi campi sono opzionali — un cane può non averli
And se il cane non ha pelo/taglia configurati, il form mostra hint:
  "Configura pelo e taglia per ottenere il prezzo corretto degli appuntamenti"

Given un utente seleziona Pelo e/o Taglia e salva
When il cane viene salvato
Then i campi coatType e sizeType vengono persistiti nel DB
And mostra un toast "Cane aggiornato" / "Cane creato"

Given un utente visualizza il dettaglio di un cane
When il cane ha pelo e taglia configurati
Then nella scheda vengono mostrati: razza (se presente), tipo di pelo, taglia
And è visibile l'indicazione visiva del profilo prezzo (es. "Pelo Medio - Taglia Grande")

Given un utente visualizza il dettaglio di un cane
When il cane non ha pelo e/o taglia configurati
Then viene mostrato un avviso soft "Pelo/taglia non configurati — il prezzo degli appuntamenti
  userà il prezzo base del servizio"

OLD (da eliminare):
[AC originali che non facevano riferimento a pelo/taglia rimossi o integrati sopra]
```

**Rationale:** La story originale aggiungeva solo la razza. Ora estende il form con i due campi dimensione fondamentali per il calcolo del prezzo.

---

### MODIFICA G — Story 4.5: Prezzo Appuntamento per Pelo/Taglia (RISCRITTA)

**Story:** 4.5 — Prezzo Appuntamento Differenziato per Pelo/Taglia (riscritta)
**Stato attuale:** `review` → **Riscritta**
**Epica:** Epica 4

```
Story: [4.5] Prezzo Appuntamento Differenziato per Pelo/Taglia (riscritta)

OLD title: "Prezzo Appuntamento Differenziato per Razza"
NEW title: "Prezzo Appuntamento Differenziato per Pelo/Taglia"

As a **Amministratore o Collaboratore**,
I want **che il prezzo dell'appuntamento si pre-compili automaticamente in base al pelo e
  alla taglia del cane e al servizio selezionato**,
So that **la tariffa proposta rifletta le tariffe reali del salone senza richiedere
  inserimento manuale**.

Acceptance Criteria:

Given l'utente ha selezionato cliente, cane (con pelo e taglia configurati) e servizio
When il servizio viene selezionato
Then il prezzo si pre-compila cercando nella service_price_matrix per (serviceId, coatType, sizeType)
And se la cella esiste: usa quel prezzo
And il form mostra sotto il campo prezzo: "(prezzo razza: [Pelo X - Taglia Y])"
  → label aggiornata: "(prezzo: Pelo [tipo] · Taglia [tipo])"
And se il servizio ha maggiorazione per durata (durationSurchargePer30min > 0):
  il campo durata mostra info "Ogni 30min aggiuntivi: +€ X,XX"
  e il prezzo si aggiorna dinamicamente al cambiare della durata

Given l'utente ha selezionato cliente, cane (senza pelo e/o taglia) e servizio
When il servizio viene selezionato
Then il prezzo si pre-compila con il prezzo base del servizio
And il form mostra soft warning: "Pelo/taglia non configurati sul cane — uso prezzo base"
And è visibile un link rapido "Configura pelo/taglia" che apre il form cane

Given il prezzo è stato pre-compilato
When l'utente modifica manualmente il prezzo
Then il valore modificato viene usato senza sovrascrittura

Given l'utente cambia il cane selezionato
When il nuovo cane ha pelo/taglia diversi o non configurati
Then il prezzo si aggiorna automaticamente ricalcolando con la nuova combinazione

Given l'utente cambia la durata dell'appuntamento
When il servizio ha una maggiorazione per 30min (durationSurchargePer30min > 0)
Then il prezzo si aggiorna aggiungendo la maggiorazione proporzionale ai minuti extra

OLD (da rimuovere/sostituire):
[Tutti gli AC originali che facevano riferimento a service_breed_prices e breedId]
```

**Rationale:** La logica di prezzo si basa ora su pelo/taglia del cane anziché razza. L'esperienza utente rimane identica (pre-compilazione automatica, sovrascrivibile manualmente).

---

## Sezione 5 — Handoff per l'Implementazione

### Classificazione Scope

**MODERATO** — Richiede aggiornamento backlog e coordinamento, ma non ripianificazione strategica.

### Sequenza di Implementazione Raccomandata

```
1. [DB] Migrazione: drop service_breed_prices, add service_price_matrix,
        pricing_surcharges, dogs.coat_type, dogs.size_type,
        services.duration_surcharge_per_30min
   → Prerequisito per tutte le story successive

2. Story 2.7: Configurazione Tabelle di Maggiorazione
   → Prerequisito per il pulsante "Ricalcola" in Story 2.1

3. Story 2.1 (modifica): Aggiungere matrice prezzi al form servizio
   → Dipende da: 2.7 (per ricalcolo), DB migration

4. Story 2.6 (modifica): Semplificare BreedForm (solo nome)
   → Indipendente, può andare in parallelo con 2.1

5. Story 3.3 (riscritta): Pelo e Taglia nel Profilo Cane
   → Dipende da: DB migration (nuovi campi dogs)
   → Prerequisito per Story 4.5

6. Story 4.5 (riscritta): Prezzo Appuntamento per Pelo/Taglia
   → Dipende da: 3.3 (pelo/taglia sul cane), 2.1 (matrice prezzi), DB migration
```

### Responsabilità

| Ruolo | Responsabilità |
|-------|---------------|
| Dev | Migrazione DB, implementazione nuove tabelle e logica |
| Dev | Riscrittura story 3.3 e 4.5 (in review → rollback e rewrite) |
| Dev | Modifiche a story 2.1 e 2.6 (post-migrazione) |
| Dev | Nuova story 2.7 (impostazioni maggiorazioni) |
| SM/PO | Aggiornare sprint-status.yaml, aggiornare epics.md |

### Criteri di Successo

- [ ] Migrazione DB applicata senza errori (staging e produzione)
- [ ] ServiceForm mostra tabella 3×5 editabile con pulsante ricalcolo
- [ ] DogForm ha Select Pelo e Select Taglia opzionali
- [ ] AppointmentForm calcola prezzo da pelo/taglia del cane (non dalla razza)
- [ ] La maggiorazione per 30min si applica dinamicamente alla durata
- [ ] Le tabelle di maggiorazione sono configurabili dalle Impostazioni con seed di default corretti
- [ ] BreedForm mostra solo il nome (nessun campo prezzo)
- [ ] Tutti i test delle story 3.3 e 4.5 aggiornati alla nuova logica

---

*Documento generato dal workflow Correct Course — BMAD Method v6.0*
*Data: 2026-05-16 — Progetto: dog-grooming*
