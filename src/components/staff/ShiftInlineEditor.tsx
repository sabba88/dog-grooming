'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const shiftFormSchema = z.object({
  locationId: z.string().uuid('Seleziona una sede'),
  startTime: z.string().regex(timePattern, 'Formato non valido'),
  endTime: z.string().regex(timePattern, 'Formato non valido'),
}).refine((d) => d.endTime > d.startTime, {
  message: "Fine deve essere dopo l'inizio",
  path: ['endTime'],
})

type ShiftFormData = z.infer<typeof shiftFormSchema>

export type ExistingShift = {
  id: string
  startTime: string
  endTime: string
}

export type Location = {
  id: string
  name: string
}

export type BusinessHoursForDay = {
  locationId: string
  openTime: string
  closeTime: string
}

interface ShiftInlineEditorProps {
  mode: 'add' | 'edit'
  editShiftId?: string
  defaultLocationId?: string
  defaultStartTime?: string
  defaultEndTime?: string
  existingShifts: ExistingShift[]
  locations: Location[]
  businessHoursForDay: BusinessHoursForDay[]
  onSave: (data: { locationId: string; startTime: string; endTime: string }) => void
  onDelete?: () => void
  onCancel: () => void
  isPending?: boolean
}

export function ShiftInlineEditor({
  mode,
  editShiftId,
  defaultLocationId = '',
  defaultStartTime = '09:00',
  defaultEndTime = '18:00',
  existingShifts,
  locations,
  businessHoursForDay,
  onSave,
  onDelete,
  onCancel,
  isPending,
}: ShiftInlineEditorProps) {
  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      locationId: defaultLocationId,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    },
  })

  const watchedLocationId = form.watch('locationId')

  useEffect(() => {
    if (mode !== 'add' || !watchedLocationId) return
    const hours = businessHoursForDay.find(h => h.locationId === watchedLocationId)
    if (hours) {
      form.setValue('startTime', hours.openTime)
      form.setValue('endTime', hours.closeTime)
    }
  }, [watchedLocationId, mode, businessHoursForDay, form])

  function onSubmit(data: ShiftFormData) {
    const others = existingShifts.filter(s => s.id !== editShiftId)
    const hasOverlap = others.some(
      s => data.startTime < s.endTime && data.endTime > s.startTime
    )
    if (hasOverlap) {
      form.setError('startTime', { message: 'Fascia sovrapposta a un turno esistente' })
      return
    }
    onSave(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="text-sm font-medium">
        {mode === 'add' ? 'Aggiungi turno' : 'Modifica turno'}
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shift-location" className="text-xs">Sede</Label>
        <Controller
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="shift-location"
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
          <Label htmlFor="shift-start" className="text-xs">Inizio</Label>
          <Input
            id="shift-start"
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
          <Label htmlFor="shift-end" className="text-xs">Fine</Label>
          <Input
            id="shift-end"
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
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive h-7 px-2"
          >
            <Trash2 className="size-3.5 mr-1" />
            Elimina
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
