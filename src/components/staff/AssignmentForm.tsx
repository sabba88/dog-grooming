'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
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

interface Location {
  id: string
  name: string
}

interface ExistingShift {
  startTime: string
  endTime: string
}

interface AssignmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { locationId: string; locationName: string; startTime: string; endTime: string }) => void
  locations: Location[]
  date: string // YYYY-MM-DD
  existingShifts: ExistingShift[]
}

export function AssignmentForm({
  open,
  onOpenChange,
  onSave,
  locations,
  date,
  existingShifts,
}: AssignmentFormProps) {
  const isMobile = useIsMobile()

  const dateLabel = date
    ? format(parseISO(date), "EEEE d MMMM yyyy", { locale: it })
    : ''

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      locationId: '',
      startTime: '09:00',
      endTime: '18:00',
    },
  })

  function onSubmit(data: AssignmentFormData) {
    // Client-side overlap check
    const hasOverlap = existingShifts.some(
      s => data.startTime < s.endTime && data.endTime > s.startTime
    )
    if (hasOverlap) {
      form.setError('startTime', { message: 'Fascia oraria sovrapposta a un turno esistente' })
      return
    }

    const locationName = locations.find(l => l.id === data.locationId)?.name ?? ''
    onSave({ ...data, locationName })
    form.reset()
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) form.reset()
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
          <p className="text-sm text-destructive">{form.formState.errors.locationId.message}</p>
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
            <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
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
            <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="mt-2">Aggiungi</Button>
    </form>
  )

  const title = `Aggiungi Fascia — ${dateLabel}`

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
