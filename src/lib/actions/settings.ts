'use server'

import { authActionClient } from '@/lib/actions/client'
import { updatePricingSurchargesSchema } from '@/lib/validations/settings'
import { getPricingSurcharges } from '@/lib/queries/settings'
import { db } from '@/lib/db'
import { pricingSurcharges } from '@/lib/db/schema'
import { z } from 'zod'

export const fetchPricingSurcharges = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const surcharges = await getPricingSurcharges(ctx.tenantId)
    return { surcharges }
  })

export const updatePricingSurcharges = authActionClient
  .schema(updatePricingSurchargesSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.role !== 'admin') {
      throw new Error('Non autorizzato')
    }
    const { tenantId } = ctx
    for (const entry of parsedInput.surcharges) {
      await db
        .insert(pricingSurcharges)
        .values({
          tenantId,
          dimension: entry.dimension,
          valueKey: entry.valueKey,
          surchargePercent: entry.surchargePercent,
        })
        .onConflictDoUpdate({
          target: [
            pricingSurcharges.tenantId,
            pricingSurcharges.dimension,
            pricingSurcharges.valueKey,
          ],
          set: {
            surchargePercent: entry.surchargePercent,
            updatedAt: new Date(),
          },
        })
    }
    return { success: true }
  })
