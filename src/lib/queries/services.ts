import { db } from '@/lib/db'
import { services, servicePriceMatrix } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getServices(tenantId: string) {
  return db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
      durationSurchargePer30min: services.durationSurchargePer30min,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(eq(services.tenantId, tenantId))
    .orderBy(asc(services.name))
}

export async function getServiceById(serviceId: string, tenantId: string) {
  const [service] = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
      durationSurchargePer30min: services.durationSurchargePer30min,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
    .limit(1)

  return service ?? null
}

// STUB — implementazione completa in Story 2.1
export async function getServicePriceMatrixCells(serviceId: string, tenantId: string) {
  return db
    .select()
    .from(servicePriceMatrix)
    .where(and(eq(servicePriceMatrix.serviceId, serviceId), eq(servicePriceMatrix.tenantId, tenantId)))
}

// STUB — implementazione completa in Story 4.5
export async function getAppointmentPrice(
  serviceId: string,
  coatType: string | null,
  sizeType: string | null,
  tenantId: string
): Promise<number> {
  const service = await getServiceById(serviceId, tenantId)
  if (!service) throw new Error('Service not found')
  if (!coatType || !sizeType) return service.price

  const [cell] = await db
    .select()
    .from(servicePriceMatrix)
    .where(
      and(
        eq(servicePriceMatrix.serviceId, serviceId),
        eq(servicePriceMatrix.coatType, coatType),
        eq(servicePriceMatrix.sizeType, sizeType),
        eq(servicePriceMatrix.tenantId, tenantId)
      )
    )
    .limit(1)

  return cell?.price ?? service.price
}
