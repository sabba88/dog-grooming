# Story 4.4: Note Prestazione

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Amministratore o Collaboratore**,
I want **aggiungere note sulla prestazione al termine di un appuntamento**,
so that **lo storico del cane si arricchisca di informazioni utili per le visite future**.

## Acceptance Criteria

1. **Given** un utente tocca un appuntamento nell'agenda
   **When** accede al dettaglio dell'appuntamento
   **Then** vede la sezione "Note Prestazione" con un campo testo per aggiungere/modificare la nota
   **And** vede le note delle prestazioni precedenti dello stesso cane (storico da Story 3.2), escluso l'appuntamento corrente

2. **Given** un utente scrive una nota sulla prestazione
   **When** salva la nota
   **Then** la nota viene associata all'appuntamento (campo `notes` su `appointments`)
   **And** la nota appare nello storico delle note prestazione del cane (visibile da anagrafica cane, sezione "Storico Note Prestazione")
   **And** mostra un toast "Nota salvata"

3. **Given** un utente consulta le note precedenti dal dettaglio dell'appuntamento
   **When** le note vengono renderizzate
   **Then** sono mostrate in ordine cronologico inverso con data (startTime), servizio effettuato (serviceName) e testo della nota
   **And** l'utente puo' identificare rapidamente informazioni rilevanti

4. **Given** un utente ha un appuntamento nell'agenda
   **When** right-click sull'appuntamento (desktop) o long-press (mobile, 500ms)
   **Then** appare un DropdownMenu contestuale con le azioni rapide: "Dettaglio", "Aggiungi Nota", "Sposta", "Cancella"
   **And** "Dettaglio" apre AppointmentDetail normalmente
   **And** "Aggiungi Nota" apre AppointmentDetail con focus automatico sul campo nota
   **And** "Sposta" attiva la modalita' spostamento (stesso comportamento di Story 4.3)
   **And** "Cancella" mostra AlertDialog di conferma direttamente senza aprire il dettaglio

## Tasks / Subtasks

- [x] Task 1: Aggiungere schema Zod e action per salvare la nota sull'appuntamento (AC: #2)
  - [x] 1.1 Aggiungere `saveAppointmentNoteSchema` in `src/lib/validations/appointments.ts` — `{ id: z.string().uuid(), notes: z.string().trim().max(2000) }`
  - [x] 1.2 Aggiungere `saveAppointmentNote` in `src/lib/actions/appointments.ts` — usa `authActionClient` con `saveAppointmentNoteSchema`, verifica che l'appuntamento esista e appartenga al `tenantId`, aggiorna `appointments.notes` e `updatedAt`, restituisce `{ success: true }`

