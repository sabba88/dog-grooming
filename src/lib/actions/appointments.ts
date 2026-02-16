'use server'

import { authActionClient } from '@/lib/actions/client'
import { getAppointmentsQuerySchema } from '@/lib/validations/appointments'
import { getAppointmentsByDateAndLocation } from '@/lib/queries/appointments'
import { getStationsWithScheduleForDay } from '@/lib/queries/appointments'
import { toDayOfWeek } from '@/lib/utils/schedule'
import { getDay } from 'date-fns'

export const getAgendaData = authActionClient
  .schema(getAppointmentsQuerySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { locationId, date } = parsedInput
    const dateObj = new Date(date + 'T00:00:00.000Z')
    const dayOfWeek = toDayOfWeek(getDay(dateObj))

    const [appointments, stations] = await Promise.all([
      getAppointmentsByDateAndLocation(locationId, date, ctx.tenantId),
      getStationsWithScheduleForDay(locationId, dayOfWeek, ctx.tenantId),
    ])

    return { appointments, stations }
  })
