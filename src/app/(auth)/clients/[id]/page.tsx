import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getClientById, getClientNotes, getClientAppointments } from '@/lib/queries/clients'
import { getDogsByClient } from '@/lib/queries/dogs'
import { getBreedsForSelect } from '@/lib/queries/breeds'
import { ClientDetail } from '@/components/client/ClientDetail'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const { id } = await params

  const client = await getClientById(id, session.user.tenantId)
  if (!client) {
    redirect('/clients')
  }

  const [notes, dogs, breeds, clientAppointments] = await Promise.all([
    getClientNotes(id, session.user.tenantId),
    getDogsByClient(id, session.user.tenantId),
    getBreedsForSelect(session.user.tenantId),
    getClientAppointments(id, session.user.tenantId),
  ])

  return (
    <ClientDetail
      client={client}
      notes={notes}
      dogs={dogs}
      breeds={breeds}
      appointments={clientAppointments}
      userRole={session.user.role as 'admin' | 'collaborator'}
    />
  )
}
