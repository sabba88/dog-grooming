import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { checkPermission } from '@/lib/auth/permissions'
import { getAllUsersWithAssignments } from '@/lib/queries/staff'
import { getLocations } from '@/lib/queries/locations'
import { StaffList } from '@/components/staff/StaffList'

export default async function StaffPage() {
  if (!(await checkPermission('manageStaff'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const tenantId = session.user.tenantId

  const [users, locations] = await Promise.all([
    getAllUsersWithAssignments(tenantId),
    getLocations(tenantId),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestione Personale</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assegna collaboratori e amministratori alle sedi con il calendario settimanale
          </p>
        </div>
      </div>
      <StaffList users={users} locations={locations} />
    </div>
  )
}
