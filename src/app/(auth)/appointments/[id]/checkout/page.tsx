import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { appointments, clients, dogs, services } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getProducts } from '@/lib/queries/products'
import { getAppointmentProducts } from '@/lib/queries/products'
import { CheckoutClient } from '@/components/shop/CheckoutClient'

interface CheckoutPageProps {
  params: Promise<{ id: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const tenantId = session.user.tenantId

  const [appt] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      price: appointments.price,
      clientNominativo: clients.nominativo,
      dogName: dogs.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
    .limit(1)

  if (!appt) notFound()

  const [availableProducts, soldProducts] = await Promise.all([
    getProducts(tenantId),
    getAppointmentProducts(id, tenantId),
  ])

  return (
    <CheckoutClient
      appointment={appt}
      availableProducts={availableProducts}
      initialSoldProducts={soldProducts}
    />
  )
}
