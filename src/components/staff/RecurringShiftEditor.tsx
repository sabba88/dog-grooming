'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
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

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const recurringFormSchema = z.object({
  locationId: z.string().uuid('Seleziona una sede'),
  startTime: z.string().regex(timePattern, 'Formato non valido'),
  endTime: z.string().regex(timePattern, 'Formato non valido'),
}).refine((d) => d.endTime > d.startTime, {
  message: "Fine deve essere dopo l'inizio",
  path: ['endTime'],
})

type RecurringFormData = z.infer<typeof recurringFormSchema>

export type Location = {
  id: string
  name: string
}

interface RecurringShiftEditorProps {
  mode: 'add' | 'edit'
  editId?: string
  userId: string
  dayOfWeek: number
  defaultLocationId?: string
  defaultStartTime?: string
  defaultEndTime?: string
  locations: Location[]
  onSave: (data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
  isPending?: boolean
}

function getDayLabel(dayOfWeek: number): string {
  // dayOfWeek: 0=Mon, weekStart is any Monday; use 2025-01-06 (a known Monday) as reference
  const monday = parseISO('2025-01-06')
  return format(addDays(monday, dayOfWeek), 'EEEE', { locale: it })
}

export function RecurringShiftEditor({
  mode,
  dayOfWeek,
  defaultLocationId = '',
  defaultStartTime = '09:00',
  defaultEndTime = '18:00',
  locations,
  onSave,
  onDelete,
  onCancel,
  isPending,
}: RecurringShiftEditorProps) {
  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      locationId: defaultLocationId,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    },
  })

  async function onSubmit(data: RecurringFormData) {
    await onSave(data)
  }

  const dayLabel = getDayLabel(dayOfWeek)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="text-sm font-medium capitalize">
        {mode === 'add' ? `Template — ${dayLabel}` : `Modifica template — ${dayLabel}`}
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recurring-location" className="text-xs">Sede</Label>
        <Controller
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="recurring-location"
                className="h-8 text-xs"
                aria-invalid={!!form.formState.errors.locationId}
              >
                <SelectValue placeholder="Seleziona sede" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(l => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.locationId && (
          <p className="text-xs text-destructive">{form.formState.errors.locationId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recurring-start" className="text-xs">Inizio</Label>
          <Input
            id="recurring-start"
            type="time"
            className="h-8 text-xs"
            {...form.register('startTime')}
            aria-invalid={!!form.formState.errors.startTime}
          />
          {form.formState.errors.startTime && (
            <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recurring-end" className="text-xs">Fine</Label>
          <Input
            id="recurring-end"
            type="time"
            className="h-8 text-xs"
            {...form.register('endTime')}
            aria-invalid={!!form.formState.errors.endTime}
          />
          {form.formState.errors.endTime && (
            <p className="text-xs text-destructive">{form.formState.errors.endTime.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {mode === 'edit' && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive h-7 px-2"
          >
            <Trash2 className="size-3.5 mr-1" />
            Elimina template
          </Button>
        ) : <span />}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            Annulla
          </Button>
          <Button type="submit" size="sm" disabled={isPending} className="h-7 px-3 text-xs">
            {mode === 'add' ? 'Aggiungi' : 'Salva'}
          </Button>
        </div>
      </div>
    </form>
  )
}
