import { db } from '@/lib/db'
import { products, appointmentProducts } from '@/lib/db/schema'
import { eq, and, isNull, asc, desc } from 'drizzle-orm'

export async function getProducts(tenantId: string) {
  return db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .orderBy(asc(products.name))
}

export async function getProductById(id: string, tenantId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .limit(1)
  return product ?? null
}

export async function getAppointmentProducts(appointmentId: string, tenantId: string) {
  return db
    .select({
      id: appointmentProducts.id,
      productId: appointmentProducts.productId,
      productName: products.name,
      quantity: appointmentProducts.quantity,
      priceAtSale: appointmentProducts.priceAtSale,
      createdAt: appointmentProducts.createdAt,
    })
    .from(appointmentProducts)
    .innerJoin(products, eq(appointmentProducts.productId, products.id))
    .where(and(eq(appointmentProducts.appointmentId, appointmentId), eq(appointmentProducts.tenantId, tenantId)))
    .orderBy(desc(appointmentProducts.createdAt))
}
