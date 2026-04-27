import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getDogById, getDogNotes } from '@/lib/queries/dogs'
import { getBreedsForSelect } from '@/lib/queries/breeds'
import { getServiceNotesByDog } from '@/lib/queries/appointments'
import { DogDetail } from '@/components/dog/DogDetail'

interface DogDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DogDetailPage({ params }: DogDetailPageProps) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const { id } = await params

  const dog = await getDogById(id, session.user.tenantId)
  if (!dog) {
    redirect('/clients')
  }

  const [notes, breeds, serviceNotes] = await Promise.all([
    getDogNotes(id, session.user.tenantId),
    getBreedsForSelect(session.user.tenantId),
    getServiceNotesByDog(id, null, session.user.tenantId),
  ])

  return (
    <DogDetail
      dog={dog}
      notes={notes}
      breeds={breeds}
      serviceNotes={serviceNotes}
      userRole={session.user.role as 'admin' | 'collaborator'}
    />
  )
}
