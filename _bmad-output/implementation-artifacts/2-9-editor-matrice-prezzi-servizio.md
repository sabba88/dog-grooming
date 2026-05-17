# Story 2.9: Editor Matrice Prezzi per Servizio

Status: review

<!-- CC-2026-05-17: Nuova story — estensione story 2.1 prevista dal change proposal CC-2026-05-16 ma mai tradotta in task. Aggiunge campo durationSurchargePer30min e editor matrice 3×5 pelo×taglia al ServiceForm. Dipende da: Story 2.7 (schema DB — DONE), Story 2.8 (tabelle maggiorazione — review). -->

## Story

As a **Amministratore**,
I want **configurare per ogni servizio il prezzo differenziato per ogni combinazione pelo/taglia (matrice 3×5) e la maggiorazione per durata aggiuntiva**,
so that **il sistema possa pre-compilare automaticamente il prezzo corretto nel form appuntamento in base alle caratteristiche fisiche del cane**.

## Acceptance Criteria

1. **Given** un Amministratore apre il form di creazione di un nuovo servizio
   **When** il form viene renderizzato
   **Then** compare il campo "Maggiorazione 30min (EUR)" (default 0)
   **And** compare la sezione "Prezzi per Pelo/Taglia" con una griglia 3×5 (3 tipi pelo × 5 taglie) — tutti i campi a 0 di default
   **And** ogni cella mostra un input numerico EUR con la combinazione pelo+taglia come label

2. **Given** un Amministratore apre il form di modifica di un servizio esistente
   **When** il form viene renderizzato
   **Then** il campo "Maggiorazione 30min (EUR)" è pre-compilato con il valore attuale (centesimi→EUR)
   **And** la griglia mostra i prezzi già configurati in `service_price_matrix` per quel servizio
   **And** le celle non presenti in matrice mostrano 0

3. **Given** un Amministratore compila il form e salva un servizio (nuovo o modifica)
   **When** il submit viene eseguito
   **Then** `services.duration_surcharge_per_30min` viene salvato in centesimi
   **And** nella tabella `service_price_matrix`: le celle con prezzo > 0 vengono salvate (upsert), le celle con prezzo = 0 vengono eliminate (se esistevano)
   **And** mostra il toast "Servizio creato" o "Servizio aggiornato"

4. **Given** una cella della matrice viene lasciata a 0 (o non configurata)
   **When** il prezzo appuntamento viene calcolato (Story 4.5)
   **Then** il sistema usa il prezzo base del servizio come fallback (comportamento esistente in `getAppointmentPrice`)

5. **Given** un Amministratore inserisce una maggiorazione negativa o un prezzo matrice negativo
   **When** il form viene validato
   **Then** il sistema mostra errori di validazione inline in italiano

6. **Given** un Collaboratore accede alla pagina Servizi
   **When** la pagina viene renderizzata
   **Then** la lista mostra anche il valore "Maggiorazione 30min" se > 0 (badge o testo secondario)
   **And** il form di modifica non è accessibile (comportamento esistente)

## Tasks / Subtasks

