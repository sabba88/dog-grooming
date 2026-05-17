'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ShiftInlineEditor,
  type ExistingShift,
  type Location,
  type BusinessHoursForDay,
} from './ShiftInlineEditor'

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
  onAdd: (userId: string, date: string, data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onUpdate: (shiftId: string, data: { locationId: string; startTime: string; endTime: string }) => Promise<void>
  onDelete: (shiftId: string) => Promise<void>
  isPending?: boolean
}

export function ShiftCell({
  userId,
  date,
  shifts,
  locations,
  businessHoursForDay,
  onAdd,
  onUpdate,
  onDelete,
  isPending,
}: ShiftCellProps) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  const existingShifts: ExistingShift[] = shifts.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
  }))

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

      <Popover
        open={openPopoverId === 'add'}
        onOpenChange={(o) => setOpenPopoverId(o ? 'add' : null)}
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
          <ShiftInlineEditor
            mode="add"
            existingShifts={existingShifts}
            locations={locations}
            businessHoursForDay={businessHoursForDay}
            onSave={handleAdd}
            onCancel={() => setOpenPopoverId(null)}
            isPending={isPending}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
