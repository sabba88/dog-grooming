'use client'

import { addDays, format, isToday, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

interface DateStripProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Generate 7 days centered on selectedDate
  const days = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3))

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selectedDate])

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-none"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)
        const dayName = format(day, 'EEE', { locale: it })
        const dayNum = format(day, 'd')

        return (
          <button
            key={day.toISOString()}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onDateChange(day)}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg min-w-12 h-14 px-2 text-sm transition-colors',
              'scroll-snap-align-center',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-accent'
            )}
            style={{ scrollSnapAlign: 'center' }}
          >
            <span className="text-xs capitalize">{dayName}</span>
            <span className="font-semibold">{dayNum}</span>
            {isTodayDate && !isSelected && (
              <span className="size-1.5 rounded-full bg-primary mt-0.5" />
            )}
            {isTodayDate && isSelected && (
              <span className="size-1.5 rounded-full bg-primary-foreground mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
