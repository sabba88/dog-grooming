# Story 3.3: Razza, Pelo e Taglia nel Profilo Cane

Status: review

<!-- CC-2026-05-17: Riscritta. Modello a cascata: coat/size sulla razza come default, override opzionale per-cane. -->

## Story

As a **Amministratore o Collaboratore**,
I want **configurare pelo e taglia sulla razza e associarle a ogni cane con possibilità di override**,
so that **il prezzo degli appuntamenti si pre-compili automaticamente usando il profilo pelo/taglia più specifico disponibile**.

## Acceptance Criteria

1. **Given** un Amministratore crea o modifica una razza
   **When** accede al form
   **Then** vede i campi "Tipo di Pelo" (Corto/Medio/Lungo) e "Taglia" (Toy/Piccola/Media/Grande/Gigante) opzionali

2. **Given** un Amministratore salva una razza con pelo e taglia
   **When** clicca "Salva"
   **Then** i valori `coatType` e `sizeType` vengono persistiti nella tabella `breeds`
   **And** mostra un toast "Razza creata" / "Razza aggiornata"

3. **Given** un utente crea o modifica un cane e seleziona una razza
   **When** la razza viene selezionata nel form
   **Then** i campi "Tipo di Pelo" e "Taglia" si pre-compilano automaticamente con i valori della razza
   **And** l'utente può modificare manualmente i valori (override)

4. **Given** un utente crea o modifica un cane senza selezionare una razza
   **When** accede al form
   **Then** i campi "Tipo di Pelo" e "Taglia" sono editabili manualmente

5. **Given** un utente salva il cane
   **When** ha modificato pelo e/o taglia rispetto ai valori della razza
   **Then** i valori sovrascritti vengono salvati su `dogs.coat_type` / `dogs.size_type`
   **And** mostra un toast "Cane aggiornato" / "Cane aggiunto"

6. **Given** un utente visualizza il dettaglio di un cane
   **When** il cane ha pelo/taglia configurati (sul cane o sulla razza)
   **Then** la scheda mostra "Pelo [tipo] · Taglia [tipo]" come profilo prezzo effettivo
   **And** se il valore viene dalla razza (non overridato) è visibile la label "(da razza)"

7. **Given** un utente visualizza il dettaglio di un cane
   **When** né il cane né la razza hanno pelo/taglia configurati
   **Then** viene mostrato l'avviso soft: "Pelo/taglia non configurati — il prezzo degli appuntamenti userà il prezzo base del servizio"

8. **Given** una razza viene eliminata dal catalogo
   **When** un cane aveva quella razza associata
   **Then** il campo razza del cane diventa null (ON DELETE SET NULL — già implementato nello schema)
   **And** se il cane non aveva override, pelo/taglia risultano non configurati

## Tasks / Subtasks

