import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { checkPermission } from '@/lib/auth/permissions'
import { getLocations } from '@/lib/queries/locations'
import { LocationList } from '@/components/location/LocationList'

export default async function LocationsPage() {
  if (!(await checkPermission('manageLocations'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const locationsList = await getLocations(session.user.tenantId)

  return <LocationList locations={locationsList} />
}
