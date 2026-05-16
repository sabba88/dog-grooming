# Story 2.8: Configurazione Tabelle di Maggiorazione Pelo/Taglia

Status: review

## Story

As a **Amministratore**,
I want **configurare le percentuali di maggiorazione per ogni tipo di pelo e taglia**,
so that **il sistema possa pre-calcolare automaticamente la matrice prezzi di ogni servizio a partire dal prezzo base**.

## Acceptance Criteria

1. **Given** un Amministratore accede alla sezione Impostazioni → Tabelle di Maggiorazione  
   **When** la pagina viene renderizzata  
   **Then** vede due tabelle: "Maggiorazioni Pelo" e "Maggiorazioni Taglia"  
   **And** i valori di default sono già pre-caricati (seed da Story 2.7):  
   - Pelo: Corto +0%, Medio +20%, Lungo +20%  
   - Taglia: Toy +0%, Piccola +0%, Media +20%, Grande +40%, Gigante +60%

2. **Given** un Amministratore modifica una o più percentuali e salva  
   **When** clicca "Salva"  
   **Then** il valore viene aggiornato in `pricing_surcharges` (upsert su unique constraint)  
   **And** mostra un toast "Tabelle aggiornate"  
   **And** le successive chiamate a "Ricalcola da maggiorazioni" (Story 2.1) usano i nuovi valori

3. **Given** un Amministratore inserisce una percentuale non valida (negativa o > 500%)  
   **When** il form viene validato  
   **Then** il sistema mostra errore di validazione inline "La maggiorazione deve essere tra 0% e 500%"  
   **And** il pulsante "Salva" rimane disabilitato finché i valori non sono validi

4. **Given** un Collaboratore tenta di accedere alla pagina Tabelle Maggiorazione  
   **When** il sistema verifica il ruolo  
   **Then** l'accesso viene negato (redirect a `/agenda`)

5. **Given** la pagina Impostazioni viene visualizzata da un Amministratore  
   **When** la pagina viene renderizzata  
   **Then** è visibile un terzo link "Tabelle Maggiorazione" nella griglia navigazione Impostazioni

## Tasks / Subtasks

- [x] Task 1 — Creare `src/lib/queries/settings.ts` (AC: 1)
  - [x] 1.1 Importare `pricingSurcharges` da `@/lib/db/schema` e db da `@/lib/db`
  - [x] 1.2 Implementare `getPricingSurcharges(tenantId: string)` — query Drizzle `SELECT * FROM pricing_surcharges WHERE tenant_id = ?` ordinata per dimension, value_key

- [x] Task 2 — Creare `src/lib/validations/settings.ts` (AC: 3)
  - [x] 2.1 Definire `surchargeEntrySchema`: oggetto con `{ dimension: z.enum(['coat', 'size']), valueKey: z.string(), surchargePercent: z.number().int().min(0, 'La maggiorazione deve essere tra 0% e 500%').max(500, 'La maggiorazione deve essere tra 0% e 500%') }`
  - [x] 2.2 Definire `updatePricingSurchargesSchema`: `z.object({ surcharges: z.array(surchargeEntrySchema) })`

- [x] Task 3 — Creare `src/lib/actions/settings.ts` (AC: 2, 4)
  - [x] 3.1 Importare `authActionClient` da `@/lib/actions/client`, schema e db (pattern effettivo: `authActionClient` con `if (ctx.role !== 'admin') throw new Error('Non autorizzato')` e `ctx.tenantId` diretto)
  - [x] 3.2 Implementare `updatePricingSurcharges` con pattern next-safe-action:
    - `if (ctx.role !== 'admin') throw new Error('Non autorizzato')`
    - Estrarre `tenantId` da `ctx.tenantId`
    - Per ogni entry: upsert in `pricing_surcharges` su conflitto `(tenant_id, dimension, value_key)` → aggiorna `surcharge_percent` e `updated_at`

- [x] Task 4 — Creare `src/components/settings/PricingSurchargesEditor.tsx` (AC: 1, 2, 3)
  - [x] 4.1 Componente client (`'use client'`) con React Hook Form + schema Zod flat (8 campi: `coat_short`, `coat_medium`, etc. con `valueAsNumber: true`)
  - [x] 4.2 Costruire form a partire da `initialSurcharges: PricingSurcharge[]` (prop dal Server Component)
  - [x] 4.3 Renderizzare tabella "Maggiorazioni Pelo" con 3 righe (Corto / Medio / Lungo) — input numerico per ogni riga
  - [x] 4.4 Renderizzare tabella "Maggiorazioni Taglia" con 5 righe (Toy / Piccola / Media / Grande / Gigante) — input numerico per ogni riga
  - [x] 4.5 Aggiungere simbolo "%" affiancato a ogni input, etichette in italiano (usare `COAT_LABELS`, `SIZE_LABELS` da `@/lib/types`)
  - [x] 4.6 Pulsante "Salva" con stato `isPending` durante la mutation (disabilitato + spinner)
  - [x] 4.7 Al submit: chiamare `updatePricingSurcharges({ surcharges: [...] })` e mostrare toast "Tabelle aggiornate" (Sonner) in caso di successo, messaggio di errore in caso di fallimento

