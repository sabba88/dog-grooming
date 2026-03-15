'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { DAYS_OF_WEEK } from '@/lib/validations/staff'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const assignmentFormSchema = z.object({
  locationId: z.string().uuid('Seleziona una sede'),
  startTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
  endTime: z.string().regex(timePattern, 'Formato orario non valido (HH:mm)'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "L'orario di fine deve essere successivo all'orario di inizio", path: ['endTime'] }
)

type AssignmentFormData = z.infer<typeof assignmentFormSchema>

interface DraftAssignment {
  locationId: string
  locationName: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Location {
  id: string
  name: string
}

interface AssignmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { locationId: string; startTime: string; endTime: string }) => void
  locations: Location[]
  dayOfWeek: number
  existingAssignment: DraftAssignment | null
  existingDraft: DraftAssignment[]
}

export function AssignmentForm({
  open,
  onOpenChange,
  onSave,
  locations,
  dayOfWeek,
  existingAssignment,
  existingDraft,
}: AssignmentFormProps) {
  const isMobile = useIsMobile()
  const isEditing = !!existingAssignment

  const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label ?? ''

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: existingAssignment
      ? {
          locationId: existingAssignment.locationId,
          startTime: existingAssignment.startTime,
          endTime: existingAssignment.endTime,
        }
      : {
          locationId: '',
          startTime: '09:00',
          endTime: '18:00',
        },
  })

  function onSubmit(data: AssignmentFormData) {
    // Client-side conflict check (AC #3)
    const conflict = existingDraft.find(
      a => a.dayOfWeek === dayOfWeek && a.locationId !== data.locationId
    )
    // This shouldn't happen since we replace the same day, but guard against it
    if (conflict) {
      form.setError('locationId', {
        message: `L'utente è già assegnato a ${conflict.locationName} per questo giorno`,
      })
      return
    }

    onSave(data)
    form.reset()
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="assignment-location">Sede</Label>
        <Controller
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="assignment-location" aria-invalid={!!form.formState.errors.locationId}>
                <SelectValue placeholder="Seleziona sede" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.locationId && (
          <p className="text-sm text-destructive">
            {form.formState.errors.locationId.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignment-start">Inizio</Label>
          <Input
            id="assignment-start"
            type="time"
            {...form.register('startTime')}
            aria-invalid={!!form.formState.errors.startTime}
          />
          {form.formState.errors.startTime && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startTime.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignment-end">Fine</Label>
          <Input
            id="assignment-end"
            type="time"
            {...form.register('endTime')}
            aria-invalid={!!form.formState.errors.endTime}
          />
          {form.formState.errors.endTime && (
            <p className="text-sm text-destructive">
              {form.formState.errors.endTime.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="mt-2">
        {isEditing ? 'Salva Modifiche' : 'Assegna'}
      </Button>
    </form>
  )

  const title = isEditing
    ? `Modifica Assegnazione — ${dayLabel}`
    : `Nuova Assegnazione — ${dayLabel}`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
