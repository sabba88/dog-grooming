'use client'

import { useRouter } from 'next/navigation'
import { format, addDays, subDays, parseISO, startOfISOWeek } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeekNavigatorProps {
  weekStart: string
  children?: React.ReactNode
}

export function WeekNavigator({ weekStart, children }: WeekNavigatorProps) {
  const router = useRouter()

  const weekStartDate = parseISO(weekStart)
  const weekEndDate = addDays(weekStartDate, 6)

  const prevWeekStart = format(subDays(weekStartDate, 7), 'yyyy-MM-dd')
  const nextWeekStart = format(addDays(weekStartDate, 7), 'yyyy-MM-dd')
  const todayWeekStart = format(startOfISOWeek(new Date()), 'yyyy-MM-dd')

  const label = `${format(weekStartDate, 'd MMM', { locale: it })} – ${format(weekEndDate, 'd MMM yyyy', { locale: it })}`

  function navigate(week: string) {
    router.push(`/staff/schedule?week=${week}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(prevWeekStart)}
          aria-label="Settimana precedente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium min-w-44 text-center">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(nextWeekStart)}
          aria-label="Settimana successiva"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(todayWeekStart)}
        disabled={weekStart === todayWeekStart}
        className="gap-1.5 text-xs"
      >
        <CalendarDays className="size-3.5" />
        Oggi
      </Button>
      {children}
    </div>
  )
}
