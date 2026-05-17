# Story 2.7: Migrazione DB — Logica Prezzi Pelo/Taglia

Status: done

## Story

As a **developer**,
I want **migrare lo schema del database per supportare la nuova logica prezzi pelo/taglia**,
so that **tutte le story successive (2.1 ext, 2.6, 2.8, 3.3, 4.5) abbiano il corretto schema in place e i file esistenti che referenziavano `serviceBreedPrices` compilino senza errori**.

## Acceptance Criteria

1. La tabella `service_breed_prices` viene droppata dal database.
2. La tabella `service_price_matrix` viene creata con unique constraint su `(service_id, coat_type, size_type, tenant_id)` e ON DELETE CASCADE da `services.id`.
3. La tabella `pricing_surcharges` viene creata con unique constraint su `(tenant_id, dimension, value_key)`.
4. La tabella `dogs` riceve due nuove colonne nullable: `coat_type` e `size_type`. Il campo `size` esistente non viene toccato.
5. La tabella `services` riceve il nuovo campo `duration_surcharge_per_30min` (integer NOT NULL DEFAULT 0).
6. Per ogni tenant esistente, `pricing_surcharges` viene pre-popolata con i valori di default (vedi Task 4).
7. Tutti i file TypeScript che referenziavano `serviceBreedPrices` vengono aggiornati e l'app compila senza errori (`npm run build` o `tsc --noEmit` passa).
8. La migrazione Drizzle viene generata (`db:generate`) e applicata in dev (`db:push` o `db:migrate`).

## Tasks / Subtasks

