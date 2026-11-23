'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { upsertLocationBusinessHours } from '@/lib/actions/locations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'

const DAY_LABELS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

interface TimeSlot {
  openTime: string
  closeTime: string
}

interface BusinessHoursEditorProps {
  locationId: string
  initialHours: { dayOfWeek: number; openTime: string; closeTime: string }[]
}

export function BusinessHoursEditor({ locationId, initialHours }: BusinessHoursEditorProps) {
  const [weekHours, setWeekHours] = useState<Map<number, TimeSlot[]>>(() => {
    const map = new Map<number, TimeSlot[]>()
    for (const h of initialHours) {
      const existing = map.get(h.dayOfWeek) ?? []
      map.set(h.dayOfWeek, [...existing, { openTime: h.openTime, closeTime: h.closeTime }])
    }
    return map
  })

  const [savingDay, setSavingDay] = useState<number | null>(null)
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set())

  function markDirty(dayOfWeek: number) {
    setDirtyDays(prev => {
      if (prev.has(dayOfWeek)) return prev
      const next = new Set(prev)
      next.add(dayOfWeek)
      return next
    })
  }

  const { execute } = useAction(upsertLocationBusinessHours, {
    onSuccess: ({ input }) => {
      toast.success('Orari aggiornati')
      setSavingDay(null)
      setDirtyDays(prev => {
        const next = new Set(prev)
        next.delete(input.dayOfWeek)
        return next
      })
    },
    onError: (error) => {
      toast.error(error.error?.serverError ?? 'Errore durante il salvataggio')
      setSavingDay(null)
    },
  })

  function handleSlotChange(dayOfWeek: number, slotIndex: number, field: 'openTime' | 'closeTime', value: string) {
    setWeekHours(prev => {
      const newMap = new Map(prev)
      const slots = [...(newMap.get(dayOfWeek) ?? [])]
      slots[slotIndex] = { ...slots[slotIndex], [field]: value }
      newMap.set(dayOfWeek, slots)
      return newMap
    })
    markDirty(dayOfWeek)
  }

  function handleAddSlot(dayOfWeek: number) {
    setWeekHours(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(dayOfWeek) ?? []
      newMap.set(dayOfWeek, [...existing, { openTime: '', closeTime: '' }])
      return newMap
    })
    markDirty(dayOfWeek)
  }

  function handleRemoveSlot(dayOfWeek: number, slotIndex: number) {
    setWeekHours(prev => {
      const newMap = new Map(prev)
      const slots = (newMap.get(dayOfWeek) ?? []).filter((_, i) => i !== slotIndex)
      newMap.set(dayOfWeek, slots)
      return newMap
    })
    markDirty(dayOfWeek)
  }

  function handleOpenDay(dayOfWeek: number) {
    setWeekHours(prev => {
      const newMap = new Map(prev)
      newMap.set(dayOfWeek, [{ openTime: '', closeTime: '' }])
      return newMap
    })
    markDirty(dayOfWeek)
  }

  function validateSlots(slots: TimeSlot[]): string | null {
    for (const s of slots) {
      if (!s.openTime || !s.closeTime) return 'Compilare tutti gli orari'
      if (s.closeTime <= s.openTime) return "L'orario di chiusura deve essere dopo l'apertura"
    }
    if (slots.length === 2 && slots[0].closeTime > slots[1].openTime) {
      return 'Le fasce orarie non devono sovrapporsi'
    }
    return null
  }

  function handleSaveDay(dayOfWeek: number) {
    const slots = weekHours.get(dayOfWeek) ?? []
    const error = validateSlots(slots)
    if (error) {
      toast.error(error)
      return
    }
    setSavingDay(dayOfWeek)
    execute({ locationId, dayOfWeek, slots })
  }

  return (
    <div className="flex flex-col gap-3">
      {DAY_LABELS.map((label, dayOfWeek) => {
        const slots = weekHours.get(dayOfWeek) ?? []
        const isSaving = savingDay === dayOfWeek
        const isDirty = dirtyDays.has(dayOfWeek)

        return (
          <div
            key={dayOfWeek}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex w-28 shrink-0 flex-col gap-0.5 pt-1.5">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {slots.length === 0 && (
                  <span className="text-xs text-muted-foreground">Chiuso</span>
                )}
              </div>

              {slots.length === 0 ? (
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleOpenDay(dayOfWeek)}
                  >
                    Apri giorno
                  </Button>
                  {isDirty && (
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSaveDay(dayOfWeek)}
                      disabled={isSaving}
                    >
                      {isSaving && <Loader2 className="size-3.5 animate-spin mr-1" />}
                      Salva
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.openTime}
                        onChange={e => handleSlotChange(dayOfWeek, i, 'openTime', e.target.value)}
                        className="h-9 w-28 text-sm tabular-nums"
                        aria-label={`${label}: apertura fascia ${i + 1}`}
                      />
                      <span className="text-sm text-muted-foreground">&ndash;</span>
                      <Input
                        type="time"
                        value={slot.closeTime}
                        onChange={e => handleSlotChange(dayOfWeek, i, 'closeTime', e.target.value)}
                        className="h-9 w-28 text-sm tabular-nums"
                        aria-label={`${label}: chiusura fascia ${i + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSlot(dayOfWeek, i)}
                        aria-label="Rimuovi fascia"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    {slots.length < 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() => handleAddSlot(dayOfWeek)}
                      >
                        <Plus className="size-3.5" />
                        Aggiungi pausa
                      </Button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {isDirty && (
                        <span className="text-xs text-muted-foreground">Modifiche da salvare</span>
                      )}
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleSaveDay(dayOfWeek)}
                        disabled={isSaving}
                      >
                        {isSaving && <Loader2 className="size-3.5 animate-spin mr-1" />}
                        Salva
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
