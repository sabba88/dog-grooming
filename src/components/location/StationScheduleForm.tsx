'use client'

import { useState } from 'react'
import { updateStationSchedule } from '@/lib/actions/stations'
import { DAYS_OF_WEEK } from '@/lib/validations/stations'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

interface ScheduleEntry {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

interface StationScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  stationId: string
  stationName: string
  existingSchedules: ScheduleEntry[]
}

interface DayState {
  enabled: boolean
  openTime: string
  closeTime: string
  error?: string
}

function buildInitialState(existingSchedules: ScheduleEntry[]): DayState[] {
  return DAYS_OF_WEEK.map((day) => {
    const existing = existingSchedules.find(s => s.dayOfWeek === day.value)
    return {
      enabled: !!existing,
      openTime: existing?.openTime ?? '09:00',
      closeTime: existing?.closeTime ?? '18:00',
    }
  })
}

export function StationScheduleForm({
  open,
  onOpenChange,
  onSuccess,
  stationId,
  stationName,
  existingSchedules,
}: StationScheduleFormProps) {
  const isMobile = useIsMobile()
  const [days, setDays] = useState<DayState[]>(() => buildInitialState(existingSchedules))

  const { execute, isPending } = useAction(updateStationSchedule, {
    onSuccess: () => {
      toast.success('Orari aggiornati')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento degli orari")
    },
  })

  function updateDay(index: number, updates: Partial<DayState>) {
    setDays(prev => prev.map((day, i) =>
      i === index ? { ...day, ...updates, error: undefined } : day
    ))
  }

  function handleSubmit() {
    // Client-side validation
    let hasError = false
    const newDays = days.map((day) => {
      if (day.enabled && day.closeTime <= day.openTime) {
        hasError = true
        return { ...day, error: "Chiusura deve essere dopo apertura" }
      }
      return { ...day, error: undefined }
    })
    setDays(newDays)

    if (hasError) return

    const schedules = days
      .map((day, index) => ({
        dayOfWeek: index,
        openTime: day.openTime,
        closeTime: day.closeTime,
        enabled: day.enabled,
      }))
      .filter(day => day.enabled)
      .map(({ dayOfWeek, openTime, closeTime }) => ({ dayOfWeek, openTime, closeTime }))

    execute({ stationId, schedules })
  }

  const formContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {DAYS_OF_WEEK.map((day, index) => (
          <div key={day.value} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={days[index].enabled}
                onCheckedChange={(checked) => updateDay(index, { enabled: checked === true })}
                aria-label={`Abilita ${day.label}`}
              />
              <Label className="min-w-[90px] text-sm font-medium">{day.label}</Label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={days[index].openTime}
                  onChange={(e) => updateDay(index, { openTime: e.target.value })}
                  disabled={!days[index].enabled}
                  className="w-[120px]"
                  aria-label={`Apertura ${day.label}`}
                />
                <span className="text-muted-foreground text-sm">—</span>
                <Input
                  type="time"
                  value={days[index].closeTime}
                  onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                  disabled={!days[index].enabled}
                  className="w-[120px]"
                  aria-label={`Chiusura ${day.label}`}
                />
              </div>
            </div>
            {days[index].error && (
              <p className="text-xs text-destructive ml-[calc(16px+12px+90px+12px)]">
                {days[index].error}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : 'Salva Orari'}
      </Button>
    </div>
  )

  const title = `Orari — ${stationName}`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
