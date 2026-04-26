# Story 2.6: Gestione Razze Canine

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore**,
I want **creare e gestire un catalogo di razze canine con prezzi specifici per servizio**,
so that **il salone possa tariffeare ogni servizio in modo differenziato per razza e il prezzo degli appuntamenti si pre-compili correttamente**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla pagina Razze (`/breeds`)
   **When** la pagina viene renderizzata
   **Then** viene mostrata la lista delle razze con nome e numero di prezzi per servizio configurati
   **And** l'accesso è limitato al ruolo Amministratore (checkRole — Collaboratore riceve redirect)

2. **Given** un Amministratore clicca su "Nuova Razza"
   **When** il form si apre (Sheet su mobile / Dialog su desktop)
   **Then** vede un campo per il nome della razza e la lista completa dei servizi esistenti, ciascuno con un campo prezzo opzionale (placeholder: "Usa prezzo base")

3. **Given** un Amministratore compila il nome e facoltativamente uno o più prezzi per servizio
   **When** clicca "Salva"
   **Then** la razza viene creata e i prezzi compilati (non vuoti) vengono salvati in `service_breed_prices`
   **And** mostra un toast "Razza creata"

4. **Given** un Amministratore seleziona una razza esistente
   **When** modifica nome o prezzi per servizio e salva
   **Then** le modifiche vengono salvate (delete + insert per i prezzi della razza — replace strategy)
   **And** mostra un toast "Razza aggiornata"

5. **Given** un Amministratore clicca "Elimina" su una razza
   **When** viene mostrato Alert Dialog "Eliminare la razza [nome]? I cani associati perderanno la razza."
   **Then** dopo conferma la razza viene eliminata
   **And** i cani con quella razza avranno `breedId = null` (ON DELETE SET NULL — gestito a livello DB, campo aggiunto in Story 3.3)
   **And** i prezzi in `service_breed_prices` vengono eliminati (ON DELETE CASCADE — gestito a livello DB)
   **And** mostra un toast "Razza eliminata"

6. **Given** un Amministratore è nel form di modifica di un servizio (ServiceForm in modalità edit)
   **When** accede alla sezione "Prezzi per Razza"
   **Then** vede la lista di tutte le razze con il prezzo specifico configurato per questo servizio (se presente)
   **And** le razze senza prezzo specifico mostrano il placeholder "Usa prezzo base (€ X,XX)"
   **And** può aggiungere, modificare o rimuovere il prezzo specifico per ogni razza

7. **Given** un Amministratore modifica i prezzi per razza dalla sezione "Prezzi per Razza" nel form servizio
   **When** clicca "Salva Prezzi Razza"
   **Then** i prezzi vengono aggiornati in `service_breed_prices` (replace strategy per questo servizio)
   **And** mostra un toast "Prezzi aggiornati"

8. **Given** viene creato un nuovo servizio dopo che esistono già delle razze
   **When** l'Amministratore apre il form di modifica di una razza esistente
   **Then** il nuovo servizio appare nella lista con il campo prezzo vuoto (usa prezzo base)

## Tasks / Subtasks

