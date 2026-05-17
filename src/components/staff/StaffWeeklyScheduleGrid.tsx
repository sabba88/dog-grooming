'use client'

import { useState } from 'react'
import { format, parseISO, getISODay } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { upsertShift, deleteShift } from '@/lib/actions/staff'
import type { WeekGridShift } from '@/lib/queries/staff'
import type { BusinessHoursEntry } from '@/lib/queries/locations'
import { WeekNavigator } from './WeekNavigator'
import { ShiftCell } from './ShiftCell'
import { CopyWeekButton } from './CopyWeekButton'

type User = {
  id: string
  name: string
  role: 'admin' | 'collaborator'
}

type Location = {
  id: string
  name: string
}

interface StaffWeeklyScheduleGridProps {
  users: User[]
  initialShifts: WeekGridShift[]
  locations: Location[]
  businessHours: BusinessHoursEntry[]
  weekDays: string[]
  weekStart: string
}

export function StaffWeeklyScheduleGrid({
  users,
  initialShifts,
  locations,
  businessHours,
  weekDays,
  weekStart,
}: StaffWeeklyScheduleGridProps) {
  const [shifts, setShifts] = useState<WeekGridShift[]>(initialShifts)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { executeAsync: execUpsert } = useAction(upsertShift)
  const { executeAsync: execDelete } = useAction(deleteShift)

  function getBusinessHoursForDay(date: string) {
    const dayOfWeek = getISODay(parseISO(date)) - 1
    return businessHours
      .filter(h => h.dayOfWeek === dayOfWeek)
      .map(h => ({ locationId: h.locationId, openTime: h.openTime, closeTime: h.closeTime }))
  }

  function getShiftsForCell(userId: string, date: string) {
    return shifts.filter(s => s.userId === userId && s.date === date)
  }

  async function handleAdd(
    userId: string,
    date: string,
    data: { locationId: string; startTime: string; endTime: string }
  ) {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const locationName = locations.find(l => l.id === data.locationId)?.name ?? null
    const optimistic: WeekGridShift = { id: tempId, userId, date, locationName, ...data }

    setShifts(prev =>
      [...prev, optimistic].sort(
        (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      )
    )

    const result = await execUpsert({ userId, date, ...data })

    if (result?.data?.shift?.id) {
      setShifts(prev => prev.map(s => (s.id === tempId ? { ...s, id: result.data!.shift.id } : s)))
      toast.success('Turno aggiunto')
    } else {
      setShifts(prev => prev.filter(s => s.id !== tempId))
      const errMsg = (result as { serverError?: string })?.serverError
      toast.error(errMsg ?? 'Errore durante il salvataggio')
    }
  }

  async function handleUpdate(
    shiftId: string,
    data: { locationId: string; startTime: string; endTime: string }
  ) {
    const original = shifts.find(s => s.id === shiftId)
    if (!original) return

    const locationName = locations.find(l => l.id === data.locationId)?.name ?? null
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, ...data, locationName } : s)))
    setPendingId(shiftId)

    const result = await execUpsert({
      id: shiftId,
      userId: original.userId,
      date: original.date,
      ...data,
    })
    setPendingId(null)

    if (result?.data?.shift?.id) {
      toast.success('Turno aggiornato')
    } else {
      setShifts(prev => prev.map(s => (s.id === shiftId ? original : s)))
      const errMsg = (result as { serverError?: string })?.serverError
      toast.error(errMsg ?? 'Errore durante il salvataggio')
    }
  }

  async function handleDelete(shiftId: string) {
    const original = shifts.find(s => s.id === shiftId)
    if (!original) return

    setShifts(prev => prev.filter(s => s.id !== shiftId))
    setPendingId(shiftId)

    const result = await execDelete({ id: shiftId })
    setPendingId(null)

    if (result?.data?.success) {
      toast.success('Turno eliminato')
    } else {
      setShifts(prev =>
        [...prev, original].sort(
          (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
        )
      )
      const errMsg = (result as { serverError?: string })?.serverError
      toast.error(errMsg ?? "Errore durante l'eliminazione")
    }
  }

  const hasShiftsThisWeek = weekDays.some(day => shifts.some(s => s.date === day))

  return (
    <div className="flex flex-col gap-4">
      <WeekNavigator weekStart={weekStart}>
        <CopyWeekButton weekStart={weekStart} hasShifts={hasShiftsThisWeek} />
      </WeekNavigator>

      {/* Desktop: griglia */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 w-36 border-b border-border">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Dipendente
                </span>
              </th>
              {weekDays.map(day => {
                const dayDate = parseISO(day)
                const isToday = day === format(new Date(), 'yyyy-MM-dd')
                return (
                  <th key={day} className="px-1 py-2 border-b border-border min-w-[110px]">
                    <div
                      className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {format(dayDate, 'EEE', { locale: it })}
                    </div>
                    <div
                      className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}
                    >
                      {format(dayDate, 'd MMM', { locale: it })}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={`border-b border-border last:border-0 ${idx % 2 !== 0 ? 'bg-muted/20' : ''}`}
              >
                <td className="px-3 py-2 align-top">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {user.role === 'admin' ? 'Admin' : 'Collaboratore'}
                  </div>
                </td>
                {weekDays.map(day => (
                  <td key={day} className="p-0.5 align-top">
                    <ShiftCell
                      userId={user.id}
                      date={day}
                      shifts={getShiftsForCell(user.id, day)}
                      locations={locations}
                      businessHoursForDay={getBusinessHoursForDay(day)}
                      onAdd={handleAdd}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isPending={pendingId !== null}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: lista verticale per dipendente */}
      <div className="flex flex-col gap-4 md:hidden">
        {users.map(user => (
          <div key={user.id} className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-3 py-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === 'admin' ? 'Admin' : 'Collaboratore'}
              </p>
            </div>
            <div className="divide-y divide-border">
              {weekDays.map(day => {
                const dayDate = parseISO(day)
                return (
                  <div key={day} className="flex gap-3 px-3 py-2">
                    <div className="w-14 shrink-0">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {format(dayDate, 'EEE', { locale: it })}
                      </div>
                      <div className="text-sm font-medium">{format(dayDate, 'd', { locale: it })}</div>
                    </div>
                    <div className="flex-1">
                      <ShiftCell
                        userId={user.id}
                        date={day}
                        shifts={getShiftsForCell(user.id, day)}
                        locations={locations}
                        businessHoursForDay={getBusinessHoursForDay(day)}
                        onAdd={handleAdd}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        isPending={pendingId !== null}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
