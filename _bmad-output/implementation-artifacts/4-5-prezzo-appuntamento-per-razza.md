# Story 4.5: Prezzo Appuntamento Differenziato per Razza

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **che il prezzo dell'appuntamento si pre-compili automaticamente in base alla razza del cane e al servizio selezionato**,
so that **la tariffa proposta rifletta le tariffe reali del salone senza richiedere inserimento manuale**.

## Acceptance Criteria

1. **Given** l'utente ha selezionato cliente, cane (con razza associata) e servizio nel form appuntamento
   **When** il servizio viene selezionato
   **Then** il prezzo si pre-compila con il prezzo specifico per quella razza e quel servizio (da `service_breed_prices`)
   **And** il form mostra sotto il campo prezzo: "(prezzo razza: [nome razza])"

2. **Given** l'utente ha selezionato cliente, cane (senza razza o con razza senza prezzo specifico per quel servizio) e servizio
   **When** il servizio viene selezionato
   **Then** il prezzo si pre-compila con il prezzo base del servizio (comportamento invariato)
   **And** non viene mostrata nessuna etichetta aggiuntiva

3. **Given** il prezzo è stato pre-compilato (con o senza prezzo per razza)
   **When** l'utente modifica manualmente il campo prezzo
   **Then** il valore modificato viene usato senza sovrascrittura
   **And** l'etichetta "(prezzo razza: ...)" scompare se era presente

4. **Given** l'utente cambia il cane selezionato nel form
   **When** il nuovo cane ha una razza diversa o nessuna razza
   **Then** il prezzo si aggiorna automaticamente ricalcolando con la logica breed-aware
   **And** l'etichetta viene aggiornata (o rimossa) di conseguenza

## Tasks / Subtasks

