import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getClients } from '@/lib/queries/clients'
import { ClientList } from '@/components/client/ClientList'

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const clientsList = await getClients(session.user.tenantId)

  return <ClientList clients={clientsList} />
}
