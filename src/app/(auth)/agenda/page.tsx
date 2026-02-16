import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getLocations } from '@/lib/queries/locations'
import { AgendaView } from '@/components/schedule/AgendaView'

export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const locations = await getLocations(session.user.tenantId)

  return <AgendaView locations={locations} />
}
