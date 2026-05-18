'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getISODay, parseISO } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ShiftInlineEditor,
  type ExistingShift,
  type Location,
  type BusinessHoursForDay,
} from './ShiftInlineEditor'
import { RecurringShiftEditor } from './RecurringShiftEditor'
import type { RecurringShift } from '@/lib/queries/staff'

type CellShift = {
  id: string
  locationId: string
  locationName: string | null
  startTime: string
  endTime: string
}

interface ShiftCellProps {
  userId: string
  date: string
  shifts: CellShift[]
  locations: Location[]
  businessHoursForDay: BusinessHoursForDay[]
  recurringShifts?: RecurringShift[]
  onAdd: (userId: string, date: string, data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onUpdate: (shiftId: string, data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onDelete: (shiftId: string) => Promise<void>
  onAddRecurring?: (userId: string, dayOfWeek: number, data: { locationId: string; startTime: string; endTime: string }) => Promise<{ id: string } | undefined>
  onUpdateRecurring?: (recurringId: string, data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onDeleteRecurring?: (recurringId: string) => Promise<void>
  isPending?: boolean
}

type GhostPopoverView = 'actions' | 'edit-template'

export function ShiftCell({
  userId,
  date,
  shifts,
  locations,
  businessHoursForDay,
  recurringShifts = [],
  onAdd,
  onUpdate,
  onDelete,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  isPending,
}: ShiftCellProps) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [ghostPopoverView, setGhostPopoverView] = useState<GhostPopoverView>('actions')
  const [addView, setAddView] = useState<'shift' | 'template'>('shift')

  const dayOfWeek = getISODay(parseISO(date)) - 1

  const existingShifts: ExistingShift[] = shifts.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
  }))

  const showGhostBadges = shifts.length === 0 && recurringShifts.length > 0

  async function handleAdd(data: { locationId: string; startTime: string; endTime: string }) {
    setOpenPopoverId(null)
    await onAdd(userId, date, data)
  }

  async function handleUpdate(shiftId: string, data: { locationId: string; startTime: string; endTime: string }) {
    setOpenPopoverId(null)
    await onUpdate(shiftId, data)
  }

  async function handleDelete(shiftId: string) {
    setOpenPopoverId(null)
    await onDelete(shiftId)
  }

  async function handleCreateFromTemplate(recurring: RecurringShift) {
    setOpenPopoverId(null)
    await onAdd(userId, date, {
      locationId: recurring.locationId,
      startTime: recurring.startTime,
      endTime: recurring.endTime,
    })
  }

  async function handleUpdateRecurring(recurring: RecurringShift, data: { locationId: string; startTime: string; endTime: string }) {
    setOpenPopoverId(null)
    setGhostPopoverView('actions')
    await onUpdateRecurring?.(recurring.id, data)
  }

  async function handleDeleteRecurring(recurringId: string) {
    setOpenPopoverId(null)
    setGhostPopoverView('actions')
    await onDeleteRecurring?.(recurringId)
  }

  async function handleAddRecurringFromCell(data: { locationId: string; startTime: string; endTime: string }) {
    setOpenPopoverId(null)
    setAddView('shift')
    await onAddRecurring?.(userId, dayOfWeek, data)
  }

  return (
    <div className="flex flex-col gap-1 min-h-[60px] p-1">
      {shifts.map(shift => (
        <Popover
          key={shift.id}
          open={openPopoverId === shift.id}
          onOpenChange={(o) => setOpenPopoverId(o ? shift.id : null)}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full text-left rounded-sm px-2 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="text-[11px] font-medium text-emerald-800 truncate leading-tight">
                {shift.locationName ?? 'Sede'}
              </div>
              <div className="text-[10px] text-emerald-600 leading-tight">
                {shift.startTime}–{shift.endTime}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <ShiftInlineEditor
              mode="edit"
              editShiftId={shift.id}
              defaultLocationId={shift.locationId}
              defaultStartTime={shift.startTime}
              defaultEndTime={shift.endTime}
              existingShifts={existingShifts}
              locations={locations}
              businessHoursForDay={businessHoursForDay}
              onSave={(data) => handleUpdate(shift.id, data)}
              onDelete={() => handleDelete(shift.id)}
              onCancel={() => setOpenPopoverId(null)}
              isPending={isPending}
            />
          </PopoverContent>
        </Popover>
      ))}

      {showGhostBadges && recurringShifts.map(recurring => (
        <Popover
          key={`ghost-${recurring.id}`}
          open={openPopoverId === `ghost-${recurring.id}`}
          onOpenChange={(o) => {
            if (o) {
              setGhostPopoverView('actions')
              setOpenPopoverId(`ghost-${recurring.id}`)
            } else {
              setOpenPopoverId(null)
              setGhostPopoverView('actions')
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full text-left rounded-sm px-2 py-1 bg-emerald-50/40 border border-dashed border-emerald-300 opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="text-[11px] font-medium text-emerald-700 truncate leading-tight">
                {recurring.locationName ?? 'Sede'}
              </div>
              <div className="text-[10px] text-emerald-600 leading-tight">
                {recurring.startTime}–{recurring.endTime}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            {ghostPopoverView === 'actions' ? (
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Orario standard</p>
                  <p className="text-sm font-medium mt-0.5">
                    {recurring.locationName ?? 'Sede'} · {recurring.startTime}–{recurring.endTime}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => handleCreateFromTemplate(recurring)}
                  disabled={isPending}
                >
                  Crea turno per oggi
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => setGhostPopoverView('edit-template')}
                  disabled={isPending}
                >
                  Modifica template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDeleteRecurring(recurring.id)}
                  disabled={isPending}
                >
                  Elimina template
                </Button>
              </div>
            ) : (
              <RecurringShiftEditor
                mode="edit"
                editId={recurring.id}
                userId={userId}
                dayOfWeek={recurring.dayOfWeek}
                defaultLocationId={recurring.locationId}
                defaultStartTime={recurring.startTime}
                defaultEndTime={recurring.endTime}
                locations={locations}
                onSave={(data) => handleUpdateRecurring(recurring, data)}
                onCancel={() => setGhostPopoverView('actions')}
                isPending={isPending}
              />
            )}
          </PopoverContent>
        </Popover>
      ))}

      <Popover
        open={openPopoverId === 'add'}
        onOpenChange={(o) => {
          setOpenPopoverId(o ? 'add' : null)
          if (!o) setAddView('shift')
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full rounded-sm border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 flex items-center justify-center h-7 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Aggiungi turno"
          >
            <Plus className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          {addView === 'shift' ? (
            <>
              <ShiftInlineEditor
                mode="add"
                existingShifts={existingShifts}
                locations={locations}
                businessHoursForDay={businessHoursForDay}
                onSave={handleAdd}
                onCancel={() => setOpenPopoverId(null)}
                isPending={isPending}
              />
              {onAddRecurring && (
                <>
                  <Separator className="my-2" />
                  <button
                    type="button"
                    className="w-full text-[11px] text-muted-foreground hover:text-foreground text-center py-0.5"
                    onClick={() => setAddView('template')}
                  >
                    Crea template ricorrente
                  </button>
                </>
              )}
            </>
          ) : (
            <RecurringShiftEditor
              mode="add"
              userId={userId}
              dayOfWeek={dayOfWeek}
              locations={locations}
              onSave={handleAddRecurringFromCell}
              onCancel={() => setAddView('shift')}
              isPending={isPending}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
