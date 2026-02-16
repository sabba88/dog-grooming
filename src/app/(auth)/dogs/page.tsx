import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getAllDogs } from '@/lib/queries/dogs'
import { DogsPage } from '@/components/dog/DogsPage'

export default async function DogsListPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const dogs = await getAllDogs(session.user.tenantId)

  return <DogsPage dogs={dogs} />
}