- [x] Task 5 — Creare `src/app/(auth)/settings/surcharges/page.tsx` (AC: 1, 4)
  - [x] 5.1 Server Component con `checkPermission('manageServices')` — redirect a `/agenda` se non admin. Nota: `/settings/surcharges` è già coperta dal middleware admin-only via prefix match `pathname.startsWith('/settings/')` in `adminOnlyRoutes`
  - [x] 5.2 Caricare dati con `getPricingSurcharges(session.user.tenantId)`
  - [x] 5.3 Gestire caso in cui `surcharges` sia vuoto (non dovrebbe accadere dopo seed 2.7, ma renderizzare comunque il form con valori a 0)
  - [x] 5.4 Passare `surcharges` come prop a `PricingSurchargesEditor`

- [x] Task 6 — Aggiornare `src/app/(auth)/settings/page.tsx` (AC: 5)
  - [x] 6.1 Aggiungere `Percent` all'import da lucide-react (riga 4 attuale: `import { Users, MapPin } from 'lucide-react'` → `import { Users, MapPin, Percent } from 'lucide-react'`)
  - [x] 6.2 Aggiungere terzo `<Link>` nella `<nav>` dopo il link "Gestione Sedi":
    ```tsx
    <Link
      href="/settings/surcharges"
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <Percent className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">Tabelle Maggiorazione</p>
        <p className="text-sm text-muted-foreground">Configura % maggiorazione per pelo e taglia</p>
      </div>
    </Link>
    ```

## Dev Notes

### Schema database — `pricing_surcharges` (già presente da Story 2.7)

```typescript
// src/lib/db/schema.ts — già esistente, NON modificare
export const pricingSurcharges = pgTable('pricing_surcharges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dimension: text('dimension').notNull(),      // 'coat' | 'size'
  valueKey: text('value_key').notNull(),        // 'short'|'medium'|'long' | 'toy'|'small'|'medium'|'large'|'giant'
  surchargePercent: integer('surcharge_percent').notNull().default(0), // 20 = +20%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_surcharge_key').on(t.tenantId, t.dimension, t.valueKey)]
)
```

### Tipi TypeScript — già presenti in `src/lib/types/index.ts` (da Story 2.7)

```typescript
export const COAT_TYPES = ['short', 'medium', 'long'] as const
export type CoatType = typeof COAT_TYPES[number]

export const SIZE_TYPES = ['toy', 'small', 'medium', 'large', 'giant'] as const
export type SizeType = typeof SIZE_TYPES[number]

export const COAT_LABELS: Record<CoatType, string> = {
  short: 'Corto', medium: 'Medio', long: 'Lungo',
}
export const SIZE_LABELS: Record<SizeType, string> = {
  toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante',
}
```

**NON ridefinire questi tipi** — importarli da `@/lib/types`.

### Pattern obbligatorio — Server Actions (next-safe-action)

```typescript
// src/lib/actions/settings.ts
'use server'
import { actionClient } from '@/lib/actions/client'
import { checkRole } from '@/lib/auth/permissions'
import { updatePricingSurchargesSchema } from '@/lib/validations/settings'
import { db } from '@/lib/db'
import { pricingSurcharges } from '@/lib/db/schema'

export const updatePricingSurcharges = actionClient
  .schema(updatePricingSurchargesSchema)
  .action(async ({ parsedInput, ctx }) => {
    checkRole(ctx.session, ['admin'])
    const tenantId = ctx.session.user.tenantId
    // upsert per ogni entry
    for (const entry of parsedInput.surcharges) {
      await db
        .insert(pricingSurcharges)
        .values({ tenantId, dimension: entry.dimension, valueKey: entry.valueKey, surchargePercent: entry.surchargePercent })
        .onConflictDoUpdate({
          target: [pricingSurcharges.tenantId, pricingSurcharges.dimension, pricingSurcharges.valueKey],
          set: { surchargePercent: entry.surchargePercent, updatedAt: new Date() },
        })
    }
    return { success: true }
  })
```

### Query — `getPricingSurcharges`

```typescript
// src/lib/queries/settings.ts
import { db } from '@/lib/db'
import { pricingSurcharges } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getPricingSurcharges(tenantId: string) {
  return db
    .select()
    .from(pricingSurcharges)
    .where(eq(pricingSurcharges.tenantId, tenantId))
    .orderBy(pricingSurcharges.dimension, pricingSurcharges.valueKey)
}
```

### Pattern form — `PricingSurchargesEditor`

Il form deve costruire l'array di `surcharges` nell'ordine fisso: prima tutti i `coat` (short, medium, long), poi tutti i `size` (toy, small, medium, large, giant). React Hook Form gestisce un array di field con `useFieldArray` oppure più semplice con `register('surcharges.0.surchargePercent')` per ogni posizione fissa.

Approccio consigliato: non usare `useFieldArray` dinamico — le 8 righe sono fisse e note. Usare 8 field separati (`coat_short`, `coat_medium`, etc.) e ricostruire l'array al submit.

### Dove inserire la route Impostazioni

