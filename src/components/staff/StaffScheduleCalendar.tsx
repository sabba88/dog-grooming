'use client'

import { useState, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useAction } from 'next-safe-action/hooks'
import { saveWeeklyCalendar } from '@/lib/actions/staff'
import { DAYS_OF_WEEK } from '@/lib/validations/staff'
import { AssignmentForm } from './AssignmentForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Assignment {
  id: string
  userId: string
  locationId: string
  locationName: string | null
  dayOfWeek: number
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

interface DraftAssignment {
  locationId: string
  locationName: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface StaffScheduleCalendarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: StaffUser
  locations: Location[]
  existingAssignments: Assignment[]
}

export function StaffScheduleCalendar({
  open,
  onOpenChange,
  onSuccess,
  user,
  locations,
  existingAssignments,
}: StaffScheduleCalendarProps) {
  const isMobile = useIsMobile()
  const initialDraft = useMemo(() =>
    existingAssignments.map(a => ({
      locationId: a.locationId,
      locationName: a.locationName ?? '',
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })), [existingAssignments])

  const [draft, setDraft] = useState<DraftAssignment[]>(initialDraft)
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<DraftAssignment | null>(null)

  // Reset draft when dialog opens with new user data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDraft(initialDraft)
    }
    onOpenChange(newOpen)
  }

  const { execute, isPending } = useAction(saveWeeklyCalendar, {
    onSuccess: () => {
      toast.success('Calendario aggiornato')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante il salvataggio')
    },
  })

  function handleAddAssignment(dayOfWeek: number) {
    setEditingDay(dayOfWeek)
    setEditingAssignment(null)
    setAssignmentFormOpen(true)
  }

  function handleEditAssignment(assignment: DraftAssignment) {
    setEditingDay(assignment.dayOfWeek)
    setEditingAssignment(assignment)
    setAssignmentFormOpen(true)
  }

  function handleRemoveAssignment(dayOfWeek: number) {
    setDraft(prev => prev.filter(a => a.dayOfWeek !== dayOfWeek))
  }

  function handleAssignmentSave(data: { locationId: string; startTime: string; endTime: string }) {
    if (editingDay === null) return

    const location = locations.find(l => l.id === data.locationId)

    setDraft(prev => {
      const filtered = prev.filter(a => a.dayOfWeek !== editingDay)
      return [...filtered, {
        locationId: data.locationId,
        locationName: location?.name ?? '',
        dayOfWeek: editingDay,
        startTime: data.startTime,
        endTime: data.endTime,
      }].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    })

    setAssignmentFormOpen(false)
  }

  function handleSave() {
    execute({
      userId: user.id,
      assignments: draft.map(a => ({
        locationId: a.locationId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    })
  }

  const calendarContent = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-muted-foreground">
          {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {DAYS_OF_WEEK.map(day => {
          const assignment = draft.find(a => a.dayOfWeek === day.value)
          return (
            <div
              key={day.value}
              className="flex items-center justify-between rounded-lg border border-border p-3 min-h-[52px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium w-12 shrink-0">
                  {day.label.slice(0, 3)}
                </span>
                {assignment ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs shrink-0">
                      {assignment.locationName}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {assignment.startTime} - {assignment.endTime}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Non assegnato</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {assignment ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditAssignment(assignment)}
                      aria-label={`Modifica ${day.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveAssignment(day.value)}
                      aria-label={`Rimuovi ${day.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAddAssignment(day.value)}
                    aria-label={`Aggiungi ${day.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Button onClick={handleSave} disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : 'Salva Calendario'}
      </Button>

      <AssignmentForm
        open={assignmentFormOpen}
        onOpenChange={setAssignmentFormOpen}
        onSave={handleAssignmentSave}
        locations={locations}
        dayOfWeek={editingDay ?? 0}
        existingAssignment={editingAssignment}
        existingDraft={draft}
      />
    </div>
  )

  const title = `Calendario di ${user.name}`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{calendarContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {calendarContent}
      </DialogContent>
    </Dialog>
  )
}
