# Story 4.5: Prezzo Appuntamento Differenziato per Pelo/Taglia

Status: done

<!-- CC-2026-05-16: Riscritta da "Prezzo Appuntamento Differenziato per Razza" — logica prezzo basata su pelo/taglia del cane (non più razza). Dipende da: Story 3.3 (pelo/taglia su razza e cane — DONE), Story 2.1 (matrice prezzi servizio — DONE), DB migration 2.7 (DONE), 2.8 (DONE). -->

## Story

As a **Amministratore o Collaboratore**,
I want **che il prezzo dell'appuntamento si pre-compili automaticamente in base al pelo e alla taglia del cane e al servizio selezionato**,
so that **la tariffa proposta rifletta le tariffe reali del salone senza richiedere inserimento manuale**.

## Acceptance Criteria

1. **Given** l'utente ha selezionato cliente, cane (con pelo e taglia configurati) e servizio nel form appuntamento
   **When** il servizio viene selezionato
   **Then** il prezzo si pre-compila cercando nella `service_price_matrix` per `(serviceId, coatType, sizeType)`
   **And** il form mostra sotto il campo prezzo: `"(prezzo: Pelo [tipo] · Taglia [tipo])"`
   **And** se il servizio ha `durationSurchargePer30min > 0`, il campo durata mostra `"Ogni 30min aggiuntivi: +€ X,XX"`

2. **Given** l'utente ha selezionato cliente, cane (senza pelo e/o taglia) e servizio
   **When** il servizio viene selezionato
   **Then** il prezzo si pre-compila con il prezzo base del servizio
   **And** il form mostra avviso soft: `"Pelo/taglia non configurati — uso prezzo base"`
   **And** è visibile un link `"Configura pelo/taglia"` che porta alla pagina del cane (apre in nuova tab)

3. **Given** il prezzo è stato pre-compilato
   **When** l'utente modifica manualmente il prezzo
   **Then** il valore modificato viene usato senza sovrascrittura

4. **Given** l'utente cambia il cane selezionato
   **When** il nuovo cane ha pelo/taglia diversi o non configurati
   **Then** il prezzo si aggiorna automaticamente ricalcolando con la nuova combinazione

5. **Given** l'utente cambia la durata dell'appuntamento
   **When** il servizio ha `durationSurchargePer30min > 0`
   **Then** il prezzo si aggiorna aggiungendo la maggiorazione proporzionale ai 30min extra rispetto alla durata base
   **Formula**: `totalPrice = baseMatrixPrice + floor(max(0, duration - baseDuration) / 30) * durationSurchargePer30min`

6. **Given** il pelo/taglia del cane viene dalla razza (non dal cane direttamente, modello cascata Story 3.3)
   **When** il prezzo viene calcolato
   **Then** il sistema usa `dog.coatType ?? dog.breedCoatType` e `dog.sizeType ?? dog.breedSizeType` per determinare la combinazione effettiva

## Tasks / Subtasks

