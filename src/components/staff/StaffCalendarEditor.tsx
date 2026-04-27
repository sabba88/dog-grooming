'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAction } from 'next-safe-action/hooks'
import { saveDayShifts } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'
import { AssignmentForm } from './AssignmentForm'

interface Assignment {
  id: string
  userId: string
  locationId: string
  locationName: string | null
  date: string
  startTime: string
  endTime: string
}

interface StaffUser {
  id: string
  name: string
  role: 'admin' | 'collaborator'
}

interface Location {
  id: string
  name: string
}

interface DayShift {
  locationId: string
  locationName: string
  startTime: string
  endTime: string
}

interface StaffCalendarEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: StaffUser
  locations: Location[]
  existingAssignments: Assignment[]
}

export function StaffCalendarEditor({
  open,
  onOpenChange,
  onSuccess,
  user,
  locations,
  existingAssignments,
}: StaffCalendarEditorProps) {
  const isMobile = useIsMobile()

  const [draftByDate, setDraftByDate] = useState<Map<string, DayShift[]>>(() => {
    const map = new Map<string, DayShift[]>()
    for (const a of existingAssignments) {
      const existing = map.get(a.date) ?? []
      map.set(a.date, [...existing, {
        locationId: a.locationId,
        locationName: a.locationName ?? '',
        startTime: a.startTime,
        endTime: a.endTime,
      }])
    }
    return map
  })

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [addFormOpen, setAddFormOpen] = useState(false)

  const { execute: executeSave, isPending: isSaving } = useAction(saveDayShifts, {
    onSuccess: () => {
      toast.success('Turni aggiornati')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError ?? 'Errore durante il salvataggio')
    },
  })

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const selectedShifts = selectedDateStr ? (draftByDate.get(selectedDateStr) ?? []) : []

  const daysWithShifts = [...draftByDate.entries()]
    .filter(([, shifts]) => shifts.length > 0)
    .map(([dateStr]) => parseISO(dateStr))

  function handleShiftAdd(data: { locationId: string; locationName: string; startTime: string; endTime: string }) {
    if (!selectedDateStr) return
    setDraftByDate(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(selectedDateStr) ?? []
      newMap.set(
        selectedDateStr,
        [...existing, data].sort((a, b) => a.startTime.localeCompare(b.startTime))
      )
      return newMap
    })
    setAddFormOpen(false)
  }

  function handleShiftRemove(index: number) {
    if (!selectedDateStr) return
    setDraftByDate(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(selectedDateStr) ?? []
      const updated = existing.filter((_, i) => i !== index)
      if (updated.length === 0) {
        newMap.delete(selectedDateStr)
      } else {
        newMap.set(selectedDateStr, updated)
      }
      return newMap
    })
  }

  function handleSaveDay() {
    if (!selectedDateStr) return
    executeSave({
      userId: user.id,
      date: selectedDateStr,
      shifts: selectedShifts.map(s => ({
        locationId: s.locationId,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    })
  }

  const selectedDateLabel = selectedDate
    ? format(selectedDate, "EEEE d MMMM yyyy", { locale: it })
    : ''

  const content = (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
      </p>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        locale={it}
        modifiers={{ hasShifts: daysWithShifts }}
        modifiersStyles={{
          hasShifts: { fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted' },
        }}
      />

      {selectedDate && (
        <div className="border rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium capitalize">{selectedDateLabel}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddFormOpen(true)}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              Aggiungi fascia
            </Button>
          </div>

          {selectedShifts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun turno per questa data</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedShifts.map((shift, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                      {shift.locationName || 'Sede'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {shift.startTime} – {shift.endTime}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleShiftRemove(i)}
                    aria-label="Rimuovi fascia"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSaveDay}
            disabled={isSaving}
            className="self-end"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Salva giorno
          </Button>
        </div>
      )}

      <AssignmentForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        onSave={handleShiftAdd}
        locations={locations}
        date={selectedDateStr ?? ''}
        existingShifts={selectedShifts}
      />
    </div>
  )

  const title = `Calendario di ${user.name}`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
