# Sprint Change Proposal — Filtri Avanzati Lista Clienti
**Data:** 2026-05-17
**Classificazione Scope:** Minor
**Handoff:** Development team — implementazione diretta

---

## 1. Issue Summary

**Problema:** La pagina Clienti dispone di un componente `ClientSearch` (type-ahead dropdown) che permette di trovare un singolo cliente per nome o telefono e navigare al suo dettaglio, ma non offre la possibilità di **filtrare la lista clienti** in base a criteri combinabili.

**Contesto:** Emerso in fase operativa — il gestore del salone ha bisogno di cercare i clienti anche tramite il **nome del cane** (es. "trova tutti i clienti che hanno un cane di nome Fido") e combinare più criteri di filtro.

**Gap attuale:**
- `searchClients()` esegue `ilike` su `nominativo` e `phone` ma non include join su `dogs`
- `getClients()` restituisce solo `dogsCount` (conteggio cani), non i nomi
- `ClientSearch` è progettato come navigazione rapida (click → dettaglio), non come filtro della lista visibile
- Non esiste un campo filtro che operi sulla lista dei clienti già caricata

---

## 2. Impact Analysis

### Epic Impact
- **Epic 3: Gestione Clienti e Cani** — Story 3.1 (`done`) va estesa con nuovi acceptance criteria

### Story Impact
- **Story 3.1 (Anagrafica Clienti)** — unica story impattata. I nuovi AC si aggiungono a quelli esistenti.
- Nessuna story futura impattata (Epic 4 `AppointmentForm` usa `ClientSearch` in modo indipendente — non toccata).

### Artifact Conflicts
- **epics.md** — Story 3.1: aggiungere AC per filtro lista multi-criterio
- **FR15 (PRD)** — "ricerca rapida cliente": estendere per includere filtro per nome del cane
- **`src/lib/queries/clients.ts`** — `getClients()`: aggiungere `dogNames` aggregato via `string_agg`
- **`src/components/client/ClientList.tsx`** — aggiungere barra filtro con singolo campo di ricerca
- **`src/app/(auth)/clients/page.tsx`** — nessuna modifica necessaria (la pagina passa `clients` a `ClientList`)

### Technical Impact
- Query `getClients()`: aggiungere `dogNames` come campo aggregato (SQL: `string_agg(dogs.name, ', ')`)
- `ClientList`: aggiungere stato locale `filterQuery` + `filteredClients` derivato (filtro client-side — il dataset è piccolo, nessun server roundtrip necessario)
- `ClientSearch` nella pagina Clienti: da valutare se mantenere o sostituire con il nuovo filtro. **Proposta: mantenere entrambi** — la barra filtro lavora sulla lista, `ClientSearch` rimane per la creazione rapida di nuovi clienti da AppointmentForm o ricerca per navigazione diretta.
- Nessuna modifica a `ClientSearch` (usato invariato in `AppointmentForm`)

---

## 3. Recommended Approach

**Opzione scelta: Direct Adjustment (Opzione 1)**

Aggiungere un campo filtro alla lista clienti che filtra in tempo reale la lista già caricata su nome, telefono e nome del cane combinati.