- [x] Task 1: Aggiornare `src/lib/queries/services.ts` per esporre `durationSurchargePer30min` (AC: #1, #5)
  - [x] 1.1 In `getServices()`: aggiungere `durationSurchargePer30min: services.durationSurchargePer30min` alla select
  - [x] 1.2 In `getServiceById()`: aggiungere `durationSurchargePer30min: services.durationSurchargePer30min` alla select
  - [x] 1.3 Verificare che `getAppointmentPrice()` (già parzialmente implementato come stub) gestisca correttamente il lookup su `service_price_matrix` con fallback a `service.price` — NON aggiungere surcharge qui (il calcolo avviene lato client in AppointmentForm)

- [x] Task 2: Aggiornare `src/lib/queries/stations.ts` per esporre `durationSurchargePer30min` (AC: #1, #5)
  - [x] 2.1 In `getServicesForStation()`: aggiungere `durationSurchargePer30min: services.durationSurchargePer30min` alla select
  - [x] 2.2 In `getStationServices()`: aggiungere `durationSurchargePer30min: services.durationSurchargePer30min` alla select

- [x] Task 3: Aggiungere `fetchAppointmentPrice` action in `src/lib/actions/appointments.ts` (AC: #1, #2, #4)
  - [x] 3.1 Aggiungere schema Zod in `src/lib/validations/appointments.ts`
  - [x] 3.2 Aggiungere action `fetchAppointmentPrice` in `src/lib/actions/appointments.ts`
  - [x] 3.3 Importare `fetchAppointmentPriceSchema` e `getAppointmentPrice` dove necessario

- [x] Task 4: Aggiornare `src/components/appointment/AppointmentForm.tsx` — interfacce e stato (AC: #1–#6)
  - [x] 4.1 Aggiornare interfaccia `Dog` con i campi coat/size
  - [x] 4.2 Aggiornare interfaccia `Service` con `durationSurchargePer30min`
  - [x] 4.3 Aggiungere stato `basePriceForMatrix: number | null`
  - [x] 4.4 Aggiungere stato `priceIsManual: boolean`
  - [x] 4.5 Aggiungere stato `priceHint: PriceHintState`
  - [x] 4.6 Aggiungere `useAction(fetchAppointmentPrice)`

- [x] Task 5: Aggiornare `AppointmentForm.tsx` — logica calcolo prezzo (AC: #1–#6)
  - [x] 5.1 Aggiungere importazione `COAT_LABELS, SIZE_LABELS` da `@/lib/types`
  - [x] 5.2 Aggiungere importazione `fetchAppointmentPrice` da `@/lib/actions/appointments`
  - [x] 5.3 Aggiungere helper `getEffectiveCoatSize(dog: Dog)`
  - [x] 5.4 Aggiungere helper `recalcPriceWithSurcharge(...)`
  - [x] 5.5 Riscrivere `handleServiceChange` con logica matrice/coat/size
  - [x] 5.6 Aggiungere `handleDogChange`
  - [x] 5.7 Sostituire `onValueChange` Select cani con `handleDogChange`
  - [x] 5.8 Sostituire auto-select cane singolo con `handleDogChange`
  - [x] 5.9 Aggiornare handler cambio durata con ricalcolo surcharge
  - [x] 5.10 Aggiornare handler cambio prezzo con `priceIsManual = true`

- [x] Task 6: Aggiornare `AppointmentForm.tsx` — UI hints (AC: #1, #2, #5)
  - [x] 6.1 Aggiungere hint prezzo sotto campo "Prezzo (EUR)"
  - [x] 6.2 Aggiungere hint surcharge sotto campo "Durata (min)"
  - [x] 6.3 Aggiungere import `CoatType` e `SizeType` da `@/lib/types`

- [x] Task 7: Reset stato prezzo al reset del cane/cliente/servizio (AC: #4)
  - [x] 7.1 Nel click "X" (rimozione cliente): reset `basePriceForMatrix`, `priceIsManual`, `priceHint`
  - [x] 7.2 In `handleStationChange`: reset `basePriceForMatrix`, `priceIsManual`, `priceHint`

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** usa `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** in OGNI query dal contesto sessione JWT (`ctx.tenantId`)
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- **Lingua UI:** Italiano (label, messaggi, toast). **Lingua codice:** Inglese
- **Prezzi:** centesimi nel DB, EUR nella UI (`(price / 100).toFixed(2)`)

### Modello Pelo/Taglia a Cascata (Story 3.3)

Il sistema usa un modello a cascata per determinare pelo e taglia effettivi del cane:
```
effectiveCoat = dog.coatType ?? dog.breedCoatType ?? null
effectiveSize = dog.sizeType ?? dog.breedSizeType ?? null
```

- **`dogs.coatType` / `dogs.sizeType`**: override esplicito sul cane (ha priorità)
- **`breeds.coatType` / `breeds.sizeType`**: default della razza (fallback)
- **null**: nessun valore → usa prezzo base del servizio

`getDogsByClient` già restituisce tutti e 4 i campi (`coatType`, `sizeType`, `breedCoatType`, `breedSizeType`). Il cambiamento necessario in `AppointmentForm` è solo aggiornare l'interfaccia `Dog` — l'action `fetchDogsForClient` già li trasmette.

### `getAppointmentPrice` — Funzione Già Presente (Solo Completare)

In `src/lib/queries/services.ts` esiste già:
```typescript
export async function getAppointmentPrice(
  serviceId: string,
  coatType: string | null,
  sizeType: string | null,
  tenantId: string
): Promise<number> {
  const service = await getServiceById(serviceId, tenantId)
  if (!service) throw new Error('Service not found')
  if (!coatType || !sizeType) return service.price
  const [cell] = await db.select().from(servicePriceMatrix).where(...)
  return cell?.price ?? service.price
}
```

Questa funzione gestisce già il lookup sulla matrice con fallback al prezzo base. NON aggiungere il calcolo della surcharge qui — viene fatto client-side in `AppointmentForm` per consentire aggiornamento in tempo reale al cambio durata.

**IMPORTANTE**: `getServiceById` attualmente NON include `durationSurchargePer30min` nella select. Questo NON impatta `getAppointmentPrice` (che restituisce solo il prezzo base), ma deve essere aggiunto alle query usate da `fetchAllServices` e `fetchServicesForStation`.

### Calcolo Totale Prezzo con Surcharge Duration

```
// Dati disponibili in AppointmentForm dopo Task 1-4:
const service = services.find(s => s.id === selectedServiceId)  // include durationSurchargePer30min
const baseDuration = service.duration                            // durata base del servizio (min)
const surchargePerUnit = service.durationSurchargePer30min      // centesimi per ogni 30min extra

// Calcolo (ogni volta che duration o basePriceForMatrix cambiano):
const extraMinutes = Math.max(0, duration - baseDuration)
const surchargeUnits = Math.floor(extraMinutes / 30)
const totalPriceCents = basePriceForMatrix + surchargeUnits * surchargePerUnit
const priceEur = (totalPriceCents / 100).toFixed(2)
```

Se `duration <= baseDuration`, nessuna maggiorazione. Se `duration = baseDuration + 20min`, ancora nessuna maggiorazione (< 30min). Se `duration = baseDuration + 30min`, una unità di maggiorazione.

### Comportamento `priceIsManual`

Una volta che l'utente modifica manualmente il prezzo, il sistema NON deve sovrascrivere il valore anche se cambia la durata. Il flag `priceIsManual` serve a questo:

```
priceIsManual = false → il sistema può aggiornare il prezzo automaticamente
priceIsManual = true → il sistema NON tocca il prezzo (rispetta la scelta utente)
```

Il flag viene resettato a `false` quando:
- L'utente cambia servizio (`handleServiceChange`)
- L'utente cambia cane (`handleDogChange`)
- L'utente rimuove il cliente (click X)
- L'utente cambia postazione (`handleStationChange`)

### Gestione `priceHint` State

```typescript
type PriceHintState = { coat: string | null; size: string | null } | 'base' | null
```

- `null`: nessun hint (servizio non ancora selezionato)
- `'base'`: usa prezzo base (pelo/taglia non configurati sul cane)
- `{ coat, size }`: usa prezzo da matrice per questa combinazione

Il valore viene impostato in:
- `handleServiceChange`: quando si seleziona il servizio
- `handleDogChange`: quando si cambia cane (se servizio già selezionato)

L'hint `'base'` viene impostato direttamente in `handleServiceChange`/`handleDogChange` prima di chiamare `executeFetchPrice` per mostrare l'avviso. Viene rimpiazzato con `{ coat, size }` quando il server risponde (in `onSuccess` di `fetchAppointmentPrice`).

In realtà, il valore `'base'` si imposta quando `effectiveCoat` o `effectiveSize` sono null (prima ancora di contattare il server).

### AppointmentForm — Flusso Aggiornato

```
SEQUENZA TIPICA:
1. Utente seleziona cliente → dogs caricati
2. Auto-select cane (singolo) → handleDogChange() chiamato
   - Se nessun servizio: non fa nulla al prezzo
   - Se servizio già selezionato: ricalcola prezzo (improbabile ma gestito)
3. Utente seleziona postazione → servizi filtrati per postazione
4. Utente seleziona servizio → handleServiceChange()
   - Calcola effectiveCoat/effectiveSize dal cane selezionato
   - Se coat E size presenti: fetchAppointmentPrice() → onSuccess aggiorna priceEur + priceHint
   - Se coat O size mancante: usa service.price come base, priceHint = 'base'
5. Utente cambia durata → aggiorna price con surcharge (solo se !priceIsManual)
6. Utente modifica prezzo manualmente → priceIsManual = true
7. Conferma → price usato as-is in centesimi
```

### File da NON Toccare

| File | Motivo |
|------|--------|
| `src/lib/actions/appointments.ts` (azioni esistenti) | Aggiungere solo `fetchAppointmentPrice`, nessuna modifica alle altre |
| `src/lib/db/schema.ts` | Nessuna modifica schema — tutti i campi esistono già (Story 2.7) |
| `src/lib/queries/dogs.ts` | Già aggiornato in Story 3.3 |
| `src/lib/queries/appointments.ts` | Non coinvolto |

### Stato Attuale del Codice (Post Story 3.3, 2.7, 2.8)

**Schema DB (già in produzione dopo Story 2.7):**
- `services.duration_surcharge_per_30min` INTEGER NOT NULL DEFAULT 0 ✓
- `service_price_matrix` tabella con `(serviceId, coatType, sizeType, price, tenantId)` ✓
- `dogs.coat_type` e `dogs.size_type` colonne nullable ✓
- `breeds.coat_type` e `breeds.size_type` colonne nullable ✓ (Story 3.3)

**Codice GIÀ funzionante — NON riscrivere:**

| File | Stato | Note |
|------|-------|------|
| `src/lib/queries/services.ts` | MODIFICARE | Aggiungere `durationSurchargePer30min` alla select |
| `src/lib/queries/stations.ts` | MODIFICARE | Aggiungere `durationSurchargePer30min` alla select |
| `src/lib/queries/dogs.ts` | OK | Già restituisce `coatType`, `sizeType`, `breedCoatType`, `breedSizeType` |
| `src/lib/actions/appointments.ts` | ESTENDERE | Aggiungere solo `fetchAppointmentPrice` |
| `src/lib/validations/appointments.ts` | ESTENDERE | Aggiungere solo `fetchAppointmentPriceSchema` |
| `src/components/appointment/AppointmentForm.tsx` | MODIFICARE | Descrizione completa nei Task 4-7 |

**Commento TEMP da rimuovere in AppointmentForm.tsx riga ~157:**
```typescript
// TEMP (Story 2.7): usa sempre services.price fino a Story 4.5  ← RIMUOVERE
setPriceEur((service.price / 100).toFixed(2))                   ← SOSTITUIRE con logica matrice
```

### Componenti shadcn/ui — Già Installati

Nessun nuovo componente shadcn/ui necessario. I componenti usati (`Input`, `Label`, `Select`, ecc.) sono già installati.

### `formatPrice` da `@/lib/utils/formatting`

Usare `formatPrice(cents)` per visualizzare prezzi nella UI dove appropriato (es. nell'hint della surcharge):
```typescript
import { formatPrice } from '@/lib/utils/formatting'
// formatPrice(500) → "€ 5,00"
```

Verificare che la funzione gestisca correttamente il formato italiano (con virgola). Se l'hint surcharge usa template string, usare `(cents / 100).toFixed(2).replace('.', ',')` come fallback.

### Project Structure Notes

```
src/
  lib/
    queries/
      services.ts          # MODIFICARE: aggiungere durationSurchargePer30min ai select
      stations.ts          # MODIFICARE: aggiungere durationSurchargePer30min a getServicesForStation
    actions/
      appointments.ts      # ESTENDERE: aggiungere fetchAppointmentPrice
    validations/
      appointments.ts      # ESTENDERE: aggiungere fetchAppointmentPriceSchema
  components/
    appointment/
      AppointmentForm.tsx  # MODIFICARE: logica prezzo matrice + UI hints
```

### Testing

Nessun framework di test automatico configurato. Verifica manuale — casi critici:

**Happy path:**
- Selezionare cane con `coatType = 'short'` e `sizeType = 'toy'` + servizio con prezzo configurato in matrice per quella combinazione → prezzo si pre-compila con valore matrice, hint mostra "(prezzo: Pelo Corto · Taglia Toy)"
- Selezionare cane con coat/size ereditato dalla razza (dog.coatType = null, breed.coatType = 'long') → prezzo usa valori della razza, hint mostra la combinazione

**Cane senza pelo/taglia:**
- Selezionare cane senza `coatType` / `sizeType` e senza razza (o razza senza coat/size) → hint "Pelo/taglia non configurati — uso prezzo base", link "Configura pelo/taglia" apre `/dogs/{id}` in nuova tab

**Surcharge durata:**
- Servizio con `durationSurchargePer30min = 500` (€5,00), durata base 60 min → hint "Ogni 30min aggiuntivi: +€ 5,00" appare
- Portare durata a 90 min (+30) → prezzo aumenta di €5,00
- Portare durata a 75 min (+15) → prezzo NON aumenta (< 30min)
- Portare durata a 120 min (+60) → prezzo aumenta di €10,00 (2 unità)

**Modifica manuale:**
- Pre-compilare prezzo con matrice → modificare il prezzo manualmente → cambiare la durata → il prezzo NON si aggiorna automaticamente

**Cambio cane:**
- Cane A con pelo/taglia X, servizio selezionato, prezzo pre-compilato da matrice → cambiare a cane B con pelo/taglia Y → prezzo si aggiorna con nuova combinazione

**Servizi senza record matrice:**
- Servizio senza celle in `service_price_matrix` per la combinazione del cane → usa `service.price` come fallback (stesso comportamento di cane senza pelo/taglia, ma l'hint mostra la combinazione effettiva del cane)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.5 — Acceptance Criteria originali]
- [Source: _bmad-output/planning-artifacts/epics.md#FR25 — Calcolo automatico durata e prezzo]
- [Source: _bmad-output/planning-artifacts/epics.md#FR40 — Pre-compilazione prezzo appuntamento da pelo/taglia cane]
- [Source: _bmad-output/planning-artifacts/architecture.md — getAppointmentPrice, service_price_matrix schema, durationSurchargePer30min]
- [Source: _bmad-output/implementation-artifacts/3-3-razza-pelo-taglia-nel-profilo-cane.md — modello cascata coat/size, getDogsByClient aggiornato]
- [Source: _bmad-output/implementation-artifacts/2-7-db-migration-pelo-taglia.md — schema service_price_matrix e pricing_surcharges]
- [Source: _bmad-output/implementation-artifacts/2-8-configurazione-tabelle-maggiorazione.md — configurazione surcharge tenant]
- [Source: _bmad-output/implementation-artifacts/4-4-note-prestazione.md — pattern useAction, AppointmentForm base]
- [Source: src/lib/queries/services.ts — getAppointmentPrice stub, getServices, getServiceById]
- [Source: src/lib/queries/stations.ts — getServicesForStation (da modificare)]
- [Source: src/lib/queries/dogs.ts — getDogsByClient con coatType/sizeType/breedCoatType/breedSizeType]
- [Source: src/lib/actions/appointments.ts — fetchDogsForClient, authActionClient pattern]
- [Source: src/lib/validations/appointments.ts — pattern schemi esistenti]
- [Source: src/lib/types/index.ts — COAT_LABELS, SIZE_LABELS, CoatType, SizeType già definiti]
- [Source: src/components/appointment/AppointmentForm.tsx — struttura attuale, stato, handlers]
- [Source: src/lib/db/schema.ts — services.durationSurchargePer30min, servicePriceMatrix, dogs.coatType/sizeType]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Nessun blocco critico. TypeScript compila senza errori (`tsc --noEmit` pulito).

### Completion Notes List

- Task 1: `getServices` e `getServiceById` aggiornati con `durationSurchargePer30min`. `getAppointmentPrice` verificato — restituisce solo prezzo base da matrice, surcharge calcolata client-side.
- Task 2: `getServicesForStation` e `getStationServices` aggiornati con `durationSurchargePer30min`.
- Task 3: Schema Zod `fetchAppointmentPriceSchema` aggiunto in `validations/appointments.ts`. Action `fetchAppointmentPrice` aggiunta in `actions/appointments.ts` con `authActionClient` + `tenantId`.
- Task 4–7: `AppointmentForm.tsx` riscritto con interfacce aggiornate, nuovi stati (`basePriceForMatrix`, `priceIsManual`, `priceHint`), helper `getEffectiveCoatSize` e `recalcPriceWithSurcharge`, `handleDogChange`, `handleServiceChange` aggiornato, UI hints prezzo e surcharge. Reset completo degli stati prezzo in tutti i punti di reset (rimozione cliente, cambio postazione).

### File List

- `src/lib/queries/services.ts` — aggiunto `durationSurchargePer30min` in `getServices` e `getServiceById`
- `src/lib/queries/stations.ts` — aggiunto `durationSurchargePer30min` in `getServicesForStation` e `getStationServices`
- `src/lib/validations/appointments.ts` — aggiunto `fetchAppointmentPriceSchema`
- `src/lib/actions/appointments.ts` — aggiunto import `fetchAppointmentPriceSchema`, `getAppointmentPrice`; aggiunta action `fetchAppointmentPrice`
- `src/components/appointment/AppointmentForm.tsx` — riscrittura completa con logica matrice pelo/taglia, stati prezzo, UI hints
- `_bmad-output/implementation-artifacts/4-5-prezzo-appuntamento-per-pelo-taglia.md` — aggiornato (task, status, file list, change log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — aggiornato status `4-5` da `ready-for-dev` a `review`

## Change Log

- 2026-05-17: Implementazione completa Story 4.5 — prezzo appuntamento da matrice pelo/taglia, surcharge durata, UI hints, reset stati
