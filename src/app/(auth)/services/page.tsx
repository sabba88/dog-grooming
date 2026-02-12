import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getServices } from '@/lib/queries/services'
import { ServiceList } from '@/components/service/ServiceList'

export default async function ServicesPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const servicesList = await getServices(session.user.tenantId)

  return (
    <ServiceList
      services={servicesList}
      role={session.user.role as 'admin' | 'collaborator'}
    />
  )
}