**Rationale:**
- Effort: Low (una query leggera + un componente React semplice)
- Risk: Low (nessuna modifica a AppointmentForm o ClientSearch usato altrove)
- Il dataset della lista clienti è tipicamente < 500 record per un salone monoposto → filtro client-side adeguato
- Mantiene il pattern esistente (Server Component carica tutti i clienti, Client Component gestisce l'interazione)

**Effort:** ~2-3 ore di sviluppo
**Timeline impact:** Nessuno — va aggiunto come mini-task a Story 3.1

---

## 4. Detailed Change Proposals

### 4.1 Query Layer — `src/lib/queries/clients.ts`

**Story:** 3.1
**File:** `src/lib/queries/clients.ts`
**Funzione:** `getClients()`

**OLD:**
```typescript
return db
  .select({
    id: clients.id,
    nominativo: clients.nominativo,
    phone: clients.phone,
    email: clients.email,
    createdAt: clients.createdAt,
    dogsCount: count(dogs.id),
    lastAppointmentAt: lastAppt.lastAt,
    nextAppointmentAt: nextAppt.nextAt,
  })
```

**NEW:** aggiungere campo `dogNames` aggregato
```typescript
import { sql } from 'drizzle-orm'

// Nel select:
dogNames: sql<string>`coalesce(string_agg(${dogs.name}, ', '), '')`,
```

**Rationale:** Permette al componente client di filtrare per nome cane senza ulteriori query al DB. `string_agg` è disponibile in PostgreSQL/Neon. Il campo è già nel `groupBy` implicito essendo un aggregato.

---

### 4.2 Componente Lista — `src/components/client/ClientList.tsx`

**Story:** 3.1
**File:** `src/components/client/ClientList.tsx`

**OLD (interfaccia):**
```typescript
interface Client {
  id: string
  nominativo: string
  phone: string
  email: string | null
  createdAt: Date | null
  lastAppointmentAt: Date | null | string
  nextAppointmentAt: Date | null | string
}
```

**NEW:**
```typescript
interface Client {
  id: string
  nominativo: string
  phone: string
  email: string | null
  createdAt: Date | null
  lastAppointmentAt: Date | null | string
  nextAppointmentAt: Date | null | string
  dogNames: string  // aggiunto — stringa aggregata dei nomi cani
}
```

**OLD (barra ricerca):**
```tsx
<div className="mb-4">
  <ClientSearch onSelect={handleSelect} onCreateNew={handleNew} />
</div>
```

**NEW:** sostituire la `ClientSearch` standalone con una barra filtro dedicata + mantenere `ClientSearch` come azione secondaria
```tsx
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

// Stato aggiunto nel componente:
const [filterQuery, setFilterQuery] = useState('')

// Logica di filtro (fuori dal JSX):
const filteredClients = filterQuery.trim().length === 0
  ? clients
  : clients.filter(c => {
      const q = filterQuery.toLowerCase()
      return (
        c.nominativo.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.dogNames.toLowerCase().includes(q)
      )
    })

// JSX — sostituisce la sezione mb-4:
<div className="mb-4 flex gap-2">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Filtra per nome, telefono o nome del cane..."
      value={filterQuery}
      onChange={e => setFilterQuery(e.target.value)}
      className="pl-9 pr-9"
    />
    {filterQuery && (
      <button
        type="button"
        onClick={() => setFilterQuery('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
</div>

// Nota: usare `filteredClients` invece di `clients` nel rendering della lista e nel controllo "length === 0"
// Aggiungere messaggio "Nessun risultato per '[filterQuery]'" quando filteredClients.length === 0 ma clients.length > 0
```

**Rationale:** Filtro client-side immediato (no debounce necessario su dataset piccolo). Il pulsante X resetta il filtro. Il placeholder spiega le 3 dimensioni di ricerca.

---

### 4.3 Aggiornamento Story 3.1 — `_bmad-output/planning-artifacts/epics.md`

**Section:** Story 3.1 Acceptance Criteria

**AGGIUNGERE i seguenti AC:**

```
**Given** un utente è nella pagina Clienti
**When** digita nel campo filtro (nome, telefono, nome del cane)
**Then** la lista si aggiorna in tempo reale mostrando solo i clienti che corrispondono
**And** la ricerca è combinata: trova corrispondenze in nominativo, telefono O nomi dei cani associati
**And** la ricerca non è case-sensitive

**Given** un utente applica un filtro e nessun cliente corrisponde
**When** la lista viene aggiornata
**Then** viene mostrato "Nessun cliente trovato per '[query]'" con pulsante "Rimuovi filtro"

**Given** un utente ha applicato un filtro
**When** clicca la X nel campo filtro o "Rimuovi filtro"
**Then** la lista torna a mostrare tutti i clienti
```

---

### 4.4 Aggiornamento FR15 — `_bmad-output/planning-artifacts/epics.md` (Requirements Inventory)

**OLD:**
```
FR15: L'Amministratore e il Collaboratore possono cercare un cliente in modo rapido
```

**NEW:**
```
FR15: L'Amministratore e il Collaboratore possono filtrare la lista clienti in tempo reale per nome, telefono e nome del cane (combinabili); possono navigare rapidamente a un cliente specifico tramite ricerca type-ahead
```

---

## 5. Implementation Handoff

**Scope classificazione:** Minor — implementazione diretta del development team

**Responsabilità:**
- **Dev**: Implementare le 4 modifiche (query, interfaccia, componente, epics.md)
- **Nessun coordinamento PO/SM necessario** — change minore a feature esistente

**Sequenza di implementazione consigliata:**
1. `getClients()` — aggiungere `dogNames` (SQL `string_agg`)
2. `ClientList.tsx` — aggiornare interfaccia + aggiungere barra filtro
3. Testare filtro su lista desktop e mobile
4. Aggiornare epics.md (AC + FR15)

**Success criteria:**
- [ ] Digitando un nome nel filtro, la lista mostra solo i clienti con quel nome nel nominativo
- [ ] Digitando un numero di telefono, la lista mostra solo i clienti con quel numero
- [ ] Digitando il nome di un cane (es. "Rex"), la lista mostra tutti i clienti che hanno un cane con quel nome
- [ ] Il filtro è combinato: "ma" trova "Mara", "Marco", clienti con telefono contenente "ma", e clienti con cani "Mammolo"
- [ ] Il pulsante X resetta il filtro
- [ ] Su mobile il filtro funziona identicamente
- [ ] Il componente `ClientSearch` in `AppointmentForm` non è modificato e funziona invariato