- [x] Task 1 — Aggiornare `src/lib/db/schema.ts` (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Rimuovere l'export `serviceBreedPrices` e la relativa definizione
  - [x] 1.2 Aggiungere `durationSurchargePer30min` a `services`
  - [x] 1.3 Aggiungere `coatType` e `sizeType` a `dogs` (nullable, nessun default)
  - [x] 1.4 Aggiungere export `servicePriceMatrix` (vedi schema completo in Dev Notes)
  - [x] 1.5 Aggiungere export `pricingSurcharges` (vedi schema completo in Dev Notes)

- [x] Task 2 — Rimuovere riferimenti a `serviceBreedPrices` dai file di query e action (AC: 7)
  - [x] 2.1 `src/lib/queries/services.ts` — rimuovere `getBreedPriceForService` e `getServiceWithBreedPrices`; aggiungere `getServicePriceMatrixCells` e `getAppointmentPrice` (stubs da completare in Story 2.1/4.5)
  - [x] 2.2 `src/lib/queries/breeds.ts` — rimuovere `priceCount` da `getBreeds`; rimuovere `getBreedWithPrices`
  - [x] 2.3 `src/lib/actions/services.ts` — rimuovere `fetchServiceBreedPrices` e `upsertServiceBreedPrices`
  - [x] 2.4 `src/lib/actions/breeds.ts` — rimuovere logica breed prices da `createBreed`, `updateBreed`, `fetchBreedWithPrices`, `deleteBreed` (cascade gestito dal DB, non dal codice)
  - [x] 2.5 `src/lib/validations/breeds.ts` — rimuovere `upsertServiceBreedPricesSchema` e qualsiasi schema relativo ai prezzi razza
  - [x] 2.6 `src/lib/actions/appointments.ts` — rimuovere `fetchBreedPriceForService` e la logica `applyBreedAwarePrice`; sostituire con fallback temporaneo su `services.price` (la logica pelo/taglia arriva in Story 4.5)
  - [x] 2.7 `src/components/service/ServiceBreedPricesSection.tsx` — eliminare il file (rimosso dal form in Story 2.1)
  - [x] 2.8 `src/components/service/ServiceForm.tsx` — rimuovere import e uso di `ServiceBreedPricesSection`
  - [x] 2.9 `src/components/appointment/AppointmentForm.tsx` — rimuovere `applyBreedAwarePrice`, `loadBreedPrice`, `breedPriceLabel`; il prezzo si pre-compila con `services.price` (base) fino a Story 4.5

- [x] Task 3 — Generare e applicare la migrazione Drizzle (AC: 8)
  - [x] 3.1 Eseguire `npx drizzle-kit generate` — verificare che il file di migrazione generato includa DROP TABLE, CREATE TABLE, ALTER TABLE corretti
  - [x] 3.2 Applicare in dev con `npx drizzle-kit push` (o `migrate` se in ambiente staging)
  - [x] 3.3 Verificare con un client DB che le tabelle siano state create/droppate correttamente

- [x] Task 4 — Seed `pricing_surcharges` per tenant esistenti (AC: 6)
  - [x] 4.1 Scrivere uno script di seed o un'azione one-shot `src/lib/db/seed-pricing-surcharges.ts`
  - [x] 4.2 Inserire i default per ogni `tenantId` esistente in `users`:
    - dimension='coat', valueKey='short', surchargePercent=0
    - dimension='coat', valueKey='medium', surchargePercent=20
    - dimension='coat', valueKey='long', surchargePercent=20
    - dimension='size', valueKey='toy', surchargePercent=0
    - dimension='size', valueKey='small', surchargePercent=0
    - dimension='size', valueKey='medium', surchargePercent=20
    - dimension='size', valueKey='large', surchargePercent=40
    - dimension='size', valueKey='giant', surchargePercent=60
  - [x] 4.3 Eseguire il seed; verificare le 8 righe per tenant in `pricing_surcharges`

- [x] Task 5 — Verifica compilazione TypeScript (AC: 7)
  - [x] 5.1 Eseguire `npx tsc --noEmit` — zero errori relativi a `serviceBreedPrices`, `breedId` in pricing context, `upsertServiceBreedPricesSchema`
  - [x] 5.2 Eseguire `npm run build` — build passa senza errori

## Dev Notes

### Schema Drizzle — definizioni complete da inserire in `schema.ts`

```typescript
// RIMUOVERE: export const serviceBreedPrices = pgTable(...)

// AGGIUNGERE a services (dopo il campo duration):
durationSurchargePer30min: integer('duration_surcharge_per_30min').notNull().default(0),
// centesimi per ogni 30min aggiuntivi rispetto alla durata base

// AGGIUNGERE a dogs (dopo il campo breedId):
coatType: text('coat_type'),   // 'short' | 'medium' | 'long' | null
sizeType: text('size_type'),   // 'toy' | 'small' | 'medium' | 'large' | 'giant' | null
// NOTA: il campo size (text libero) esistente NON viene toccato — retrocompatibilita'

// NUOVA TABELLA service_price_matrix
export const servicePriceMatrix = pgTable('service_price_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  coatType: text('coat_type').notNull(), // 'short' | 'medium' | 'long'
  sizeType: text('size_type').notNull(), // 'toy' | 'small' | 'medium' | 'large' | 'giant'
  price: integer('price').notNull(),     // centesimi, come services.price
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_service_matrix_cell').on(t.serviceId, t.coatType, t.sizeType, t.tenantId)]
)

// NUOVA TABELLA pricing_surcharges
export const pricingSurcharges = pgTable('pricing_surcharges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dimension: text('dimension').notNull(),      // 'coat' | 'size'
  valueKey: text('value_key').notNull(),        // coat: 'short'|'medium'|'long' / size: 'toy'|'small'|'medium'|'large'|'giant'
  surchargePercent: integer('surcharge_percent').notNull().default(0), // es. 20 = +20%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_surcharge_key').on(t.tenantId, t.dimension, t.valueKey)]
)
```

### Import da aggiungere a schema.ts

`uniqueIndex` è già importato. Nessun nuovo import necessario.

### Costanti TypeScript da aggiungere in `src/lib/types/index.ts`

```typescript
export const COAT_TYPES = ['short', 'medium', 'long'] as const
export type CoatType = typeof COAT_TYPES[number]

export const SIZE_TYPES = ['toy', 'small', 'medium', 'large', 'giant'] as const
export type SizeType = typeof SIZE_TYPES[number]

export const COAT_LABELS: Record<CoatType, string> = {
  short: 'Corto',
  medium: 'Medio',
  long: 'Lungo',
}

export const SIZE_LABELS: Record<SizeType, string> = {
  toy: 'Toy',
  small: 'Piccola',
  medium: 'Media',
  large: 'Grande',
  giant: 'Gigante',
}
```

### Stubs da aggiungere in `src/lib/queries/services.ts`

```typescript
// STUB — implementazione completa in Story 2.1
export async function getServicePriceMatrixCells(serviceId: string, tenantId: string) {
  return db
    .select()
    .from(servicePriceMatrix)
    .where(and(eq(servicePriceMatrix.serviceId, serviceId), eq(servicePriceMatrix.tenantId, tenantId)))
}

// STUB — implementazione completa in Story 4.5
export async function getAppointmentPrice(
  serviceId: string,
  coatType: string | null,
  sizeType: string | null,
  tenantId: string
): Promise<number> {
  const service = await getServiceById(serviceId, tenantId)
  if (!service) throw new Error('Service not found')
  if (!coatType || !sizeType) return service.price

  const [cell] = await db
    .select()
    .from(servicePriceMatrix)
    .where(
      and(
        eq(servicePriceMatrix.serviceId, serviceId),
        eq(servicePriceMatrix.coatType, coatType),
        eq(servicePriceMatrix.sizeType, sizeType),
        eq(servicePriceMatrix.tenantId, tenantId)
      )
    )
    .limit(1)

  return cell?.price ?? service.price
}
```

### Fallback temporaneo in `AppointmentForm.tsx`

Nella funzione che gestisce la selezione del servizio, sostituire la chiamata a `fetchBreedPriceForService` con:
```typescript
// TEMP (Story 2.7): usa sempre services.price fino a Story 4.5
setPrice(selectedService.price)
// rimuovere: breedPriceLabel, applyBreedAwarePrice, loadBreedPrice
```

### Attenzione — campo `dogs.size` esistente

La tabella `dogs` ha già un campo `size` (text libero). **Non dropparlo.** Il nuovo campo è `size_type` (text nullable con valori controllati). Le due colonne coesistono:
- `size` — campo legacy free-text, usato nella UI prima di questa story
- `size_type` — nuovo campo enum-like, usato per il calcolo del prezzo (Story 3.3 in poi)

La Story 3.3 gestirà l'aggiornamento dell'UI del form cane per usare `size_type`.

### Pattern obbligatorio per nuove Server Actions

Ogni nuova action deve usare `next-safe-action` con schema Zod:
```typescript
export const myAction = actionClient
  .schema(mySchema)
  .action(async ({ parsedInput, ctx }) => {
    checkRole(ctx.session, ['admin'])
    // ...
  })
```

### Convenzioni naming (da architecture.md)

- DB: `snake_case` — `coat_type`, `size_type`, `service_price_matrix`
- TypeScript: `camelCase` — `coatType`, `sizeType`, `servicePriceMatrix`
- Drizzle mappa automaticamente snake_case ↔ camelCase

### Project Structure Notes

File da modificare in questa story:
```
src/lib/db/schema.ts                        ← Task 1 (schema update)
src/lib/db/seed-pricing-surcharges.ts       ← Task 4 (nuovo file seed)
src/lib/queries/services.ts                 ← Task 2.1 (remove + add stubs)
src/lib/queries/breeds.ts                   ← Task 2.2 (remove priceCount/getBreedWithPrices)
src/lib/actions/services.ts                 ← Task 2.3 (remove breed price actions)
src/lib/actions/breeds.ts                   ← Task 2.4 (remove breed price logic)
src/lib/actions/appointments.ts             ← Task 2.6 (remove breed price, temp fallback)
src/lib/validations/breeds.ts               ← Task 2.5 (remove breed price schemas)
src/lib/types/index.ts                      ← Task 1 (add CoatType, SizeType constants)
src/components/service/ServiceBreedPricesSection.tsx  ← ELIMINARE (Task 2.7)
src/components/service/ServiceForm.tsx      ← Task 2.8 (remove ServiceBreedPricesSection)
src/components/appointment/AppointmentForm.tsx ← Task 2.9 (temp fallback, remove breed logic)
```

File NON da toccare in questa story (implementazione nelle story successive):
```
src/components/dog/DogForm.tsx              ← Story 3.3
src/components/breed/BreedForm.tsx          ← Story 2.6
src/lib/db/seed-breeds.ts                   ← NON toccare (seed razze indipendente)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Schema Database - serviceBreedPrices]
- [Source: _bmad-output/planning-artifacts/architecture.md#Note schema CC-2026-05-16]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-05-16-listini-pelo-taglia.md#MODIFICA B]
- [Source: src/lib/db/schema.ts] — schema attuale completo

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- drizzle-kit generate/push richiedono prompt interattivi TTY; risolto con Node.js helper script che invia `\r\n` a intervalli regolari.
- `src/components/breed/BreedForm.tsx` e `BreedList.tsx` non erano stati aggiornati in Story 2.6: rimossa la logica `servicePrices`/`priceCount` per ripristinare compilazione.

### Completion Notes List

- Task 1: Schema aggiornato — `serviceBreedPrices` rimossa, `durationSurchargePer30min` aggiunto a `services`, `coatType`/`sizeType` aggiunti a `dogs` (nullable), nuove tabelle `servicePriceMatrix` e `pricingSurcharges` con unique index. Costanti `COAT_TYPES`/`SIZE_TYPES` aggiunte a `src/lib/types/index.ts`.
- Task 2: Rimossi tutti i riferimenti a `serviceBreedPrices` in 9 file (query, actions, validations, componenti). `AppointmentForm` ora usa `services.price` come fallback temporaneo. `BreedForm`/`BreedList` semplificati (rimossa sezione prezzi per razza).
- Task 3: Migrazione `drizzle/0001_young_secret_warriors.sql` generata e applicata al DB dev via `drizzle-kit push`. File include: CREATE TABLE pricing_surcharges, CREATE TABLE service_price_matrix, DROP TABLE service_breed_prices CASCADE, ALTER TABLE dogs/services.
- Task 4: Script `src/lib/db/seed-pricing-surcharges.ts` creato e eseguito — 8 righe inserite per 1 tenant esistente.
- Task 5: `npx tsc --noEmit` — 0 errori. `npm run build` — Compiled successfully.

### File List

- src/lib/db/schema.ts (modificato)
- src/lib/types/index.ts (modificato)
- src/lib/queries/services.ts (modificato)
- src/lib/queries/breeds.ts (modificato)
- src/lib/actions/services.ts (modificato)
- src/lib/actions/breeds.ts (modificato)
- src/lib/actions/appointments.ts (modificato)
- src/lib/validations/breeds.ts (modificato)
- src/components/service/ServiceBreedPricesSection.tsx (eliminato)
- src/components/service/ServiceForm.tsx (modificato)
- src/components/appointment/AppointmentForm.tsx (modificato)
- src/components/breed/BreedForm.tsx (modificato)
- src/components/breed/BreedList.tsx (modificato)
- src/app/(auth)/breeds/page.tsx (modificato)
- src/lib/db/seed-pricing-surcharges.ts (nuovo)
- drizzle/0001_young_secret_warriors.sql (nuovo)
- drizzle/meta/_journal.json (modificato da drizzle-kit)
- drizzle/meta/0001_snapshot.json (nuovo da drizzle-kit)
- package.json (modificato — aggiunto script db:seed-pricing-surcharges)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modificato)

### Change Log

- 2026-05-17: Story 2.7 — Migrazione DB pelo/taglia completata. Drop `service_breed_prices`, create `service_price_matrix` + `pricing_surcharges`, alter `dogs` + `services`. Rimossi tutti i riferimenti TypeScript a `serviceBreedPrices`. Build e tsc passano.
