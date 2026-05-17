import { redirect } from 'next/navigation'
import { format, addDays, parseISO, startOfISOWeek } from 'date-fns'
import { auth } from '@/lib/auth/auth'
import { checkPermission } from '@/lib/auth/permissions'
import { getActiveUsers } from '@/lib/queries/staff'
import { getWeekShiftsForGrid } from '@/lib/queries/staff'
import { getLocations } from '@/lib/queries/locations'
import { getAllLocationBusinessHours } from '@/lib/queries/locations'
import { StaffWeeklyScheduleGrid } from '@/components/staff/StaffWeeklyScheduleGrid'

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function StaffSchedulePage({ searchParams }: PageProps) {
  if (!(await checkPermission('manageStaff'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const tenantId = session.user.tenantId
  const { week } = await searchParams

  const weekStartDate = week ? parseISO(week) : startOfISOWeek(new Date())
  const weekStart = format(weekStartDate, 'yyyy-MM-dd')
  const weekEnd = format(addDays(weekStartDate, 6), 'yyyy-MM-dd')
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStartDate, i), 'yyyy-MM-dd')
  )

  const [users, shifts, locations, businessHours] = await Promise.all([
    getActiveUsers(tenantId),
    getWeekShiftsForGrid(weekStart, weekEnd, tenantId),
    getLocations(tenantId),
    getAllLocationBusinessHours(tenantId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Orario Settimanale</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestisci i turni del personale per sede e orario
        </p>
      </div>
      <StaffWeeklyScheduleGrid
        users={users}
        initialShifts={shifts}
        locations={locations.map(l => ({ id: l.id, name: l.name }))}
        businessHours={businessHours}
        weekDays={weekDays}
        weekStart={weekStart}
      />
    </div>
  )
}
