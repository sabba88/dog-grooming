# Story 3.3: Razza nel Profilo Cane

Status: review

## Story

As a **Amministratore o Collaboratore**,
I want **associare una razza a ogni cane dal catalogo razze**,
so that **il prezzo degli appuntamenti si pre-compili correttamente in base alla razza del cane**.

## Acceptance Criteria

1. **Given** un utente crea o modifica un cane
   **When** accede al campo "Razza" nel form
   **Then** vede un Combobox con ricerca sul catalogo razze configurato dall'Amministratore (sostituisce il campo testo libero)
   **And** il campo è opzionale — un cane può non avere razza associata

2. **Given** un utente seleziona una razza dal Combobox e salva
   **When** il cane viene salvato
   **Then** il campo `breedId` viene persistito
   **And** mostra un toast "Cane aggiornato" / "Cane creato"

3. **Given** un utente visualizza il dettaglio di un cane
   **When** il cane ha una razza associata
   **Then** la razza viene mostrata nel profilo del cane (nome dalla tabella `breeds`)

4. **Given** una razza viene eliminata dal catalogo
   **When** un cane aveva quella razza associata
   **Then** il campo razza del cane risulta vuoto senza errori (ON DELETE SET NULL)

5. **Given** non esistono razze nel catalogo
   **When** un utente apre il campo razza nel form cane
   **Then** il Combobox mostra "Nessuna razza configurata"
   **And** se l'utente è Amministratore, viene mostrato un link a "Gestione Razze"

## Tasks / Subtasks

