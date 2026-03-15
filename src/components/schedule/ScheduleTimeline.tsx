'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppointmentBlock } from './AppointmentBlock'
import { EmptySlot } from './EmptySlot'
import { generateTimeSlots, getServiceColor } from '@/lib/utils/schedule'

interface Station {
  id: string
  name: string
  openTime: string
  closeTime: string
}

interface Appointment {
  id: string
  startTime: Date
  endTime: Date
  price: number
  notes: string | null
  stationId: string
  clientFirstName: string
  clientLastName: string
  dogName: string
  serviceName: string
  serviceId: string
}

interface ScheduleTimelineProps {
  stations: Station[]
  appointments: Appointment[]
  dateString: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { stationId: string; date: string; time: string }) => void
}

function StationTimeline({
  station,
  appointments,
  allServiceIds,
  dateString,
  onAppointmentClick,
  onEmptySlotClick,
}: {
  station: Station
  appointments: Appointment[]
  allServiceIds: string[]
  dateString: string
  onAppointmentClick?: (id: string) => void
  onEmptySlotClick?: (data: { stationId: string; date: string; time: string }) => void
}) {
  const timeSlots = generateTimeSlots(station.openTime, station.closeTime)

  return (
    <div className="flex flex-col gap-2">
      {timeSlots.map((slot) => {
        const [slotH, slotM] = slot.split(':').map(Number)
        const slotMinutes = slotH * 60 + slotM

        const appt = appointments.find((a) => {
          const startMinutes = a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes()
          const endMinutes = a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes()
          return slotMinutes >= startMinutes && slotMinutes < endMinutes
        })

        // Only show the appointment block on its first slot
        if (appt) {
          const apptStartMinutes = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes()
          if (slotMinutes !== apptStartMinutes) return null

          const color = getServiceColor(appt.serviceId, allServiceIds)

          return (
            <div key={slot} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
              <div className="flex-1">
                <AppointmentBlock
                  id={appt.id}
                  clientName={`${appt.clientFirstName} ${appt.clientLastName}`}
                  dogName={appt.dogName}
                  serviceName={appt.serviceName}
                  price={appt.price}
                  startTime={appt.startTime}
                  endTime={appt.endTime}
                  color={color}
                  variant="timeline"
                  onClick={onAppointmentClick}
                />
              </div>
            </div>
          )
        }

        return (
          <div key={slot} className="flex gap-3 items-start">
            <span className="text-xs text-muted-foreground w-12 pt-3 shrink-0">{slot}</span>
            <div className="flex-1">
              <EmptySlot
                stationId={station.id}
                date={dateString}
                time={slot}
                variant="timeline"
                onClick={onEmptySlotClick}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScheduleTimeline({
  stations,
  appointments,
  dateString,
  onAppointmentClick,
  onEmptySlotClick,
}: ScheduleTimelineProps) {
  const allServiceIds = [...new Set(appointments.map((a) => a.serviceId))]

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full overflow-x-auto">
        <TabsTrigger value="all">Tutte</TabsTrigger>
        {stations.map((station) => (
          <TabsTrigger key={station.id} value={station.id}>
            {station.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="flex flex-col gap-6">
          {stations.map((station) => {
            const stationAppointments = appointments.filter(
              (a) => a.stationId === station.id
            )
            return (
              <div key={station.id}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{station.name}</h3>
                <StationTimeline
                  station={station}
                  appointments={stationAppointments}
                  allServiceIds={allServiceIds}
                  dateString={dateString}
                  onAppointmentClick={onAppointmentClick}
                  onEmptySlotClick={onEmptySlotClick}
                />
              </div>
            )
          })}
        </div>
      </TabsContent>

      {stations.map((station) => {
        const stationAppointments = appointments.filter(
          (a) => a.stationId === station.id
        )
        return (
          <TabsContent key={station.id} value={station.id} className="mt-4">
            <StationTimeline
              station={station}
              appointments={stationAppointments}
              allServiceIds={allServiceIds}
              dateString={dateString}
              onAppointmentClick={onAppointmentClick}
              onEmptySlotClick={onEmptySlotClick}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
