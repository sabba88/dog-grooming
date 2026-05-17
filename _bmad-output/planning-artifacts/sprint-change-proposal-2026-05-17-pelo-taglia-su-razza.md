# Sprint Change Proposal — Pelo/Taglia su Razza + Override per Cane

**Data:** 2026-05-17
**Proposto da:** Samueles
**Stato:** APPROVATO
**Impatta:** Story 2.6 (retroattivo), Story 3.3 (riscritta), Story 4.5 (aggiornamento logica lookup)

---

## Motivazione

La decisione originale CC-2026-05-16 prevedeva di aggiungere `coat_type` e `size_type` direttamente sul singolo cane. Dopo revisione, si preferisce un modello a cascata più flessibile:

1. **Razza come default:** Ogni razza porta il proprio profilo pelo/taglia (configurato dall'amministratore nella gestione razze)
2. **Override per cane:** Ogni cane può sovrascrivere pelo e/o taglia individualmente, indipendentemente dalla razza
3. **Fallback:** Se nessun valore disponibile né sul cane né sulla razza → si usa il prezzo base del servizio

## Nuovo Modello Dati

### Tabella `breeds` (aggiornamento)
```sql
ALTER TABLE breeds ADD COLUMN coat_type text;
ALTER TABLE breeds ADD COLUMN size_type text;
```
- `coat_type`: `'short' | 'medium' | 'long'` — tipo di pelo tipico della razza
- `size_type`: `'toy' | 'small' | 'medium' | 'large' | 'giant'` — taglia tipica della razza

### Tabella `dogs` (invariata — campi già aggiunti in story 2.7)
- `coat_type` — override specifico del cane (nullable, opzionale)
- `size_type` — override specifico del cane (nullable, opzionale)

### Logica Effettiva (per pricing e visualizzazione)
```
effectiveCoatType = dog.coatType ?? breed.coatType ?? null
effectiveSizeType = dog.sizeType ?? breed.sizeType ?? null
```
- Se `dog.coatType` valorizzato → usa quello (override esplicito)
- Altrimenti se il cane ha una razza con `coatType` → usa quello della razza
- Altrimenti → `null` → prezzo base del servizio

## Impatto per Story

### Story 2.6 — Gestione Razze Canine (già DONE — aggiornamento retroattivo)
Aggiunta di `coat_type` e `size_type` alla tabella breeds e al BreedForm:
- DB schema: aggiungere i campi a `breeds`
- `validations/breeds.ts`: aggiungere campi agli schemi Zod
- `actions/breeds.ts`: aggiungere ai `.values()` e `.set()`
- `queries/breeds.ts`: aggiungere ai select
- `BreedForm.tsx`: aggiungere i due Select (Tipo di Pelo, Taglia)

Queste modifiche sono incluse nella story 3.3 per semplicità implementativa.

### Story 3.3 — Razza, Pelo e Taglia nel Profilo Cane (RISCRITTA)
Ora copre:
- Aggiornamento breeds (DB + form + actions + queries)
- Esposizione coat/size nel form cane con auto-fill da razza + override
- Visualizzazione profilo effettivo in DogDetail con indicazione della fonte

### Story 4.5 — Prezzo Appuntamento per Pelo/Taglia (aggiornamento logica)
La funzione `getAppointmentPrice` deve usare la logica a cascata:
```
effectiveCoat = dog.coatType ?? breed.coatType
effectiveSize = dog.sizeType ?? breed.sizeType
→ lookup in service_price_matrix (serviceId, effectiveCoat, effectiveSize)
```
La query `getDogById` (già aggiornata in 3.3) restituirà sia i valori del cane che quelli della razza.

## Nessun Impatto su
- Schema `dogs` — già ha i campi da story 2.7, nessuna migrazione aggiuntiva
- `service_price_matrix` — invariata (3×5, coat×size)
- `pricing_surcharges` — invariata
- Story 2.7, 2.8 — già completate, nessuna modifica