- [x] Task 1: Aggiornare `src/lib/validations/services.ts` (AC: #1, #3, #5)
  - [x] 1.1 Aggiungere `durationSurchargePer30min` (integer ≥ 0, in centesimi) a `createServiceSchema` e `updateServiceSchema`
  - [x] 1.2 Aggiungere `servicePriceMatrixCellSchema` e tipo inferito `ServicePriceMatrixCell`
  - [x] 1.3 Aggiornare i tipi inferiti `CreateServiceFormData`, `UpdateServiceFormData` con i nuovi campi

- [x] Task 2: Aggiornare `src/lib/queries/services.ts` (AC: #2, #4)
  - [x] 2.1 Rimosso commento `// STUB — implementazione completa in Story 2.1` da `getServicePriceMatrixCells`
  - [x] 2.2 Aggiunto `getServiceWithMatrix(serviceId, tenantId)` con Promise.all

- [x] Task 3: Aggiornare `src/lib/actions/services.ts` (AC: #3, #5)
  - [x] 3.1 Aggiunti import `servicePriceMatrix`, `getServicePriceMatrixCells`
  - [x] 3.2 `createService` aggiornato: inserisce celle con prezzo > 0 dopo il returning
  - [x] 3.3 `updateService` aggiornato: delete + re-insert celle non-zero
  - [x] 3.4 Aggiunta action `fetchServicePriceMatrix`

- [x] Task 4: Aggiornare `src/components/service/ServiceForm.tsx` — prop e stato (AC: #1, #2)
  - [x] 4.1 Interfaccia `ServiceFormProps.service` aggiornata con `durationSurchargePer30min`
  - [x] 4.2 Stato `matrixCells: Record<string, number>` aggiunto
  - [x] 4.3 `useEffect` carica celle tramite `fetchServicePriceMatrix` all'apertura in modifica
  - [x] 4.4 `defaultValues` aggiornati con `durationSurchargePer30min`
  - [x] 4.5 `onSubmit` costruisce e passa `matrixCells` all'action

- [x] Task 5: Aggiornare `src/components/service/ServiceForm.tsx` — UI matrice (AC: #1, #2, #5)
  - [x] 5.1 Import `COAT_TYPES, COAT_LABELS, SIZE_TYPES, SIZE_LABELS, CoatType, SizeType` da `@/lib/types`
  - [x] 5.2 Import `useAction`, `fetchServicePriceMatrix` da `@/lib/actions/services`
  - [x] 5.3 Campo "Maggiorazione 30min (EUR)" con `setValueAs` e nota descrittiva
  - [x] 5.4 Griglia 3×5 con intestazioni coat/size, input EUR per cella, nota fallback
  - [x] 5.5 `overflow-x-auto` sulla tabella per mobile

- [x] Task 6: Aggiornare `src/components/service/ServiceList.tsx` (AC: #6)
  - [x] 6.1 Interfaccia `Service` aggiornata con `durationSurchargePer30min: number`
  - [x] 6.2 Visualizzazione `+€X/30min` in tabella e card se surcharge > 0
  - [x] 6.3 `handleEdit` passa `durationSurchargePer30min` a `ServiceForm`

- [x] Task 7: `src/app/(auth)/services/page.tsx` — nessuna modifica necessaria (AC: #1, #2)
  - [x] 7.1 Verificato: `getServices()` restituisce già `durationSurchargePer30min` (Story 4.5). TypeScript passa senza errori.

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** usa `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** in OGNI query dal contesto sessione JWT (`ctx.tenantId`)
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- **Lingua UI:** Italiano (label, messaggi, toast). **Lingua codice:** Inglese
- **Prezzi:** centesimi nel DB, EUR nella UI (`(price / 100).toFixed(2)`, `Math.round(num * 100)` per conversione inversa)
- `checkRole` esplicito nelle actions di mutazione: `if (ctx.role !== 'admin') throw new Error('Non autorizzato')`

### Schema DB (già in produzione dopo Story 2.7)

```typescript
// services (campo già presente):
durationSurchargePer30min: integer('duration_surcharge_per_30min').notNull().default(0)

// service_price_matrix (tabella già presente):
export const servicePriceMatrix = pgTable('service_price_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  coatType: text('coat_type').notNull(),
  sizeType: text('size_type').notNull(),
  price: integer('price').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_service_matrix_cell').on(t.serviceId, t.coatType, t.sizeType, t.tenantId)]
)
```

**IMPORTANTE:** `service_price_matrix` ha un unique constraint su `(serviceId, coatType, sizeType, tenantId)`. La strategia scelta in Task 3.3 è delete + re-insert (non upsert per cella) — più semplice e atomico.

### Tipi da `@/lib/types`

```typescript
export const COAT_TYPES = ['short', 'medium', 'long'] as const
export type CoatType = typeof COAT_TYPES[number]
export const COAT_LABELS: Record<CoatType, string> = { short: 'Corto', medium: 'Medio', long: 'Lungo' }

export const SIZE_TYPES = ['toy', 'small', 'medium', 'large', 'giant'] as const
export type SizeType = typeof SIZE_TYPES[number]
export const SIZE_LABELS: Record<SizeType, string> = { toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante' }
```

Totale celle: 3 × 5 = 15. Le chiavi di `matrixCells` sono nel formato `"${coatType}_${sizeType}"` (es. `"short_toy"`, `"long_giant"`).

### Pattern Validazione Schema Zod — matrixCells

`matrixCells` è un array opzionale in `createServiceSchema` e `updateServiceSchema`. Viene costruito nel `onSubmit` del form da 15 campi separati e passato all'action. Il Dev Agent deve scegliere se gestire i 15 campi come campi separati nel form (più semplice con React Hook Form) o come array (più pulito).

**Approccio raccomandato:** gestire `matrixCells` come stato React separato (non come campo React Hook Form) — come fatto per `PricingSurchargesEditor` in Story 2.8. In `onSubmit`, leggere lo stato `matrixCells` e aggiungerlo manualmente al payload dell'action.

Alternativa: aggiungere `matrixCells` allo schema Zod come:
```typescript
matrixCells: z.array(z.object({
  coatType: z.string(),
  sizeType: z.string(),
  price: z.number().int().min(0),
})).optional()
```

### `getServicePriceMatrixCells` — Già Presente (Solo Togliere Commento STUB)

In `src/lib/queries/services.ts` esiste già:
```typescript
// STUB — implementazione completa in Story 2.1
export async function getServicePriceMatrixCells(serviceId: string, tenantId: string) {
  return db
    .select()
    .from(servicePriceMatrix)
    .where(and(eq(servicePriceMatrix.serviceId, serviceId), eq(servicePriceMatrix.tenantId, tenantId)))
}
```

Questa funzione è già completa — rimuovere solo il commento STUB.

### `getServices` — Già Restituisce `durationSurchargePer30min` (Story 4.5)

`getServices()` e `getServiceById()` in `src/lib/queries/services.ts` già includono `durationSurchargePer30min` nella select (aggiornato in Story 4.5). **NON modificare di nuovo.**

### Pattern `ServiceForm` — Stato Matrix Separato da React Hook Form

Il form usa `react-hook-form` per `name`, `price`, `duration`, `durationSurchargePer30min`. Le 15 celle della matrice vengono gestite con uno stato React separato `matrixCells: Record<string, number>` (centesimi) per semplicità. Il `useEffect` che carica le celle è attivato all'apertura del form (`open === true && isEditing`).

```typescript
// Stato celle matrice
const [matrixCells, setMatrixCells] = useState<Record<string, number>>({})

// Caricamento celle in modifica
useEffect(() => {
  if (open && isEditing && service?.id) {
    executeFetchMatrix({ serviceId: service.id })
  } else if (!open) {
    setMatrixCells({})  // reset alla chiusura
  }
}, [open, isEditing])

// Helper per aggiornare una cella
function setCellPrice(coatType: string, sizeType: string, eurValue: string) {
  const cents = Math.round((parseFloat(eurValue) || 0) * 100)
  setMatrixCells(prev => ({ ...prev, [`${coatType}_${sizeType}`]: cents }))
}

// In onSubmit:
const cells = COAT_TYPES.flatMap(coat =>
  SIZE_TYPES.map(size => ({
    coatType: coat,
    sizeType: size,
    price: matrixCells[`${coat}_${size}`] ?? 0,
  }))
)
// Passare `cells` all'action insieme agli altri campi
```

### Pattern `PricingSurchargesEditor` da Story 2.8 — Riferimento

Il componente `src/components/settings/PricingSurchargesEditor.tsx` usa un approccio simile con React Hook Form flat fields per la gestione di valori tabulari. Consultare per pattern di input numerici con label italiane e conversione percentuali.

### Comportamento Celle a 0 — Fallback a Prezzo Base

La funzione `getAppointmentPrice` in `src/lib/queries/services.ts` già gestisce il fallback:
```typescript
if (!coatType || !sizeType) return service.price
const [cell] = await db.select().from(servicePriceMatrix).where(...)
return cell?.price ?? service.price  // ← fallback se cella non esiste
```

Celle a 0 vengono eliminate dalla matrice (non inserite), quindi la query non le trova e usa `service.price`. **NON modificare `getAppointmentPrice`.**

### File da NON Toccare

| File | Motivo |
|------|--------|
| `src/lib/db/schema.ts` | Schema già completo dopo Story 2.7 |
| `src/lib/queries/dogs.ts` | Non coinvolto |
| `src/components/appointment/AppointmentForm.tsx` | Non coinvolto — usa già la logica corretta da Story 4.5 |
| `src/lib/actions/appointments.ts` | Non coinvolto |

### Testing

Nessun framework automatico. Verifica manuale — casi critici:

- **Creazione servizio con matrice:** compilare 5-6 celle con prezzi diversi, lasciare le altre a 0 → salvataggio corretto, solo celle > 0 in `service_price_matrix`
- **Modifica servizio:** aprire form di modifica → celle pre-compilate con valori salvati, celle non configurate a 0 → modificare alcuni valori → salvare → verificare aggiornamento corretto
- **Azzeramento cella:** avere cella con prezzo X → modificarla a 0 → salvare → cella eliminata dalla matrice
- **Maggiorazione 30min:** impostare €5,00 → salvare → `durationSurchargePer30min = 500` nel DB → ServiceList mostra "+€ 5,00/30min" → AppointmentForm usa il valore correttamente
- **Validazione:** prezzo negativo → errore inline
- **ServiceList:** servizio senza maggiorazione → nessun badge; servizio con maggiorazione > 0 → badge visibile

### Project Structure Notes

```
src/
  lib/
    validations/
      services.ts          # MODIFICARE: aggiungere durationSurchargePer30min + matrixCells
    actions/
      services.ts          # MODIFICARE: updateService + createService con matrice; aggiungere fetchServicePriceMatrix
    queries/
      services.ts          # MODIFICARE: rimuovere commento STUB; aggiungere getServiceWithMatrix
  components/
    service/
      ServiceForm.tsx      # MODIFICARE: campo surcharge + griglia matrice 3×5 + caricamento celle
      ServiceList.tsx      # MODIFICARE: interfaccia Service + visualizzazione surcharge
```

### References

- [Source: _bmad-output/implementation-artifacts/2-1-gestione-listino-servizi.md — pattern ServiceForm, ServiceList, validations, actions]
- [Source: _bmad-output/implementation-artifacts/2-7-db-migration-pelo-taglia.md — schema service_price_matrix, durationSurchargePer30min]
- [Source: _bmad-output/implementation-artifacts/2-8-configurazione-tabelle-maggiorazione.md — pattern PricingSurchargesEditor, upsert pricing_surcharges, React Hook Form flat fields]
- [Source: _bmad-output/implementation-artifacts/4-5-prezzo-appuntamento-per-pelo-taglia.md — getAppointmentPrice, comportamento fallback matrice]
- [Source: src/lib/db/schema.ts — servicePriceMatrix, services.durationSurchargePer30min]
- [Source: src/lib/queries/services.ts — getServicePriceMatrixCells (stub), getServices, getServiceById]
- [Source: src/lib/actions/services.ts — createService, updateService, deleteService]
- [Source: src/lib/validations/services.ts — createServiceSchema, updateServiceSchema]
- [Source: src/components/service/ServiceForm.tsx — struttura attuale, React Hook Form pattern]
- [Source: src/components/service/ServiceList.tsx — struttura attuale, interfaccia Service]
- [Source: src/lib/types/index.ts — COAT_TYPES, SIZE_TYPES, COAT_LABELS, SIZE_LABELS]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Nessun blocco critico. TypeScript compila senza errori.

### Completion Notes List

- Task 1: Schema Zod aggiornato con `durationSurchargePer30min` (int ≥ 0), `servicePriceMatrixCellSchema`, `matrixCells` opzionale in create/update schema.
- Task 2: Rimosso commento STUB da `getServicePriceMatrixCells`. Aggiunta `getServiceWithMatrix` con Promise.all.
- Task 3: `createService` inserisce celle non-zero dopo il returning. `updateService` esegue delete + re-insert celle. Aggiunta `fetchServicePriceMatrix` action.
- Task 4–5: `ServiceForm` riscritto con stato `matrixCells`, `useEffect` per caricamento in modifica, campo surcharge con `setValueAs`, griglia 3×5 con `overflow-x-auto`, `onSubmit` con costruzione array celle.
- Task 6: `ServiceList` aggiornato con nuovo campo `durationSurchargePer30min` nell'interfaccia e visualizzazione condizionale `+€X/30min` in tabella e card.
- Task 7: `services/page.tsx` invariato — compatibile automaticamente grazie al TypeScript.

### File List

- `src/lib/validations/services.ts` — aggiunto `durationSurchargePer30min`, `servicePriceMatrixCellSchema`, `matrixCells` opzionale
- `src/lib/queries/services.ts` — rimosso commento STUB, aggiunta `getServiceWithMatrix`
- `src/lib/actions/services.ts` — aggiornati `createService`/`updateService` con matrice, aggiunta `fetchServicePriceMatrix`
- `src/components/service/ServiceForm.tsx` — riscrittura completa con campo surcharge e griglia 3×5
- `src/components/service/ServiceList.tsx` — aggiornato interfaccia + visualizzazione surcharge
- `_bmad-output/implementation-artifacts/2-9-editor-matrice-prezzi-servizio.md` — aggiornato (task, status, file list, change log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — aggiornato status `2-9` a `review`

## Change Log

- 2026-05-17: Implementazione completa Story 2.9 — editor matrice prezzi pelo/taglia e campo maggiorazione 30min nel ServiceForm