- [x] Task 2: Aggiornare query e aggiungere query storico note prestazione (AC: #1, #3)
  - [x] 2.1 In `src/lib/queries/appointments.ts`, aggiungere `dogId: appointments.dogId` e `clientId: appointments.clientId` alla select di `getAppointmentById` — necessari per caricare il storico nel dettaglio
  - [x] 2.2 Aggiungere `getServiceNotesByDog(dogId: string, excludeAppointmentId: string | null, tenantId: string)` in `src/lib/queries/appointments.ts` — SELECT `id, startTime, serviceName (via JOIN services), notes` FROM `appointments` JOIN `services` ON `appointments.serviceId = services.id` WHERE `dogId = dogId AND tenantId = tenantId AND notes IS NOT NULL AND notes != ''` AND (se `excludeAppointmentId` fornito) `id != excludeAppointmentId` ORDER BY `startTime DESC`
  - [x] 2.3 Aggiungere `fetchServiceNotesByDog` action in `src/lib/actions/appointments.ts` — usa `authActionClient` con schema `{ dogId: z.string().uuid(), excludeAppointmentId: z.string().uuid().optional() }`, chiama `getServiceNotesByDog` e restituisce `{ serviceNotes }`

- [x] Task 3: Aggiornare AppointmentDetail con sezione note e storico (AC: #1, #2, #3)
  - [x] 3.1 In `src/components/appointment/AppointmentDetail.tsx`, aggiungere prop `autoFocusNotes?: boolean`
  - [x] 3.2 Aggiungere stato `noteText: string` inizializzato con `appointment.notes ?? ''` al caricamento del dettaglio
  - [x] 3.3 Aggiungere stato `serviceNotes` (storico note prestazione): dopo il caricamento del dettaglio, chiamare `fetchServiceNotesByDog({ dogId: appointment.dogId, excludeAppointmentId: appointmentId })` per caricare il storico del cane
  - [x] 3.4 Aggiungere action `saveNote` tramite `useAction(saveAppointmentNote)` con `onSuccess: () => toast.success('Nota salvata')` e `onError: () => toast.error('Errore nel salvataggio')`
  - [x] 3.5 Aggiungere sezione "Note Prestazione" nel JSX — sopra i pulsanti "Sposta/Cancella":
    - Label "Note Prestazione"
    - `<Textarea>` (da `@/components/ui/textarea`) con `value={noteText}` e `onChange`, `placeholder="Aggiungi una nota sulla prestazione..."`, `rows={3}`, `ref={notesTextareaRef}` per focus programmatico
    - Bottone "Salva Nota" (variant outline, size sm) che chiama `saveNote({ id: appointmentId, notes: noteText })` — disabilitato se `isSavingNote`
  - [x] 3.6 Aggiungere sezione "Storico Note" sotto il campo nota, visibile solo se `serviceNotes.length > 0`:
    - Per ogni nota: data formattata in italiano (`format(note.startTime, "d MMM yyyy", { locale: it })`), `note.serviceName`, `note.notes`
  - [x] 3.7 Implementare auto-focus sulla textarea: `useEffect(() => { if (autoFocusNotes && notesTextareaRef.current) { notesTextareaRef.current.focus(); notesTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) } }, [autoFocusNotes, appointment])`

- [x] Task 4: Aggiornare DogDetail con storico note prestazione reale (AC: #2)
  - [x] 4.1 In `src/lib/queries/appointments.ts`, verificare che `getServiceNotesByDog` esista (Task 2.2) — se no, crearlo
  - [x] 4.2 In `src/app/(auth)/dogs/[id]/page.tsx`, aggiungere fetch `getServiceNotesByDog(id, null, session.user.tenantId)` nel `Promise.all` esistente (accanto a `getDogNotes` e `getBreedsForSelect`)
  - [x] 4.3 Passare `serviceNotes` come prop a `DogDetail`
  - [x] 4.4 In `src/components/dog/DogDetail.tsx`, aggiungere prop `serviceNotes: { id: string; startTime: Date; serviceName: string; notes: string }[]`
  - [x] 4.5 Sostituire il placeholder "Storico Note Prestazione" con il rendering reale:
    - Se `serviceNotes.length === 0`: mostrare "Nessuna nota prestazione registrata"
    - Se `serviceNotes.length > 0`: per ogni nota mostrare data (format `"d MMM yyyy"`), serviceName, testo della nota, separati da `<Separator>`

- [x] Task 5: Aggiungere context menu all'AppointmentBlock (AC: #4)
  - [x] 5.1 In `src/components/schedule/AppointmentBlock.tsx`, aggiungere prop `onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void`
  - [x] 5.2 Importare `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger` da `@/components/ui/dropdown-menu`
  - [x] 5.3 Aggiungere stati interni: `const [dropdownOpen, setDropdownOpen] = useState(false)` e `const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`
  - [x] 5.4 Implementare `handleContextMenu(e: React.MouseEvent)`: `if (!onContextAction) return; e.preventDefault(); e.stopPropagation(); setDropdownOpen(true)`
  - [x] 5.5 Implementare long-press handlers
  - [x] 5.6 Modificare il click handler del `<button>`: `onClick={() => { if (!dropdownOpen) { onClick?.(id) } }}`
  - [x] 5.7 Avvolgere il `<button>` esistente in `<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>` con `<DropdownMenuTrigger asChild>`
  - [x] 5.8 Aggiungere `<DropdownMenuContent align="start">` con 4 `<DropdownMenuItem>`
  - [x] 5.9 Aggiungere `onContextMenu`, `onTouchStart`, `onTouchEnd`, `onTouchMove` al `<button>` esistente
  - [x] 5.10 Context menu disabilitato quando `isMoving=true`

- [x] Task 6: Integrare context menu in AgendaView (AC: #4)
  - [x] 6.1 In `src/components/schedule/AgendaView.tsx`, aggiungere stato `deletingAppointmentId: string | null`
  - [x] 6.2 Aggiungere stato `autoFocusNotes: boolean`
  - [x] 6.3 Implementare `handleContextAction(action: 'detail' | 'add-note' | 'move' | 'delete', id: string)`
  - [x] 6.4 Passare `onContextAction={handleContextAction}` a `ScheduleGrid` e `ScheduleTimeline`
  - [x] 6.5 Passare `autoFocusNotes` a `AppointmentDetail` quando aperto
  - [x] 6.6 Aggiungere AlertDialog per cancellazione rapida (da context menu)

- [x] Task 7: Propagare onContextAction in ScheduleGrid e ScheduleTimeline (AC: #4)
  - [x] 7.1 In `src/components/schedule/ScheduleGrid.tsx`, aggiungere prop `onContextAction?` e passarla a ogni `<AppointmentBlock>`
  - [x] 7.2 In `src/components/schedule/ScheduleTimeline.tsx`, stessa modifica

## Dev Notes

### Architettura e Pattern Obbligatori

- **OGNI Server Action** usa `authActionClient` da `src/lib/actions/client.ts` con schema Zod — nessuna eccezione
- **tenantId** presente in OGNI query al database dal contesto sessione JWT (`ctx.tenantId`)
- **Pattern Result:** next-safe-action gestisce automaticamente `{ success, data/error }` tramite `authActionClient`
- **Lingua UI:** Italiano (label, messaggi, placeholder, toast). **Lingua codice:** Inglese
- **NO checkRole** — Sia Amministratore che Collaboratore possono gestire note prestazione (FR24)
- **FK logiche:** Il progetto NON usa foreign key constraints in Drizzle (solo su `dogs.breedId` e `serviceBreedPrices`). Mantenere lo stesso pattern
- **React Compiler attivo** — NON usare `useMemo`/`useCallback`/`React.memo` manualmente
- **Toast:** `toast.success()` per successo, `toast.error()` per errori

### Campo `notes` su `appointments` — Nessuna Nuova Tabella

**CRITICO**: NON creare una tabella separata per le note prestazione. Il campo `notes: text('notes')` gia' esiste sulla tabella `appointments` nello schema Drizzle (`src/lib/db/schema.ts`). Questo e' il campo da usare per la nota prestazione.

Il "storico note prestazione" del cane si ottiene semplicemente interrogando gli appuntamenti del cane (`dogId`) con `notes IS NOT NULL AND notes != ''`.

```typescript
// src/lib/db/schema.ts — campo GIA' ESISTENTE
export const appointments = pgTable('appointments', {
  // ...
  notes: text('notes'),  // ← campo per la nota prestazione
  // ...
})
```

### getAppointmentById — Aggiunta dogId e clientId

La query `getAppointmentById` in `src/lib/queries/appointments.ts` deve includere `dogId` e `clientId` nella select per permettere all'AppointmentDetail di caricare lo storico note del cane:

```typescript
// Aggiungere alla select esistente:
dogId: appointments.dogId,
clientId: appointments.clientId,
```

Questo e' necessario perche' `fetchServiceNotesByDog` ha bisogno di `dogId`.

### getServiceNotesByDog — Query Storico

```typescript
// src/lib/queries/appointments.ts
export async function getServiceNotesByDog(
  dogId: string,
  excludeAppointmentId: string | null,
  tenantId: string
) {
  // WHERE appointments.dogId = dogId AND tenantId = tenantId
  //   AND appointments.notes IS NOT NULL AND appointments.notes != ''
  //   AND (excludeAppointmentId ? appointments.id != excludeAppointmentId : true)
  // JOIN services ON appointments.serviceId = services.id
  // ORDER BY appointments.startTime DESC
  // Returns: { id, startTime, serviceName, notes }
}
```

Usa `isNotNull(appointments.notes)` e `ne(appointments.notes, '')` per filtrare note vuote. Usa `and(...)` e `ne(appointments.id, excludeAppointmentId)` per escludere l'appuntamento corrente.

Importa da drizzle-orm: `isNotNull`, `ne`, `desc`.

### saveAppointmentNote — Action

```typescript
// src/lib/validations/appointments.ts
export const saveAppointmentNoteSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().trim().max(2000, 'La nota non puo\' superare 2000 caratteri'),
})

// src/lib/actions/appointments.ts
export const saveAppointmentNote = authActionClient
  .schema(saveAppointmentNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))
      .limit(1)
    if (!existing) throw new Error('Appuntamento non trovato')
    await db
      .update(appointments)
      .set({ notes: parsedInput.notes || null, updatedAt: new Date() })
      .where(and(eq(appointments.id, parsedInput.id), eq(appointments.tenantId, ctx.tenantId)))
    return { success: true }
  })
```

**NOTA**: Se `notes` e' una stringa vuota (utente cancella la nota), salvare `null` (`parsedInput.notes || null`).

### AppointmentDetail — Struttura Note Section

```
┌─────────────────────────────────────────┐
│  Dettaglio Appuntamento                 │
├─────────────────────────────────────────┤
│  Cliente, Cane, Servizio, Persona       │
│  Data, Orario, Prezzo                   │
├─────────────────────────────────────────┤
│  Note Prestazione                       │
│  ┌──────────────────────────────────┐   │
│  │ Textarea (3 righe, placeholder)  │   │
│  └──────────────────────────────────┘   │
│  [Salva Nota] (outline, sm)             │
│                                         │
│  Storico Note (solo se esistenti)       │
│  ─ 12 Mar 2026 · Bagno e taglio         │
│    "Cane nervoso alle zampe"            │
│  ─ 5 Feb 2026 · Toelettatura            │
│    "Prima visita, docile"               │
├─────────────────────────────────────────┤
│  [↔ Sposta]          [🗑 Cancella]      │
└─────────────────────────────────────────┘
```

### Context Menu su AppointmentBlock — Pattern

```typescript
// AppointmentBlock.tsx — pattern con DropdownMenu
// DropdownMenu GIA' INSTALLATO: src/components/ui/dropdown-menu.tsx

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem,
         DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useState, useRef } from 'react'

// Nuova prop:
onContextAction?: (action: 'detail' | 'add-note' | 'move' | 'delete', id: string) => void

// Stato interno:
const [dropdownOpen, setDropdownOpen] = useState(false)
const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// Handler right-click:
const handleContextMenu = (e: React.MouseEvent) => {
  if (!onContextAction || isMoving) return
  e.preventDefault()
  e.stopPropagation()
  setDropdownOpen(true)
}

// Long-press (mobile):
const handleTouchStart = () => {
  if (!onContextAction || isMoving) return
  longPressTimerRef.current = setTimeout(() => setDropdownOpen(true), 500)
}
const cancelLongPress = () => {
  if (longPressTimerRef.current) {
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }
}

// Click modificato (evita double-fire con dropdown):
onClick={() => { if (!dropdownOpen) onClick?.(id) }}
```

**NOTA**: Il `DropdownMenu` con `open/onOpenChange` controllato si apre programmaticamente dal right-click o long-press, mentre il click normale passa all'`onClick` esistente. La separazione funziona perche' right-click non triggera `onClick` (evento diverso).

**ATTENZIONE**: Quando `isMoving=true`, disabilitare TUTTI gli handler del context menu per mantenere il comportamento corretto della modalita' spostamento.

### AgendaView — Gestione Context Menu

```typescript
// Nuovi stati in AgendaView.tsx:
const [autoFocusNotes, setAutoFocusNotes] = useState(false)
const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null)

// handleContextAction:
function handleContextAction(action: 'detail' | 'add-note' | 'move' | 'delete', id: string) {
  switch (action) {
    case 'detail':
      setSelectedAppointmentId(id)
      setAutoFocusNotes(false)
      break
    case 'add-note':
      setSelectedAppointmentId(id)
      setAutoFocusNotes(true)
      break
    case 'move':
      handleMoveStart(id)  // funzione GIA' esistente da Story 4.3
      break
    case 'delete':
      setDeletingAppointmentId(id)
      break
  }
}

// Reset autoFocusNotes quando chiude il dettaglio:
// Nel Dialog/Sheet onOpenChange: setAutoFocusNotes(false)

// Passare autoFocusNotes ad AppointmentDetail:
<AppointmentDetail
  appointmentId={selectedAppointmentId}
  onClose={...}
  onMove={handleMoveStart}
  onDeleted={handleAppointmentDeleted}
  autoFocusNotes={autoFocusNotes}
/>

// AlertDialog per cancellazione rapida (aggiungere vicino agli altri Dialog/Sheet):
<AlertDialog open={deletingAppointmentId !== null} onOpenChange={(open) => { if (!open) setDeletingAppointmentId(null) }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancellare l'appuntamento?</AlertDialogTitle>
      <AlertDialogDescription>L'azione e' irreversibile.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annulla</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        if (deletingAppointmentId) {
          executeQuickDelete({ id: deletingAppointmentId })
        }
      }} className="bg-destructive ...">Cancella</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Aggiungere `useAction(deleteAppointment)` separato per la cancellazione rapida da context menu (in AgendaView), con `onSuccess` che invalida la query e mostra il toast.

### Componenti shadcn/ui — Gia' Installati

- **Textarea** — `src/components/ui/textarea.tsx` ✓ GIA' INSTALLATO
- **DropdownMenu** — `src/components/ui/dropdown-menu.tsx` ✓ GIA' INSTALLATO
- **AlertDialog** — `src/components/ui/alert-dialog.tsx` ✓ GIA' INSTALLATO
- **Dialog** — gia' usato per AppointmentDetail su desktop ✓
- **Sheet** — gia' usato per AppointmentDetail su mobile ✓

**NON installare `ContextMenu`** — usare `DropdownMenu` con apertura programmatica come descritto.

### Stato Attuale del Codice (Post Stories 4.1-4.3)

**Componenti e funzioni GIA' funzionanti — NON riscrivere:**

| Componente/Funzione | File | Note |
|---------------------|------|------|
| `AppointmentDetail` | `src/components/appointment/AppointmentDetail.tsx` | ESTENDERE con sezione note |
| `AppointmentBlock` | `src/components/schedule/AppointmentBlock.tsx` | ESTENDERE con context menu |
| `AgendaView` | `src/components/schedule/AgendaView.tsx` | ESTENDERE con handleContextAction |
| `ScheduleGrid` | `src/components/schedule/ScheduleGrid.tsx` | ESTENDERE con onContextAction prop |
| `ScheduleTimeline` | `src/components/schedule/ScheduleTimeline.tsx` | ESTENDERE con onContextAction prop |
| `fetchAppointmentDetail` | `src/lib/actions/appointments.ts` | RIUTILIZZARE (gia' carica `notes`) |
| `deleteAppointment` | `src/lib/actions/appointments.ts` | RIUTILIZZARE in AgendaView per cancellazione rapida |
| `handleMoveStart` | `src/components/schedule/AgendaView.tsx` | RIUTILIZZARE per 'move' da context menu |
| `getAppointmentById` | `src/lib/queries/appointments.ts` | MODIFICARE: aggiungere `dogId`, `clientId` |
| `getDogDetail` page | `src/app/(auth)/dogs/[id]/page.tsx` | MODIFICARE: aggiungere fetch serviceNotes |
| `DogDetail` | `src/components/dog/DogDetail.tsx` | MODIFICARE: aggiungere prop serviceNotes |

### Storico Note Prestazione in DogDetail — Stato Corrente

La sezione "Storico Note Prestazione" in `src/components/dog/DogDetail.tsx` e' ATTUALMENTE un PLACEHOLDER:
```tsx
{/* Storico Note Prestazione — placeholder per Epica 4 */}
<div className="rounded-lg border border-border bg-card p-6">
  <h2 className="text-lg font-semibold text-foreground mb-4">Storico Note Prestazione</h2>
  <p className="text-sm text-muted-foreground">
    Nessuna nota prestazione registrata — Le note verranno aggiunte durante gli appuntamenti
  </p>
</div>
```

**Task 4 di questa story sostituisce questo placeholder** con il rendering reale delle note.

### TanStack Query — Invalidation Pattern

```typescript
// Query key agenda: ['appointments', selectedLocationId, dateString]
// Dopo saveAppointmentNote NON e' necessario invalidare la query agenda
// (la nota non e' visibile sulla griglia)

// Il storico nel DogDetail e' caricato lato server (page.tsx),
// non richiede invalidazione TanStack Query — il refresh avviene con router.refresh()
```

### Drizzle — Import Necessari

Per `getServiceNotesByDog`, aggiungere ai import di `src/lib/queries/appointments.ts`:
- `isNotNull` (probabilmente gia' importato)
- `ne` — per `appointments.notes != ''` e `appointments.id != excludeAppointmentId`
- `desc` — per `ORDER BY startTime DESC`

Verificare i drizzle-orm import esistenti prima di aggiungere.

### Pattern UI: Storico Note nel Dettaglio

```tsx
// Sezione storico nel AppointmentDetail — solo se serviceNotes.length > 0
{serviceNotes.length > 0 && (
  <div className="mt-3 pt-3 border-t">
    <p className="text-xs text-muted-foreground font-medium mb-2">Storico note prestazione</p>
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {serviceNotes.map((note) => (
        <div key={note.id} className="text-xs border rounded-md p-2 bg-muted/30">
          <p className="text-muted-foreground mb-1">
            {format(new Date(note.startTime), 'd MMM yyyy', { locale: it })} · {note.serviceName}
          </p>
          <p className="text-foreground">{note.notes}</p>
        </div>
      ))}
    </div>
  </div>
)}
```

### Project Structure Notes

```
src/
  components/
    appointment/
      AppointmentDetail.tsx    # MODIFICARE: sezione note + storico + autoFocusNotes
    schedule/
      AgendaView.tsx           # MODIFICARE: handleContextAction, deletingAppointmentId, autoFocusNotes
      ScheduleGrid.tsx         # MODIFICARE: passare onContextAction ad AppointmentBlock
      ScheduleTimeline.tsx     # MODIFICARE: passare onContextAction ad AppointmentBlock
      AppointmentBlock.tsx     # MODIFICARE: context menu con DropdownMenu
    dog/
      DogDetail.tsx            # MODIFICARE: prop serviceNotes, sostituire placeholder
  lib/
    actions/
      appointments.ts          # AGGIORNARE: aggiungere saveAppointmentNote, fetchServiceNotesByDog
    validations/
      appointments.ts          # AGGIORNARE: aggiungere saveAppointmentNoteSchema
    queries/
      appointments.ts          # AGGIORNARE: getAppointmentById (dogId+clientId) + getServiceNotesByDog
  app/
    (auth)/dogs/[id]/page.tsx  # AGGIORNARE: fetch serviceNotes
```

### Testing

Nessun framework di test automatico configurato. Verifica manuale — casi critici:

- Click su appuntamento → dettaglio apre, sezione "Note Prestazione" visibile con campo testo
- Scrivere nota e salvare → toast "Nota salvata" appare
- Riaprire lo stesso appuntamento → nota precedentemente salvata pre-compila il campo
- Salvare nota vuota → `notes` campo impostato a `null` (non stringa vuota)
- Aprire dettaglio cane → sezione "Storico Note Prestazione" mostra le note salvate con data e servizio
- Storico nel dettaglio appuntamento → mostra note di altri appuntamenti del cane, NON quello corrente
- Right-click su appuntamento (desktop) → dropdown con 4 azioni
- Long-press su appuntamento (mobile, 500ms) → dropdown con 4 azioni
- Click normale → apre dettaglio normalmente (non dropdown)
- "Aggiungi Nota" dal dropdown → apre dettaglio con focus sul campo nota
- "Sposta" dal dropdown → attiva modalita' spostamento
- "Cancella" dal dropdown → AlertDialog di conferma → appuntamento cancellato, toast
- Context menu disabilitato durante modalita' spostamento
- Touch target >= 44x44px per tutte le azioni del dropdown

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.4 — Acceptance Criteria originali]
- [Source: _bmad-output/planning-artifacts/epics.md#FR24 — Note prestazione post-appuntamento]
- [Source: _bmad-output/planning-artifacts/epics.md#FR19 — Storico note prestazione per cane]
- [Source: _bmad-output/planning-artifacts/architecture.md — Server Actions pattern, naming conventions, TanStack Query keys]
- [Source: _bmad-output/implementation-artifacts/4-3-cancellazione-e-spostamento-appuntamenti.md — handleMoveStart, handleAppointmentDeleted, Dialog/Sheet pattern, TanStack Query invalidation]
- [Source: _bmad-output/implementation-artifacts/3-2-anagrafica-cani.md — DogDetail, storico note placeholder, getDogNotes pattern]
- [Source: src/lib/db/schema.ts — appointments.notes campo esistente, struttura tabella]
- [Source: src/lib/queries/appointments.ts — getAppointmentById (da modificare), pattern query]
- [Source: src/lib/actions/appointments.ts — fetchAppointmentDetail, deleteAppointment, pattern authActionClient]
- [Source: src/components/appointment/AppointmentDetail.tsx — struttura attuale, useAction pattern, Dialog/Sheet responsive]
- [Source: src/components/schedule/AppointmentBlock.tsx — struttura attuale, variant grid/timeline, isMoving prop]
- [Source: src/components/schedule/AgendaView.tsx — handleMoveStart, movingAppointment state, Dialog/Sheet responsive, TanStack Query]
- [Source: src/components/dog/DogDetail.tsx — placeholder storico (da sostituire)]
- [Source: src/components/ui/dropdown-menu.tsx — gia' installato]
- [Source: src/components/ui/textarea.tsx — gia' installato]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implementato campo note sulla prestazione su `appointments.notes` (campo già esistente nello schema DB)
- Aggiunta query `getServiceNotesByDog` con JOIN a `services` per ottenere il nome del servizio, filtro `notes IS NOT NULL AND notes != ''`, esclusione dell'appuntamento corrente
- `getAppointmentById` estesa con `dogId` e `clientId` per permettere il caricamento del storico nel dettaglio
- `AppointmentDetail` aggiornato con: Textarea nota, bottone "Salva Nota", storico note prestazione del cane, prop `autoFocusNotes`
- `DogDetail` aggiornato: placeholder storico sostituito con rendering reale via `getServiceNotesByDog` lato server
- `AppointmentBlock` aggiornato con `DropdownMenu` programmatico via right-click (desktop) e long-press 500ms (mobile), context menu disabilitato durante modalità spostamento
- `AgendaView` aggiornato con `handleContextAction`, `autoFocusNotes`, `deletingAppointmentId`, `AlertDialog` per cancellazione rapida
- `ScheduleGrid` e `ScheduleTimeline` aggiornati con prop `onContextAction` propagata agli `AppointmentBlock`
- Build TypeScript e Next.js completati senza errori

### File List

- src/lib/validations/appointments.ts
- src/lib/queries/appointments.ts
- src/lib/actions/appointments.ts
- src/components/appointment/AppointmentDetail.tsx
- src/components/dog/DogDetail.tsx
- src/app/(auth)/dogs/[id]/page.tsx
- src/components/schedule/AppointmentBlock.tsx
- src/components/schedule/AgendaView.tsx
- src/components/schedule/ScheduleGrid.tsx
- src/components/schedule/ScheduleTimeline.tsx

## Change Log

- 2026-04-26: Implementazione completa story 4-4-note-prestazione — note prestazione su appuntamento, storico note nel dettaglio appuntamento e anagrafica cane, context menu (right-click/long-press) su AppointmentBlock con azioni Dettaglio/Aggiungi Nota/Sposta/Cancella (claude-sonnet-4-6)
