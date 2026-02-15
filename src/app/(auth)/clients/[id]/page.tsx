import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getClientById, getClientNotes } from '@/lib/queries/clients'
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

  const notes = await getClientNotes(id, session.user.tenantId)

  return <ClientDetail client={client} notes={notes} />
}
