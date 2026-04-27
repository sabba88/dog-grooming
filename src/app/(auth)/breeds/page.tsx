import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getBreeds } from '@/lib/queries/breeds'
import { getServices } from '@/lib/queries/services'
import { BreedList } from '@/components/breed/BreedList'

export default async function BreedsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (session.user.role !== 'admin') redirect('/agenda')

  const [breedsList, servicesList] = await Promise.all([
    getBreeds(session.user.tenantId),
    getServices(session.user.tenantId),
  ])

  return (
    <BreedList
      breeds={breedsList}
      services={servicesList}
    />
  )
}