La route `/settings/surcharges` deve seguire lo stesso pattern delle route esistenti in `(auth)/settings/`:
- Protezione con `checkPermission('manageServices')` — permesso semanticamente corretto per configurazione pricing (come `settings/locations` usa `manageLocations`)
- Il middleware in `src/lib/auth/permissions.ts` → `adminOnlyRoutes` copre già `/settings/surcharges` via `pathname.startsWith('/settings/')`, quindi nessuna modifica al middleware necessaria
- Nessun layout dedicato aggiuntivo (eredita il layout `(auth)`)

### Logica di calcolo — come viene usata da Story 2.1

Questa story fornisce il dato di input per il pulsante "Ricalcola da maggiorazioni" della Story 2.1. Il calcolo è:
```
prezzoMatrice(coatType, sizeType) = prezzoBase × (1 + coat_surcharge/100 + size_surcharge/100)
```
I valori `coat_surcharge` e `size_surcharge` vengono letti da `pricing_surcharges` per il tenant corrente. Questa story implementa solo la configurazione — il calcolo effettivo è in Story 2.1.

### Note da Story 2.7 (precedente)

- La tabella `pricing_surcharges` esiste già nel DB con le 8 righe di default per il tenant di sviluppo (seed applicato in Task 4 della Story 2.7).
- In dev: le 8 righe sono già presenti. In produzione o con un nuovo tenant, il seed **non** viene applicato automaticamente — la Story 2.7 lo ha fatto manualmente via script. L'AC 5 degli epics menziona "primo accesso tenant → pre-popolamento" ma questo riguarda l'onboarding flow (fuori scope di questa story). Per questa story è sufficiente che la UI mostri i dati esistenti e li aggiorni.
- Nessuna migrazione DB richiesta — lo schema è già in place.

### Project Structure Notes

Allineamento con la struttura progetto:

```
src/
  app/(auth)/settings/
    page.tsx                     ← MODIFICARE: aggiungere link Tabelle Maggiorazione
    surcharges/
      page.tsx                   ← NUOVO: Server Component carica dati + renderizza editor
  components/settings/
    PricingSurchargesEditor.tsx  ← NUOVO: Client Component form due tabelle
  lib/
    actions/settings.ts          ← NUOVO: updatePricingSurcharges (next-safe-action)
    queries/settings.ts          ← NUOVO: getPricingSurcharges
    validations/settings.ts      ← NUOVO: updatePricingSurchargesSchema
```

La directory `src/components/settings/` non esiste ancora — crearla.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Note schema CC-2026-05-16 - pricingSurcharges]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns - Server Actions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Nuovi file settings.ts]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-05-16-listini-pelo-taglia.md#NUOVA STORY E]
- [Source: _bmad-output/implementation-artifacts/2-7-db-migration-pelo-taglia.md#Task 4 seed pricing_surcharges]
- [Source: src/lib/db/schema.ts#pricingSurcharges]
- [Source: src/lib/types/index.ts#COAT_TYPES, SIZE_TYPES]
- [Source: src/app/(auth)/settings/page.tsx] — struttura attuale settings nav

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `z.coerce.number()` con zodResolver causava errore TypeScript (resolver type mismatch). Risolto usando `z.number()` + `{ valueAsNumber: true }` nel `register()` di React Hook Form.
- Pattern `actionClient` + `checkRole` non usato: il codebase usa `authActionClient` che già inietta `ctx.role` e `ctx.tenantId`. Adattato di conseguenza.

### Completion Notes List

- Task 1: `src/lib/queries/settings.ts` creato — `getPricingSurcharges(tenantId)` con `asc()` su dimension e value_key.
- Task 2: `src/lib/validations/settings.ts` creato — `surchargeEntrySchema` + `updatePricingSurchargesSchema`.
- Task 3: `src/lib/actions/settings.ts` creato — `updatePricingSurcharges` con `authActionClient`, role check, upsert loop.
- Task 4: `src/components/settings/PricingSurchargesEditor.tsx` creato — 2 tabelle (Pelo 3 righe, Taglia 5 righe), React Hook Form flat schema, `valueAsNumber`, submit → reconstruct array → server action, toast Sonner.
- Task 5: `src/app/(auth)/settings/surcharges/page.tsx` creato — Server Component, `checkPermission('manageServices')`, carica surcharges dal DB, fallback a 0 se vuoto.
- Task 6: `src/app/(auth)/settings/page.tsx` aggiornato — aggiunto `Percent` import e terzo Link "Tabelle Maggiorazione".
- `npx tsc --noEmit`: 0 errori. `npm run build`: build passed, `/settings/surcharges` presente nella route list.

### File List

- src/lib/queries/settings.ts (nuovo)
- src/lib/validations/settings.ts (nuovo)
- src/lib/actions/settings.ts (nuovo)
- src/components/settings/PricingSurchargesEditor.tsx (nuovo)
- src/app/(auth)/settings/surcharges/page.tsx (nuovo)
- src/app/(auth)/settings/page.tsx (modificato)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modificato)
- _bmad-output/implementation-artifacts/2-8-configurazione-tabelle-maggiorazione.md (modificato)