- [x] Task 1: Schema DB e migrazione (AC: #1–8)
  - [x] 1.1 In `src/lib/db/schema.ts` aggiungere la tabella `breeds` dopo `locationBusinessHours`
  - [x] 1.2 In `src/lib/db/schema.ts` aggiungere la tabella `serviceBreedPrices` dopo `breeds` (FK su services.id ON DELETE CASCADE, breeds.id ON DELETE CASCADE; unique su service_id + breed_id + tenant_id)
  - [x] 1.3 Eseguire `npx drizzle-kit push` per creare le due tabelle nel DB (operazione non distruttiva — aggiunge tabelle, non modifica esistenti)

- [x] Task 2: Validazioni Zod, query e server actions breeds (AC: #1–5)
  - [x] 2.1 Creare `src/lib/validations/breeds.ts` con `createBreedSchema`, `updateBreedSchema`, `deleteBreedSchema`, `upsertBreedPricesSchema`
  - [x] 2.2 Creare `src/lib/queries/breeds.ts` con `getBreeds` (nome + count prezzi), `getBreedById`, `getBreedWithPrices`
  - [x] 2.3 Creare `src/lib/actions/breeds.ts` con `createBreed`, `updateBreed`, `deleteBreed` (tutti con `authActionClient`, checkRole admin)
  - [x] 2.4 `createBreed` e `updateBreed`: dopo save breed, eseguire replace dei prezzi (delete all breed prices → insert solo quelli con price valorizzato) — NO db.transaction() (driver neon-http incompatibile)

- [x] Task 3: Query e action per prezzi-per-razza dal lato servizio (AC: #6–8)
  - [x] 3.1 Aggiungere `getServiceWithBreedPrices(serviceId, tenantId)` in `src/lib/queries/services.ts` — join con `serviceBreedPrices` e `breeds`
  - [x] 3.2 Aggiungere `upsertServiceBreedPrices` action in `src/lib/actions/services.ts` — riceve `serviceId` + array `[{breedId, price?: number}]`, replace strategy: delete all per (serviceId, tenantId) poi insert quelli con price valorizzato

- [x] Task 4: Componenti BreedList e BreedForm (AC: #1–5)
  - [x] 4.1 Creare `src/components/breed/BreedList.tsx` — Client Component: lista razze con nome + count prezzi + pulsanti "Modifica" e "Elimina" (Alert Dialog per eliminazione). Admin-only UI.
  - [x] 4.2 Creare `src/components/breed/BreedForm.tsx` — Client Component: Sheet mobile / Dialog desktop con campo nome + lista servizi con prezzi opzionali. Usa `useAction(createBreed)` o `useAction(updateBreed)`.
  - [x] 4.3 Creare `src/app/(auth)/breeds/page.tsx` — Server Component: `checkRole` admin (redirect se collaboratore), fetch `getBreeds` + `getServices`, render `<BreedList>` con i dati
  - [x] 4.4 Aggiungere voce "Razze" nella navigazione sidebar/bottom bar per il ruolo Admin

- [ ] Task 5: Sezione "Prezzi per Razza" nel ServiceForm (AC: #6–8)
  - [ ] 5.1 Creare `src/components/service/ServiceBreedPricesSection.tsx` — Client Component: riceve `serviceId`, `serviceBasePrice`, lista di `{breedId, breedName, currentPrice?}`. State locale per i prezzi, pulsante "Salva Prezzi Razza", usa `useAction(upsertServiceBreedPrices)`.
  - [ ] 5.2 Aggiornare `ServiceForm.tsx`: quando `isEditing`, aggiungere `ServiceBreedPricesSection` sotto il form principale (sezione separata con heading "Prezzi per Razza"). Fetch `getServiceWithBreedPrices` via query TanStack Query al mount del form.
  - [ ] 5.3 Aggiornare `src/app/(auth)/services/page.tsx`: passare la lista delle razze a `ServiceList` per consentire il fetch nella sezione prezzi (oppure `ServiceBreedPricesSection` fa il fetch internamente via TanStack Query).

## Dev Notes

### Schema DB da aggiungere

```typescript
// src/lib/db/schema.ts — AGGIUNGERE dopo la tabella `locationBusinessHours`:

// CC-2026-04-26b: Catalogo razze canine — CMS gestito dall'Amministratore.
export const breeds = pgTable('breeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// CC-2026-04-26b: Prezzi specifici per razza per servizio.
// Se non esiste una riga per (serviceId, breedId), il sistema usa services.price come fallback.
// ON DELETE CASCADE da entrambi i lati.
// dogs.breedId (aggiunto in Story 3.3): uuid('breed_id').references(() => breeds.id, { onDelete: 'set null' })
export const serviceBreedPrices = pgTable('service_breed_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  breedId: uuid('breed_id').notNull().references(() => breeds.id, { onDelete: 'cascade' }),
  price: integer('price').notNull(), // centesimi, come services.price
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
// Unique constraint: un solo prezzo per (service, breed, tenant)
(t) => [uniqueIndex('unique_service_breed_tenant').on(t.serviceId, t.breedId, t.tenantId)]
)
```

Aggiungere anche `uniqueIndex` agli import: `import { pgTable, uuid, text, timestamp, ..., uniqueIndex } from 'drizzle-orm/pg-core'`

**Drizzle push:** `npx drizzle-kit push` — nuove tabelle, operazione non distruttiva, nessun dato esistente da migrare.

> **ATTENZIONE:** La colonna `dogs.breedId` (FK su breeds.id) NON è inclusa in questa story — verrà aggiunta in Story 3.3. In Story 2.6 la tabella `dogs` non viene modificata.

### Validazioni Zod

```typescript
// src/lib/validations/breeds.ts — CREARE:
import { z } from 'zod'

export const breedServicePriceSchema = z.object({
  serviceId: z.string().uuid(),
  price: z.number().int().positive().optional(), // centesimi; undefined/absent = non salvare
})

export const createBreedSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  servicePrices: z.array(breedServicePriceSchema).default([]),
})

export const updateBreedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  servicePrices: z.array(breedServicePriceSchema).default([]),
})

export const deleteBreedSchema = z.object({
  id: z.string().uuid(),
})

// Per upsert dal lato servizio
export const upsertServiceBreedPricesSchema = z.object({
  serviceId: z.string().uuid(),
  breedPrices: z.array(z.object({
    breedId: z.string().uuid(),
    price: z.number().int().positive().optional(),
  })),
})

export type CreateBreedFormData = z.infer<typeof createBreedSchema>
export type UpdateBreedFormData = z.infer<typeof updateBreedSchema>
```

### Query breeds

```typescript
// src/lib/queries/breeds.ts — CREARE:
import { db } from '@/lib/db'
import { breeds, serviceBreedPrices } from '@/lib/db/schema'
import { eq, and, asc, count, sql } from 'drizzle-orm'

// Lista razze con contatore prezzi configurati
export async function getBreeds(tenantId: string) {
  return db
    .select({
      id: breeds.id,
      name: breeds.name,
      priceCount: sql<number>`count(${serviceBreedPrices.id})::int`,
    })
    .from(breeds)
    .leftJoin(serviceBreedPrices, eq(serviceBreedPrices.breedId, breeds.id))
    .where(eq(breeds.tenantId, tenantId))
    .groupBy(breeds.id, breeds.name)
    .orderBy(asc(breeds.name))
}

// Singola razza con tutti i prezzi per servizio
export async function getBreedWithPrices(breedId: string, tenantId: string) {
  const [breed] = await db
    .select({ id: breeds.id, name: breeds.name })
    .from(breeds)
    .where(and(eq(breeds.id, breedId), eq(breeds.tenantId, tenantId)))
    .limit(1)
  if (!breed) return null

  const prices = await db
    .select({
      serviceId: serviceBreedPrices.serviceId,
      price: serviceBreedPrices.price,
    })
    .from(serviceBreedPrices)
    .where(and(
      eq(serviceBreedPrices.breedId, breedId),
      eq(serviceBreedPrices.tenantId, tenantId),
    ))

  return { ...breed, servicePrices: prices }
}
```

### Server actions breeds

```typescript
// src/lib/actions/breeds.ts — CREARE:
'use server'

import { authActionClient } from '@/lib/actions/client'
import { createBreedSchema, updateBreedSchema, deleteBreedSchema } from '@/lib/validations/breeds'
import { breeds, serviceBreedPrices } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// ATTENZIONE: driver neon-http non supporta db.transaction()
// Pattern: operazioni sequenziali (come in staff.ts e locations.ts)

export const createBreed = authActionClient
  .schema(createBreedSchema)
  .action(async ({ parsedInput: { name, servicePrices }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [breed] = await db
      .insert(breeds)
      .values({ name, tenantId: ctx.tenantId })
      .returning({ id: breeds.id })

    const pricesToInsert = servicePrices.filter(p => p.price !== undefined)
    if (pricesToInsert.length > 0) {
      await db.insert(serviceBreedPrices).values(
        pricesToInsert.map(p => ({
          serviceId: p.serviceId,
          breedId: breed.id,
          price: p.price!,
          tenantId: ctx.tenantId,
        }))
      )
    }
    return { breed }
  })

export const updateBreed = authActionClient
  .schema(updateBreedSchema)
  .action(async ({ parsedInput: { id, name, servicePrices }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(breeds)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId)))

    // Replace strategy: elimina tutti i prezzi esistenti per questa razza, poi reinserisce
    await db.delete(serviceBreedPrices).where(
      and(eq(serviceBreedPrices.breedId, id), eq(serviceBreedPrices.tenantId, ctx.tenantId))
    )

    const pricesToInsert = servicePrices.filter(p => p.price !== undefined)
    if (pricesToInsert.length > 0) {
      await db.insert(serviceBreedPrices).values(
        pricesToInsert.map(p => ({
          serviceId: p.serviceId,
          breedId: id,
          price: p.price!,
          tenantId: ctx.tenantId,
        }))
      )
    }
    return { breedId: id }
  })

export const deleteBreed = authActionClient
  .schema(deleteBreedSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')
    // service_breed_prices eliminati per CASCADE; dogs.breedId → null per SET NULL (Story 3.3)
    await db.delete(breeds).where(
      and(eq(breeds.id, id), eq(breeds.tenantId, ctx.tenantId))
    )
    return { deletedId: id }
  })
```

### Query e action per prezzi-per-razza dal lato servizio

```typescript
// src/lib/queries/services.ts — AGGIUNGERE:
import { serviceBreedPrices, breeds } from '@/lib/db/schema'

export async function getServiceWithBreedPrices(serviceId: string, tenantId: string) {
  const breedPrices = await db
    .select({
      breedId: serviceBreedPrices.breedId,
      breedName: breeds.name,
      price: serviceBreedPrices.price,
    })
    .from(serviceBreedPrices)
    .innerJoin(breeds, eq(breeds.id, serviceBreedPrices.breedId))
    .where(and(
      eq(serviceBreedPrices.serviceId, serviceId),
      eq(serviceBreedPrices.tenantId, tenantId),
    ))
    .orderBy(asc(breeds.name))

  return breedPrices
}

// src/lib/actions/services.ts — AGGIUNGERE:
import { upsertServiceBreedPricesSchema } from '@/lib/validations/breeds'

export const upsertServiceBreedPrices = authActionClient
  .schema(upsertServiceBreedPricesSchema)
  .action(async ({ parsedInput: { serviceId, breedPrices }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    // Replace strategy per questo servizio
    await db.delete(serviceBreedPrices).where(
      and(eq(serviceBreedPrices.serviceId, serviceId), eq(serviceBreedPrices.tenantId, ctx.tenantId))
    )

    const pricesToInsert = breedPrices.filter(p => p.price !== undefined)
    if (pricesToInsert.length > 0) {
      await db.insert(serviceBreedPrices).values(
        pricesToInsert.map(p => ({
          serviceId,
          breedId: p.breedId,
          price: p.price!,
          tenantId: ctx.tenantId,
        }))
      )
    }
    return { serviceId }
  })
```

### Pagina breeds

```typescript
// src/app/(auth)/breeds/page.tsx — CREARE:
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getBreeds } from '@/lib/queries/breeds'
import { getServices } from '@/lib/queries/services'
import { BreedList } from '@/components/breed/BreedList'

export default async function BreedsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (session.user.role !== 'admin') redirect('/agenda') // Admin only

  const [breedsList, servicesList] = await Promise.all([
    getBreeds(session.user.tenantId),
    getServices(session.user.tenantId),
  ])

  return (
    <BreedList
      breeds={breedsList}
      services={servicesList}
    />
  )
}
```

### Pattern componenti BreedList e BreedForm

**BreedList** (Client Component):
- Props: `breeds: { id, name, priceCount }[]`, `services: { id, name, price }[]`
- State locale: `editingBreed`, `deletingBreedId`, `isFormOpen`
- Renderizza:
  - Heading "Razze" + pulsante "Nuova Razza"
  - Lista: ogni riga mostra nome + `X prezzi configurati` + pulsanti "Modifica" / "Elimina"
  - `<BreedForm>` condizionale per create/edit
  - `<AlertDialog>` per conferma eliminazione
- Dopo create/update/delete: `router.refresh()` per aggiornare i dati dal server

**BreedForm** (Client Component):
- Props: `open`, `onOpenChange`, `onSuccess`, `services: { id, name, price }[]`, `breed?` (per edit)
- Al mount in edit: fetch `getBreedWithPrices` tramite `useQuery` TanStack Query per ottenere i prezzi esistenti
- State locale: mappa `serviceId → priceEur: string` (stringa per l'input, convertita in centesimi al submit)
- Rendering: Sheet (mobile) / Dialog (desktop)
  - Campo "Nome razza" (required)
  - Sezione "Prezzi per Servizio": per ogni servizio, Input type="number" step="0.01" placeholder="Usa prezzo base" (vuoto = non salvare prezzo per questo servizio)
- Submit: converte prezzi in centesimi, chiama `createBreed` o `updateBreed`

**ServiceBreedPricesSection** (Client Component):
- Props: `serviceId: string`, `serviceBasePrice: number`, `breeds: { id, name }[]`
- Fetch interno: `useQuery(['serviceBreedPrices', serviceId], () => getServiceWithBreedPrices(serviceId))`
- State locale: mappa `breedId → priceEur: string`
- Rendering: lista razze con Input prezzo (placeholder: `Usa prezzo base (€ X,XX)`)
- Submit: `useAction(upsertServiceBreedPrices)`, toast "Prezzi aggiornati"
- Solo mostrata in ServiceForm quando `isEditing` (il servizio ha un ID)

### Navigazione sidebar

Aggiungere voce "Razze" alla sidebar e alla bottom bar solo per il ruolo `admin`. Pattern uguale alle altre voci admin-only (es. "Impostazioni" o "Utenti"). Verificare in `src/components/layout/Sidebar.tsx` e `src/components/layout/BottomBar.tsx`.

### Formattazione prezzi

- Input UI: decimale in EUR (es. `25.00`)
- Database: intero in centesimi (es. `2500`)
- Conversione al submit: `Math.round(parseFloat(value) * 100)` — stesso pattern di `ServiceForm.tsx` line 121-125
- Display nei placeholder: usare `formatPrice` da `src/lib/utils/formatting.ts` (se esiste) o `new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price / 100)`

### Pattern replace per prezzi (CRITICO — neon-http)

Il driver neon-http **non supporta `db.transaction()`** — confermato nella Story 2.5 (vedi completion note Task 2). Usare sempre delete + insert sequenziali:

```typescript
// CORRETTO:
await db.delete(serviceBreedPrices).where(...)
await db.insert(serviceBreedPrices).values(...)

// SBAGLIATO (causa errore runtime):
await db.transaction(async (tx) => { ... })
```

Riferimento: `src/lib/actions/locations.ts` (upsertLocationBusinessHours) — stessa strategia.

### Project Structure Notes

**File nuovi da creare:**
- `src/lib/validations/breeds.ts`
- `src/lib/queries/breeds.ts`
- `src/lib/actions/breeds.ts`
- `src/app/(auth)/breeds/page.tsx`
- `src/components/breed/BreedList.tsx`
- `src/components/breed/BreedForm.tsx`
- `src/components/service/ServiceBreedPricesSection.tsx`

**File da modificare:**
- `src/lib/db/schema.ts` — aggiungere `breeds`, `serviceBreedPrices`; aggiungere `uniqueIndex` agli import
- `src/lib/queries/services.ts` — aggiungere `getServiceWithBreedPrices`
- `src/lib/actions/services.ts` — aggiungere `upsertServiceBreedPrices`
- `src/components/service/ServiceForm.tsx` — aggiungere sezione `ServiceBreedPricesSection` in modalità edit
- `src/components/layout/Sidebar.tsx` — aggiungere voce "Razze" per admin
- `src/components/layout/BottomBar.tsx` — aggiungere voce "Razze" per admin (se necessario)

**File che NON devono essere modificati in questa story:**
- `src/lib/db/schema.ts` colonna `dogs.breedId` — verrà aggiunta in Story 3.3
- Qualsiasi file di AppointmentForm — la logica prezzo per razza verrà in Story 4.5
- `src/components/dog/DogForm.tsx` — il Combobox razza verrà in Story 3.3

### Dipendenze inter-story

```
Story 2.6 (questa) — crea breeds + service_breed_prices
    └── Story 3.3 — usa breeds per Combobox su DogForm + aggiunge dogs.breedId FK
            └── Story 4.5 — usa breedId del cane + service_breed_prices per prezzo appuntamento
```

### Riferimenti pattern esistenti

- Server action con `authActionClient` e checkRole: `src/lib/actions/staff.ts`
- Replace strategy delete + insert (neon-http): `src/lib/actions/locations.ts` (upsertLocationBusinessHours)
- Sheet/Dialog responsive con `useIsMobile()`: `src/components/service/ServiceForm.tsx` (pattern identico)
- Toast: `import { toast } from 'sonner'` — `toast.success("Razza creata")`
- Prezzi in centesimi: `src/components/service/ServiceForm.tsx:121-125` (setValueAs con Math.round * 100)
- AlertDialog per eliminazione: vedere implementazioni esistenti in StaffList o altri componenti admin
- `router.refresh()` dopo mutazione in Server Component: vedere `src/components/staff/StaffList.tsx` o `src/components/service/ServiceList.tsx`
- TanStack Query key pattern: `['breeds', 'list', tenantId]`, `['breeds', 'withPrices', breedId]`, `['serviceBreedPrices', serviceId]`

### References

- Sprint Change Proposal razze: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-26-gestione-razze.md`
- Schema DB breeds/serviceBreedPrices: `_bmad-output/planning-artifacts/architecture.md#CC-2026-04-26b`
- Pattern replace neon-http: `src/lib/actions/locations.ts` (upsertLocationBusinessHours) — confermato in Story 2.5 Completion Notes
- Pattern ServiceForm Sheet/Dialog: `src/components/service/ServiceForm.tsx`
- Pattern prezzi centesimi: `src/components/service/ServiceForm.tsx:121-125`
- Schema Drizzle attuale: `src/lib/db/schema.ts` — conferma che `breeds` e `serviceBreedPrices` non esistono ancora

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
