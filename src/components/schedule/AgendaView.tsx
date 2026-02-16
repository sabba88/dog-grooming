'use client'

import { useState } from 'react'
import { format, getDay } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { DateNavigation } from './DateNavigation'
import { DateStrip } from './DateStrip'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleTimeline } from './ScheduleTimeline'
import { getAgendaData } from '@/lib/actions/appointments'
import { Settings } from 'lucide-react'
import Link from 'next/link'

interface Location {
  id: string
  name: string
  address: string
}

interface AgendaViewProps {
  locations: Location[]
}

export function AgendaView({ locations }: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const isMobile = useIsMobile()
  const { selectedLocationId, isHydrated } = useLocationSelector(locations)

  const dateString = format(selectedDate, 'yyyy-MM-dd')

  const { data } = useQuery({
    queryKey: ['appointments', selectedLocationId, dateString],
    queryFn: async () => {
      if (!selectedLocationId) return null
      const result = await getAgendaData({ locationId: selectedLocationId, date: dateString })
      if (result?.data) {
        return {
          appointments: result.data.appointments.map((a) => ({
            ...a,
            startTime: new Date(a.startTime),
            endTime: new Date(a.endTime),
          })),
          stations: result.data.stations,
        }
      }
      return null
    },
    enabled: !!selectedLocationId && isHydrated,
  })

  if (!isHydrated) return null

  const appointments = data?.appointments ?? []
  const stations = data?.stations ?? []

  // No stations configured
  if (isHydrated && selectedLocationId && data && stations.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {isMobile ? (
          <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
        ) : (
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Settings className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Nessuna postazione configurata per questa sede
          </p>
          <Link
            href="/stations"
            className="text-sm text-primary hover:underline"
          >
            Vai a Impostazioni per configurare le postazioni
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {isMobile ? (
        <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
      ) : (
        <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}

      {isMobile ? (
        <ScheduleTimeline
          stations={stations}
          appointments={appointments}
          dateString={dateString}
        />
      ) : (
        <ScheduleGrid
          stations={stations}
          appointments={appointments}
          selectedDate={selectedDate}
          dateString={dateString}
        />
      )}
    </div>
  )
}
