import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getLocations } from '@/lib/queries/locations'
import { BookingCalendar } from '@/components/booking/BookingCalendar'

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const locations = await getLocations(session.user.tenantId)

  return <BookingCalendar locations={locations} />
}