- [x] Task 1: Aggiornare schema Drizzle — aggiungere coat_type e size_type a `breeds` (AC: #1, #2)
  - [x] 1.1 In `src/lib/db/schema.ts`, aggiungere alla tabella `breeds`: `coatType: text('coat_type')` e `sizeType: text('size_type')`
  - [x] 1.2 Eseguire `npx drizzle-kit push` per applicare al DB di sviluppo

- [x] Task 2: Aggiornare validazioni e actions breeds (AC: #1, #2)
  - [x] 2.1 In `src/lib/validations/breeds.ts`: aggiungere `coatType` e `sizeType` a `createBreedSchema` e `updateBreedSchema`
  - [x] 2.2 In `src/lib/actions/breeds.ts`: aggiungere `coatType` e `sizeType` al `.values()` di `createBreed` e al `.set()` di `updateBreed`
  - [x] 2.3 In `src/lib/queries/breeds.ts`: aggiungere `coatType: breeds.coatType` e `sizeType: breeds.sizeType` ai select di `getBreedsForSelect`, `getBreeds`, `getBreedById`

- [x] Task 3: Aggiornare `src/components/breed/BreedForm.tsx` (AC: #1, #2)
  - [x] 3.1 Aggiungere `coatType: string | null` e `sizeType: string | null` all'interfaccia `Breed`
  - [x] 3.2 Aggiungere state locale `coatType` e `sizeType` (o migrare il form a React Hook Form per coerenza con il resto — ma mantenere lo stesso pattern già esistente)
  - [x] 3.3 Aggiungere Select "Tipo di Pelo" con opzioni: short→"Corto", medium→"Medio", long→"Lungo" (+ opzione "Nessuno" per resettare)
  - [x] 3.4 Aggiungere Select "Taglia" con opzioni: toy→"Toy", small→"Piccola", medium→"Media", large→"Grande", giant→"Gigante" (+ opzione "Nessuno")
  - [x] 3.5 Pre-compilare i Select in modalità modifica con i valori esistenti della razza

- [x] Task 4: Aggiornare validazioni e actions dogs (AC: #3, #4, #5)
  - [x] 4.1 In `src/lib/validations/dogs.ts`: aggiungere `coatType` e `sizeType` (z.enum + .or(z.literal(''))) a `createDogSchema` e `updateDogSchema`
  - [x] 4.2 In `src/lib/actions/dogs.ts`: aggiungere `coatType: parsedInput.coatType || null` e `sizeType: parsedInput.sizeType || null` al `.values()` di `createDog` e al `.set()` di `updateDog`

- [x] Task 5: Aggiornare query dogs per includere i valori della razza (AC: #6, #7)
  - [x] 5.1 In `src/lib/queries/dogs.ts`, aggiornare `getDogsByClient`: aggiungere `coatType: dogs.coatType`, `sizeType: dogs.sizeType`, `breedCoatType: breeds.coatType`, `breedSizeType: breeds.sizeType`
  - [x] 5.2 Aggiornare `getDogById`: stessi campi aggiuntivi
  - [x] 5.3 Aggiornare `getAllDogs`: aggiungere almeno `coatType` e `sizeType` del cane (+ breed values se utili alla lista)

- [x] Task 6: Aggiornare `src/components/dog/DogForm.tsx` (AC: #3, #4, #5)
  - [x] 6.1 Aggiornare prop `breeds` da `{ id, name }[]` a `{ id, name, coatType: string | null, sizeType: string | null }[]`
  - [x] 6.2 Aggiungere `coatType` e `sizeType` all'interfaccia prop `dog?` e ai `defaultValues`
  - [x] 6.3 Aggiungere Select "Tipo di Pelo" (`coatType`: Corto/Medio/Lungo + "Nessuno")
  - [x] 6.4 Sostituire il Select "Taglia" (vecchio `size`, piccola/media/grande) con Select `sizeType` (Toy/Piccola/Media/Grande/Gigante + "Nessuno")
  - [x] 6.5 Implementare auto-fill: quando l'utente seleziona una razza via `BreedCombobox`, pre-compilare `coatType` e `sizeType` dai valori della razza (solo se la razza li ha). L'utente può modificarli dopo
  - [x] 6.6 Mostrare hint sotto i Select: "Valori ereditati dalla razza — puoi modificarli" quando i valori corrispondono a quelli della razza selezionata

- [x] Task 7: Aggiornare `src/components/dog/DogDetail.tsx` (AC: #6, #7, #8)
  - [x] 7.1 Aggiungere `coatType`, `sizeType`, `breedCoatType`, `breedSizeType` all'interfaccia `Dog`
  - [x] 7.2 Calcolare `effectiveCoatType = dog.coatType ?? dog.breedCoatType ?? null` e `effectiveSizeType = dog.sizeType ?? dog.breedSizeType ?? null`
  - [x] 7.3 Rimuovere la visualizzazione del vecchio campo "Taglia" (`dog.size`) e sostituire con la coppia Pelo + Taglia effettivi
  - [x] 7.4 Quando entrambi i valori effettivi sono presenti: mostrare badge "Pelo [tipo] · Taglia [tipo]"
  - [x] 7.5 Indicare la fonte: se `dog.coatType` è null ma `dog.breedCoatType` è valorizzato, mostrare "(da razza)" accanto al valore
  - [x] 7.6 Quando nessun valore effettivo: mostrare avviso amber "Pelo/taglia non configurati — il prezzo degli appuntamenti userà il prezzo base del servizio"
  - [x] 7.7 Aggiornare il prop `dog` passato a `DogForm` per includere `coatType` e `sizeType`

- [x] Task 8: Aggiornare interfacce in DogList, DogsPage, ClientDetail (AC: #6)
  - [x] 8.1 `src/components/dog/DogList.tsx`: aggiungere `coatType` e `sizeType` all'interfaccia Dog; aggiornare il testo secondario mostrando "Pelo · Taglia" effettivi (usando i valori del cane, senza join breed — già presente in getDogsByClient)
  - [x] 8.2 `src/components/dog/DogsPage.tsx`: aggiungere `coatType` e `sizeType`; aggiornare colonna tabella
  - [x] 8.3 `src/components/client/ClientDetail.tsx`: aggiungere `coatType` e `sizeType` all'interfaccia Dog passata come prop

## Dev Notes

### Contesto — Modello a Cascata CC-2026-05-17

```
effectiveCoatType = dog.coatType ?? breed.coatType ?? null
effectiveSizeType = dog.sizeType ?? breed.sizeType ?? null
```

Priorità lookup:
1. `dogs.coat_type` / `dogs.size_type` — override esplicito sul cane (più specifico)
2. `breeds.coat_type` / `breeds.size_type` — default della razza
3. `null` → fallback al prezzo base del servizio

Questa logica è rilevante anche per Story 4.5 (prezzo appuntamento): la query `getDogById` restituirà entrambi i livelli, e `getAppointmentPrice` calcolerà i valori effettivi.

### Task 1 — Schema Drizzle: Breeds

```typescript
// src/lib/db/schema.ts — modifica alla tabella breeds
export const breeds = pgTable('breeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  coatType: text('coat_type'),   // NEW: 'short' | 'medium' | 'long'
  sizeType: text('size_type'),   // NEW: 'toy' | 'small' | 'medium' | 'large' | 'giant'
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

Dopo la modifica: `npx drizzle-kit push`

La tabella `dogs` non cambia — `coat_type` e `size_type` sono già presenti (aggiunti in story 2.7).

### Task 2 — Validazioni e Actions Breeds

```typescript
// src/lib/validations/breeds.ts
export const createBreedSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  coatType: z.enum(['short', 'medium', 'long']).optional().or(z.literal('')),
  sizeType: z.enum(['toy', 'small', 'medium', 'large', 'giant']).optional().or(z.literal('')),
})

export const updateBreedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  coatType: z.enum(['short', 'medium', 'long']).optional().or(z.literal('')),
  sizeType: z.enum(['toy', 'small', 'medium', 'large', 'giant']).optional().or(z.literal('')),
})
```

```typescript
// src/lib/actions/breeds.ts — createBreed
.values({ name, coatType: coatType || null, sizeType: sizeType || null, tenantId: ctx.tenantId })

// updateBreed
.set({ name, coatType: coatType || null, sizeType: sizeType || null, updatedAt: new Date() })
```

```typescript
// src/lib/queries/breeds.ts — aggiungere a TUTTI i select:
coatType: breeds.coatType,
sizeType: breeds.sizeType,
```

### Task 3 — BreedForm.tsx

Il form attuale usa state locale (non React Hook Form). Mantenere lo stesso pattern aggiungendo:
- `const [coatType, setCoatType] = useState<string>('')`
- `const [sizeType, setSizeType] = useState<string>('')`
- Pre-compilare da `breed.coatType` / `breed.sizeType` nell'`useEffect` esistente

```typescript
// Nell'useEffect esistente (riga 43-47), aggiungere:
setCoatType(isEditing && breed ? breed.coatType ?? '' : '')
setSizeType(isEditing && breed ? breed.sizeType ?? '' : '')

// Nel handleSubmit, aggiungere ai parametri:
executeCreate({ name: name.trim(), coatType: coatType || undefined, sizeType: sizeType || undefined })
executeUpdate({ id: breed.id, name: name.trim(), coatType: coatType || undefined, sizeType: sizeType || undefined })
```

Aggiungere all'interfaccia `Breed`:
```typescript
interface Breed {
  id: string
  name: string
  coatType: string | null  // NEW
  sizeType: string | null  // NEW
}
```

Aggiungere "Nessuno" come prima SelectItem per resettare il valore:
```tsx
<SelectContent>
  <SelectItem value="">Nessuno</SelectItem>
  <SelectItem value="short">Corto</SelectItem>
  ...
</SelectContent>
```

### Task 4 — Validazioni e Actions Dogs

```typescript
// src/lib/validations/dogs.ts — aggiungere a createDogSchema e updateDogSchema:
coatType: z.enum(['short', 'medium', 'long']).optional().or(z.literal('')),
sizeType: z.enum(['toy', 'small', 'medium', 'large', 'giant']).optional().or(z.literal('')),
```

Il campo `size` (vecchio, piccola/media/grande) **rimane nello schema Zod** per ora — non aggiungere breaking changes alla validazione. MA va rimosso dal form UI (sostituito da `sizeType`).

```typescript
// src/lib/actions/dogs.ts — aggiungere in createDog .values():
coatType: parsedInput.coatType || null,
sizeType: parsedInput.sizeType || null,

// aggiungere in updateDog .set():
coatType: parsedInput.coatType || null,
sizeType: parsedInput.sizeType || null,
```

### Task 5 — Query Dogs con valori breed

```typescript
// src/lib/queries/dogs.ts — getDogsByClient
{
  id: dogs.id,
  name: dogs.name,
  breedId: dogs.breedId,
  breedName: breeds.name,
  coatType: dogs.coatType,         // NEW — override del cane
  sizeType: dogs.sizeType,         // NEW — override del cane
  breedCoatType: breeds.coatType,  // NEW — default della razza
  breedSizeType: breeds.sizeType,  // NEW — default della razza
  size: dogs.size,                 // mantenuto (backward compat)
  dateOfBirth: dogs.dateOfBirth,
  sex: dogs.sex,
  sterilized: dogs.sterilized,
  createdAt: dogs.createdAt,
}

// getDogById — stessi campi aggiuntivi
// getAllDogs — aggiungere almeno coatType, sizeType (breedCoatType/breedSizeType opzionali)
```

Il `leftJoin(breeds, ...)` è già presente nelle query — solo aggiungere i campi al select.

### Task 6 — DogForm: Auto-fill da razza

```typescript
// Prop breeds aggiornato
breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]

// Prop dog? aggiornato
dog?: {
  id: string
  name: string
  breedId: string | null
  coatType: string | null  // NEW
  sizeType: string | null  // NEW
  dateOfBirth: Date | null
  sex: string | null
  sterilized: boolean
} | null
```

**Auto-fill breed → dog:** Il `BreedCombobox` chiama `field.onChange(breedId)`. Bisogna intercettare questo cambio per pre-compilare coat/size. Usare un wrapper sulla `onChange` del Controller:

```typescript
// Nel Controller di breedId, wrappare l'onChange:
render={({ field }) => (
  <BreedCombobox
    value={field.value}
    onChange={(newBreedId) => {
      field.onChange(newBreedId)
      if (newBreedId) {
        const selectedBreed = breeds.find(b => b.id === newBreedId)
        if (selectedBreed?.coatType) form.setValue('coatType', selectedBreed.coatType as any)
        if (selectedBreed?.sizeType) form.setValue('sizeType', selectedBreed.sizeType as any)
      }
    }}
    breeds={breeds}
    isAdmin={userRole === 'admin'}
  />
)}
```

**defaultValues in modifica:** Usare `dog.coatType` (valore salvato sul cane). Se null ma la razza ha il valore, NON pre-compilare in defaultValues — il form mostra i campi vuoti e l'utente vede l'hint "da razza".

**Select "Tipo di Pelo" e "Taglia":**
```tsx
{/* Tipo di Pelo */}
<div className="flex flex-col gap-2">
  <Label htmlFor="coatType">Tipo di Pelo (opzionale)</Label>
  <Controller name="coatType" control={form.control}
    render={({ field }) => (
      <Select value={field.value || ''} onValueChange={field.onChange}>
        <SelectTrigger id="coatType">
          <SelectValue placeholder="Seleziona tipo di pelo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nessuno</SelectItem>
          <SelectItem value="short">Corto</SelectItem>
          <SelectItem value="medium">Medio</SelectItem>
          <SelectItem value="long">Lungo</SelectItem>
        </SelectContent>
      </Select>
    )}
  />
</div>

{/* Taglia — sizeType con 5 opzioni, sostituisce il vecchio size */}
<div className="flex flex-col gap-2">
  <Label htmlFor="sizeType">Taglia (opzionale)</Label>
  <Controller name="sizeType" control={form.control}
    render={({ field }) => (
      <Select value={field.value || ''} onValueChange={field.onChange}>
        <SelectTrigger id="sizeType">
          <SelectValue placeholder="Seleziona taglia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nessuno</SelectItem>
          <SelectItem value="toy">Toy</SelectItem>
          <SelectItem value="small">Piccola</SelectItem>
          <SelectItem value="medium">Media</SelectItem>
          <SelectItem value="large">Grande</SelectItem>
          <SelectItem value="giant">Gigante</SelectItem>
        </SelectContent>
      </Select>
    )}
  />
</div>
```

Rimuovere il vecchio Select `size` (piccola/media/grande) dal form — non mostrarlo più.

### Task 7 — DogDetail: Visualizzazione Cascata

```typescript
// Costanti label
const COAT_TYPE_LABELS: Record<string, string> = {
  short: 'Corto', medium: 'Medio', long: 'Lungo',
}
const SIZE_TYPE_LABELS: Record<string, string> = {
  toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante',
}

// Valori effettivi
const effectiveCoatType = dog.coatType ?? dog.breedCoatType ?? null
const effectiveSizeType = dog.sizeType ?? dog.breedSizeType ?? null
const coatFromBreed = !dog.coatType && !!dog.breedCoatType
const sizeFromBreed = !dog.sizeType && !!dog.breedSizeType
```

```tsx
{/* Profilo prezzo — visibile se almeno un valore effettivo è presente */}
{(effectiveCoatType || effectiveSizeType) && (
  <div className="sm:col-span-2">
    <p className="text-xs text-muted-foreground mb-1">Profilo Prezzo</p>
    <p className="text-sm font-medium text-primary">
      {effectiveCoatType && (
        <>Pelo {COAT_TYPE_LABELS[effectiveCoatType]}{coatFromBreed && <span className="text-xs text-muted-foreground ml-1">(da razza)</span>}</>
      )}
      {effectiveCoatType && effectiveSizeType && ' · '}
      {effectiveSizeType && (
        <>Taglia {SIZE_TYPE_LABELS[effectiveSizeType]}{sizeFromBreed && <span className="text-xs text-muted-foreground ml-1">(da razza)</span>}</>
      )}
    </p>
  </div>
)}

{/* Avviso soft — visibile se nessun valore effettivo */}
{!effectiveCoatType && !effectiveSizeType && (
  <div className="sm:col-span-2">
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
      Pelo/taglia non configurati — il prezzo degli appuntamenti userà il prezzo base del servizio
    </p>
  </div>
)}
```

Interfaccia `Dog` aggiornata:
```typescript
interface Dog {
  id: string
  name: string
  breedId: string | null
  breedName: string | null
  coatType: string | null      // NEW — override del cane
  sizeType: string | null      // NEW — override del cane
  breedCoatType: string | null // NEW — default dalla razza
  breedSizeType: string | null // NEW — default dalla razza
  // size: string | null       // RIMOSSO dalla visualizzazione (valore legacy)
  dateOfBirth: Date | null
  sex: string | null
  sterilized: boolean
  clientId: string
  createdAt: Date | null
  updatedAt: Date | null
  clientNominativo: string
}
```

Aggiornare anche il prop `dog` passato a `DogForm` per includere `coatType` e `sizeType`.

### Protezione Anti-Errori

- **`|| null` nelle actions:** I valori stringa vuota dal form (`''`) devono diventare `null` nel DB. Usare sempre `parsedInput.coatType || null`.
- **Auto-fill solo se la razza ha il valore:** Nel wrapper onChange di BreedCombobox, verificare `selectedBreed?.coatType` prima di fare `form.setValue` — non sovrascrivere con `null`.
- **SelectItem value="" per reset:** Aggiungere sempre `<SelectItem value="">Nessuno</SelectItem>` come prima opzione per permettere di azzerare il campo.
- **breedCoatType in getDogsByClient:** Il join breeds è già `leftJoin` — se `breedId` è null, `breeds.coatType` sarà null nel risultato. Gestire entrambi i casi nell'UI.
- **Vecchio campo `size`:** Rimane nel DB e nello schema Zod (backward compat) ma non viene più mostrato nel form. Non dropparlo né renderlo null nelle actions (semplicemente non includerlo negli update futuri).
- **BreedForm: useEffect dipendenze:** Aggiungere `breed?.coatType` e `breed?.sizeType` alle dipendenze dell'useEffect se necessario per evitare stale state.

### File da NON Modificare
- `src/lib/db/schema.ts` per `dogs` — già aggiornato da story 2.7
- `src/components/dog/BreedCombobox.tsx` — usato as-is (solo la prop `onChange` viene wrappata)
- `src/components/dog/DogNotes.tsx` — nessuna modifica
- `src/middleware.ts`, `src/lib/auth/permissions.ts` — invariati

### Relazione con Story 4.5

Story 4.5 (Prezzo Appuntamento per Pelo/Taglia) dipende da questa story. La funzione di lookup prezzo dovrà usare:
```typescript
const effectiveCoat = dog.coatType ?? dog.breedCoatType ?? null
const effectiveSize = dog.sizeType ?? dog.breedSizeType ?? null
// lookup in service_price_matrix(serviceId, effectiveCoat, effectiveSize)
// se effectiveCoat o effectiveSize null → usa services.base_price
```
La query `getDogById` aggiornata in questa story espone già entrambi i livelli.

### Git Pattern Commit

```
story 3-3-razza-pelo-taglia-nel-profilo-cane: Task N — descrizione
```

### Testing Manuale

- Crea razza "Labrador" con Pelo=Corto, Taglia=Grande → salva → controlla DB `breeds`
- Crea cane con razza "Labrador", senza override coat/size → detail mostra "Pelo Corto · Taglia Grande (da razza)"
- Modifica cane, cambia Taglia a "Gigante" → salva → detail mostra "Pelo Corto (da razza) · Taglia Gigante"
- Crea cane senza razza, imposta Pelo=Lungo → detail mostra "Pelo Lungo" senza indicatore "(da razza)"
- Crea cane senza razza e senza pelo/taglia → avviso amber visibile
- Elimina razza dal cane → coat/size override restano, breedCoat/breedSize diventano null
- BreedForm in modifica: valori pre-compilati da razza esistente, modificabili

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-05-17-pelo-taglia-su-razza.md — decisione architetturale]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3 — AC originali]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture — coat_type, size_type, logica cascata]
- [Source: src/lib/db/schema.ts — breeds (da aggiornare) e dogs (già OK)]
- [Source: src/lib/validations/breeds.ts — baseline da aggiornare]
- [Source: src/lib/actions/breeds.ts — baseline da aggiornare]
- [Source: src/lib/queries/breeds.ts — baseline da aggiornare]
- [Source: src/components/breed/BreedForm.tsx — baseline da aggiornare]
- [Source: src/lib/validations/dogs.ts — baseline da aggiornare]
- [Source: src/lib/actions/dogs.ts — baseline da aggiornare]
- [Source: src/lib/queries/dogs.ts — baseline da aggiornare]
- [Source: src/components/dog/DogForm.tsx — baseline da aggiornare]
- [Source: src/components/dog/DogDetail.tsx — baseline da aggiornare]
- [Source: _bmad-output/implementation-artifacts/3-2-anagrafica-cani.md — pattern codice e file list]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Nessun blocco critico. Fix minore: cast espliciti a `'short' | 'medium' | 'long'` in BreedForm.tsx per soddisfare i tipi Zod inferiti da next-safe-action.

### Completion Notes List

- Aggiunto `coatType` e `sizeType` alla tabella `breeds` nello schema Drizzle + push al DB di sviluppo
- Aggiornati validazioni (createBreedSchema, updateBreedSchema, createDogSchema, updateDogSchema) con i nuovi campi opzionali
- Aggiornate actions createBreed, updateBreed, createDog, updateDog per persistere i valori (con `|| null` per stringa vuota)
- Aggiornate queries getBreedsForSelect, getBreeds, getBreedById, getDogsByClient, getDogById, getAllDogs
- BreedForm: aggiunti Select Pelo e Taglia con pre-compilazione in edit, opzione "Nessuno" per reset
- BreedList: aggiornata interfaccia Breed, aggiunte colonne Pelo/Taglia in tabella e card mobile
- DogForm: rimosso vecchio Select "size" (piccola/media/grande), aggiunti Select coatType e sizeType con auto-fill dalla razza (wrapper onChange BreedCombobox via useWatch) e hint "Valore ereditato dalla razza"
- DogDetail: logica cascata effectiveCoatType/effectiveSizeType, badge "Pelo X · Taglia Y" con "(da razza)", avviso amber quando nessun valore
- DogList, DogsPage, ClientDetail: interfacce Dog aggiornate, testo secondario mostra pelo/taglia effettivi
- Build Next.js completata senza errori, TypeScript senza warning

### File List

- src/lib/db/schema.ts
- src/lib/validations/breeds.ts
- src/lib/validations/dogs.ts
- src/lib/actions/breeds.ts
- src/lib/actions/dogs.ts
- src/lib/queries/breeds.ts
- src/lib/queries/dogs.ts
- src/components/breed/BreedForm.tsx
- src/components/breed/BreedList.tsx
- src/components/dog/DogForm.tsx
- src/components/dog/DogDetail.tsx
- src/components/dog/DogList.tsx
- src/components/dog/DogsPage.tsx
- src/components/client/ClientDetail.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-05-17: Implementazione completa story 3-3 — pelo/taglia su razza e cascata sul profilo cane
