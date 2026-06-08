'use server'

import { authActionClient } from '@/lib/actions/client'
import {
  createProductSchema,
  updateProductSchema,
  updateProductStockSchema,
  deleteProductSchema,
  addProductToAppointmentSchema,
  removeAppointmentProductSchema,
} from '@/lib/validations/products'
import { products, appointmentProducts } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getProducts, getProductById, getAppointmentProducts } from '@/lib/queries/products'

export const fetchProducts = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const result = await getProducts(ctx.tenantId)
    return { products: result }
  })

export const fetchAppointmentProducts = authActionClient
  .schema(z.object({ appointmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await getAppointmentProducts(parsedInput.appointmentId, ctx.tenantId)
    return { appointmentProducts: result }
  })

export const createProduct = authActionClient
  .schema(createProductSchema)
  .action(async ({ parsedInput: { name, price, stock }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    const [product] = await db
      .insert(products)
      .values({ name, price, stock, tenantId: ctx.tenantId })
      .returning({ id: products.id })

    return { product }
  })

export const updateProduct = authActionClient
  .schema(updateProductSchema)
  .action(async ({ parsedInput: { id, name, price }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(products)
      .set({ name, price, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))

    return { productId: id }
  })

export const updateProductStock = authActionClient
  .schema(updateProductStockSchema)
  .action(async ({ parsedInput: { id, stock }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(products)
      .set({ stock, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))

    return { productId: id }
  })

export const deleteProduct = authActionClient
  .schema(deleteProductSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    if (ctx.role !== 'admin') throw new Error('Non autorizzato')

    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId), isNull(products.deletedAt)))

    return { deletedId: id }
  })

export const addProductToAppointment = authActionClient
  .schema(addProductToAppointmentSchema)
  .action(async ({ parsedInput: { appointmentId, productId, quantity }, ctx }) => {
    const product = await getProductById(productId, ctx.tenantId)
    if (!product) throw new Error('Prodotto non trovato')
    if (product.stock < quantity) throw new Error(`Scorte insufficienti (disponibili: ${product.stock})`)

    const [entry] = await db
      .insert(appointmentProducts)
      .values({
        appointmentId,
        productId,
        quantity,
        priceAtSale: product.price,
        tenantId: ctx.tenantId,
      })
      .returning()

    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, ctx.tenantId)))

    return { entry }
  })

export const removeProductFromAppointment = authActionClient
  .schema(removeAppointmentProductSchema)
  .action(async ({ parsedInput: { appointmentProductId }, ctx }) => {
    const [entry] = await db
      .select({
        id: appointmentProducts.id,
        productId: appointmentProducts.productId,
        quantity: appointmentProducts.quantity,
      })
      .from(appointmentProducts)
      .where(and(eq(appointmentProducts.id, appointmentProductId), eq(appointmentProducts.tenantId, ctx.tenantId)))
      .limit(1)

    if (!entry) throw new Error('Voce non trovata')

    await db
      .delete(appointmentProducts)
      .where(and(eq(appointmentProducts.id, appointmentProductId), eq(appointmentProducts.tenantId, ctx.tenantId)))

    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${entry.quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, entry.productId), eq(products.tenantId, ctx.tenantId)))

    return { deletedId: appointmentProductId }
  })
