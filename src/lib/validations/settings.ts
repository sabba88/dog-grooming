import { z } from 'zod'

const surchargeMessage = 'La maggiorazione deve essere tra 0% e 500%'

export const surchargeEntrySchema = z.object({
  dimension: z.enum(['coat', 'size']),
  valueKey: z.string(),
  surchargePercent: z.number().int().min(0, surchargeMessage).max(500, surchargeMessage),
})

export const updatePricingSurchargesSchema = z.object({
  surcharges: z.array(surchargeEntrySchema),
})
