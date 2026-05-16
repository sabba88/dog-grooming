import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getBreeds } from '@/lib/queries/breeds'
import { BreedList } from '@/components/breed/BreedList'

export default async function BreedsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (session.user.role !== 'admin') redirect('/agenda')

  const breedsList = await getBreeds(session.user.tenantId)

  return (
    <BreedList breeds={breedsList} />
  )
}
