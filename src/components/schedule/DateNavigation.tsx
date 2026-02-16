'use client'

import { format, addDays, subDays, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const formattedDate = format(selectedDate, "EEEE d MMMM yyyy", { locale: it })
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(subDays(selectedDate, 1))}
        aria-label="Giorno precedente"
        className="size-10"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium min-w-[200px] text-center">
          {capitalizedDate}
        </span>

        {!isToday(selectedDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            Oggi
          </Button>
        )}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="size-10" aria-label="Seleziona data">
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date)
                  setCalendarOpen(false)
                }
              }}
              locale={it}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        aria-label="Giorno successivo"
        className="size-10"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
