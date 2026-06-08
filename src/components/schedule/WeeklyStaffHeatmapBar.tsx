'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { timeToMinutes } from '@/lib/utils/schedule'

// Predefined classes so Tailwind JIT includes them
const HEAT_COLORS = [
  'bg-slate-100',  // 0 — nessuno
  'bg-teal-100',   // 1
  'bg-teal-200',   // 2
  'bg-teal-400',   // 3
  'bg-teal-600',   // 4
  'bg-teal-800',   // 5+
] as const

interface StaffMember {
  id: string
  name: string
}

interface WeeklyStaffHeatmapBarProps {
  weekDates: string[]
  staff: StaffMember[]
  staffShifts: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>
  // Orari apertura negozio per ogni data (possono essere più fasce per giorno)
  businessHoursPerDate: Record<string, { startTime: string; endTime: string }[]>
  // Range orario globale: ora intera min-max su tutta la settimana
  globalHourRange: { startHour: number; endHour: number }
}

function getActiveNamesForHour(
  date: string,
  hour: number,
  staff: StaffMember[],
  staffShifts: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>
): string[] {
  const slotStart = hour * 60
  const slotEnd = (hour + 1) * 60
  return staff
    .filter(person => {
      const entry = staffShifts[person.id]?.find(e => e.date === date)
      return entry?.shifts.some(s => {
        const start = timeToMinutes(s.startTime)
        const end = timeToMinutes(s.endTime)
        return start < slotEnd && end > slotStart
      })
    })
    .map(p => p.name)
}

// Verifica se un'ora H è all'interno di una delle fasce di apertura del negozio
function isWithinBusinessHours(
  hour: number,
  businessHours: { startTime: string; endTime: string }[]
): boolean {
  return businessHours.some(bh => {
    const start = Math.floor(timeToMinutes(bh.startTime) / 60)
    const end = Math.ceil(timeToMinutes(bh.endTime) / 60)
    return hour >= start && hour < end
  })
}

function heatColorClass(count: number, maxCount: number): string {
  if (count === 0) return HEAT_COLORS[0]
  const ratio = count / Math.max(1, maxCount)
  const idx = Math.max(1, Math.round(ratio * (HEAT_COLORS.length - 1)))
  return HEAT_COLORS[Math.min(idx, HEAT_COLORS.length - 1)]
}

export function WeeklyStaffHeatmapBar({
  weekDates,
  staff,
  staffShifts,
  businessHoursPerDate,
  globalHourRange,
}: WeeklyStaffHeatmapBarProps) {
  const { startHour, endHour } = globalHourRange
  const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour)

  // Calcola i dati per ogni giorno × ora
  const heatmap = weekDates.map(date => {
    const dayBusinessHours = businessHoursPerDate[date] ?? []
    return {
      date,
      slots: hours.map(hour => ({
        hour,
        inBusinessHours: isWithinBusinessHours(hour, dayBusinessHours),
        names: isWithinBusinessHours(hour, dayBusinessHours)
          ? getActiveNamesForHour(date, hour, staff, staffShifts)
          : [],
      })),
      isOpen: dayBusinessHours.length > 0,
    }
  })

  const maxCount = Math.max(
    1,
    ...heatmap.flatMap(d => d.slots.filter(s => s.inBusinessHours).map(s => s.names.length))
  )

  return (
    <div className="contents">
      {/* Label */}
      <div className="flex items-center px-3 border-b border-r bg-muted/50 sticky left-0 z-10 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        Staff
      </div>

      {/* Una cella per ogni giorno */}
      {heatmap.map(({ date, slots, isOpen }) => {
        const hasStaff = slots.some(s => s.inBusinessHours && s.names.length > 0)

        return (
          <div key={date} className="p-1.5 border-b border-r bg-background">
            {!isOpen ? (
              <div className="h-5 w-full flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Chiuso</span>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-5 w-full overflow-hidden rounded-sm cursor-default gap-px">
                      {slots.map(({ hour, inBusinessHours, names }) => {
                        const colorClass = inBusinessHours
                          ? heatColorClass(names.length, maxCount)
                          : 'bg-slate-200'
                        return (
                          <div
                            key={hour}
                            className={`flex-1 h-full transition-colors ${colorClass}`}
                          />
                        )
                      })}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-2">
                    {hasStaff ? (
                      <div className="flex flex-col gap-0.5 text-xs">
                        {slots
                          .filter(s => s.inBusinessHours && s.names.length > 0)
                          .map(({ hour, names }) => (
                            <div key={hour} className="flex gap-2">
                              <span className="font-mono text-muted-foreground w-10 shrink-0">
                                {String(hour).padStart(2, '0')}:00
                              </span>
                              <span>{names.join(', ')}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nessun turno</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )
      })}
    </div>
  )
}
