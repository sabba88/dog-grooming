import { db } from '@/lib/db'
import { pricingSurcharges } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function getPricingSurcharges(tenantId: string) {
  return db
    .select()
    .from(pricingSurcharges)
    .where(eq(pricingSurcharges.tenantId, tenantId))
    .orderBy(asc(pricingSurcharges.dimension), asc(pricingSurcharges.valueKey))
}