- [x] Task 1: Aggiungere query `getBreedPriceForService` in services (AC: #1, #2)
  - [x] 1.1 In `src/lib/queries/services.ts`, aggiungere:
    ```typescript
    export async function getBreedPriceForService(
      serviceId: string,
      breedId: string,
      tenantId: string
    ): Promise<{ price: number; breedName: string } | null> {
      const [result] = await db
        .select({ price: serviceBreedPrices.price, breedName: breeds.name })
        .from(serviceBreedPrices)
        .innerJoin(breeds, eq(breeds.id, serviceBreedPrices.breedId))
        .where(and(
          eq(serviceBreedPrices.serviceId, serviceId),
          eq(serviceBreedPrices.breedId, breedId),
          eq(serviceBreedPrices.tenantId, tenantId)
        ))
        .limit(1)
      return result ?? null
    }
    ```

- [x] Task 2: Aggiungere server action `fetchBreedPriceForService` in appointments (AC: #1, #2)
  - [x] 2.1 In `src/lib/actions/appointments.ts`, aggiungere import di `getBreedPriceForService` e `getServiceById` da `@/lib/queries/services`
  - [x] 2.2 Aggiungere action:
    ```typescript
    export const fetchBreedPriceForService = authActionClient
      .schema(z.object({ serviceId: z.string().uuid(), breedId: z.string().uuid() }))
      .action(async ({ parsedInput, ctx }) => {
        const [breedPrice, service] = await Promise.all([
          getBreedPriceForService(parsedInput.serviceId, parsedInput.breedId, ctx.tenantId),
          getServiceById(parsedInput.serviceId, ctx.tenantId),
        ])
        if (!service) throw new Error('Servizio non trovato')
        if (breedPrice) {
          return { price: breedPrice.price, breedName: breedPrice.breedName, isBreedPrice: true }
        }
        return { price: service.price, breedName: null, isBreedPrice: false }
      })
    ```
  - [x] 2.3 Verificare che `getServiceById` sia già importato (esiste in `src/lib/queries/services.ts` — già presente)

- [x] Task 3: Aggiornare `AppointmentForm` con logica breed-aware (AC: #1, #2, #3, #4)
  - [x] 3.1 Aggiungere `breedId: string | null` all'interfaccia `Dog` in `AppointmentForm.tsx`
  - [x] 3.2 Aggiungere import di `fetchBreedPriceForService` in `AppointmentForm.tsx`
  - [x] 3.3 Aggiungere stato `breedPriceLabel: string | null` (default `null`) per l'etichetta "(prezzo razza: ...)"
  - [x] 3.4 Aggiungere `useRef<boolean>(false)` per `isPriceManuallyEdited` — si imposta a `true` quando l'utente modifica il campo prezzo, e si resetta a `false` quando il servizio o il cane cambiano automaticamente
  - [x] 3.5 Aggiungere hook `useAction(fetchBreedPriceForService)` con `onSuccess: ({ data }) => { if (isPriceManuallyEdited.current) return; if (data) { setPriceEur((data.price / 100).toFixed(2)); setBreedPriceLabel(data.breedName ?? null) } }`
  - [x] 3.6 Creare helper `applyBreedAwarePrice(serviceId: string, dog: Dog)`:
    - Se `dog.breedId` è valorizzato → `isPriceManuallyEdited.current = false`, chiama `loadBreedPrice({ serviceId, breedId: dog.breedId })`
    - Altrimenti → `isPriceManuallyEdited.current = false`, imposta `setPriceEur((service.price / 100).toFixed(2))`, `setBreedPriceLabel(null)`
  - [x] 3.7 Aggiornare `handleServiceChange`: dopo aver impostato `duration`, chiamare `applyBreedAwarePrice(serviceId, selectedDog)` invece di `setPriceEur` diretto (se `selectedDogId` è valorizzato)
  - [x] 3.8 Modificare il Select cane (sia il caso `dogs.length === 1` auto-select che il `Select` multiplo) — quando il cane cambia:
    - Impostare `setSelectedDogId(dogId)`
    - Se `selectedServiceId` è valorizzato: chiamare `applyBreedAwarePrice(selectedServiceId, newDog)`
    - Nota: il caso `dogs.length === 1` nel `useAction(fetchDogsForClient).onSuccess` deve anche triggerare il ricalcolo prezzo se il servizio è già selezionato
  - [x] 3.9 Aggiornare l'`onChange` del campo prezzo: aggiungere `isPriceManuallyEdited.current = true; setBreedPriceLabel(null)` (rimuove l'etichetta se l'utente edita manualmente)
  - [x] 3.10 Aggiungere etichetta sotto il campo prezzo:
    ```tsx
    {breedPriceLabel && (
      <p className="text-xs text-muted-foreground mt-0.5">
        (prezzo razza: {breedPriceLabel})
      </p>
    )}
    ```
  - [x] 3.11 Assicurarsi che `setBreedPriceLabel(null)` venga chiamato anche quando:
    - L'utente deseleziona il cane (bottone X su cliente → reset)
    - Il cane viene auto-deselezionato al cambio postazione/servizio

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** usa `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database — dal `ctx.tenantId` nell'action
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente. Usare `useRef` per valori mutabili che non causano re-render
- **Lingua UI:** Italiano (label, messaggi, toast). **Lingua codice:** Inglese
- **Prezzi in centesimi** nel database → formattati con `(price / 100).toFixed(2)` nel form, `formatPrice()` in visualizzazione
- **NO checkRole** — Sia Amministratore che Collaboratore possono creare appuntamenti (FR20)
- **Toast:** solo per successo/errore di submit, non per il ricalcolo prezzo

### Dipendenze da Stories Precedenti

- **Story 2.6 (Gestione Razze Canine):** ha creato la tabella `service_breed_prices` e il catalogo `breeds`. Prerequisito soddisfatto.
- **Story 3.3 (Razza nel Profilo Cane):** ha aggiunto `breedId` su `dogs`, il Combobox razza nel form cane, e ha già aggiornato `getDogsByClient` per restituire `breedId`. Prerequisito soddisfatto.
- **Story 4.2 (Creazione Appuntamento Rapido):** `AppointmentForm` funzionante con pre-compilazione base. Questa story ESTENDE il form senza riscriverlo.

### Stato Corrente del Codice (Post Stories 4.4 + 3.3)

**File critici da leggere prima di modificare:**

| File | Stato attuale | Azione richiesta |
|------|--------------|-----------------|
| `src/components/appointment/AppointmentForm.tsx` | `Dog.breedName` presente, `Dog.breedId` MANCANTE; `handleServiceChange` usa solo `service.price` | MODIFICARE: aggiungere `breedId`, logica breed-aware |
| `src/lib/queries/services.ts` | `getServiceWithBreedPrices(serviceId)` esiste ma query per tutte le razze; manca query per singola (serviceId, breedId) | AGGIUNGERE: `getBreedPriceForService` |
| `src/lib/actions/appointments.ts` | Non ha azione breed price | AGGIUNGERE: `fetchBreedPriceForService` |
| `src/lib/queries/dogs.ts` | `getDogsByClient` già restituisce `breedId` | NON MODIFICARE |

**`AppointmentForm.Dog` interfaccia ATTUALE:**
```typescript
interface Dog {
  id: string
  name: string
  breedName: string | null  // già presente da Story 3.3
  // breedId MANCANTE — da aggiungere in questa story
}
```

**`getDogsByClient` ritorno (già corretto):**
```typescript
// src/lib/queries/dogs.ts — già restituisce breedId
{
  id: string
  name: string
  breedId: string | null  // ← già qui, non usato dal form
  breedName: string | null
  size: ...
  // ...
}
```

### Schema DB Rilevante

```typescript
// service_breed_prices — CC-2026-04-26b — GIA' CREATA (Story 2.6)
export const serviceBreedPrices = pgTable('service_breed_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  breedId: uuid('breed_id').notNull().references(() => breeds.id, { onDelete: 'cascade' }),
  price: integer('price').notNull(), // centesimi
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// UNIQUE constraint su (service_id, breed_id, tenant_id)
// ON DELETE CASCADE da services e da breeds
// dogs.breedId: nullable FK a breeds.id (ON DELETE SET NULL)
```

### Logica `isPriceManuallyEdited` — Dettaglio Implementativo

Usare `useRef<boolean>(false)` (NON `useState`) per evitare re-render non necessari.

**Quando impostare a `false`:**
- All'inizio di `applyBreedAwarePrice()` — prima di chiamare la server action o impostare il prezzo direttamente

**Quando impostare a `true`:**
- In `onChange` del campo prezzo Input — l'utente ha editato manualmente

**Quando il `onSuccess` di `fetchBreedPriceForService` viene chiamato:**
```typescript
onSuccess: ({ data }) => {
  if (isPriceManuallyEdited.current) return  // ← non sovrascrivere
  if (data) {
    setPriceEur((data.price / 100).toFixed(2))
    setBreedPriceLabel(data.breedName ?? null)
  }
}
```

**Quando l'utente modifica prezzo:**
```typescript
onChange={(e) => {
  setPriceEur(e.target.value)
  isPriceManuallyEdited.current = true
  setBreedPriceLabel(null)  // rimuovi etichetta razza se edita manualmente
}}
```

**Reset quando cane/servizio cambiano:**
```typescript
// In applyBreedAwarePrice():
isPriceManuallyEdited.current = false  // ← reset prima del calcolo
```

### Flusso Completo con Breed-Aware Pricing

```
1. Utente seleziona cane CON breedId + seleziona servizio
   → applyBreedAwarePrice(serviceId, dog)
   → dog.breedId presente → chiama fetchBreedPriceForService({serviceId, breedId})
   → server: query service_breed_prices WHERE serviceId + breedId + tenantId
   → Se trovato: onSuccess → setPriceEur(breedPrice/100) + setBreedPriceLabel(breedName)
   → Se NON trovato: onSuccess → setPriceEur(servicePrice/100) + setBreedPriceLabel(null)

2. Utente seleziona cane SENZA breedId + seleziona servizio
   → applyBreedAwarePrice(serviceId, dog)
   → dog.breedId è null → setPriceEur(service.price/100) + setBreedPriceLabel(null)

3. Utente cambia cane → nuovo cane ha breedId diverso
   → handleDogChange(newDogId)
   → se selectedServiceId → applyBreedAwarePrice(selectedServiceId, newDog)
   → ricalcola breed price per nuovo cane + nuovo servizio

4. Utente modifica prezzo manualmente
   → isPriceManuallyEdited.current = true
   → setBreedPriceLabel(null) — rimuove etichetta
   → se cane/servizio cambiano → reset isPriceManuallyEdited + ricalcola
```

### AppointmentForm — Vista Aggiornata

```
┌─────────────────────────────────────────┐
│  Nuovo Appuntamento                   X │
├─────────────────────────────────────────┤
│  👤 Giulia R.  •  Lun 17 Feb  •  09:00 │
├─────────────────────────────────────────┤
│  🔍 Cerca cliente...            [input] │
│  🐕 Cane: [Teddy (Golden) ▼]           │
│  📍 Postazione: [Tutte ▼]              │
│  ✂️  Servizio: [Bagno e taglio ▼]       │
│                                         │
│  ⏱️ Durata: [60] min                    │
│  💰 Prezzo (EUR): [35.00]               │
│    (prezzo razza: Golden Retriever) ←  │  ← NUOVO: etichetta breed
│                                         │
│          [ Conferma ]                   │
└─────────────────────────────────────────┘
```

### Gestione Reset Corretto

Quando il cliente viene deselezionato (click X), il reset esistente in `AppointmentForm` già imposta:
```typescript
setSelectedDogId(null)
setDogs([])
// ...
setSelectedServiceId(null)
setDuration(0)
setPriceEur('')
```
Aggiungere anche: `setBreedPriceLabel(null)`

### Pattern next-safe-action — Action Return

La nuova action `fetchBreedPriceForService` ritorna:
```typescript
// Caso 1: breed price trovato
{ price: number, breedName: string, isBreedPrice: true }

// Caso 2: breed price non trovato → fallback base service price
{ price: number, breedName: null, isBreedPrice: false }

// Caso 3: servizio non trovato → throw new Error (handled by next-safe-action as serverError)
```

Il client gestisce via `onSuccess({ data })` — non serve gestire `onError` separatamente per questo flusso (il prezzo rimane invariato).

### File da NON Modificare

- `src/lib/queries/dogs.ts` — `getDogsByClient` già ok
- `src/lib/db/schema.ts` — nessuna migrazione necessaria
- `src/lib/validations/appointments.ts` — `createAppointmentSchema` rimane invariato (prezzo è già nel payload)
- `src/lib/actions/appointments.ts` per `createAppointment` — nessuna logica server-side da cambiare (il prezzo è già inviato dal client)

### Project Structure Notes

```
src/
  components/
    appointment/
      AppointmentForm.tsx        # MODIFICARE: breedId in Dog, breed-aware price logic
  lib/
    queries/
      services.ts                # AGGIUNGERE: getBreedPriceForService
    actions/
      appointments.ts            # AGGIUNGERE: fetchBreedPriceForService
```

### Testing

Nessun framework di test automatico configurato. Verifica manuale — casi critici:

- Seleziona cane CON razza + servizio con prezzo razza configurato → prezzo si aggiorna al valore breed-specific, etichetta "(prezzo razza: [nome])" visibile
- Seleziona cane CON razza + servizio SENZA prezzo razza configurato → prezzo base, nessuna etichetta
- Seleziona cane SENZA razza + servizio → prezzo base, nessuna etichetta (comportamento invariato)
- Modifica manuale prezzo → etichetta scompare, valore manuale non viene sovrascritto
- Cambio cane (razza diversa) → prezzo si ricalcola per nuova razza, etichetta aggiornata
- Cambio cane (da razza a nessuna razza) → torna prezzo base, etichetta rimossa
- Cambio cane dopo aver editato manualmente il prezzo → IS RESET: il prezzo si ricalcola con la logica breed-aware (manual edit viene "dimenticato" al cambio cane)
- Nessuna razza configurata nel catalogo → comportamento invariato (prezzo base, nessuna etichetta)
- Submit con prezzo breed → `appointments.price` salvato con valore breed-specific in centesimi

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.5 — Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2 — AC #4: breed-aware pricing già richiesto ma non implementato]
- [Source: _bmad-output/planning-artifacts/architecture.md — service_breed_prices schema, prezzi in centesimi, Server Actions pattern]
- [Source: _bmad-output/implementation-artifacts/4-4-note-prestazione.md — pattern authActionClient, React Compiler, useRef per valori mutabili]
- [Source: _bmad-output/implementation-artifacts/4-2-creazione-appuntamento-rapido.md — AppointmentForm stato attuale, handleServiceChange, Dog interface]
- [Source: src/components/appointment/AppointmentForm.tsx — codice attuale, Dog interface con breedName ma senza breedId, handleServiceChange]
- [Source: src/lib/queries/dogs.ts — getDogsByClient già restituisce breedId]
- [Source: src/lib/queries/services.ts — getServiceWithBreedPrices pattern di riferimento, getServiceById disponibile]
- [Source: src/lib/db/schema.ts — serviceBreedPrices tabella con (serviceId, breedId, price), dogs.breedId nullable]
- [Source: src/lib/actions/appointments.ts — fetchDogsForClient, pattern useAction hooks nel form]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Aggiunta `getBreedPriceForService` in `src/lib/queries/services.ts`. JOIN su `serviceBreedPrices` e `breeds` con filtro `(serviceId, breedId, tenantId)`. Import già presenti.
- Task 2: Aggiunta `fetchBreedPriceForService` server action in `src/lib/actions/appointments.ts`. Importati `getServiceById` e `getBreedPriceForService` da `@/lib/queries/services`. Pattern `authActionClient` + schema Zod. Promise.all per le due query. Return branch: `isBreedPrice: true` se trovato, altrimenti fallback sul prezzo base del servizio.
- Task 3: Aggiornato `AppointmentForm.tsx`. Aggiunti `useRef`, `fetchBreedPriceForService` agli import; `breedId: string | null` all'interfaccia `Dog`; stato `breedPriceLabel`; ref `isPriceManuallyEdited`. Hook `loadBreedPrice` con guard su `isPriceManuallyEdited.current`. Helper `applyBreedAwarePrice` che sceglie tra chiamata server action (breedId presente) e set diretto del prezzo base. Aggiornati `handleServiceChange`, `handleStationChange`, Select multi-cane, `fetchDogsForClient.onSuccess` (auto-select), `onChange` campo prezzo, reset cliente X. Aggiunta etichetta `(prezzo razza: ...)` sotto il campo prezzo. TypeScript: zero errori. Lint: nessun nuovo errore (5 pre-esistenti in altri file non toccati).

### File List

- `src/lib/queries/services.ts` — AGGIUNTO: `getBreedPriceForService`
- `src/lib/actions/appointments.ts` — AGGIUNTO: `fetchBreedPriceForService`, import `getServiceById` e `getBreedPriceForService`
- `src/components/appointment/AppointmentForm.tsx` — MODIFICATO: logica breed-aware pricing completa
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — AGGIORNATO: status `in-progress` → `review`

### Change Log

- 2026-04-26: Implementazione completa story 4-5. Aggiunta query `getBreedPriceForService` (services.ts), server action `fetchBreedPriceForService` (appointments.ts), e logica breed-aware nel form appuntamento (AppointmentForm.tsx): pre-compilazione prezzo da `service_breed_prices` quando cane ha razza, etichetta "(prezzo razza: ...)", gestione override manuale con `useRef`.
