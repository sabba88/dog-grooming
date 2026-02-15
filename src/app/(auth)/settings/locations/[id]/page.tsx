import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { checkPermission } from '@/lib/auth/permissions'
import { getLocationById } from '@/lib/queries/locations'
import { getStationsByLocation } from '@/lib/queries/stations'
import { getServices } from '@/lib/queries/services'
import { getStationServices } from '@/lib/queries/stations'
import { StationList } from '@/components/location/StationList'

interface LocationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  if (!(await checkPermission('manageLocations'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const { id: locationId } = await params
  const tenantId = session.user.tenantId

  const location = await getLocationById(locationId, tenantId)
  if (!location) {
    redirect('/settings/locations')
  }

  const [stations, allServices] = await Promise.all([
    getStationsByLocation(locationId, tenantId),
    getServices(tenantId),
  ])

  // Get enabled service IDs for each station
  const stationEnabledServices: Record<string, string[]> = {}
  await Promise.all(
    stations.map(async (station) => {
      const services = await getStationServices(station.id, tenantId)
      stationEnabledServices[station.id] = services.map(s => s.serviceId)
    })
  )

  return (
    <StationList
      stations={stations}
      locationId={locationId}
      locationName={location.name}
      allServices={allServices}
      stationEnabledServices={stationEnabledServices}
    />
  )
}