- [x] Task 1: Aggiornare schema DB — sostituire `breed: text` con `breedId: uuid` (AC: #2, #4)
  - [x] 1.1 In `src/lib/db/schema.ts`: rimuovere `breed: text('breed')` dalla tabella `dogs`
  - [x] 1.2 Aggiungere `breedId: uuid('breed_id').references(() => breeds.id, { onDelete: 'set null' })` (nullable) alla tabella `dogs`
  - [x] 1.3 Verificare che l'import di `breeds` sia disponibile nello stesso file (è già definita in schema.ts)
  - [x] 1.4 Eseguire `npx drizzle-kit push` per applicare il cambiamento al DB

- [x] Task 2: Aggiornare validazioni Zod (AC: #1, #2)
  - [x] 2.1 In `src/lib/validations/dogs.ts`: sostituire `breed: z.string().optional().or(z.literal(''))` con `breedId: z.string().uuid().nullable().optional()`
  - [x] 2.2 Aggiornare `updateDogSchema` con lo stesso cambio
  - [x] 2.3 Aggiornare i tipi inferiti `CreateDogFormData` e `UpdateDogFormData`

- [x] Task 3: Aggiungere query `getBreedsForSelect` e aggiornare query cani (AC: #1, #3, #5)
  - [x] 3.1 In `src/lib/queries/breeds.ts`: aggiungere `getBreedsForSelect(tenantId: string)` che restituisce `{ id: string, name: string }[]` ordinato per name ASC
  - [x] 3.2 In `src/lib/queries/dogs.ts`: aggiornare `getDogsByClient` — sostituire `breed` con LEFT JOIN su `breeds`, restituire `breedId: dogs.breedId` e `breedName: breeds.name` (nullable)
  - [x] 3.3 Aggiornare `getDogById` — stesso LEFT JOIN, restituire `breedId` e `breedName`
  - [x] 3.4 Aggiornare `getAllDogs` — stesso LEFT JOIN, restituire `breedName` invece di `breed`

- [x] Task 4: Aggiornare Server Actions dogs (AC: #2)
  - [x] 4.1 In `src/lib/actions/dogs.ts`: in `createDog` sostituire `.values({ ..., breed: parsedInput.breed || null, ... })` con `breedId: parsedInput.breedId || null`
  - [x] 4.2 In `updateDog` sostituire `breed: parsedInput.breed || null` con `breedId: parsedInput.breedId || null`

- [x] Task 5: Installare componente `command` e creare `BreedCombobox` (AC: #1, #5)
  - [x] 5.1 Installare componente shadcn/ui: `npx shadcn@latest add command`
  - [x] 5.2 Creare `src/components/dog/BreedCombobox.tsx` — Client Component che usa `Popover` + `Command` di shadcn/ui
  - [x] 5.3 Props: `value: string | null | undefined`, `onChange: (value: string | null) => void`, `breeds: { id: string; name: string }[]`, `isAdmin: boolean`
  - [x] 5.4 Quando `breeds` è vuoto: mostrare "Nessuna razza configurata" + link `<a href="/breeds">Aggiungi razze</a>` se `isAdmin`
  - [x] 5.5 Pulsante trigger mostra il nome della razza selezionata o "Seleziona razza..." come placeholder
  - [x] 5.6 Campo di ricerca interno al Command per filtrare per nome
  - [x] 5.7 Opzione per de-selezionare la razza ("Nessuna razza") all'inizio della lista
  - [x] 5.8 Icona `Check` sulla razza selezionata (pattern shadcn/ui Combobox standard)

- [x] Task 6: Aggiornare DogForm con BreedCombobox (AC: #1, #2, #5)
  - [x] 6.1 In `src/components/dog/DogForm.tsx`: aggiungere props `breeds: { id: string; name: string }[]` e `userRole: 'admin' | 'collaborator'`
  - [x] 6.2 Sostituire il campo `Input breed` con il componente `BreedCombobox`, passando `breeds` e `isAdmin={userRole === 'admin'}`
  - [x] 6.3 Aggiornare `defaultValues`: sostituire `breed: dog.breed || ''` con `breedId: dog.breedId || null`
  - [x] 6.4 Controllare la gestione del `Controller` RHF per il campo `breedId` (valore nullable/undefined)

- [x] Task 7: Aggiornare DogList con il nuovo schema (AC: #1, #2, #3)
  - [x] 7.1 In `src/components/dog/DogList.tsx`: aggiornare l'interfaccia `Dog` — sostituire `breed: string | null` con `breedId: string | null` e `breedName: string | null`
  - [x] 7.2 Aggiungere props `breeds: { id: string; name: string }[]` e `userRole: 'admin' | 'collaborator'`
  - [x] 7.3 Passare `breeds` e `userRole` a `DogForm`
  - [x] 7.4 Nel rendering dei cani: mostrare `dog.breedName` invece di `dog.breed`

- [x] Task 8: Aggiornare DogDetail con il nuovo schema (AC: #3)
  - [x] 8.1 In `src/components/dog/DogDetail.tsx`: aggiornare l'interfaccia `Dog` — sostituire `breed: string | null` con `breedId: string | null` e `breedName: string | null`
  - [x] 8.2 Aggiungere props `breeds: { id: string; name: string }[]` e `userRole: 'admin' | 'collaborator'`
  - [x] 8.3 Nella sezione Dati Cane: mostrare `dog.breedName` invece di `dog.breed`
  - [x] 8.4 Passare `breeds`, `userRole`, e il `dog` aggiornato (con `breedId`) a `DogForm`

- [x] Task 9: Aggiornare DogsPage con il nuovo schema (AC: #3)
  - [x] 9.1 In `src/components/dog/DogsPage.tsx`: aggiornare l'interfaccia `Dog` — sostituire `breed: string | null` con `breedName: string | null`
  - [x] 9.2 Nel rendering: mostrare `dog.breedName` invece di `dog.breed`

- [x] Task 10: Aggiornare le pagine Server Component per passare breeds e role (AC: #1, #5)
  - [x] 10.1 In `src/app/(auth)/dogs/[id]/page.tsx`: aggiungere `import { getBreedsForSelect } from '@/lib/queries/breeds'`; fare fetch parallelo con `Promise.all([getDogById, getDogNotes, getBreedsForSelect])`; passare `breeds` e `userRole={session.user.role}` a `DogDetail`
  - [x] 10.2 In `src/app/(auth)/clients/[id]/page.tsx`: aggiungere `import { getBreedsForSelect } from '@/lib/queries/breeds'`; fare fetch parallelo aggiungendo `getBreedsForSelect`; passare `breeds` e `userRole={session.user.role}` a `ClientDetail`
  - [x] 10.3 In `src/components/client/ClientDetail.tsx`: aggiungere props `breeds` e `userRole`; passarli a `DogList`

## Dev Notes

### Contesto Architetturale

**Dipendenza da Story 2.6:** La tabella `breeds` e `serviceBreedPrices` sono già state create nella story 2.6. `getBreedsForSelect` deve usare la tabella `breeds` esistente in `src/lib/db/schema.ts`.

**Perché FK con constraint in questo caso:** Il progetto usa FK logiche per la maggior parte delle relazioni, ma usa FK con `.references(..., { onDelete: 'cascade' })` quando è necessaria una cascata automatica (vedi `serviceBreedPrices`). Per `dogs.breedId` serve `ON DELETE SET NULL` (AC #4), quindi si usa `.references(() => breeds.id, { onDelete: 'set null' })`. Questo è l'unico campo in `dogs` con FK enforced dal DB.

**Nota critica sul campo `breed: text`:** Il campo `breed: text('breed')` DEVE essere rimosso dalla tabella `dogs` (sostituito da `breedId`). Questo richiede `drizzle-kit push` che eseguirà un `ALTER TABLE dogs DROP COLUMN breed, ADD COLUMN breed_id uuid REFERENCES breeds(id) ON DELETE SET NULL`. Verificare che non ci siano dati in produzione da migrare (ambiente di sviluppo).

### Pattern obbligatori

```typescript
// src/lib/actions/client.ts — authActionClient già configurato
// Usa SEMPRE authActionClient per tutte le actions
// NO checkRole — admin + collaborator possono gestire cani

// Pattern query con LEFT JOIN breeds:
export async function getDogsByClient(clientId: string, tenantId: string) {
  return db
    .select({
      id: dogs.id,
      name: dogs.name,
      breedId: dogs.breedId,
      breedName: breeds.name,          // null se no razza
      size: dogs.size,
      dateOfBirth: dogs.dateOfBirth,
      sex: dogs.sex,
      sterilized: dogs.sterilized,
      createdAt: dogs.createdAt,
    })
    .from(dogs)
    .leftJoin(breeds, eq(dogs.breedId, breeds.id))  // LEFT JOIN per cani senza razza
    .innerJoin(clients, and(eq(dogs.clientId, clients.id), isNull(clients.deletedAt)))
    .where(and(eq(dogs.clientId, clientId), eq(dogs.tenantId, tenantId)))
    .orderBy(asc(dogs.name))
}
```

### Schema DB aggiornato — tabella `dogs`

```typescript
export const dogs = pgTable('dogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // RIMOSSO: breed: text('breed'),
  breedId: uuid('breed_id').references(() => breeds.id, { onDelete: 'set null' }), // nullable, ON DELETE SET NULL
  size: text('size'),
  dateOfBirth: timestamp('date_of_birth'),
  sex: text('sex'),
  sterilized: boolean('sterilized').notNull().default(false),
  clientId: uuid('client_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Validazioni Zod aggiornate

```typescript
// src/lib/validations/dogs.ts
export const createDogSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  breedId: z.string().uuid().nullable().optional(),  // SOSTITUISCE breed
  size: z.enum(['piccola', 'media', 'grande']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  sex: z.enum(['maschio', 'femmina']).optional().or(z.literal('')),
  sterilized: z.boolean(),
  clientId: z.string().uuid(),
})

export const updateDogSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  breedId: z.string().uuid().nullable().optional(),  // SOSTITUISCE breed
  size: z.enum(['piccola', 'media', 'grande']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  sex: z.enum(['maschio', 'femmina']).optional().or(z.literal('')),
  sterilized: z.boolean(),
})
```

### BreedCombobox — Pattern shadcn/ui Combobox

Il Combobox è costruito con `Popover` + `Command` (pattern ufficiale shadcn/ui). `Popover` è già installato. Installare `Command`:

```bash
npx shadcn@latest add command
```

```tsx
// src/components/dog/BreedCombobox.tsx
'use client'
import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Link from 'next/link'

interface BreedComboboxProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  breeds: { id: string; name: string }[]
  isAdmin: boolean
}

export function BreedCombobox({ value, onChange, breeds, isAdmin }: BreedComboboxProps) {
  const [open, setOpen] = useState(false)
  const selectedBreed = breeds.find((b) => b.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedBreed ? selectedBreed.name : 'Seleziona razza...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Cerca razza..." />
          <CommandList>
            {breeds.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nessuna razza configurata
                {isAdmin && (
                  <div className="mt-2">
                    <Link href="/breeds" className="text-primary underline underline-offset-4 hover:no-underline">
                      Aggiungi razze
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <CommandEmpty>Nessun risultato</CommandEmpty>
                <CommandGroup>
                  {/* Opzione per de-selezionare */}
                  <CommandItem
                    value=""
                    onSelect={() => { onChange(null); setOpen(false) }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
                    Nessuna razza
                  </CommandItem>
                  {breeds.map((breed) => (
                    <CommandItem
                      key={breed.id}
                      value={breed.name}
                      onSelect={() => { onChange(breed.id); setOpen(false) }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value === breed.id ? 'opacity-100' : 'opacity-0')} />
                      {breed.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Integrazione BreedCombobox in DogForm

```tsx
// In DogForm.tsx — sostituire il campo Input breed con:
<div className="flex flex-col gap-2">
  <Label>Razza (opzionale)</Label>
  <Controller
    name="breedId"
    control={form.control}
    render={({ field }) => (
      <BreedCombobox
        value={field.value}
        onChange={field.onChange}
        breeds={breeds}
        isAdmin={userRole === 'admin'}
      />
    )}
  />
</div>
```

### Pattern getBreedsForSelect

```typescript
// src/lib/queries/breeds.ts — aggiungere questa funzione
export async function getBreedsForSelect(tenantId: string) {
  return db
    .select({ id: breeds.id, name: breeds.name })
    .from(breeds)
    .where(eq(breeds.tenantId, tenantId))
    .orderBy(asc(breeds.name))
}
```

### Propagazione `breeds` e `userRole` — albero componenti

```
clients/[id]/page.tsx (Server Component)
  → fetch getBreedsForSelect(tenantId) in Promise.all
  → session.user.role disponibile
  → ClientDetail (props: dogs, breeds, userRole)
      → DogList (props: dogs, breeds, userRole)
          → DogForm (props: breeds, userRole)
              → BreedCombobox

dogs/[id]/page.tsx (Server Component)
  → fetch getBreedsForSelect(tenantId) in Promise.all
  → session.user.role disponibile
  → DogDetail (props: dog, notes, breeds, userRole)
      → DogForm (props: dog, breeds, userRole)
          → BreedCombobox
```

### Nota: `ClientDetail.tsx` è Client Component

`ClientDetail.tsx` è un Client Component (`'use client'`). Aggiungere `breeds` e `userRole` come props e passarli a `DogList`. NON fare fetch client-side in `ClientDetail` — i breeds arrivano già dal Server Component padre.

### Aggiornamento `updatedAt` nelle actions

Ricordare sempre `updatedAt: new Date()` in ogni `db.update()` — il default `defaultNow()` di Drizzle funziona solo all'INSERT.

### Aggiornamento `DogsPage.tsx`

```tsx
// src/components/dog/DogsPage.tsx — aggiornare interfaccia Dog
interface Dog {
  id: string
  name: string
  breedName: string | null  // SOSTITUISCE breed: string | null
  size: string | null
  sex: string | null
  clientFirstName: string
  clientLastName: string
  clientId: string
}
// Nel rendering: mostrare dog.breedName invece di dog.breed
```

### Project Structure Notes

**File da modificare:**
```
src/lib/db/schema.ts                 — MODIFICA: dogs.breed → dogs.breedId (con FK)
src/lib/validations/dogs.ts          — MODIFICA: breed → breedId
src/lib/actions/dogs.ts              — MODIFICA: breed → breedId in createDog e updateDog
src/lib/queries/dogs.ts              — MODIFICA: LEFT JOIN breeds, breedId+breedName
src/lib/queries/breeds.ts            — AGGIUNGE: getBreedsForSelect
src/app/(auth)/dogs/[id]/page.tsx    — MODIFICA: fetch breeds + pass a DogDetail
src/app/(auth)/clients/[id]/page.tsx — MODIFICA: fetch breeds + pass a ClientDetail
src/components/client/ClientDetail.tsx — MODIFICA: pass breeds+userRole a DogList
src/components/dog/DogList.tsx       — MODIFICA: breedName, breeds+userRole props, pass a DogForm
src/components/dog/DogDetail.tsx     — MODIFICA: breedName, breeds+userRole props, pass a DogForm
src/components/dog/DogForm.tsx       — MODIFICA: BreedCombobox al posto di Input breed
src/components/dog/DogsPage.tsx      — MODIFICA: breedName invece di breed
```

**File da creare:**
```
src/components/dog/BreedCombobox.tsx — CREA: Combobox con ricerca per razze
```

**File da NON modificare:**
- `src/lib/actions/client.ts` — authActionClient già configurato
- `src/middleware.ts` — nessun cambio di route necessario
- `src/lib/auth/permissions.ts` — nessun cambio RBAC (entrambi i ruoli accedono)
- `src/components/breed/BreedForm.tsx`, `BreedList.tsx` — non toccare

### Alignment con Architettura

- **tenantId** presente in OGNI query
- **authActionClient** con schema Zod per OGNI server action
- **NO checkRole** — sia admin che collaborator gestiscono cani (FR16-FR17)
- **Lingua UI:** Italiano. **Lingua codice:** Inglese
- **Toast Sonner:** `toast.success()` / `toast.error()` — già configurato
- **Prezzi in centesimi:** non riguarda questa story
- **Combobox pattern:** seguire esattamente il pattern shadcn/ui (Popover + Command)

### Protezione Anti-Errori

- **Left join obbligatorio:** Usare `leftJoin(breeds, eq(dogs.breedId, breeds.id))` — NON `innerJoin` perché i cani possono non avere razza (breedId nullable)
- **breedId nullable nell'action:** `breedId: parsedInput.breedId || null` — non undefined, null
- **Controller RHF per breedId:** Il campo breedId è nullable, usare `Controller` di React Hook Form (non `register`) perché il valore può essere `null`
- **defaultValues per modifica:** `breedId: dog.breedId || null` — passare il breedId corrente del cane, non il nome
- **Drizzle self-reference:** In schema.ts, `breeds` è definita PRIMA di `dogs`, quindi `dogs.breedId.references(() => breeds.id)` funziona (nessun circular reference)
- **CommandItem value vs id:** Il `value` del `CommandItem` nel Command shadcn è usato per la ricerca. Usare `value={breed.name}` (testo ricercabile) e gestire la selezione con `onSelect` che chiama `onChange(breed.id)` — NON `value={breed.id}`
- **Link a /breeds nel Combobox:** Usare `Link` di Next.js (non `<a>` HTML) per navigazione SPA. Chiudere il Popover prima di navigare se necessario

### Previous Story Intelligence (da Story 3.2 e 2.6)

**Da Story 3.2:**
- `authActionClient` pattern con `.schema().action()` è stabile
- `useAction` hook con `onSuccess`/`onError` funziona correttamente
- `router.refresh()` dopo mutazione per ricaricare dati dal server
- `Controller` di RHF per campi con Select/componenti custom — stesso pattern per BreedCombobox
- Pattern errore server: `error.error?.serverError`

**Da Story 2.6:**
- `breeds` table: `id`, `name`, `tenantId`, `createdAt`, `updatedAt`
- `getBreedsForSelect` da aggiungere a `src/lib/queries/breeds.ts` (già esiste il file)
- `getBreeds` esistente restituisce `{ id, name, priceCount }` — non usare direttamente, creare `getBreedsForSelect` con solo `{ id, name }`
- La pagina `/breeds` è già in navigazione per Admin — il link nel Combobox può puntare direttamente a `/breeds`

**Git intelligence — ultimi commit:**
```
3454991 story 2-6-gestione-razze-canine: Completion
6c8f155 story 2-6-gestione-razze-canine: Task 5 — ServiceBreedPricesSection + ServiceForm integrazione
f1f3d52 story 2-6-gestione-razze-canine: Task 4 — BreedList, BreedForm, breeds page, navigazione
193d0a9 story 2-6-gestione-razze-canine: Task 3 — getServiceWithBreedPrices + upsertServiceBreedPrices
74ea01c story 2-6-gestione-razze-canine: Task 2 — Validazioni Zod, query e actions breeds
```

Pattern commit da seguire:
```
story 3-3-razza-nel-profilo-cane: Task N — Descrizione breve
```

### Testing

Nessun framework test configurato. Verifica manuale:
- Creare cane con razza selezionata → breedId salvato, toast "Cane aggiunto"
- Modificare cane e cambiare razza → breedId aggiornato, toast "Cane aggiornato"
- Creare cane senza razza → breedId = null, nessun errore
- Dettaglio cane con razza → mostra nome razza
- Dettaglio cane senza razza → mostra "—"
- Lista cani nel dettaglio cliente → mostra nome razza (o nessun dettaglio se assente)
- Lista cani globale `/dogs` → mostra nome razza
- Ricerca nel Combobox → filtra per nome razza in tempo reale
- Combobox vuoto (nessuna razza configurata):
  - Collaborator: vede "Nessuna razza configurata" senza link
  - Admin: vede "Nessuna razza configurata" + link "Aggiungi razze" che porta a /breeds
- De-selezione razza via "Nessuna razza" → breedId = null
- Eliminazione razza dal catalogo → cane mostra razza vuota senza errore DB (ON DELETE SET NULL)
- Collaborator: può creare/modificare cani (NO checkRole)
- Admin: può creare/modificare cani

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3 — Acceptance Criteria e requisiti]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns — schema dogs con breedId e ON DELETE SET NULL]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns — Server Actions, no checkRole per cani]
- [Source: _bmad-output/implementation-artifacts/3-2-anagrafica-cani.md — File list, pattern authActionClient, FK logiche, DogForm Controller pattern]
- [Source: _bmad-output/implementation-artifacts/2-6-gestione-razze-canine.md — breeds table, serviceBreedPrices, getBreedsForSelect da aggiungere]
- [Source: src/lib/db/schema.ts — tabelle dogs (breed: text da sostituire), breeds (già presente)]
- [Source: src/lib/validations/dogs.ts — schemi Zod attuali con breed text]
- [Source: src/lib/actions/dogs.ts — createDog, updateDog pattern]
- [Source: src/lib/queries/dogs.ts — getDogsByClient, getDogById, getAllDogs]
- [Source: src/lib/queries/breeds.ts — getBreeds, getBreedWithPrices — aggiungere getBreedsForSelect]
- [Source: src/components/dog/DogForm.tsx — campo breed Input da sostituire con BreedCombobox]
- [Source: src/components/dog/DogDetail.tsx — dog.breed da aggiornare a dog.breedName]
- [Source: src/components/dog/DogList.tsx — dog.breed da aggiornare a dog.breedName]
- [Source: src/app/(auth)/dogs/[id]/page.tsx — aggiornare fetch con breeds]
- [Source: src/app/(auth)/clients/[id]/page.tsx — aggiungere fetch breeds in Promise.all]
- [Source: shadcn/ui docs — Combobox: Popover + Command pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- drizzle-kit push non supporta input non-interattivo per la scelta rename/create: applicata migrazione SQL direttamente via @neondatabase/serverless (ALTER TABLE dogs DROP COLUMN breed, ADD COLUMN breed_id uuid REFERENCES breeds(id) ON DELETE SET NULL). Successivo drizzle-kit push ha confermato "No changes detected".
- AppointmentForm.tsx aveva un'interfaccia Dog locale con `breed: string | null` non contemplata nel task list — aggiornata a `breedName: string | null` per mantenere coerenza TypeScript.
- breeds spostata prima di dogs in schema.ts per permettere la forward reference `() => breeds.id`.

### Completion Notes List

- Task 1: Schema DB aggiornato — breeds spostata prima di dogs; dogs.breed rimosso e dogs.breedId aggiunto come FK nullable (ON DELETE SET NULL); migrazione applicata al DB.
- Tasks 2-4: Validazioni Zod, query dogs con LEFT JOIN breeds (breedId+breedName), actions aggiornate.
- Task 5: shadcn/ui command installato; BreedCombobox.tsx creato con Popover+Command, ricerca per nome, de-selezione, link admin a /breeds se catalogo vuoto.
- Tasks 6-10: DogForm, DogList, DogDetail, DogsPage, ClientDetail, dogs/[id]/page.tsx, clients/[id]/page.tsx aggiornati con breeds/userRole propagati dall'alto. AppointmentForm.tsx aggiornato come extra per coerenza dei tipi.
- TypeScript compila senza errori.

### File List

- src/lib/db/schema.ts
- src/lib/validations/dogs.ts
- src/lib/queries/dogs.ts
- src/lib/queries/breeds.ts
- src/lib/actions/dogs.ts
- src/components/ui/command.tsx (nuovo)
- src/components/dog/BreedCombobox.tsx (nuovo)
- src/components/dog/DogForm.tsx
- src/components/dog/DogList.tsx
- src/components/dog/DogDetail.tsx
- src/components/dog/DogsPage.tsx
- src/components/client/ClientDetail.tsx
- src/components/appointment/AppointmentForm.tsx
- src/app/(auth)/dogs/[id]/page.tsx
- src/app/(auth)/clients/[id]/page.tsx

### Change Log

- 2026-04-26: Implementazione completa story 3-3-razza-nel-profilo-cane — campo breed:text sostituito da breedId:uuid FK in dogs, BreedCombobox shadcn/ui creato, query aggiornate con LEFT JOIN breeds, propagazione breeds+userRole a tutti i componenti dell'albero cane.
